// =============================================================================
// Web interface for the same RBAC actions as the text menu.
// requirement-web-interface — loopback pages, cookie session, permission checks.
// requirement-nodejs-oop — class WebApp.
// =============================================================================
import http from "node:http";

import { SettingsError } from "./settings.js";

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
}

function decodeForm(value) {
  const plus = String(value).replaceAll("+", " ");
  const bytes = [];
  for (let i = 0; i < plus.length; i += 1) {
    if (plus[i] === "%" && /^[0-9A-Fa-f]{2}$/.test(plus.slice(i + 1, i + 3))) {
      bytes.push(Number.parseInt(plus.slice(i + 1, i + 3), 16));
      i += 2;
      continue;
    }
    const encoded = Buffer.from(plus[i], "utf8");
    for (const byte of encoded) bytes.push(byte);
  }
  return Buffer.from(bytes).toString("utf8");
}

function parseForm(raw) {
  // parse_qs(..., keep_blank_values=True). A key without "=" is ignored.
  const form = {};
  const text = String(raw || "");
  if (!text) return form;
  for (const part of text.split("&")) {
    if (!part.includes("=")) continue;
    const eq = part.indexOf("=");
    const key = decodeForm(part.slice(0, eq));
    const value = decodeForm(part.slice(eq + 1));
    if (!Object.prototype.hasOwnProperty.call(form, key)) form[key] = [];
    form[key].push(value);
  }
  return form;
}

function intError(original) {
  const err = new Error(`invalid literal for int() with base 10: '${original}'`);
  err.name = "ValueError";
  return err;
}

function pyInt(raw) {
  // Python int(text): surrounding spaces, one sign, and underscores between digits.
  const original = typeof raw === "string" ? raw : String(raw);
  const text = original.trim();
  let index = 0;
  let sign = 1;
  if (text[index] === "+" || text[index] === "-") {
    if (text[index] === "-") sign = -1;
    index += 1;
  }
  let digits = "";
  let sawDigit = false;
  let prevUnderscore = false;
  for (; index < text.length; index += 1) {
    const ch = text[index];
    if (ch === "_") {
      if (!sawDigit || prevUnderscore) throw intError(original);
      prevUnderscore = true;
      continue;
    }
    if (ch < "0" || ch > "9") throw intError(original);
    prevUnderscore = false;
    sawDigit = true;
    digits += ch;
  }
  if (!sawDigit || prevUnderscore) throw intError(original);
  const number = sign * Number(digits);
  if (!Number.isSafeInteger(number)) throw intError(original);
  return number;
}

function field(obj, name) {
  if (obj == null) return undefined;
  if (typeof obj.get === "function") {
    const value = obj.get(name);
    if (value !== undefined) return value;
  }
  return obj[name];
}

function listedValues(form, name) {
  if (form == null) return [];
  const values = typeof form.get === "function" ? form.get(name) : form[name];
  if (values == null || values === "") return [];
  return Array.isArray(values) ? values : [values];
}

function rowGet(row, name) {
  if (row == null) return undefined;
  if (typeof row.get === "function") {
    const value = row.get(name);
    if (value !== undefined) return value;
  }
  return row[name];
}

function writeBody(handler, data) {
  if (handler.wfile && typeof handler.wfile.write === "function") {
    handler.wfile.write(data);
    return;
  }
  handler.write_body(data);
}

function clientHost(address) {
  const host = address == null ? "" : String(address);
  if (host === "::ffff:127.0.0.1") return "127.0.0.1";
  return host;
}

class NodeHandler {
  constructor(req, res, body, logger) {
    this.path = req.url || "/";
    this.requestline = `${req.method} ${req.url} HTTP/${req.httpVersion}`;
    this.client_address = [clientHost(req.socket.remoteAddress), req.socket.remotePort];
    this.headers = {
      get(name) {
        const value = req.headers[String(name).toLowerCase()];
        if (value == null) return "";
        return Array.isArray(value) ? value.join(", ") : String(value);
      },
    };
    this.rfile = {
      read: (length) => {
        const data = Buffer.isBuffer(body) ? body : Buffer.from(body || "");
        if (length == null) return data;
        return data.subarray(0, length);
      },
    };
    this.wfile = {
      write: (data) => {
        if (!res.writableEnded) res.end(data);
      },
    };
    this._res = res;
    this._logger = logger;
    this._headers = [];
    this._code = 200;
    this._headed = false;
  }

