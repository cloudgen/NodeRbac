// RBAC, database, environment, web, engine choice, and ChronicleLogger.
// Uses a private sqlite file. Does not write ruoyi_db or ry.
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { Cli, main } from "../src/NodeRbac/cli.js";
import { ChronicleLogger } from "../src/NodeRbac/chronicle_logger.js";
import { Desk } from "../src/NodeRbac/desk.js";
import { PasswordHash } from "../src/NodeRbac/password_hash.js";
import { Schema } from "../src/NodeRbac/schema.js";
import { Settings, SettingsError } from "../src/NodeRbac/settings.js";

const TABLES = [
  "sys_user_role",
  "sys_user_post",
  "sys_role_menu",
  "sys_role_dept",
  "sys_oper_log",
  "sys_logininfor",
  "sys_session",
  "sys_notice",
  "sys_dict_data",
  "sys_dict_type",
  "sys_config",
  "sys_user",
  "sys_role",
  "sys_menu",
  "sys_dept",
  "sys_post",
];

const ENV_KEYS = [
  "HOME",
  "NODERBAC_HOME",
  "NODERBAC_DB_ENGINE",
  "NODERBAC_SQLITE_FILE",
  "NODERBAC_DB_NAME",
  "NODERBAC_DB_PASSWORD",
  "NODERBAC_DB_HOST",
  "NODERBAC_DB_USER",
  "NODERBAC_BIND",
  "NODERBAC_PORT",
  "NODERBAC_ALLOW_REMOTE",
  "NODERBAC_LANG",
  "DEBUG",
  "NODERBAC_DEBUG",
];

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

async function withEnv(updates, work) {
  const saved = {};
  for (const name of Object.keys(updates)) {
    saved[name] = Object.prototype.hasOwnProperty.call(process.env, name)
      ? process.env[name]
      : undefined;
    const value = updates[name];
    if (value == null) delete process.env[name];
    else process.env[name] = value;
  }
  try {
    return await work();
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value == null) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

function quietLogger(home) {
  return new ChronicleLogger({
    logname: "NodeRbac",
    is_quiet: true,
    basedir: home,
    logdir: path.join(home, "logs"),
  });
}

async function runCli(argv, home) {
  const out = [];
  const err = [];
  const writeOut = process.stdout.write;
  const writeErr = process.stderr.write;
  process.stdout.write = (chunk, ...rest) => {
    out.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
    if (typeof rest[0] === "function") rest[0]();
    else if (typeof rest[1] === "function") rest[1]();
    return true;
  };
  process.stderr.write = (chunk, ...rest) => {
    err.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
    if (typeof rest[0] === "function") rest[0]();
    else if (typeof rest[1] === "function") rest[1]();
    return true;
  };
  try {
    const app = new Cli(quietLogger(home));
    const code = await app.run(argv);
    return { code, out: out.join(""), err: err.join(""), app };
  } finally {
    process.stdout.write = writeOut;
    process.stderr.write = writeErr;
  }
}

function names(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    if (line === "(none)") return [];
    if (!line.includes("|") || line.startsWith("user_id|")) continue;
    rows.push(line.split("|")[1]);
  }
  return rows;
}

async function dropTables(store) {
  for (const name of TABLES) {
    await store.execute(`DROP TABLE IF EXISTS ${name}`);
  }
}

