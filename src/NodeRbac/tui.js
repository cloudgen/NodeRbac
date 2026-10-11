// =============================================================================
// Text menu session for NodeRbac.
// requirement-nodejs-tui — menu region and the bottom input box.
// requirement-nodejs-about — the about result page is framework_about.
// requirement-nodejs-oop — this module defines class Tui and MenuScreenError.
// The frame is class MenuPainter. cli.js constructs Tui and calls it.
// =============================================================================
import process from "node:process";

import { MenuPainter, curses, splitLines } from "./menu_painter.js";
import { MenuSession } from "./menu_session.js";
import { SystemLog } from "./system_log.js";
import { version as packageVersion } from "./version.js";

export class MenuScreenError extends Error {
  // The terminal cannot hold the menu and the framed input box.

  constructor(message = "", logger = null) {
    super(message);
    this.name = "MenuScreenError";
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "MenuScreenError" });
    }
  }
}

export class Tui {
  // Text menu session. The front board and the result pages stay on this screen.
  // MenuModel, MenuSession, and MenuPainter live in their own modules.
  // The rows are access, system-log, language, setup, audit, serve,
  // self-management, and Exit. There is no session row. Empty arguments ask
  // for an account and a password before that board. Domain rows call Desk.

  static DOMAIN_KINDS = [
    "login",
    "whoami",
    "logout",
    "serve",
    "user-list",
    "user-add",
    "user-edit",
    "user-remove",
    "user-reset-password",
    "role-list",
    "role-grant",
    "menu-list",
    "menu-add",
    "dept-list",
    "dept-add",
    "post-list",
    "post-add",
    "config-list",
    "config-set",
    "config-add",
    "dict-list",
    "dict-add",
    "notice-list",
    "notice-add",
    "oper-log",
    "login-log",
    "online-list",
    "online-logout",
    "db-engine",
  ];

  static ASKS = {
    login: [["user_name", "user_name", false], ["password", "password", true]],
    "user-add": [
      ["user_name", "user_name", false],
      ["nick_name", "nick_name", false],
      ["dept_id", "dept_id", false],
      ["role_id", "role_id", false],
      ["password", "password, or empty for the initial password", true],
    ],
    "user-edit": [
      ["user_id", "user_id", false],
      ["nick_name", "nick_name, or empty to keep it", false],
      ["dept_id", "dept_id, or empty to keep it", false],
      ["status", "status 0 or 1, or empty to keep it", false],
    ],
    "user-remove": [["user_id", "user_id", false]],
    "user-reset-password": [["user_id", "user_id", false], ["password", "password", true]],
    "role-grant": [
      ["role_id", "role_id", false],
      ["menu_ids", "menu ids separated by commas", false],
      ["data_scope", "data_scope 1-4, or empty to keep it", false],
      ["dept_ids", "dept ids for scope 2, or empty", false],
    ],
    "menu-add": [
      ["menu_name", "menu_name", false],
      ["parent_id", "parent_id", false],
      ["menu_type", "menu_type M, C, or F", false],
      ["perms", "permission string, or empty", false],
      ["path", "path, or empty", false],
    ],
    "dept-add": [["dept_name", "dept_name", false], ["parent_id", "parent_id", false]],
    "post-add": [["post_code", "post_code", false], ["post_name", "post_name", false]],
    "config-set": [["config_key", "config_key", false], ["config_value", "config_value", false]],
    "config-add": [
      ["config_key", "config_key", false],
      ["config_name", "config_name", false],
      ["config_value", "config_value", false],
    ],
    "dict-add": [
      ["dict_type", "dict_type", false],
      ["dict_label", "dict_label", false],
      ["dict_value", "dict_value", false],
    ],
    "notice-add": [
      ["notice_title", "notice title", false],
      ["notice_type", "notice_type 1 or 2", false],
      ["content", "content, or empty", false],
    ],
    "online-logout": [["token", "session token", false]],
  };

