// =============================================================================
// Text-menu frame.
// requirement-nodejs-tui — menu region and the bottom input box.
// requirement-nodejs-cli-language — row 4 and the path word.
// requirement-nodejs-oop — class MenuPainter owns the frame and MENU_ROWS.
// =============================================================================
import path from "node:path";

import { MenuLanguage } from "./menu_language.js";

// Wide and Fullwidth code points from Python unicodedata on this host.
// Ambiguous, Neutral, Narrow, and Halfwidth stay one column.
const WIDE_RANGES = [
  [0x1100, 0x115F], [0x231A, 0x231B], [0x2329, 0x232A], [0x23E9, 0x23EC],
  [0x23F0, 0x23F0], [0x23F3, 0x23F3], [0x25FD, 0x25FE], [0x2614, 0x2615],
  [0x2648, 0x2653], [0x267F, 0x267F], [0x2693, 0x2693], [0x26A1, 0x26A1],
  [0x26AA, 0x26AB], [0x26BD, 0x26BE], [0x26C4, 0x26C5], [0x26CE, 0x26CE],
  [0x26D4, 0x26D4], [0x26EA, 0x26EA], [0x26F2, 0x26F3], [0x26F5, 0x26F5],
  [0x26FA, 0x26FA], [0x26FD, 0x26FD], [0x2705, 0x2705], [0x270A, 0x270B],
  [0x2728, 0x2728], [0x274C, 0x274C], [0x274E, 0x274E], [0x2753, 0x2755],
  [0x2757, 0x2757], [0x2795, 0x2797], [0x27B0, 0x27B0], [0x27BF, 0x27BF],
  [0x2B1B, 0x2B1C], [0x2B50, 0x2B50], [0x2B55, 0x2B55], [0x2E80, 0x2E99],
  [0x2E9B, 0x2EF3], [0x2F00, 0x2FD5], [0x2FF0, 0x2FFB], [0x3000, 0x303E],
  [0x3041, 0x3096], [0x3099, 0x30FF], [0x3105, 0x312F], [0x3131, 0x318E],
  [0x3190, 0x31E3], [0x31F0, 0x321E], [0x3220, 0x3247], [0x3250, 0x4DBF],
  [0x4E00, 0xA48C], [0xA490, 0xA4C6], [0xA960, 0xA97C], [0xAC00, 0xD7A3],
  [0xF900, 0xFAFF], [0xFE10, 0xFE19], [0xFE30, 0xFE52], [0xFE54, 0xFE66],
  [0xFE68, 0xFE6B], [0xFF01, 0xFF60], [0xFFE0, 0xFFE6], [0x16FE0, 0x16FE4],
  [0x16FF0, 0x16FF1], [0x17000, 0x187F7], [0x18800, 0x18CD5], [0x18D00, 0x18D08],
  [0x1AFF0, 0x1AFF3], [0x1AFF5, 0x1AFFB], [0x1AFFD, 0x1AFFE], [0x1B000, 0x1B122],
  [0x1B132, 0x1B132], [0x1B150, 0x1B152], [0x1B155, 0x1B155], [0x1B164, 0x1B167],
  [0x1B170, 0x1B2FB], [0x1F004, 0x1F004], [0x1F0CF, 0x1F0CF], [0x1F18E, 0x1F18E],
  [0x1F191, 0x1F19A], [0x1F200, 0x1F202], [0x1F210, 0x1F23B], [0x1F240, 0x1F248],
  [0x1F250, 0x1F251], [0x1F260, 0x1F265], [0x1F300, 0x1F320], [0x1F32D, 0x1F335],
  [0x1F337, 0x1F37C], [0x1F37E, 0x1F393], [0x1F3A0, 0x1F3CA], [0x1F3CF, 0x1F3D3],
  [0x1F3E0, 0x1F3F0], [0x1F3F4, 0x1F3F4], [0x1F3F8, 0x1F43E], [0x1F440, 0x1F440],
  [0x1F442, 0x1F4FC], [0x1F4FF, 0x1F53D], [0x1F54B, 0x1F54E], [0x1F550, 0x1F567],
  [0x1F57A, 0x1F57A], [0x1F595, 0x1F596], [0x1F5A4, 0x1F5A4], [0x1F5FB, 0x1F64F],
  [0x1F680, 0x1F6C5], [0x1F6CC, 0x1F6CC], [0x1F6D0, 0x1F6D2], [0x1F6D5, 0x1F6D7],
  [0x1F6DC, 0x1F6DF], [0x1F6EB, 0x1F6EC], [0x1F6F4, 0x1F6FC], [0x1F7E0, 0x1F7EB],
  [0x1F7F0, 0x1F7F0], [0x1F90C, 0x1F93A], [0x1F93C, 0x1F945], [0x1F947, 0x1F9FF],
  [0x1FA70, 0x1FA7C], [0x1FA80, 0x1FA88], [0x1FA90, 0x1FABD], [0x1FABF, 0x1FAC5],
  [0x1FACE, 0x1FADB], [0x1FAE0, 0x1FAE8], [0x1FAF0, 0x1FAF8], [0x20000, 0x2FFFD],
  [0x30000, 0x3FFFD],
];

