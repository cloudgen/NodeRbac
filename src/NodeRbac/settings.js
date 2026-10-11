// =============================================================================
// Process settings for NodeRbac.
// requirement-environment — names, defaults, and the mode-0600 password file.
// requirement-nodejs-oop — class Settings and SettingsError.
// =============================================================================
import fs from "node:fs";
import path from "node:path";

export class SettingsError extends Error {
  // A missing or refused setting. The next step is for the operator.

  constructor(message, nxt, logger = null) {
    super(message);
    this.name = "SettingsError";
    this.logger = logger;
    this.nxt = nxt;
    if (logger != null) {
      logger.log_message("instantiated", { component: "SettingsError" });
    }
  }
}

export class Settings {
  // Environment values for the database, the web bind, and the home folder.
  // The environment wins. A mode-0600 file supplies a key only when the
  // environment value is missing. Defaults never include a password.

  static APP_DIR = "NodeRbac";
  static FILE_NAME = "database";
  static SQLITE_NAME = "noderbac.sqlite3";
  static ENGINES = ["sqlite3", "mysql"];
  static DEFAULTS = {
    NODERBAC_DB_HOST: "127.0.0.1",
    NODERBAC_DB_PORT: "3306",
    NODERBAC_DB_USER: "noderbac",
    NODERBAC_DB_NAME: "noderbac",
    NODERBAC_BIND: "127.0.0.1",
    NODERBAC_PORT: "8765",
  };
  static LOOPBACK = ["127.0.0.1", "localhost", "::1"];