  constructor(app = null, appName = "NodeRbac", version = null, logger = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "Tui" });
    }
    this.app = app;
    this.app_name = appName;
    this.version = version == null ? packageVersion : version;
    this.painter = new MenuPainter(logger);
    this.system_log = new SystemLog(logger);
  }

  _name() {
    if (this.app != null) return this.app.app_name;
    return this.app_name;
  }

  _ver() {
    if (this.app != null) return this.app.version;
    return this.version;
  }

  front_lines() {
    // General Purpose: Path line and the front board rows.
    return [this.painter.path_line()].concat(this.painter.format_rows(this.painter.display_rows("front")));
  }

  self_lines() {
    // General Purpose: Path line and the self-management board under 8.
    return [this.painter.path_line()].concat(this.painter.format_rows(this.painter.display_rows("self")));
  }

  log_lines() {
    // General Purpose: Path line and the system-log board under 3.
    return [this.painter.path_line()].concat(this.painter.format_rows(this.painter.display_rows("log")));
  }

  language_lines() {
    // General Purpose: Path line and the language board under 4.
    return [this.painter.path_line()].concat(this.painter.format_rows(this.painter.display_rows("lang")));
  }

  help_on_screen() {
    // General Purpose: Help text when help is typed on the open menu.
    // The typed node-rbac help verb does not call this and does not draw the screen.
    const name = this._name();
    let verbs = "help, version, about";
    if (this.app != null) {
      const list = this.app.PRODUCT_VERBS;
      verbs = Array.isArray(list) ? list.join(", ") : Array.from(list).join(", ");
    }
    return (
      `help: usage for ${name}.\n` +
      `Verbs: ${verbs}.\n` +
      "version shows the installed version and does not call npm.\n" +
      "about shows the about page.\n" +
      "Sign in before this menu. login, logout, and whoami are typed verbs.\n" +
      "access, setup, and audit repeat the web pages. serve starts the site.\n" +
      "This program does not join media or list files in this folder.\n" +
      "version-check runs: npm view noderbac version\n" +
      "self-update runs: npm install -g noderbac@latest\n" +
      "self-install runs: npm install -g noderbac\n" +
      "self-uninstall runs: npm uninstall -g noderbac\n" +
      "On the command line, self-uninstall also needs --force.\n" +
      "Empty arguments on a terminal open this menu and do not run npm.\n" +
      "--password is visible in the process list. This menu masks it."
    );
  }

  async about_text() {
    // General Purpose: The about page body from AboutPage.framework_about.
    if (this.app == null) return "";
    return await this.app.about.framework_about();
  }

  _visible_lines(lines, room, pinLast) {
    // Lines that fit above the input box. A question pins its last line.
    if (room < 1) return [];
    if (lines.length <= room) return lines.slice();
    if (!pinLast) return lines.slice(-room);
    if (room === 1) return [lines[lines.length - 1]];
    return lines.slice(0, room - 2).concat(["…", lines[lines.length - 1]]);
  }

  _paint_lines(screen, model, title, lines, pinLast) {
    // Hand one question to MenuPainter. The session does not draw a second frame.
    this.painter.paint_prompt(
      screen,
      model,
      title,
      lines,
      pinLast,
      this._name(),
      this._ver(),
      (body, room, pin) => this._visible_lines(body, room, pin),
    );
  }

  _arm_blocking(screen) {
    // Clear the one-second clock wait. A no-key from that wait is not Esc.
    if (typeof screen.timeout === "function") screen.timeout(-1);
  }

  async read_key(screen, model, lines, title = "menu") {
    // General Purpose: Read one line from the bottom input box.
    // Returns the text, or null when the person presses Esc. The board's
    // one-second clock wait is cleared before each key.
    model.buffer = "";
    model.cursor = 0;
    model.focus = "input";
    while (true) {
      this._paint_lines(screen, model, title, lines, true);
      this._arm_blocking(screen);
      const key = await readKey(screen);
      if (key === -1 || key === 27) {
        model.error = "";
        model.buffer = "";
        model.cursor = 0;
        model.focus = "list";
        return null;
      }
      if (key === 10 || key === 13 || key === curses.KEY_ENTER) {
        const text = model.buffer;
        model.buffer = "";
        model.cursor = 0;
        model.error = "";
        return text;
      }
      if (key === curses.KEY_BACKSPACE || key === 127 || key === 8) {
        model._backspace();
        model.error = "";
        continue;
      }
      if (key === curses.KEY_LEFT || key === curses.KEY_RIGHT || model.edge_keys().includes(key)) {
        model._slide(key);
        continue;
      }
      if (key === curses.KEY_UP || key === curses.KEY_DOWN) continue;
      if (key >= 32 && key < 127) {
        model._insert(String.fromCharCode(key));
        model.error = "";
      }
    }
  }

  async notice(screen, model, lines, title = "result", closing = null) {
    // General Purpose: Show lines until the next key. The clock wait is cleared.
    model.buffer = "";
    model.cursor = 0;
    model.focus = "list";
    model.error = "";
    const tail = closing == null ? "Press a key to return to the main menu." : closing;
    const body = lines.concat(["", tail]);
    this._paint_lines(screen, model, title, body, true);
    this._arm_blocking(screen);
    try {
      await readKey(screen);
    } catch (err) {
      if (isInterrupt(err)) throw err;
    }
  }

  async _read_yes_no(screen, model, lines, title = "system-log") {
    // y/n from the box. Esc returns null. Empty is no.
    while (true) {
      let raw = await this.read_key(screen, model, lines, title);
      if (raw == null) return null;
      raw = raw.trim().toLowerCase();
      if (raw === "" || raw === "n" || raw === "no") return false;
      if (raw === "y" || raw === "yes") return true;
      model.error = "Please enter y or n";
    }
  }

  async _read_index(screen, model, lines, count, title = "system-log") {
    // 1-based index from the box. Ask again on a bad value. Esc returns null.
    while (true) {
      let raw = await this.read_key(screen, model, lines, title);
      if (raw == null) return null;
      raw = raw.trim();
      let idx;
      try {
        idx = menuInt(raw);
      } catch {
        model.error = "Please type a number";
        continue;
      }
      if (idx >= 1 && idx <= count) return idx - 1;
      model.error = `Enter 1–${count}`;
    }
  }

  async about_on_screen(screen = null, model = null) {
    // General Purpose: Show the about page.
    // With no screen, open the text screen when this is the direct verb.
    const text = await this.about_text();
    if (screen != null && model != null) {
      const lines = splitLines(text);
      await this.notice(screen, model, lines.length ? lines : [""], "about");
      return 0;
    }
    if (this.app != null && this.app.stdout_is_tty()) return this.open_direct("about");
    return text;
  }

  _screen_error(tooSmall) {
    if (this.app == null) return "missing";
    const next = `${this.app.CONSOLE_NAME} help`;
    if (tooSmall) {
      this.app.report_error(
        "The text screen is too small for the menu and the input box.",
        next,
      );
    } else {
      this.app.report_error(
        "The text menu could not open on this terminal.",
        next,
      );
    }
    return "missing";
  }

  _require_terminal() {
    if (this.app == null || !this.app.stdout_is_tty()) {
      if (this.app != null) {
        this.app.report_error(
          "No terminal for the text menu. Use a terminal.",
          `${this.app.CONSOLE_NAME} help`,
        );
      }
      return false;
    }
    return true;
  }

  async login_lines(state = "", error = "", databaseName = "") {
    // General Purpose: The sign-in text shown before the front board.
    const lines = [
      "Sign in before the menu.",
      "Type the account name, then the password.",
      "The password is masked. Esc leaves.",
    ];
    const desk = this.app != null ? this.app.desk : null;
    const settings = desk != null ? desk.settings : null;
    if (settings != null) {
      try {
        lines.push(await settings.engine_sentence());
      } catch {
        // The sentence is optional on the sign-in text.
      }
    }
    if (state === "seeded" && databaseName) {
      lines.push(`Database ${databaseName}: seeded.`);
      lines.push("Seeded accounts are in the product README. Change them after this sign-in.");
    }
    if (error) {
      lines.push("");
      lines.push(`ERROR: ${error}`);
    }
    return lines;
  }

  async login_gate(ask, state = "present", databaseName = "") {
    // General Purpose: Ask until the password matches. Esc returns false.
    // ask(lines) returns an object with user_name and password, or null.
    let error = "";
    while (true) {
      const picked = await ask(await this.login_lines(state, error, databaseName));
      if (picked == null) return false;
      if (this.app == null || this.app.desk == null) {
        error = "This menu has no command desk.";
        continue;
      }
      try {
        const userName = picked.user_name != null ? picked.user_name : "";
        const password = picked.password != null ? picked.password : "";
        await this.app.desk.login(userName, password);
        return true;
      } catch (exc) {
        error = errorText(exc);
      }
    }
  }

  async _menu_engine(screen, model) {
    // Ask for sqlite3 or mysql. Esc returns null. Enter selects sqlite3 and the default file.
    while (true) {
      const lines = Array.from(await this.app.desk.settings.choice_lines());
      lines.push("Enter uses sqlite3 and the default file. 2 uses mysql. Esc leaves.");
      const text = await this.read_key(screen, model, lines, "database");
      if (text == null) return null;
      try {
        return await this.app.desk.settings.apply_choice(text.trim());
      } catch (exc) {
        const nxt = exc && exc.nxt ? exc.nxt : "node-rbac db-engine";
        await this.notice(
          screen,
          model,
          [`ERROR: ${errorText(exc)}`, `Next: ${nxt}`],
          "database",
          "Press a key to choose again.",
        );
      }
    }
  }

  async open_text_menu() {
    // General Purpose: Use sqlite3 and the default file unless a choice is
    // already stored, initialize a missing database, ask for a sign-in, then
    // draw the front board. Does not ask for the engine or the file path.
    // Does not run npm. Returns "missing" when the screen cannot open or
    // the database cannot be prepared.
    if (!this._require_terminal()) return "missing";
    if (this.app == null || this.app.desk == null) return this._screen_error(false);
    const screenBox = {};
    let failure = null;
    let session;
    const onKind = async (kind) => {
      if (kind === "help") return this.help_on_screen();
      if (kind === "version-check" || kind === "self-update" || kind === "self-install" || kind === "self-uninstall") {
        return pipText(await this.app.self_manage.run_pip(kind));
      }
      const screen = screenBox.screen;
      if (kind === "view-log") {
        if (screen == null) return null;
        return this._view_log(screen, session.model);
      }
      if (kind === "clear-log") {
        if (screen == null) return null;
        return this._clear_log(screen, session.model);
      }
      if (kind === "log-folder") return this._log_folder();
      if (Tui.DOMAIN_KINDS.includes(kind)) {
        if (screen == null) return null;
        return this._domain(kind, screen, session.model);
      }
      return null;
    };
    session = new MenuSession(
      this._name(),
      this._ver(),
      async () => this.app.self_manage.local_version(),
      async () => this.about_text(),
      null,
      onKind,
      this.logger,
      this.painter,
    );
    try {
      await withScreen(async (screen) => {
        screenBox.screen = screen;
        let state;
        let databaseName;
        try {
          state = await this.app.desk.ensure_database();
          databaseName = await this.app.desk.settings.storage_label();
        } catch (exc) {
          failure = exc;
          return;
        }
        const signedIn = await this.login_gate(
          (lines) => this._ask_fields(screen, session.model, "login", Tui.ASKS.login),
          state,
          databaseName,
        );
        if (!signedIn) return;
        await session.run(screen);
      });
    } catch (err) {
      if (err instanceof MenuScreenError) return this._screen_error(true);
      if (isInterrupt(err)) throw err;
      return this._screen_error(false);
    }
    if (failure != null) {
      const nxt = failure.nxt || "node-rbac db-init";
      this.app.report_error(errorText(failure), nxt);
      return "missing";
    }
    return null;
  }

  async open_direct(kind) {
    // General Purpose: Open the text screen on about.
    // Does not start on the front board. Returns a process status.
    if (!this._require_terminal()) return 1;
    const codeBox = { code: 0 };
    const session = new MenuSession(
      this._name(),
      this._ver(),
      async () => this.app.self_manage.local_version(),
      async () => this.about_text(),
      null,
      async () => null,
      this.logger,
      this.painter,
    );
    try {
      await withScreen(async (screen) => {
        try {
          if (kind !== "about") {
            codeBox.code = 1;
            return;
          }
          codeBox.code = await this.about_on_screen(screen, session.model);
        } catch (exc) {
          if (isInterrupt(exc)) throw exc;
          await this.notice(
            screen,
            session.model,
            [`ERROR: ${errorText(exc)}`],
            "result",
            "Press a key to close.",
          );
          codeBox.code = 1;
        }
        session.leave_to_front();
        // Esc and a finished page return to the front board.
        if (codeBox.code === 0) await session.run(screen);
      });
    } catch (err) {
      if (err instanceof MenuScreenError) {
        this._screen_error(true);
        return 1;
      }
      if (isInterrupt(err)) throw err;
      this._screen_error(false);
      return 1;
    }
    return codeBox.code;
  }

  async _view_log(screen, model) {
    // List log files and return the chosen file for the result page.
    const folder = this.system_log.log_dir();
    if (!folder) return "No log folder.";
    const files = this.system_log.log_files();
    if (!files.length) return `No log file in ${folder}.`;
    const lines = ["Log files:"];
    files.forEach((file, index) => {
      lines.push(`${index + 1}. ${file.name}`);
    });
    lines.push("");
    lines.push("Choose a log file:");
    const picked = await this._read_index(screen, model, lines, files.length, "system-log");
    if (picked == null) return null;
    const file = files[picked];
    const body = this.system_log.read_log(file);
    if (body == null) return `ERROR: ${file.name} is not a log file in the log folder.`;
    const shown = body === "" ? "(empty)" : body;
    return `${file.name}\n\n${shown}`;
  }

  async _clear_log(screen, model) {
    // List log files, confirm, and empty the chosen file.
    const folder = this.system_log.log_dir();
    if (!folder) return "No log folder.";
    const files = this.system_log.log_files();
    if (!files.length) return `No log file in ${folder}.`;
    const lines = ["Log files:"];
    files.forEach((file, index) => {
      lines.push(`${index + 1}. ${file.name}`);
    });
    lines.push("");
    lines.push("Choose a log file to clear:");
    const picked = await this._read_index(screen, model, lines, files.length, "system-log");
    if (picked == null) return null;
    const file = files[picked];
    const answer = await this._read_yes_no(
      screen,
      model,
      [`Clear ${file.name}? (y/n)`],
      "system-log",
    );
    if (answer !== true) return null;
    if (!this.system_log.clear_log(file)) {
      return `ERROR: ${file.name} is not a log file in the log folder.`;
    }
    return `Cleared ${file.name}.`;
  }

  _log_folder() {
    // The log-folder result page. The path is logDir().
    return this.system_log.folder_text();
  }

  async _ask_fields(screen, model, title, fields) {
    // One field at a time. Esc returns null. A password field is masked.
    const values = {};
    for (const [name, label, secret] of fields) {
      model.mask = Boolean(secret);
      try {
        const text = await this.read_key(screen, model, [label], title);
        if (text == null) return null;
        values[name] = text.trim();
      } finally {
        model.mask = false;
      }
    }
    return values;
  }

  async _domain(kind, screen, model) {
    // General Purpose: The same Desk verb the command line runs.
    if (this.app == null || this.app.desk == null) {
      return "ERROR: This menu has no command desk.\nNext: node-rbac help";
    }
    if (kind === "db-engine") return this._menu_engine(screen, model);
    const options = {};
    const fields = Tui.ASKS[kind];
    if (fields) {
      const picked = await this._ask_fields(screen, model, kind, fields);
      if (picked == null) return null;
      Object.assign(options, picked);
    }
    try {
      if (kind === "serve") return await this.app.desk.serve_background();
      return await this.app.desk.execute(kind, options);
    } catch (exc) {
      const nxt = exc && exc.nxt ? exc.nxt : "node-rbac help";
      return `ERROR: ${errorText(exc)}\nNext: ${nxt}`;
    }
  }
}