function isWide(codePoint) {
  let lo = 0;
  let hi = WIDE_RANGES.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const start = WIDE_RANGES[mid][0];
    const end = WIDE_RANGES[mid][1];
    if (codePoint < start) hi = mid - 1;
    else if (codePoint > end) lo = mid + 1;
    else return true;
  }
  return false;
}

function columnWidth(char) {
  return isWide(char.codePointAt(0)) ? 2 : 1;
}

export function splitLines(text) {
  const raw = text == null ? "" : String(text);
  if (raw === "") return [];
  const parts = raw.split(/\r\n|\n|\r|\v|\f|\u0085|\u2028|\u2029|[\u001c-\u001e]/);
  if (
    parts.length > 0
    && parts[parts.length - 1] === ""
    && /(?:\r\n|\n|\r|\v|\f|\u0085|\u2028|\u2029|[\u001c-\u001e])$/.test(raw)
  ) {
    parts.pop();
  }
  return parts;
}

export class CursesError extends Error {
  constructor(message = "") {
    super(message);
    this.name = "curses.error";
  }
}

// Same numeric values as this host's Python curses, so key checks match.
export const curses = {
  error: CursesError,
  KEY_DOWN: 258,
  KEY_UP: 259,
  KEY_LEFT: 260,
  KEY_RIGHT: 261,
  KEY_HOME: 262,
  KEY_BACKSPACE: 263,
  KEY_END: 360,
  KEY_ENTER: 343,
  A_UNDERLINE: 131072,
  A_REVERSE: 262144,
  A_DIM: 1048576,
  A_BOLD: 2097152,
  A_ITALIC: 2147483648,
};

const CONSTANT_NAMES = [
  "INPUT_MARK",
  "INPUT_HINT",
  "PATH_LABEL_EN",
  "PATH_LABEL_ZH_HANT",
  "FRAME_TOP_LEFT",
  "FRAME_TOP_RIGHT",
  "FRAME_BOTTOM_LEFT",
  "FRAME_BOTTOM_RIGHT",
  "FRAME_HORIZ",
  "FRAME_VERT",
  "CARET_BLOCK",
  "FRAME_ROWS",
  "FOOTER_ROWS",
  "CHROME_ROWS",
  "MIN_MENU_ABOVE",
  "MIN_HEIGHT",
  "MIN_PLACEABLE",
  "MENU_ROWS",
  "ACCESS_ROWS",
  "SETUP_ROWS",
  "AUDIT_ROWS",
  "SELF_ROWS",
  "LOG_ROWS",
  "ANY_BOARD",
];

export class MenuPainter {
  // Draws the front board and the rounded input box. One class, one module.

  static display_width(text) {
    // Terminal columns. Wide and Fullwidth count as two. Ambiguous stays one.
    // requirement-nodejs-tui. Box-drawing and the block caret are Ambiguous.
    let total = 0;
    for (const char of String(text)) total += columnWidth(char);
    return total;
  }

