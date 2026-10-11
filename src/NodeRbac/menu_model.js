// =============================================================================
// Keystroke state for the text menu.
// requirement-nodejs-oop — class MenuModel.
// requirement-nodejs-tui — Esc, end of input, and the bottom input box.
// =============================================================================
import { MenuPainter, curses, splitLines } from "./menu_painter.js";

const KEY_J = "j".charCodeAt(0);
const KEY_K = "k".charCodeAt(0);

export class MenuModel {
  // Keystroke state for the front board. The bottom frame is the input box.
  // boards, when set, replaces the rows for this session. Omit boards and
  // the painter supplies the live rows, so a language save repaints them.
  // Front rows are access, system-log, language, setup, audit,
  // serve, self-management, and Exit. There is no session row.
  // System-log is under 3. Language is under 4.

  constructor(boards = null, logger = null, painter = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "MenuModel" });
    }
    if (painter == null) this.painter = new MenuPainter(logger);
    else this.painter = painter;
    this.boards = boards;
    this.layer = "front";
    this.index = 0;
    this.buffer = "";
    this.cursor = 0;
    this.focus = "list";
    this.error = "";
    this.notice = "";
    this.phase = "board";
    this.result_text = "";
    this.result_offset = 0;
    this.mask = false;
  }

  edge_keys() {
    const home = Object.prototype.hasOwnProperty.call(curses, "KEY_HOME") ? curses.KEY_HOME : -2;
    const end = Object.prototype.hasOwnProperty.call(curses, "KEY_END") ? curses.KEY_END : -3;
    return [home, end];
  }

  highlighted_row() {
    // The row under the highlight, or null when this board has no rows.
    const rows = this.rows();
    if (!rows || this.index < 0 || this.index >= rows.length) return null;
    return rows[this.index];
  }

  buffer_text() {
    // Text currently sitting in the bottom input box.
    return this.buffer;
  }

  rows() {
    if (this.boards != null) {
      const found = typeof this.boards.get === "function"
        ? this.boards.get(this.layer)
        : this.boards[this.layer];
      if (found != null) return found;
    }
    return this.painter.display_rows(this.layer);
  }

  show_result(text) {
    this.result_text = text;
    this.result_offset = 0;
    this.phase = "result";
    this.layer = "front";
    this.index = 0;
    this.buffer = "";
    this.cursor = 0;
    this.focus = "list";
    this.error = "";
  }

  apply_key(key, screenHeight = 24) {
    // Return 'exit', a row kind, or null to stay.
    // Esc (27) leaves a result page or a nested board for the front board.
    // It is not row 9 Exit. End-of-input (-1) still leaves the program from
    // the front board so a closed script does not spin. The one-second clock
    // wait never arrives here as -1. A saved-language notice lasts until
    // the next key.
    this.notice = "";
    if (key === 27) {
      if (this.phase === "result" || this.layer !== "front") this.show_front();
      return null;
    }
    if (key === -1) {
      if (this.phase === "result") {
        this.show_front();
        return null;
      }
      if (this.layer !== "front") {
        this.show_front();
        return null;
      }
      return "exit";
    }
    if (this.phase === "result") {
      const lines = splitLines(this.result_text);
      const body = lines.length ? lines : [""];
      if (this.painter._result_overflow(screenHeight, body.length) && (key === curses.KEY_UP || key === KEY_K)) {
        this._scroll_result(-1, screenHeight);
        return null;
      }
      if (this.painter._result_overflow(screenHeight, body.length) && (key === curses.KEY_DOWN || key === KEY_J)) {
        this._scroll_result(1, screenHeight);
        return null;
      }
      this.show_front();
      return null;
    }
    if (
      key === curses.KEY_UP
      || key === curses.KEY_DOWN
      || (this.focus === "list" && (key === KEY_K || key === KEY_J))
    ) {
      this._arrow(key);
      return null;
    }
    if (key === curses.KEY_LEFT || key === curses.KEY_RIGHT || this.edge_keys().includes(key)) {
      this._slide(key);
      return null;
    }
    if (key === curses.KEY_BACKSPACE || key === 127 || key === 8) {
      this._backspace();
      return null;
    }
    if (key === 10 || key === 13 || key === curses.KEY_ENTER) return this._commit();
    if (key >= 32 && key < 127) {
      this._insert(String.fromCharCode(key));
      return null;
    }
    this.error = this.painter.language.text("invalid");
    return null;
  }

  show_front() {
    this.phase = "board";
    this.layer = "front";
    this.index = 0;
    this.buffer = "";
    this.cursor = 0;
    this.focus = "list";
    this.error = "";
    this.result_offset = 0;
  }

  _scroll_result(delta, screenHeight) {
    // Move the result window. Up/Down stay on the page when it overflows.
    const lines = splitLines(this.result_text);
    const body = lines.length ? lines : [""];
    const room = this.painter._result_room(screenHeight, body.length);
    const maxOffset = Math.max(0, body.length - room);
    this.result_offset = Math.min(Math.max(0, this.result_offset + delta), maxOffset);
  }

  _arrow(key) {
    // Up/Down walks the rows, then the bottom box, then the rows again.
    const last = this.rows().length - 1;
    const down = key === curses.KEY_DOWN || key === KEY_J;
    if (this.focus === "input") {
      this.focus = "list";
      this.index = down ? 0 : last;
      return;
    }
    if (down) {
      if (this.index < last) this.index += 1;
      else {
        this.focus = "input";
        this.cursor = this.buffer.length;
      }
      return;
    }
    if (this.index > 0) {
      this.index -= 1;
      return;
    }
    this.focus = "input";
    this.cursor = this.buffer.length;
  }

  _slide(key) {
    if (this.focus !== "input") return;
    const [home, end] = this.edge_keys();
    if (key === curses.KEY_LEFT) this.cursor = Math.max(0, this.cursor - 1);
    else if (key === curses.KEY_RIGHT) this.cursor = Math.min(this.buffer.length, this.cursor + 1);
    else if (key === home) this.cursor = 0;
    else if (key === end) this.cursor = this.buffer.length;
  }

  _insert(ch) {
    if (this.focus !== "input") {
      this.focus = "input";
      this.cursor = this.buffer.length;
    }
    this.cursor = Math.min(Math.max(this.cursor, 0), this.buffer.length);
    this.buffer = this.buffer.slice(0, this.cursor) + ch + this.buffer.slice(this.cursor);
    this.cursor += 1;
  }

  _backspace() {
    if (this.focus !== "input") {
      this.focus = "input";
      this.cursor = this.buffer.length;
    }
    if (this.cursor <= 0 || !this.buffer) {
      this.cursor = 0;
      return;
    }
    this.cursor = Math.min(this.cursor, this.buffer.length);
    this.buffer = this.buffer.slice(0, this.cursor - 1) + this.buffer.slice(this.cursor);
    this.cursor -= 1;
  }

  _reject() {
    this.error = this.painter.language.text("invalid");
    this.focus = "input";
    this.cursor = this.buffer.length;
  }

  _commit() {
    const token = this.buffer.trim();
    this.buffer = "";
    this.cursor = 0;
    if (token === "") {
      const [number, _short, _explain, kind] = this.rows()[this.index];
      return this._activate(number, kind);
    }
    if (/^\d+$/.test(token)) return this._activate_number(Number(token));
    for (const [number, short, _explain, kind] of this.rows()) {
      if (token === short) return this._activate(number, kind);
    }
    const mapped = this.painter.language.token_kind(token, this.layer);
    if (mapped != null) return this._activate(0, mapped);
    if (Object.prototype.hasOwnProperty.call(MenuPainter.ANY_BOARD, token)) {
      return this._activate(0, MenuPainter.ANY_BOARD[token]);
    }
    this._reject();
    return null;
  }

  _activate_number(number) {
    for (const [rowNumber, _short, _explain, kind] of this.rows()) {
      if (rowNumber === number) return this._activate(number, kind);
    }
    this._reject();
    return null;
  }

  _activate(number, kind) {
    void number;
    this.error = "";
    this.focus = "list";
    this.cursor = 0;
    if (kind === "exit") return "exit";
    if (kind === "back") {
      this.layer = "front";
      this.index = 0;
      return null;
    }
    if (kind === "self-management") {
      this.layer = "self";
      this.index = 0;
      this.focus = "list";
      this.buffer = "";
      this.cursor = 0;
      return null;
    }
    if (kind === "system-log") {
      this.layer = "log";
      this.index = 0;
      this.focus = "list";
      this.buffer = "";
      this.cursor = 0;
      return null;
    }
    if (kind === "language") {
      this.layer = "lang";
      this.index = 0;
      this.focus = "list";
      this.buffer = "";
      this.cursor = 0;
      return null;
    }
    if (kind === "access" || kind === "setup" || kind === "audit") {
      this.layer = kind;
      this.index = 0;
      this.focus = "list";
      this.buffer = "";
      this.cursor = 0;
      return null;
    }
    if (kind.startsWith("set-")) return kind;
    if (kind === "version" || kind === "about") return kind;
    return kind;
  }
}