function errorText(exc) {
  if (exc == null) return "";
  if (typeof exc === "string") return exc;
  if (exc.message) return String(exc.message);
  return String(exc);
}

function isInterrupt(err) {
  return Boolean(err && (err.name === "KeyboardInterrupt" || err.code === "SIGINT"));
}

function menuInt(raw) {
  const text = String(raw).trim();
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
      if (!sawDigit || prevUnderscore) throw new Error("int");
      prevUnderscore = true;
      continue;
    }
    if (ch < "0" || ch > "9") throw new Error("int");
    prevUnderscore = false;
    sawDigit = true;
    digits += ch;
  }
  if (!sawDigit || prevUnderscore) throw new Error("int");
  const number = sign * Number(digits);
  if (!Number.isSafeInteger(number)) throw new Error("int");
  return number;
}

function pipText(result) {
  if (Array.isArray(result)) return result.length > 1 ? result[1] : result[0];
  if (result != null && typeof result === "object" && Object.prototype.hasOwnProperty.call(result, 1)) {
    return result[1];
  }
  if (result != null && typeof result === "object" && result.text != null) return result.text;
  return result;
}

async function readKey(screen) {
  let key = screen.getch();
  if (key != null && typeof key.then === "function") key = await key;
  return key;
}

function ansiOpen(attr) {
  const value = attr >>> 0;
  const codes = [];
  if (value & (curses.A_BOLD >>> 0)) codes.push("1");
  if (value & (curses.A_DIM >>> 0)) codes.push("2");
  if (value & (curses.A_ITALIC >>> 0)) codes.push("3");
  if (value & (curses.A_UNDERLINE >>> 0)) codes.push("4");
  if (value & (curses.A_REVERSE >>> 0)) codes.push("7");
  if (!codes.length) return "";
  return `\x1b[${codes.join(";")}m`;
}