  static clip_columns(text, columns) {
    // Left prefix that fits in columns. A wide character that does not fit is dropped whole.
    if (columns <= 0) return "";
    const kept = [];
    let used = 0;
    for (const char of String(text)) {
      const width = columnWidth(char);
      if (used + width > columns) break;
      kept.push(char);
      used += width;
    }
    return kept.join("");
  }

  static clip_columns_right(text, columns) {
    // Right suffix that fits in columns. A wide character that does not fit is dropped whole.
    if (columns <= 0) return "";
    const kept = [];
    let used = 0;
    const chars = Array.from(String(text));
    for (let i = chars.length - 1; i >= 0; i -= 1) {
      const width = columnWidth(chars[i]);
      if (used + width > columns) break;
      kept.push(chars[i]);
      used += width;
    }
    kept.reverse();
    return kept.join("");
  }

  constructor(logger = null, home = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "MenuPainter" });
    }
    // The site that needs the language writes MenuLanguage(...).
    this.language = new MenuLanguage(logger, home);
    for (const name of CONSTANT_NAMES) this[name] = MenuPainter[name];
  }

  // =============================================================================
  // CIAO-Lite Protection Zone
  // Do NOT simplify, refactor, or remove without explicit user instruction.
  // The frame glyphs are the bottom input box. requirement-nodejs-tui
  // =============================================================================
  static INPUT_MARK = "> ";
  static INPUT_HINT = "Up/Down  •  Enter";
  // Both words stay on this class. requirement-nodejs-cli-language selects one.
  static PATH_LABEL_EN = "Path";
  static PATH_LABEL_ZH_HANT = "路徑";
  static FRAME_TOP_LEFT = "╭";
  static FRAME_TOP_RIGHT = "╮";
  static FRAME_BOTTOM_LEFT = "╰";
  static FRAME_BOTTOM_RIGHT = "╯";
  static FRAME_HORIZ = "─";
  static FRAME_VERT = "│";
  static CARET_BLOCK = "█";
  static FRAME_ROWS = 3;
  static FOOTER_ROWS = 1;
  static CHROME_ROWS = 4;
  static MIN_MENU_ABOVE = 3;
  static MIN_HEIGHT = 7;
  // 2 + len(" " + INPUT_MARK) + 1
  static MIN_PLACEABLE = 6;
  static MENU_ROWS = [
    [2, "access", "users, roles, menus, departments, and posts", "access"],
    [3, "system-log", "view, clear, and the log folder", "system-log"],
    [4, "language", "display language for this menu", "language"],
    [5, "setup", "parameters, dictionaries, and notices", "setup"],
    [6, "audit", "operation log, login log, and online users", "audit"],
    [7, "serve", "start the web interface on this computer", "serve"],
    [8, "self-management", "version, about, and npm lifecycle", "self-management"],
    [9, "Exit", "leave", "exit"],
  ];
  static ACCESS_ROWS = [
    [21, "user-list", "accounts you are allowed to see", "user-list"],
    [22, "user-add", "add an account", "user-add"],
    [23, "user-edit", "change a name, department, or status", "user-edit"],
    [24, "user-remove", "mark an account deleted", "user-remove"],
    [25, "user-reset-password", "set a new password", "user-reset-password"],
    [26, "role-list", "roles and data scope", "role-list"],
    [27, "role-grant", "menus and data scope for one role", "role-grant"],
    [28, "menu-list", "menu and permission strings", "menu-list"],
    [29, "menu-add", "add a directory, page, or button", "menu-add"],
    [30, "dept-list", "departments", "dept-list"],
    [31, "dept-add", "add a department", "dept-add"],
    [32, "post-list", "posts", "post-list"],
    [33, "post-add", "add a post", "post-add"],
    [0, "Back", "return to the main menu", "back"],
  ];
  static SETUP_ROWS = [
    [71, "config-list", "parameters", "config-list"],
    [72, "config-set", "change one parameter", "config-set"],
    [73, "config-add", "add a parameter", "config-add"],
    [74, "dict-list", "dictionary values", "dict-list"],
    [75, "dict-add", "add a dictionary value", "dict-add"],
    [76, "notice-list", "notices", "notice-list"],
    [77, "notice-add", "add a notice", "notice-add"],
    [78, "db-engine", "sqlite3 file or mysql", "db-engine"],
    [0, "Back", "return to the main menu", "back"],
  ];
  static AUDIT_ROWS = [
    [61, "oper-log", "operation log", "oper-log"],
    [62, "login-log", "login log", "login-log"],
    [63, "online-list", "sessions that are signed in", "online-list"],
    [64, "online-logout", "close one online session", "online-logout"],
    [0, "Back", "return to the main menu", "back"],
  ];
  static SELF_ROWS = [
    [82, "version", "show the installed version", "version"],
    [83, "about", "version and this computer", "about"],
    [84, "version-check", "compare this install with npm", "version-check"],
    [85, "self-update", "upgrade this package with npm", "self-update"],
    [86, "self-uninstall", "remove this package with npm", "self-uninstall"],
    [87, "self-install", "install this package with npm", "self-install"],
    [0, "Back", "return to the main menu", "back"],
  ];
  static LOG_ROWS = [
    [31, "view-log", "list a log file and show it", "view-log"],
    [32, "clear-log", "empty one log file", "clear-log"],
    [33, "log-folder", "show the log folder", "log-folder"],
    [0, "Back", "return to the main menu", "back"],
  ];
  static ANY_BOARD = {
    help: "help",
    version: "version",
    about: "about",
    "self-install": "self-install",
    "version-check": "version-check",
    "self-update": "self-update",
    "self-uninstall": "self-uninstall",
    "self-management": "self-management",
    "system-log": "system-log",
    "view-log": "view-log",
    "clear-log": "clear-log",
    "log-folder": "log-folder",
    access: "access",
    setup: "setup",
    audit: "audit",
    serve: "serve",
    login: "login",
    whoami: "whoami",
    logout: "logout",
    "user-list": "user-list",
    "user-add": "user-add",
    "user-edit": "user-edit",
    "user-remove": "user-remove",
    "user-reset-password": "user-reset-password",
    "role-list": "role-list",
    "role-grant": "role-grant",
    "menu-list": "menu-list",
    "menu-add": "menu-add",
    "dept-list": "dept-list",
    "dept-add": "dept-add",
    "post-list": "post-list",
    "post-add": "post-add",
    "config-list": "config-list",
    "config-set": "config-set",
    "config-add": "config-add",
    "dict-list": "dict-list",
    "dict-add": "dict-add",
    "notice-list": "notice-list",
    "notice-add": "notice-add",
    "db-engine": "db-engine",
    "oper-log": "oper-log",
    "login-log": "login-log",
    "online-list": "online-list",
    "online-logout": "online-logout",
  };

  display_width(text) {
    return MenuPainter.display_width(text);
  }

  clip_columns(text, columns) {
    return MenuPainter.clip_columns(text, columns);
  }

  clip_columns_right(text, columns) {
    return MenuPainter.clip_columns_right(text, columns);
  }

  rows_for(layer) {
    if (layer === "self") return this.SELF_ROWS;
    if (layer === "log") return this.LOG_ROWS;
    if (layer === "access") return this.ACCESS_ROWS;
    if (layer === "setup") return this.SETUP_ROWS;
    if (layer === "audit") return this.AUDIT_ROWS;
    return this.MENU_ROWS;
  }

  display_rows(layer) {
    // Rows for one board in the selected menu language.
    // Leaf shorts stay the English token. Category shorts, explains, and
    // Back follow the language. The language board prints endonyms.
    const language = this.language;
    if (layer === "lang") {
      const rows = [];
      for (const [code, endonym, number] of language.constructor.CODES) {
        rows.push([number, endonym, language.lang_long(endonym), `set-${code}`]);
      }
      rows.push([
        0,
        language.row_short("back", "Back"),
        language.row_long("back", "return to the main menu"),
        "back",
      ]);
      return rows;
    }
    const built = [];
    for (const [number, short, explain, kind] of this.rows_for(layer)) {
      built.push([
        number,
        language.row_short(kind, short),
        language.row_long(kind, explain),
        kind,
      ]);
    }
    return built;
  }

  path_label() {
    // The path-line word for the selected menu language.
    return this.language.path_label();
  }

  clock_text() {
    // Local clock HH:MM:SS. requirement-nodejs-tui rule 13. Not translated.
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  path_line(placeable = null) {
    // First menu row: path on the left, local clock on the right when it fits.
    // A placeable width keeps the path label and shortens the directory from the left.
    // Width is display columns. The clock is omitted when both fields do not fit.
    // requirement-nodejs-tui rule 13. The path and the clock are not translated.
    const prefix = `${this.path_label()}: `;
    const current = path.resolve(process.cwd());
    const left = prefix + current;
    const right = this.clock_text();
    const gap = 2;
    const leftWidth = this.display_width(left);
    const rightWidth = this.display_width(right);
    const prefixWidth = this.display_width(prefix);
    if (placeable == null) return `${left}${" ".repeat(gap)}${right}`;
    if (placeable >= leftWidth + gap + rightWidth) {
      return left + " ".repeat(placeable - leftWidth - rightWidth) + right;
    }
    if (placeable >= leftWidth) return left;
    if (placeable <= prefixWidth) return this.clip_columns(prefix, placeable);
    return prefix + this.clip_columns_right(current, placeable - prefixWidth);
  }

  board_title(model) {
    // General Purpose: The title for this layer. A result page names itself.
    const phase = model != null && model.phase !== undefined ? model.phase : "board";
    if (phase === "result") return "result";
    const layer = model != null && model.layer !== undefined ? model.layer : "front";
    const language = this.language;
    if (layer === "self") return language.text("title_self");
    if (layer === "log") return language.text("title_log");
    if (layer === "lang") return language.text("title_language");
    if (layer === "access") return language.text("title_access");
    if (layer === "setup") return language.text("title_setup");
    if (layer === "audit") return language.text("title_audit");
    return language.text("title_main");
  }

  row_parts(rows) {
    // One board's columns. requirement-nodejs-tui.
    // Each row is number, verb, and explain. The number is padded on the left to
    // the widest number on this board. The verb pad is display columns immediately
    // before the colon. Wide and Fullwidth count as two. Ambiguous stays one.
    // The explain is drawn after one space.
    let numberWidth = 1;
    let verbWidth = 0;
    const materialized = [];
    for (const [number, short, explain] of rows) {
      const text = String(number);
      materialized.push([text, short, explain]);
      if (text.length > numberWidth) numberWidth = text.length;
      const shortWidth = this.display_width(short);
      if (shortWidth > verbWidth) verbWidth = shortWidth;
    }
    const parts = [];
    for (const [text, short, explain] of materialized) {
      const numberField = `${text.padStart(numberWidth, " ")}. `;
      const verbPad = " ".repeat(verbWidth - this.display_width(short));
      parts.push([numberField, short, verbPad, explain]);
    }
    return parts;
  }

  format_rows(rows) {
    // Aligned menu lines for one board. The painter and the tests share these.
    return this.row_parts(rows).map(
      ([numberField, short, verbPad, explain]) => `${numberField}${short}${verbPad}: ${explain}`,
    );
  }

  _banner(model) {
    // The line above the box. A saved-language notice is not an error.
    const notice = (model && model.notice) || "";
    if (notice) return notice;
    return (model && model.error) || "";
  }

  _put(screen, y, x, text, attr = 0) {
    const [height, width] = screen.getmaxyx();
    if (y < 0 || y >= height || x >= width - 1) return;
    const clipped = this.clip_columns(text, Math.max(0, width - x - 1));
    if (clipped) screen.addstr(y, x, clipped, attr);
  }

  _result_overflow(height, lineCount) {
    // True when the result text needs another row past the title and the hint.
    return lineCount > Math.max(1, height - 3);
  }

  _result_room(height, lineCount) {
    // Body rows under the title. One row is kept for the scroll hint when needed.
    if (this._result_overflow(height, lineCount)) return Math.max(1, height - 4);
    return Math.max(1, height - 3);
  }

  screen_can_hold(height, width) {
    // True when the path line, one menu row, the three-row frame, and the status line fit.
    return height >= this.MIN_HEIGHT && width - 1 >= this.MIN_PLACEABLE;
  }

  _input_field(model, inner) {
    // Cells between the side bars, and the caret index in those cells when focused.
    const prefix = ` ${this.INPUT_MARK}`;
    const focused = model.focus === "input";
    const cursor = Math.min(Math.max(model.cursor, 0), model.buffer.length);
    const reserve = prefix.length + (focused ? 1 : 0);
    const textRoom = Math.max(0, inner - reserve);
    let start = 0;
    if (textRoom && cursor > textRoom) start = cursor - textRoom;
    if (textRoom && start > Math.max(0, model.buffer.length - textRoom)) {
      start = Math.max(0, model.buffer.length - textRoom);
    }
    let shown = textRoom ? model.buffer.slice(start, start + textRoom) : "";
    if (model && model.mask) shown = "*".repeat(shown.length);
    const rel = Math.max(0, Math.min(shown.length, cursor - start));
    let body;
    let caretAt;
    if (focused && inner >= reserve) {
      body = shown.slice(0, rel) + this.CARET_BLOCK + shown.slice(rel);
      caretAt = prefix.length + rel;
    } else {
      body = shown;
      caretAt = null;
    }
    const field = (prefix + body).padEnd(inner, " ").slice(0, inner);
    if (caretAt != null && caretAt >= inner) caretAt = null;
    return [field, caretAt];
  }

  _status_line(appName, version, title) {
    // The row under the frame. Live paint uses bold name and italic version.
    return `  ${appName}(${version})  ${this.FRAME_VERT}  ${title}  ${this.FRAME_VERT}  ${this.INPUT_HINT}`;
  }

  _paint_identity(screen, y, x, appName, version) {
    // Bold name and italic version transcribe as **name**(*version*).
    const italic = Object.prototype.hasOwnProperty.call(curses, "A_ITALIC") ? curses.A_ITALIC : curses.A_DIM;
    const name = String(appName);
    const ver = String(version);
    this._put(screen, y, x, name, curses.A_BOLD);
    x += this.display_width(name);
    this._put(screen, y, x, "(");
    x += 1;
    this._put(screen, y, x, ver, italic);
    x += this.display_width(ver);
    this._put(screen, y, x, ")");
    return x + 1;
  }

  _paint_box(screen, model, top, appName, version, title) {
    // Draw the rounded frame and the status line under it.
    const [, width] = screen.getmaxyx();
    const placeable = width - 1;
    if (top < 0 || placeable < 2) return;
    const inner = placeable - 2;
    const [field, caretAt] = this._input_field(model, inner);
    const side = this.FRAME_VERT;
    const lines = [
      this.FRAME_TOP_LEFT + this.FRAME_HORIZ.repeat(inner) + this.FRAME_TOP_RIGHT,
      side + field + side,
      this.FRAME_BOTTOM_LEFT + this.FRAME_HORIZ.repeat(inner) + this.FRAME_BOTTOM_RIGHT,
    ];
    lines.forEach((line, offset) => {
      this._put(screen, top + offset, 0, line);
    });
    const statusY = top + this.FRAME_ROWS;
    this._put(screen, statusY, 0, "  ");
    const after = this._paint_identity(screen, statusY, 2, appName, version);
    const tail = `  ${this.FRAME_VERT}  ${title}  ${this.FRAME_VERT}  ${this.INPUT_HINT}`;
    this._put(screen, statusY, after, tail);
    if (caretAt == null || typeof screen.move !== "function") return;
    try {
      screen.move(top + 1, 1 + caretAt);
    } catch (err) {
      if (!(err instanceof curses.error)) throw err;
    }
  }

  paint(screen, model, appName, version) {
    // Draw one frame. This is the text-menu writer, not product logging.
    screen.erase();
    const italic = Object.prototype.hasOwnProperty.call(curses, "A_ITALIC") ? curses.A_ITALIC : curses.A_DIM;
    const title = this.board_title(model);
    if (model.phase === "result") {
      const cursor = this._paint_identity(screen, 0, 0, appName, version);
      this._put(screen, 0, cursor, ` — ${title}`);
    } else {
      const [, width] = screen.getmaxyx();
      this._put(screen, 0, 0, this.path_line(Math.max(0, width - 1)));
    }
    if (model.phase === "result") {
      const lines = splitLines(model.result_text);
      const body = lines.length ? lines : [""];
      const [height] = screen.getmaxyx();
      const room = this._result_room(height, body.length);
      const maxOffset = Math.max(0, body.length - room);
      if (model.result_offset > maxOffset) model.result_offset = maxOffset;
      if (model.result_offset < 0) model.result_offset = 0;
      const window = body.slice(model.result_offset, model.result_offset + room);
      let y = 2;
      for (const line of window) {
        if (y >= height - 1) break;
        this._put(screen, y, 0, line);
        y += 1;
      }
      if (this._result_overflow(height, body.length)) {
        this._put(screen, height - 2, 0, "Up/Down scrolls this page.", italic);
        this._put(screen, height - 1, 0, "Press a key to return to the main menu.", italic);
      } else {
        let hintY = y + 1;
        if (hintY >= height) hintY = height - 1;
        this._put(screen, hintY, 0, "Press a key to return to the main menu.", italic);
      }
      screen.refresh();
      return;
    }
    const [height] = screen.getmaxyx();
    const boxTop = height - this.CHROME_ROWS;
    const banner = this._banner(model);
    let stop = boxTop;
    if (banner && boxTop >= 4) stop = boxTop - 1;
    let y = 2;
    if (y < stop) {
      const parts = this.row_parts(model.rows());
      for (let idx = 0; idx < parts.length; idx += 1) {
        if (y >= stop) break;
        const [numberField, short, verbPad, explain] = parts[idx];
        const selected = idx === model.index;
        let attr = 0;
        if (selected && model.focus === "list") attr = curses.A_REVERSE;
        else if (selected) attr = curses.A_UNDERLINE;
        this._put(screen, y, 0, numberField, attr);
        const verbX = this.display_width(numberField);
        this._put(screen, y, verbX, short, curses.A_BOLD | attr);
        const colonX = verbX + this.display_width(short);
        this._put(screen, y, colonX, `${verbPad}: `, attr);
        const explainX = colonX + this.display_width(verbPad) + 2;
        this._put(screen, y, explainX, explain, italic);
        y += 1;
      }
    }
    if (banner && boxTop >= 4) this._put(screen, boxTop - 1, 0, banner, curses.A_BOLD);
    this._paint_box(screen, model, boxTop, appName, version, title);
    if (typeof screen.curs_set === "function") {
      try {
        screen.curs_set(0);
      } catch (err) {
        if (!(err instanceof curses.error)) throw err;
      }
    }
    screen.refresh();
  }

  paint_prompt(screen, model, title, lines, pinLast, appName, version, visibleLines) {
    // Draw one domain question. The rounded box is the only frame.
    screen.erase();
    const cursor = this._paint_identity(screen, 0, 0, appName, version);
    this._put(screen, 0, cursor, ` — ${title}`);
    const [height] = screen.getmaxyx();
    const boxTop = height - this.CHROME_ROWS;
    const banner = this._banner(model);
    let stop = boxTop;
    if (banner && boxTop >= 4) stop = boxTop - 1;
    const shown = visibleLines(lines, stop - 2, pinLast);
    let y = 2;
    for (const line of shown) {
      if (y >= stop) break;
      this._put(screen, y, 0, line);
      y += 1;
    }
    if (banner && boxTop >= 4) this._put(screen, boxTop - 1, 0, banner, curses.A_BOLD);
    this._paint_box(screen, model, boxTop, appName, version, title);
    if (typeof screen.curs_set === "function") {
      try {
        screen.curs_set(0);
      } catch (err) {
        if (!(err instanceof curses.error)) throw err;
      }
    }
    screen.refresh();
  }
}