  constructor(environ = null, home = null, logger = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "Settings" });
    }
    this.environ = environ == null ? process.env : environ;
    if (home == null) home = this.environ.HOME || "";
    this.home = home;
    this._file_cache = null;
  }

  app_home() {
    // The folder that holds the language leaf, the session, and the database file.
    const override = this.environ.NODERBAC_HOME || "";
    if (override) return override;
    if (!this.home) return "";
    return path.join(this.home, ".local", this.constructor.APP_DIR);
  }

  database_file() {
    const folder = this.app_home();
    if (!folder) return "";
    return path.join(folder, this.constructor.FILE_NAME);
  }

  _file_map() {
    if (this._file_cache != null) return this._file_cache;
    const found = {};
    const filePath = this.database_file();
    if (filePath) {
      let info = null;
      try {
        info = fs.statSync(filePath);
      } catch {
        info = null;
      }
      if (info && info.isFile()) {
        if ((info.mode & 0o777) !== 0o600) {
          this._file_cache = {};
          return this._file_cache;
        }
        let lines = [];
        try {
          lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
        } catch {
          lines = [];
        }
        for (const line of lines) {
          if (!line || line.startsWith("#") || !line.includes("=")) continue;
          const eq = line.indexOf("=");
          found[line.slice(0, eq).trim()] = line.slice(eq + 1);
        }
      }
    }
    this._file_cache = found;
    return found;
  }

  get(name) {
    // One setting. Environment, then the 0600 file, then a default.
    const current = this.environ[name] ?? "";
    if (current !== "") return current;
    const filed = this._file_map()[name] ?? "";
    if (filed !== "") return filed;
    return this.constructor.DEFAULTS[name] ?? "";
  }

  engine() {
    // sqlite3 or mysql. An empty setting is the sqlite3 file.
    const value = this.get("NODERBAC_DB_ENGINE").trim().toLowerCase();
    if (value === "") return "sqlite3";
    if (!this.constructor.ENGINES.includes(value)) {
      throw new SettingsError(
        "NODERBAC_DB_ENGINE must be sqlite3 or mysql.",
        "unset NODERBAC_DB_ENGINE, or set sqlite3 or mysql",
        this.logger,
      );
    }
    return value;
  }

  sqlite_path() {
    // The sqlite3 file. The default is noderbac.sqlite3 in the home folder.
    const override = this.get("NODERBAC_SQLITE_FILE");
    if (override) return override;
    const folder = this.app_home();
    if (!folder) {
      throw new SettingsError(
        "The home folder is not set.",
        "export HOME or NODERBAC_HOME",
        this.logger,
      );
    }
    return path.join(folder, this.constructor.SQLITE_NAME);
  }

  storage_label() {
    if (this.engine() === "sqlite3") return this.sqlite_path();
    return this.get("NODERBAC_DB_NAME");
  }

  choice_lines() {
    const filePath = this.sqlite_path();
    const mark = this.get("NODERBAC_SQLITE_FILE") === "" ? " (default file)" : "";
    return [
      "Database engine. Enter uses sqlite3 and the default file.",
      `1 sqlite3  ${filePath}${mark}`,
      `2 mysql    ${this.get("NODERBAC_DB_NAME")}`,
      `Current: ${this.engine()}`,
    ];
  }

  engine_sentence() {
    if (this.engine() === "sqlite3") {
      const mark = this.get("NODERBAC_SQLITE_FILE") === "" ? " (default file)" : "";
      return `Database engine: sqlite3 ${this.sqlite_path()}${mark}.`;
    }
    return `Database engine: mysql ${this.get("NODERBAC_DB_NAME")}.`;
  }

  apply_choice(token) {
    // Store sqlite3 or mysql. Enter selects sqlite3 and the default file.
    // A set environment value wins and is not overwritten.
    const raw = token == null ? "" : String(token).trim().toLowerCase();
    const text = raw === "" ? "sqlite3" : raw;
    let engine;
    if (text === "1" || text === "sqlite3") engine = "sqlite3";
    else if (text === "2" || text === "mysql") engine = "mysql";
    else {
      throw new SettingsError(
        "The database engine must be sqlite3 or mysql.",
        "choose 1 for the sqlite3 file or 2 for mysql",
        this.logger,
      );
    }
    const env = (this.environ.NODERBAC_DB_ENGINE || "").trim().toLowerCase();
    if (env) {
      if (!this.constructor.ENGINES.includes(env)) {
        throw new SettingsError(
          "NODERBAC_DB_ENGINE must be sqlite3 or mysql.",
          "unset NODERBAC_DB_ENGINE, or set sqlite3 or mysql",
          this.logger,
        );
      }
      if (env !== engine) {
        if (raw === "") return `${this.engine_sentence()} The environment wins.`;
        throw new SettingsError(
          "NODERBAC_DB_ENGINE is set in the environment.",
          "unset NODERBAC_DB_ENGINE to store the choice in the database file",
          this.logger,
        );
      }
      return this.engine_sentence();
    }
    this.save_engine(engine);
    return this.engine_sentence();
  }

  save_engine(engine) {
    // Store the engine in the mode-0600 file. Other lines stay.
    engine = engine == null ? "" : String(engine).trim().toLowerCase();
    if (!this.constructor.ENGINES.includes(engine)) {
      throw new SettingsError(
        "The database engine must be sqlite3 or mysql.",
        "choose 1 for the sqlite3 file or 2 for mysql",
        this.logger,
      );
    }
    const folder = this.app_home();
    if (!folder) {
      throw new SettingsError(
        "The home folder is not set.",
        "export HOME or NODERBAC_HOME",
        this.logger,
      );
    }
    fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
    fs.chmodSync(folder, 0o700);
    const filePath = this.database_file();
    let lines = [];
    let info = null;
    try {
      info = fs.statSync(filePath);
    } catch {
      info = null;
    }
    if (info && info.isFile()) {
      if ((info.mode & 0o777) !== 0o600) {
        throw new SettingsError(
          "The database file is not mode 0600.",
          "chmod 0600 the database file, or remove it and choose again",
          this.logger,
        );
      }
      try {
        lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
        if (lines.length && lines[lines.length - 1] === "") lines.pop();
      } catch {
        throw new SettingsError(
          "The database file could not be read.",
          "check the database file, then choose the engine again",
          this.logger,
        );
      }
    }
    let found = false;
    const rewritten = [];
    for (const line of lines) {
      const key = line.includes("=") ? line.split("=", 1)[0].trim() : "";
      if (key === "NODERBAC_DB_ENGINE") {
        rewritten.push(`NODERBAC_DB_ENGINE=${engine}`);
        found = true;
      } else {
        rewritten.push(line);
      }
    }
    if (!found) rewritten.push(`NODERBAC_DB_ENGINE=${engine}`);
    const payload = `${rewritten.join("\n").replace(/\n+$/, "")}\n`;
    const temporary = `${filePath}.tmp`;
    const descriptor = fs.openSync(temporary, "w", 0o600);
    try {
      fs.writeSync(descriptor, payload);
    } finally {
      fs.closeSync(descriptor);
    }
    fs.chmodSync(temporary, 0o600);
    fs.renameSync(temporary, filePath);
    fs.chmodSync(filePath, 0o600);
    this._file_cache = null;
  }

  password() {
    return this.get("NODERBAC_DB_PASSWORD");
  }

  require_password() {
    const value = this.password();
    if (value) return value;
    throw new SettingsError(
      "The database password is not set.",
      "export NODERBAC_DB_PASSWORD and run node-rbac db-init",
      this.logger,
    );
  }

  database() {
    // The MySQL connection values. The password is required.
    const name = this.get("NODERBAC_DB_NAME");
    if (!name || !/^[A-Za-z0-9_]+$/.test(name)) {
      throw new SettingsError(
        "NODERBAC_DB_NAME must be letters, digits, and underscores.",
        "export NODERBAC_DB_NAME=noderbac",
        this.logger,
      );
    }
    const port = Number(this.get("NODERBAC_DB_PORT"));
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new SettingsError(
        "NODERBAC_DB_PORT must be a port number.",
        "export NODERBAC_DB_PORT=3306",
        this.logger,
      );
    }
    return {
      host: this.get("NODERBAC_DB_HOST"),
      port,
      user: this.get("NODERBAC_DB_USER"),
      password: this.require_password(),
      database: name,
    };
  }

  bind() {
    // Web bind address and port. Non-loopback needs an explicit allow.
    const host = this.get("NODERBAC_BIND");
    const port = Number(this.get("NODERBAC_PORT"));
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      throw new SettingsError(
        "NODERBAC_PORT must be a port number. 0 asks the system for a free port.",
        "export NODERBAC_PORT=8765",
        this.logger,
      );
    }
    if (!this.constructor.LOOPBACK.includes(host) && this.environ.NODERBAC_ALLOW_REMOTE !== "yes") {
      throw new SettingsError(
        `Refusing to listen on ${host}.`,
        "keep NODERBAC_BIND=127.0.0.1, or export NODERBAC_ALLOW_REMOTE=yes",
        this.logger,
      );
    }
    return [host, port];
  }
}