class TerminalScreen {
  constructor() {
    this._timeout = -1;
    this._queue = [];
    this._waiters = [];
    this._ops = [];
    this._move = null;
    this._cursorVis = 1;
    this.rows = process.stdout.rows || 24;
    this.cols = process.stdout.columns || 80;
  }

  keypad() {}

  timeout(ms) {
    this._timeout = ms;
  }

  getmaxyx() {
    if (process.stdout.rows) this.rows = process.stdout.rows;
    if (process.stdout.columns) this.cols = process.stdout.columns;
    return [this.rows, this.cols];
  }

  erase() {
    this._ops = [{ type: "clear" }];
    this._move = null;
  }

  addstr(y, x, text, attr = 0) {
    this._ops.push({ type: "text", y, x, text, attr });
  }

  move(y, x) {
    const [height, width] = this.getmaxyx();
    if (y < 0 || x < 0 || y >= height || x >= width) throw new curses.error("move");
    this._move = { y, x };
  }

  curs_set(visibility) {
    this._cursorVis = visibility;
  }

  refresh() {
    let out = "";
    for (const op of this._ops) {
      if (op.type === "clear") {
        out += "\x1b[2J\x1b[H";
        continue;
      }
      const open = ansiOpen(op.attr);
      const reset = open ? "\x1b[0m" : "";
      out += `\x1b[${op.y + 1};${op.x + 1}H${open}${op.text}${reset}`;
    }
    this._ops = [];
    out += this._cursorVis === 0 ? "\x1b[?25l" : "\x1b[?25h";
    if (this._move) {
      out += `\x1b[${this._move.y + 1};${this._move.x + 1}H`;
      this._move = null;
    }
    process.stdout.write(out);
  }