  send_response(code) {
    this._code = code;
    this.log_request(code);
  }

  log_request(code, size = "-") {
    if (this._logger == null) return;
    this._logger.log_message(
      `http "${this.requestline}" ${code} ${size}`,
      { component: "WebApp" },
    );
  }

  send_header(key, value) {
    this._headers.push([key, value]);
  }

  end_headers() {
    if (this._headed) return;
    this._headed = true;
    const headers = {};
    for (const [key, value] of this._headers) {
      if (Object.prototype.hasOwnProperty.call(headers, key)) {
        const current = headers[key];
        headers[key] = Array.isArray(current) ? current.concat(value) : [current, value];
      } else {
        headers[key] = value;
      }
    }
    this._res.writeHead(this._code, headers);
  }

  write_body(data) {
    this.wfile.write(data);
  }
}

export class WebApp {
  // Small HTTP site. Every mutating page calls Access or Catalog.

  static COOKIE = "noderbac_session";

  constructor(settings, access, catalog, report, logger = null, prepare = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "WebApp" });
    }
    this.settings = settings;
    this.access = access;
    this.catalog = catalog;
    this.report = report;
    this.prepare = prepare;
    this.server = null;
    this.thread = null;
    this.COOKIE = this.constructor.COOKIE;
  }

  url() {
    const [host, boundPort] = this.settings.bind();
    let port = boundPort;
    if (this.server != null && this.server.listening) {
      const address = this.server.address();
      if (address != null && typeof address === "object") port = address.port;
    }
    return `http://${host}:${port}/`;
  }

  async make_server() {
    if (this.server != null && this.server.listening) return this.server;
    const [host, port] = this.settings.bind();
    const server = http.createServer((req, res) => {
      this._on_request(req, res);
    });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, host, () => {
        server.removeListener("error", reject);
        resolve();
      });
    });
    this.server = server;
    return server;
  }

  async serve_foreground() {
    await this.make_server();
    if (this.logger != null) {
      this.logger.log_message(`listening ${this.url()}`, { component: "WebApp" });
    }
    let onStop = null;
    try {
      await new Promise((resolve) => {
        onStop = () => resolve();
        process.once("SIGINT", onStop);
      });
    } finally {
      if (onStop != null) process.off("SIGINT", onStop);
      await this.stop();
    }
  }

  async start_background() {
    if (this.thread != null && this.thread.is_alive) return this.url();
    if (this._background) return this._background;
    this._background = (async () => {
      await this.make_server();
      this.thread = { is_alive: true };
      if (this.logger != null) {
        this.logger.log_message(`listening ${this.url()}`, { component: "WebApp" });
      }
      return this.url();
    })();
    try {
      return await this._background;
    } catch (exc) {
      this._background = null;
      this.thread = null;
      throw exc;
    }
  }

  async stop() {
    const server = this.server;
    this.server = null;
    this.thread = null;
    this._background = null;
    if (server == null) return;
    if (typeof server.closeAllConnections === "function") server.closeAllConnections();
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }

  async _read_body(req) {
    const chunks = [];
    let size = 0;
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 100001) {
          req.destroy();
          break;
        }
        chunks.push(chunk);
      }
    } catch {
      // The unread tail was dropped at the form cap.
    }
    return Buffer.concat(chunks);
  }

  async _on_request(req, res) {
    const body = await this._read_body(req);
    const handler = new NodeHandler(req, res, body, this.logger);
    try {
      if (req.method === "GET" || req.method === "POST") {
        if (req.method === "GET") await this.get(handler);
        else await this.post(handler);
      } else {
        handler.send_response(501);
        handler.send_header("Content-Length", "0");
        handler.end_headers();
        if (req.method !== "HEAD") writeBody(handler, "");
        else if (!res.writableEnded) res.end();
      }
    } catch (exc) {
      if (!res.headersSent) await this._fail(handler, exc);
      else if (!res.writableEnded) res.end();
    }
  }

  async get(handler) {
    try {
      const path = new URL(handler.path, "http://127.0.0.1").pathname;
      const user = await this._user(handler);
      if (path === "/login") {
        await this._send(handler, 200, await this.login_page(""));
        return;
      }
      if (user == null) {
        this._redirect(handler, "/login");
        return;
      }
      const query = parseForm(new URL(handler.path, "http://127.0.0.1").search.slice(1));
      const error = this._first(query, "error");
      const body = await this._route_get(path, user, error);
      if (body == null) {
        await this._send(handler, 404, await this.page(user, "Not found", "<p>That page is not on this site.</p>"));
        return;
      }
      await this._send(handler, 200, body);
    } catch (exc) {
      await this._fail(handler, exc);
    }
  }

  async post(handler) {
    try {
      const path = new URL(handler.path, "http://127.0.0.1").pathname;
      const form = this._form(handler);
      if (path === "/login") {
        await this._post_login(handler, form);
        return;
      }
      const user = await this._user(handler);
      if (user == null) {
        this._redirect(handler, "/login");
        return;
      }
      if (!this._csrf_ok(user, form)) {
        await this._send(
          handler,
          400,
          await this.page(user, "Rejected", "<p>The form token did not match this session.</p>"),
        );
        return;
      }
      await this._route_post(handler, path, user, form);
    } catch (exc) {
      await this._fail(handler, exc);
    }
  }

  async _route_get(path, user, error) {
    if (path === "/") return this.home_page(user, error);
    if (path === "/users") {
      await this.access.require(user, "system:user:list");
      return this.users_page(user, error);
    }
    if (path === "/roles") {
      await this.access.require(user, "system:role:list");
      return this.roles_page(user, error);
    }
    if (path === "/menus") {
      await this.access.require(user, "system:menu:list");
      return this.menus_page(user, error);
    }
    if (path === "/depts") {
      await this.access.require(user, "system:dept:list");
      return this.depts_page(user, error);
    }
    if (path === "/posts") {
      await this.access.require(user, "system:post:list");
      return this.posts_page(user, error);
    }
    if (path === "/configs") {
      await this.catalog.access.require(user, "system:config:list");
      return this.configs_page(user, error);
    }
    if (path === "/dicts") {
      await this.catalog.access.require(user, "system:dict:list");
      return this.dicts_page(user, error);
    }
    if (path === "/notices") {
      await this.catalog.access.require(user, "system:notice:list");
      return this.notices_page(user, error);
    }
    if (path === "/oper-log") {
      await this.catalog.access.require(user, "monitor:operlog:list");
      return this.simple_page(user, "Operation log", this.report.oper_log(await this.catalog.oper_log(user)), error);
    }
    if (path === "/login-log") {
      await this.catalog.access.require(user, "monitor:logininfor:list");
      return this.simple_page(user, "Login log", this.report.login_log(await this.catalog.login_log(user)), error);
    }
    if (path === "/online") {
      await this.catalog.access.require(user, "monitor:online:list");
      return this.online_page(user, error);
    }
    if (path === "/database") {
      await this.access.require(user, "system:config:edit");
      return this.database_page(user, error);
    }
    return null;
  }

  async _route_post(handler, path, user, form) {
    if (path === "/logout") {
      await this.access.logout(field(user, "token"));
      this._redirect(handler, "/login", null, true);
      return;
    }
    if (path === "/users/add") {
      await this.access.user_add(
        user,
        this._first(form, "user_name"),
        this._first(form, "nick_name"),
        pyInt(this._first(form, "dept_id") || "0"),
        pyInt(this._first(form, "role_id") || "0"),
        this._first(form, "password"),
      );
      this._redirect(handler, "/users");
      return;
    }
    if (path === "/users/edit") {
      await this.access.user_edit(
        user,
        pyInt(this._first(form, "user_id") || "0"),
        this._first(form, "nick_name") || null,
        this._optional_int(form, "dept_id"),
        this._first(form, "status") || null,
      );
      this._redirect(handler, "/users");
      return;
    }
    if (path === "/users/remove") {
      await this.access.user_remove(user, pyInt(this._first(form, "user_id") || "0"));
      this._redirect(handler, "/users");
      return;
    }
    if (path === "/users/reset") {
      await this.access.user_reset_password(
        user,
        pyInt(this._first(form, "user_id") || "0"),
        this._first(form, "password"),
      );
      this._redirect(handler, "/users");
      return;
    }
    if (path === "/roles/grant") {
      const menus = listedValues(form, "menu_id").filter((item) => item !== "").map((item) => pyInt(item));
      const depts = listedValues(form, "dept_id").filter((item) => item !== "").map((item) => pyInt(item));
      const scope = this._first(form, "data_scope") || null;
      await this.access.role_grant(
        user,
        pyInt(this._first(form, "role_id") || "0"),
        menus,
        scope,
        depts,
      );
      this._redirect(handler, "/roles");
      return;
    }
    if (path === "/menus/add") {
      await this.access.menu_add(
        user,
        this._first(form, "menu_name"),
        pyInt(this._first(form, "parent_id") || "0"),
        this._first(form, "menu_type") || "F",
        this._first(form, "perms"),
        this._first(form, "path"),
      );
      this._redirect(handler, "/menus");
      return;
    }
    if (path === "/depts/add") {
      await this.access.dept_add(
        user,
        this._first(form, "dept_name"),
        pyInt(this._first(form, "parent_id") || "0"),
      );
      this._redirect(handler, "/depts");
      return;
    }
    if (path === "/posts/add") {
      await this.access.post_add(user, this._first(form, "post_code"), this._first(form, "post_name"));
      this._redirect(handler, "/posts");
      return;
    }
    if (path === "/configs/set") {
      await this.catalog.config_set(user, this._first(form, "config_key"), this._first(form, "config_value"));
      this._redirect(handler, "/configs");
      return;
    }
    if (path === "/dicts/add") {
      await this.catalog.dict_add(
        user,
        this._first(form, "dict_type"),
        this._first(form, "dict_label"),
        this._first(form, "dict_value"),
      );
      this._redirect(handler, "/dicts");
      return;
    }
    if (path === "/notices/add") {
      await this.catalog.notice_add(
        user,
        this._first(form, "title"),
        this._first(form, "notice_type") || "1",
        this._first(form, "content"),
      );
      this._redirect(handler, "/notices");
      return;
    }
    if (path === "/online/logout") {
      await this.catalog.online_logout(user, this._first(form, "token"));
      this._redirect(handler, "/online");
      return;
    }
    if (path === "/database") {
      await this.access.require(user, "system:config:edit");
      const before = this.settings.engine();
      this._apply_posted_engine(handler, form, true);
      if (this.settings.engine() !== before) {
        this._redirect(handler, "/login", null, true);
        return;
      }
      this._redirect(handler, "/database");
      return;
    }
    await this._send(handler, 404, await this.page(user, "Not found", "<p>That action is not on this site.</p>"));
  }

  _loopback(handler) {
    const host = handler.client_address ? handler.client_address[0] : "";
    return host === "127.0.0.1" || host === "::1" || host === "localhost";
  }

  _apply_posted_engine(handler, form, allowRemote = false) {
    const posted = this._first(form, "engine").trim().toLowerCase();
    if (posted === "") return;
    let wanted;
    if (posted === "1" || posted === "sqlite3") wanted = "sqlite3";
    else if (posted === "2" || posted === "mysql") wanted = "mysql";
    else {
      throw new SettingsError(
        "The database engine must be sqlite3 or mysql.",
        "choose sqlite3 or mysql",
        this.logger,
      );
    }
    if (wanted === this.settings.engine()) return;
    if (!allowRemote && !this._loopback(handler)) {
      throw new SettingsError(
        "The database engine can be changed from this computer.",
        "open the site on 127.0.0.1, or run node-rbac db-engine",
        this.logger,
      );
    }
    this.settings.apply_choice(wanted);
  }

  async _post_login(handler, form) {
    this._apply_posted_engine(handler, form);
    if (this.prepare != null) await this.prepare();
    const user = await this.access.login(
      this._first(form, "user_name"),
      this._first(form, "password"),
      handler.client_address ? handler.client_address[0] : "",
      "web",
      handler.headers.get("User-Agent"),
    );
    this._redirect(handler, "/", field(user, "token"));
  }

  async _fail(handler, exc) {
    const message = exc instanceof Error ? exc.message : String(exc);
    const nxt = exc && exc.nxt ? exc.nxt : "";
    let body = `<p class="error">${escapeHtml(message)}</p>`;
    if (nxt) body += `<p>${escapeHtml(nxt)}</p>`;
    const code = message.startsWith("Missing permission") ? 403 : 400;
    let user = null;
    try {
      user = await this._user(handler);
    } catch {
      user = null;
    }
    await this._send(handler, code, await this.page(user, "Not completed", body));
  }

  async _user(handler) {
    const token = this._cookie(handler)[this.COOKIE] || "";
    if (!token) return null;
    return this.access.actor_from_token(token);
  }

  _cookie(handler) {
    const raw = handler.headers.get("Cookie");
    const found = {};
    for (const part of String(raw || "").split(";")) {
      if (!part.includes("=")) continue;
      const eq = part.indexOf("=");
      found[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
    }
    return found;
  }

  _form(handler) {
    const header = handler.headers.get("Content-Length");
    const length = pyInt(header === "" ? "0" : header);
    if (length < 0 || length > 100000) throw new Error("The form is too large.");
    const raw = handler.rfile.read(length);
    const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw ?? "");
    return parseForm(text);
  }

  _first(form, name) {
    const values = listedValues(form, name);
    if (!values.length || values[0] == null || values[0] === "") return "";
    return String(values[0]);
  }

  _optional_int(form, name) {
    const raw = this._first(form, name);
    if (raw === "") return null;
    return pyInt(raw);
  }

  _csrf_ok(user, form) {
    const token = this._first(form, "csrf");
    return token !== "" && token === field(user, "csrf");
  }

  _hidden(user) {
    return `<input type="hidden" name="csrf" value="${escapeHtml(field(user, "csrf") || "")}">`;
  }

  async _send(handler, code, body, extra = null) {
    const data = Buffer.from(body, "utf8");
    handler.send_response(code);
    handler.send_header("Content-Type", "text/html; charset=utf-8");
    handler.send_header("Content-Length", String(data.length));
    handler.send_header("X-Content-Type-Options", "nosniff");
    handler.send_header("Referrer-Policy", "no-referrer");
    handler.send_header(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'",
    );
    if (extra) {
      for (const [key, value] of extra) handler.send_header(key, value);
    }
    handler.end_headers();
    writeBody(handler, data);
  }

  _redirect(handler, location, cookie = null, clear = false) {
    handler.send_response(303);
    handler.send_header("Location", location);
    handler.send_header("Content-Length", "0");
    if (cookie != null) {
      handler.send_header(
        "Set-Cookie",
        `${this.COOKIE}=${cookie}; HttpOnly; SameSite=Lax; Path=/`,
      );
    }
    if (clear) {
      handler.send_header(
        "Set-Cookie",
        `${this.COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
      );
    }
    handler.end_headers();
    writeBody(handler, "");
  }

  async nav(user) {
    if (user == null) return "<nav><a href=\"/login\">Sign in</a></nav>";
    const links = [["/", "Home"]];
    const pairs = [
      ["/users", "Users", "system:user:list"],
      ["/roles", "Roles", "system:role:list"],
      ["/menus", "Menus", "system:menu:list"],
      ["/depts", "Departments", "system:dept:list"],
      ["/posts", "Posts", "system:post:list"],
      ["/configs", "Parameters", "system:config:list"],
      ["/dicts", "Dictionaries", "system:dict:list"],
      ["/notices", "Notices", "system:notice:list"],
      ["/oper-log", "Operation log", "monitor:operlog:list"],
      ["/login-log", "Login log", "monitor:logininfor:list"],
      ["/online", "Online", "monitor:online:list"],
      ["/database", "Database", "system:config:edit"],
    ];
    for (const [href, label, perm] of pairs) {
      if (await this.access.allows(user.user_id, perm)) links.push([href, label]);
    }
    const parts = links.map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`);
    parts.push(
      `<form method="post" action="/logout" style="display:inline">${this._hidden(user)}<button type="submit">Sign out</button></form>`,
    );
    return `<nav>${parts.join(" ")}</nav>`;
  }

  async page(user, title, body) {
    return (
      "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">"
      + `<title>${escapeHtml(title)}</title><style>`
      + "body{font-family:sans-serif;margin:1.5rem;max-width:60rem}"
      + "nav a{margin-right:.7rem} table{border-collapse:collapse;margin:1rem 0}"
      + "td,th{border:1px solid #ccc;padding:.25rem .45rem;text-align:left}"
      + ".error{color:#8a1f1f} form.inline{display:inline}"
      + `</style></head><body><h1>${escapeHtml(title)}</h1>${await this.nav(user)}${body}</body></html>`
    );
  }

  _error_line(error) {
    if (!error) return "";
    return `<p class="error">${escapeHtml(error)}</p>`;
  }

  engine_fields() {
    const current = this.settings.engine();
    const filePath = this.settings.sqlite_path();
    const mark = this.settings.get("NODERBAC_SQLITE_FILE") === "" ? " (default file)" : "";
    const name = this.settings.get("NODERBAC_DB_NAME");
    const radio = (value, label) => {
      const checked = current === value ? " checked" : "";
      return `<label><input type="radio" name="engine" value="${value}"${checked}> ${escapeHtml(label)}</label>`;
    };
    return (
      "<fieldset><legend>Database</legend>"
      + `<p>${radio("sqlite3", `sqlite3 ${filePath}${mark}`)}</p>`
      + `<p>${radio("mysql", `mysql ${name}`)}</p></fieldset>`
    );
  }

  async login_page(error) {
    const body = (
      `${this._error_line(error)}<form method="post" action="/login">${this.engine_fields()}`
      + "<p><label>Account <input name=\"user_name\" autocomplete=\"username\"></label></p>"
      + "<p><label>Password <input name=\"password\" type=\"password\" autocomplete=\"current-password\"></label></p>"
      + "<p><button type=\"submit\">Sign in</button></p></form>"
      + "<p>Seeded accounts and initial passwords are in the product README. "
      + "Change them after the first sign-in. This site listens on this computer only "
      + "unless remote bind was explicitly allowed. "
      + "sqlite3 and the default file are already selected. "
      + "Change that only when you want mysql. mysql needs NODERBAC_DB_PASSWORD.</p>"
    );
    return this.page(null, "Sign in", body);
  }

  async database_page(user, error) {
    const body = (
      `${this._error_line(error)}<p>${escapeHtml(this.settings.engine_sentence())} The next sign-in uses the saved engine. `
      + "Changing it signs this browser out, because the session row stays in the previous database.</p>"
      + `<form method="post" action="/database">${this.engine_fields()}${this._hidden(user)}`
      + "<p><button type=\"submit\">Save</button></p></form>"
    );
    return this.page(user, "Database", body);
  }

  async home_page(user, error) {
    const who = await this.access.describe(user);
    const body = `${this._error_line(error)}<p>Signed in as <strong>${escapeHtml(field(user, "user_name"))}</strong>.</p><pre>${escapeHtml(who)}</pre>`;
    return this.page(user, "Home", body);
  }

  _rows_html(columns, rows) {
    const head = columns.map((name) => `<th>${escapeHtml(name)}</th>`).join("");
    const body = [];
    for (const row of rows || []) {
      const cells = columns.map((name) => `<td>${escapeHtml(rowGet(row, name))}</td>`);
      body.push(`<tr>${cells.join("")}</tr>`);
    }
    if (body.length === 0) body.push(`<tr><td colspan="${columns.length}">(none)</td></tr>`);
    return `<table><tr>${head}</tr>${body.join("")}</table>`;
  }

  async users_page(user, error) {
    const rows = await this.access.user_list(user);
    const parts = [
      this._error_line(error),
      this._rows_html(["user_id", "user_name", "nick_name", "dept_id", "dept_name", "status"], rows),
    ];
    if (await this.access.allows(user.user_id, "system:user:add")) {
      parts.push(
        `<h2>Add a user</h2><form method="post" action="/users/add">${this._hidden(user)}`
        + "<p>Account <input name=\"user_name\"></p><p>Name <input name=\"nick_name\"></p>"
        + "<p>Department id <input name=\"dept_id\"></p><p>Role id <input name=\"role_id\"></p>"
        + "<p>Password <input name=\"password\" type=\"password\"></p><p><button type=\"submit\">Add</button></p></form>",
      );
    }
    if (await this.access.allows(user.user_id, "system:user:edit")) {
      parts.push(
        `<h2>Edit a user</h2><form method="post" action="/users/edit">${this._hidden(user)}`
        + "<p>User id <input name=\"user_id\"></p><p>Name <input name=\"nick_name\"></p>"
        + "<p>Department id <input name=\"dept_id\"></p><p>Status <input name=\"status\" placeholder=\"0 or 1\"></p>"
        + "<p><button type=\"submit\">Save</button></p></form>",
      );
    }
    if (await this.access.allows(user.user_id, "system:user:resetPwd")) {
      parts.push(
        `<h2>Reset a password</h2><form method="post" action="/users/reset">${this._hidden(user)}`
        + "<p>User id <input name=\"user_id\"></p><p>Password <input name=\"password\" type=\"password\"></p>"
        + "<p><button type=\"submit\">Reset</button></p></form>",
      );
    }
    if (await this.access.allows(user.user_id, "system:user:remove")) {
      parts.push(
        `<h2>Remove a user</h2><form method="post" action="/users/remove">${this._hidden(user)}`
        + "<p>User id <input name=\"user_id\"></p><p><button type=\"submit\">Remove</button></p></form>",
      );
    }
    return this.page(user, "Users", parts.join(""));
  }

  async roles_page(user, error) {
    const rows = await this.access.role_list(user);
    const userId = field(user, "user_id");
    let menus = [];
    const canList = await this.access.allows(userId, "system:menu:list");
    const canEdit = await this.access.allows(userId, "system:role:edit");
    if (canList || canEdit) {
      try {
        menus = (await this.access.allows(userId, "system:menu:list"))
          ? await this.access.menu_list(user)
          : [];
      } catch {
        menus = await this.store_menus_for_grant(user);
      }
    }
    void menus;
    const parts = [
      this._error_line(error),
      this._rows_html(["role_id", "role_name", "role_key", "data_scope", "status"], rows),
    ];
    if (await this.access.allows(userId, "system:role:edit")) {
      const admin = await this.access.is_admin(userId);
      const listed = admin || await this.access.allows(userId, "system:menu:list");
      const grantMenus = listed ? await this.access.menu_list(user) : await this._menus_unscoped();
      const boxes = (grantMenus || []).map((menu) => (
        `<label><input type="checkbox" name="menu_id" value="${escapeHtml(rowGet(menu, "menu_id"))}"> ${escapeHtml(rowGet(menu, "menu_name"))} ${escapeHtml(rowGet(menu, "perms") || "")}</label><br>`
      ));
      parts.push(
        `<h2>Grant menus</h2><form method="post" action="/roles/grant">${this._hidden(user)}`
        + "<p>Role id <input name=\"role_id\"></p>"
        + "<p>Data scope <input name=\"data_scope\" placeholder=\"1, 2, 3, or 4\"></p>"
        + "<p>Custom department ids <input name=\"dept_id\"></p>"
        + `<div>${boxes.join("")}</div><p><button type="submit">Grant</button></p></form>`,
      );
    }
    return this.page(user, "Roles", parts.join(""));
  }

  async store_menus_for_grant(user) {
    void user;
    return this._menus_unscoped();
  }

  async _menus_unscoped() {
    return this.access.store.query_all(
      "\n            SELECT menu_id, menu_name, perms FROM sys_menu\n            WHERE status = '0' ORDER BY parent_id, order_num, menu_id\n            ",
    );
  }

  async menus_page(user, error) {
    const parts = [
      this._error_line(error),
      this._rows_html(
        ["menu_id", "parent_id", "menu_name", "menu_type", "perms"],
        await this.access.menu_list(user),
      ),
    ];
    if (await this.access.allows(user.user_id, "system:menu:add")) {
      parts.push(
        `<h2>Add a menu</h2><form method="post" action="/menus/add">${this._hidden(user)}`
        + "<p>Name <input name=\"menu_name\"></p><p>Parent id <input name=\"parent_id\" value=\"0\"></p>"
        + "<p>Type <input name=\"menu_type\" placeholder=\"M, C, or F\"></p>"
        + "<p>Permission <input name=\"perms\"></p><p>Path <input name=\"path\"></p>"
        + "<p><button type=\"submit\">Add</button></p></form>",
      );
    }
    return this.page(user, "Menus", parts.join(""));
  }

  async depts_page(user, error) {
    const parts = [
      this._error_line(error),
      this._rows_html(
        ["dept_id", "parent_id", "dept_name", "ancestors", "status"],
        await this.access.dept_list(user),
      ),
    ];
    if (await this.access.allows(user.user_id, "system:dept:add")) {
      parts.push(
        `<h2>Add a department</h2><form method="post" action="/depts/add">${this._hidden(user)}`
        + "<p>Name <input name=\"dept_name\"></p><p>Parent id <input name=\"parent_id\" value=\"0\"></p>"
        + "<p><button type=\"submit\">Add</button></p></form>",
      );
    }
    return this.page(user, "Departments", parts.join(""));
  }

  async posts_page(user, error) {
    const parts = [
      this._error_line(error),
      this._rows_html(
        ["post_id", "post_code", "post_name", "post_sort", "status"],
        await this.access.post_list(user),
      ),
    ];
    if (await this.access.allows(user.user_id, "system:post:add")) {
      parts.push(
        `<h2>Add a post</h2><form method="post" action="/posts/add">${this._hidden(user)}`
        + "<p>Code <input name=\"post_code\"></p><p>Name <input name=\"post_name\"></p>"
        + "<p><button type=\"submit\">Add</button></p></form>",
      );
    }
    return this.page(user, "Posts", parts.join(""));
  }

  async configs_page(user, error) {
    const parts = [
      this._error_line(error),
      this._rows_html(
        ["config_key", "config_name", "config_value", "config_type"],
        await this.catalog.config_list(user),
      ),
    ];
    if (await this.access.allows(user.user_id, "system:config:edit")) {
      parts.push(
        `<h2>Change a parameter</h2><form method="post" action="/configs/set">${this._hidden(user)}`
        + "<p>Key <input name=\"config_key\"></p><p>Value <input name=\"config_value\"></p>"
        + "<p><button type=\"submit\">Save</button></p></form>",
      );
    }
    return this.page(user, "Parameters", parts.join(""));
  }

  async dicts_page(user, error) {
    const parts = [
      this._error_line(error),
      this._rows_html(
        ["dict_type", "dict_label", "dict_value", "status"],
        await this.catalog.dict_list(user),
      ),
    ];
    if (await this.access.allows(user.user_id, "system:dict:add")) {
      parts.push(
        `<h2>Add a dictionary value</h2><form method="post" action="/dicts/add">${this._hidden(user)}`
        + "<p>Type <input name=\"dict_type\"></p><p>Label <input name=\"dict_label\"></p>"
        + "<p>Value <input name=\"dict_value\"></p><p><button type=\"submit\">Add</button></p></form>",
      );
    }
    return this.page(user, "Dictionaries", parts.join(""));
  }

  async notices_page(user, error) {
    const parts = [
      this._error_line(error),
      this._rows_html(
        ["notice_id", "notice_title", "notice_type", "status"],
        await this.catalog.notice_list(user),
      ),
    ];
    if (await this.access.allows(user.user_id, "system:notice:add")) {
      parts.push(
        `<h2>Publish a notice</h2><form method="post" action="/notices/add">${this._hidden(user)}`
        + "<p>Title <input name=\"title\"></p><p>Type <input name=\"notice_type\" placeholder=\"1 or 2\"></p>"
        + "<p>Content <input name=\"content\"></p><p><button type=\"submit\">Publish</button></p></form>",
      );
    }
    return this.page(user, "Notices", parts.join(""));
  }

  async simple_page(user, title, text, error) {
    const body = `${this._error_line(error)}<pre>${escapeHtml(text)}</pre>`;
    return this.page(user, title, body);
  }

  async online_page(user, error) {
    const rows = await this.catalog.online_list(user);
    const parts = [this._error_line(error)];
    for (const row of rows) {
      const token = rowGet(row, "token") || "";
      parts.push(
        `<p>${escapeHtml(rowGet(row, "user_name"))} ${escapeHtml(rowGet(row, "surface"))} ${escapeHtml(String(token).slice(0, 8))}… `,
      );
      if (await this.access.allows(user.user_id, "monitor:online:forceLogout")) {
        parts.push(
          `<form class="inline" method="post" action="/online/logout">${this._hidden(user)}`
          + `<input type="hidden" name="token" value="${escapeHtml(token)}">`
          + "<button type=\"submit\">Force logout</button></form>",
        );
      }
      parts.push("</p>");
    }
    if (rows.length === 0) parts.push("<p>(none)</p>");
    return this.page(user, "Online", parts.join(""));
  }
}