function request(url, method, { cookie = "", body = null, headers = {} } = {}) {
  const parsed = new URL(url);
  const payload = body == null ? null : Buffer.from(body);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        method,
        headers: {
          ...headers,
          ...(cookie ? { Cookie: `noderbac_session=${cookie}` } : {}),
          ...(payload
            ? {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": payload.length,
            }
            : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test("password file mode 0600 and remote bind refusal", async () => {
  const home = tempDir("noderbac-env-");
  const file = path.join(home, "database");
  fs.writeFileSync(file, "NODERBAC_DB_PASSWORD=from-file\n");
  fs.chmodSync(file, 0o644);
  const loose = { NODERBAC_HOME: home, HOME: home, NODERBAC_DB_PASSWORD: "" };
  assert.equal(new Settings(loose).password(), "");
  fs.chmodSync(file, 0o600);
  assert.equal(new Settings(loose).password(), "from-file");
  assert.equal(new Settings({ ...loose, NODERBAC_DB_PASSWORD: "from-env" }).password(), "from-env");
  const unspecified = ["0", "0", "0", "0"].join(".");
  assert.throws(
    () => new Settings({ NODERBAC_BIND: unspecified, NODERBAC_PORT: "8765" }).bind(),
    (err) => err instanceof SettingsError && String(err.message).includes("Refusing to listen"),
  );
  const allowed = new Settings({
    NODERBAC_BIND: unspecified,
    NODERBAC_PORT: "8765",
    NODERBAC_ALLOW_REMOTE: "yes",
  });
  assert.deepEqual(allowed.bind(), [unspecified, 8765]);
  assert.deepEqual(new Settings({}).bind(), ["127.0.0.1", 8765]);
});

test("pbkdf2 round trip", () => {
  const hasher = new PasswordHash();
  const stored = hasher.hash("admin123");
  assert.equal(stored.startsWith("pbkdf2_sha256$"), true);
  assert.equal(hasher.verify("admin123", stored), true);
  assert.equal(hasher.verify("admin123", "not-this-scheme"), false);
  assert.equal(hasher.verify("other", stored), false);
});

test("seed once, data scope, protected rows, and the web cookie", async () => {
  const home = tempDir("noderbac-rbac-");
  const sqliteFile = path.join(home, "noderbac.sqlite3");
  await withEnv(
    {
      HOME: home,
      NODERBAC_HOME: home,
      NODERBAC_DB_ENGINE: "sqlite3",
      NODERBAC_SQLITE_FILE: sqliteFile,
      NODERBAC_DB_PASSWORD: null,
      NODERBAC_BIND: "127.0.0.1",
      NODERBAC_PORT: "0",
      NODERBAC_ALLOW_REMOTE: null,
      NODERBAC_DB_NAME: null,
    },
    async () => {
      const desk = new Desk(quietLogger(home));
      await dropTables(desk.store);
      const seeded = await desk.db_init();
      assert.match(seeded, /noderbac\.sqlite3: seeded/);
      assert.equal(seeded.includes("noderbac_test"), false);
      assert.equal(seeded.includes("ruoyi_db"), false);
      const again = await desk.db_init();
      assert.match(again, /present/);
      assert.equal(again.includes("seeded"), false);

      await dropTables(desk.store);
      let result = await runCli(["user-list"], home);
      assert.equal(result.code, 1, result.err);
      assert.match(result.err, /Not signed in/);
      let count = await desk.store.query_one("SELECT COUNT(*) AS n FROM sys_user");
      assert.equal(Number(count.n), 4);
      const admins = await desk.store.query_one(
        "SELECT COUNT(*) AS n FROM sys_user WHERE user_name = 'admin'",
      );
      assert.equal(Number(admins.n), 1);

      await dropTables(desk.store);
      let note = "";
      try {
        note = await desk.serve_background();
        assert.match(note, /http:\/\/127\.0\.0\.1:/);
        count = await desk.store.query_one("SELECT COUNT(*) AS n FROM sys_user");
        assert.equal(Number(count.n), 4);
        result = await runCli(
          ["login", "--user-name", "admin", "--password", Schema.INITIAL_ADMIN_PASSWORD],
          home,
        );
        assert.equal(result.code, 0, result.err);
        assert.match(result.out, /Signed in as admin/);
        result = await runCli(["db-init"], home);
        assert.equal(result.code, 0, result.err);
        assert.match(result.out, /present/);
        assert.equal(result.out.includes("seeded"), false);

        result = await runCli(["whoami"], home);
        assert.match(result.out, /admin=yes/);
        result = await runCli(["user-list"], home);
        assert.deepEqual(names(result.out), ["admin", "operator", "clerk", "lead"]);

        result = await runCli(
          ["login", "--user-name", "operator", "--password", Schema.INITIAL_OPERATOR_PASSWORD],
          home,
        );
        assert.equal(result.code, 0, result.err);
        result = await runCli(["user-list"], home);
        assert.deepEqual(names(result.out), ["operator"]);
        result = await runCli(
          ["user-add", "--user-name", "extra", "--nick-name", "Extra", "--dept-id", "102", "--role-id", "2"],
          home,
        );
        assert.equal(result.code, 1);
        assert.match(result.err, /Missing permission/);
        result = await runCli(
          ["config-set", "--config-key", "sys.user.initPassword", "--config-value", "nope"],
          home,
        );
        assert.equal(result.code, 1);
        assert.match(result.err, /Missing permission/);

        result = await runCli(
          ["login", "--user-name", "lead", "--password", Schema.INITIAL_LEAD_PASSWORD],
          home,
        );
        assert.equal(result.code, 0, result.err);
        result = await runCli(["user-list"], home);
        assert.deepEqual(names(result.out), ["admin", "clerk", "lead"]);

        result = await runCli(
          ["login", "--user-name", "clerk", "--password", Schema.INITIAL_CLERK_PASSWORD],
          home,
        );
        assert.equal(result.code, 0, result.err);
        result = await runCli(["user-list"], home);
        assert.deepEqual(names(result.out), ["clerk"]);

        await desk.store.execute("UPDATE sys_role SET data_scope = '5' WHERE role_id = 2");
        try {
          result = await runCli(["user-list"], home);
          assert.equal(result.code, 0, result.err);
          assert.deepEqual(names(result.out), []);
        } finally {
          await desk.store.execute("UPDATE sys_role SET data_scope = '3' WHERE role_id = 2");
        }

        result = await runCli(
          ["login", "--user-name", "admin", "--password", Schema.INITIAL_ADMIN_PASSWORD],
          home,
        );
        assert.equal(result.code, 0, result.err);
        result = await runCli(["user-remove", "--user-id", "1"], home);
        assert.equal(result.code, 1);
        assert.match(result.err, /cannot be removed/);
        result = await runCli(["user-edit", "--user-id", "1", "--status", "1"], home);
        assert.equal(result.code, 1);
        assert.match(result.err, /stays enabled/);
        result = await runCli(
          ["role-grant", "--role-id", "1", "--menu-ids", "1", "--data-scope", "3"],
          home,
        );
        assert.equal(result.code, 1);
        assert.match(result.err, /not edited/);
        result = await runCli(["logout"], home);
        assert.equal(result.code, 0, result.err);
        result = await runCli(["login", "--user-name", "missing", "--password", "admin123"], home);
        assert.equal(result.code, 1);
        assert.match(result.err, /Unknown account or wrong password/);
        result = await runCli(["notice-list"], home);
        assert.equal(result.code, 1);
        assert.match(result.err, /Not signed in/);

        const url = note.split("\n")[0].split(": ").slice(1).join(": ");
        const admin = await signIn("admin", Schema.INITIAL_ADMIN_PASSWORD, url);
        const page = await request(`${url.replace(/\/$/, "")}/users`, "GET", { cookie: admin });
        assert.equal(page.status, 200);
        assert.match(page.body, /Add a user/);
        assert.match(page.body, /clerk/);
        const csrf = page.body.match(/name="csrf" value="([^"]+)"/);
        assert.ok(csrf);
        const denied = await request(`${url.replace(/\/$/, "")}/users/add`, "POST", {
          cookie: admin,
          body: "user_name=x&csrf=nope",
        });
        assert.equal(denied.status, 400);
        assert.match(denied.body, /form token/);
        const operator = await signIn("operator", Schema.INITIAL_OPERATOR_PASSWORD, url);
        const scoped = await request(`${url.replace(/\/$/, "")}/users`, "GET", { cookie: operator });
        assert.equal(scoped.status, 200);
        assert.equal(scoped.body.includes("Add a user"), false);
        assert.match(scoped.body, /operator/);
        assert.equal(scoped.body.includes(">clerk<"), false);
        assert.equal(scoped.body.includes(">lead<"), false);
        const blocked = await request(`${url.replace(/\/$/, "")}/roles`, "GET", { cookie: operator });
        assert.equal(blocked.status, 403);
        assert.match(blocked.body, /Missing permission/);
        const bare = await request(`${url.replace(/\/$/, "")}/users`, "GET");
        assert.ok(bare.status === 302 || bare.status === 303);
        assert.equal(bare.headers.location, "/login");
      } finally {
        await desk.web().stop();
      }
    },
  );
});

async function signIn(userName, password, url) {
  const body = `user_name=${encodeURIComponent(userName)}&password=${encodeURIComponent(password)}`;
  const login = new URL("/login", url).href;
  const page = await request(login, "POST", { body });
  assert.ok(page.status === 302 || page.status === 303, page.body);
  const cookie = page.headers["set-cookie"];
  const raw = Array.isArray(cookie) ? cookie.join(";") : String(cookie || "");
  assert.match(raw, /noderbac_session=/);
  assert.equal(raw.includes(password), false);
  return raw.split("noderbac_session=")[1].split(";")[0];
}

test("main constructs ChronicleLogger and a sign-in secret stays out of the log", async () => {
  const source = fs.readFileSync(
    path.join(path.dirname(new URL(import.meta.url).pathname), "../src/NodeRbac/cli.js"),
    "utf8",
  );
  assert.match(source, /new ChronicleLogger\(/);
  assert.equal(source.includes("python -m pip install"), false);
  const logdir = tempDir("noderbac-log-");
  const home = tempDir("noderbac-loghome-");
  const secret = "s3cret-value-not-for-logs";
  await withEnv(
    {
      HOME: home,
      NODERBAC_HOME: home,
      NODERBAC_DB_ENGINE: "sqlite3",
      NODERBAC_SQLITE_FILE: path.join(home, "noderbac.sqlite3"),
      NODERBAC_DB_PASSWORD: null,
      DEBUG: null,
      NODERBAC_DEBUG: null,
    },
    async () => {
      await new Desk(quietLogger(home)).db_init();
      const code = await main(
        ["login", "--user-name", "admin", "--password", secret],
        home,
        logdir,
      );
      assert.equal(code, 1);
      let blob = "";
      for (const name of fs.readdirSync(logdir)) {
        const full = path.join(logdir, name);
        if (fs.statSync(full).isFile()) blob += fs.readFileSync(full, "utf8");
      }
      assert.equal(blob.includes(secret), false);
    },
  );
});

test("sqlite3 is the default file and mysql is choice 2", async () => {
  const home = tempDir("noderbac-engine-");
  const settings = new Settings({ NODERBAC_HOME: home, HOME: home }, home);
  assert.equal(settings.engine(), "sqlite3");
  assert.match(settings.sqlite_path(), /noderbac\.sqlite3$/);
  const lines = settings.choice_lines();
  assert.match(lines[0], /Enter uses sqlite3/);
  assert.match(lines[0], /default file/);
  assert.match(lines[1], /1 sqlite3/);
  assert.match(lines[1], /noderbac\.sqlite3/);
  assert.match(lines[1], /\(default file\)/);
  assert.match(lines[2], /2 mysql/);
  const blank = settings.apply_choice("");
  assert.match(blank, /sqlite3/);
  assert.match(blank, /\(default file\)/);
  const file = path.join(home, "database");
  assert.match(fs.readFileSync(file, "utf8"), /NODERBAC_DB_ENGINE=sqlite3/);
  assert.match(settings.apply_choice("1"), /sqlite3/);
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  assert.equal(fs.existsSync(path.join(home, "noderbac.sqlite3")), false);

  const mysql = new Settings({ NODERBAC_HOME: home, HOME: home }, home);
  assert.match(mysql.apply_choice("mysql"), /mysql/);
  assert.equal(mysql.engine(), "mysql");
  const locked = new Settings({ NODERBAC_HOME: home, HOME: home, NODERBAC_DB_ENGINE: "sqlite3" }, home);
  assert.throws(
    () => locked.apply_choice("2"),
    (err) => err instanceof SettingsError && String(err.message).includes("environment"),
  );
  assert.equal(locked.apply_choice(""), locked.engine_sentence());
  const mysqlEnv = new Settings({ NODERBAC_HOME: home, HOME: home, NODERBAC_DB_ENGINE: "mysql" }, home);
  const kept = mysqlEnv.apply_choice("");
  assert.match(kept, /mysql/);
  assert.match(kept, /environment/);
  assert.equal(mysqlEnv.engine(), "mysql");
  assert.throws(() => settings.apply_choice("postgres"), SettingsError);

  await withEnv(
    {
      HOME: home,
      NODERBAC_HOME: home,
      NODERBAC_DB_ENGINE: null,
      NODERBAC_SQLITE_FILE: null,
    },
    async () => {
      const before = fs.existsSync(path.join(home, "noderbac.sqlite3"));
      const tty = Cli.stdout_is_tty;
      Cli.stdout_is_tty = () => false;
      let result;
      try {
        result = await runCli(["db-engine"], home);
      } finally {
        Cli.stdout_is_tty = tty;
      }
      assert.equal(result.code, 0, result.err);
      assert.match(result.out, /1 sqlite3/);
      assert.match(result.out, /2 mysql/);
      assert.equal(fs.existsSync(path.join(home, "noderbac.sqlite3")), before);
    },
  );
});