  pushChunk(chunk) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    for (const byte of bytes) this._queue.push(byte);
    this._wake();
  }

  _wake() {
    while (this._waiters.length && this._queue.length) {
      const waiter = this._waiters[0];
      if (waiter.done) {
        this._waiters.shift();
        continue;
      }
      waiter.done = true;
      this._waiters.shift();
      if (waiter.timer) clearTimeout(waiter.timer);
      waiter.resolve(this._queue.shift());
    }
  }

  _readByte(timeoutMs) {
    if (this._queue.length) return Promise.resolve(this._queue.shift());
    return new Promise((resolve) => {
      const waiter = { resolve, timer: null, done: false };
      if (timeoutMs >= 0) {
        waiter.timer = setTimeout(() => {
          if (waiter.done) return;
          waiter.done = true;
          this._waiters = this._waiters.filter((item) => item !== waiter);
          resolve(null);
        }, timeoutMs);
      }
      this._waiters.push(waiter);
      this._wake();
    });
  }

  async getch() {
    const first = await this._readByte(this._timeout);
    if (first == null) return -1;
    if (first === 3) {
      const err = new Error("KeyboardInterrupt");
      err.name = "KeyboardInterrupt";
      err.code = "SIGINT";
      throw err;
    }
    if (first !== 0x1b) return this._decode(first);
    const next = await this._readByte(40);
    if (next == null) return 27;
    if (next === 0x5b) return this._readCsi();
    if (next === 0x4f) return this._readSs3();
    this._queue.unshift(next);
    this._wake();
    return 27;
  }

  async _decode(first) {
    if (first < 0x80) return first;
    let need = 0;
    if ((first & 0xe0) === 0xc0) need = 1;
    else if ((first & 0xf0) === 0xe0) need = 2;
    else if ((first & 0xf8) === 0xf0) need = 3;
    else return first;
    const bytes = [first];
    for (let i = 0; i < need; i += 1) {
      const next = await this._readByte(20);
      if (next == null) return first;
      bytes.push(next);
    }
    const text = Buffer.from(bytes).toString("utf8");
    const point = text.codePointAt(0);
    return point == null ? first : point;
  }

  async _readCsi() {
    const seq = [];
    while (seq.length < 16) {
      const next = await this._readByte(40);
      if (next == null) break;
      seq.push(next);
      if (next >= 0x40 && next <= 0x7e) break;
    }
    const final = seq.length ? seq[seq.length - 1] : 0;
    if (final === 0x41) return curses.KEY_UP;
    if (final === 0x42) return curses.KEY_DOWN;
    if (final === 0x43) return curses.KEY_RIGHT;
    if (final === 0x44) return curses.KEY_LEFT;
    if (final === 0x48) return curses.KEY_HOME;
    if (final === 0x46) return curses.KEY_END;
    if (final === 0x7e) {
      const num = Number.parseInt(Buffer.from(seq).toString("ascii"), 10);
      if (num === 1 || num === 7) return curses.KEY_HOME;
      if (num === 4 || num === 8) return curses.KEY_END;
    }
    return 0;
  }

  async _readSs3() {
    const next = await this._readByte(40);
    if (next === 0x41) return curses.KEY_UP;
    if (next === 0x42) return curses.KEY_DOWN;
    if (next === 0x43) return curses.KEY_RIGHT;
    if (next === 0x44) return curses.KEY_LEFT;
    if (next === 0x48) return curses.KEY_HOME;
    if (next === 0x46) return curses.KEY_END;
    if (next === 0x4d) return curses.KEY_ENTER;
    return 0;
  }

  cancelWaits() {
    for (const waiter of this._waiters) {
      if (waiter.timer) clearTimeout(waiter.timer);
      if (!waiter.done) {
        waiter.done = true;
        waiter.resolve(null);
      }
    }
    this._waiters = [];
  }
}

async function withScreen(work) {
  const screen = new TerminalScreen();
  const stdin = process.stdin;
  const stdout = process.stdout;
  const wasRaw = Boolean(stdin.isTTY && stdin.isRaw);
  const onData = (chunk) => screen.pushChunk(chunk);
  const onResize = () => {
    screen.rows = stdout.rows || screen.rows;
    screen.cols = stdout.columns || screen.cols;
  };
  try {
    if (stdout.isTTY) stdout.write("\x1b[?1049h");
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
    stdout.on("resize", onResize);
    return await work(screen);
  } finally {
    stdin.off("data", onData);
    stdout.off("resize", onResize);
    screen.cancelWaits();
    if (stdout.isTTY) stdout.write("\x1b[0m\x1b[?25h\x1b[?1049l");
    if (stdin.isTTY) {
      try {
        stdin.setRawMode(wasRaw);
      } catch {
        // The terminal is already gone.
      }
    }
    stdin.pause();
  }
}
