// =============================================================================
// Log folder actions for the system-log board.
// requirement-nodejs-oop — class SystemLog.
// The menu picture stays on requirement-nodejs-tui.
// =============================================================================
import fs from "node:fs";
import path from "node:path";

export class SystemLog {
  // List, read, and empty the daily log files under logDir().

  constructor(logger = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "SystemLog" });
    }
  }

  log_dir() {
    // General Purpose: The absolute log folder this logger already resolved.
    if (this.logger == null) return "";
    const folder = this.logger.logDir();
    return folder == null ? "" : String(folder);
  }

  log_files() {
    // General Purpose: Regular .log files whose parent is that folder.
    const folder = this.log_dir();
    if (!folder) return [];
    let root;
    try {
      root = fs.realpathSync(folder);
    } catch {
      return [];
    }
    let stat;
    try {
      stat = fs.statSync(root);
    } catch {
      return [];
    }
    if (!stat.isDirectory()) return [];
    const found = [];
    let names;
    try {
      names = fs.readdirSync(root);
    } catch {
      return [];
    }
    for (const name of names) {
      const owned = this._owned(path.join(root, name));
      if (owned != null) found.push(owned);
    }
    found.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
    return found;
  }

  read_log(filePath) {
    // General Purpose: Text of one owned log file. null when the path is refused.
    const owned = this._owned(filePath);
    if (owned == null) return null;
    this._note("read log", owned.full);
    return fs.readFileSync(owned.full, "utf8");
  }

  clear_log(filePath) {
    // General Purpose: Empty one owned log file. The file stays on disk.
    const owned = this._owned(filePath);
    if (owned == null) return false;
    this._note("clear log", owned.full);
    fs.writeFileSync(owned.full, "", { encoding: "utf8" });
    return true;
  }

  folder_text() {
    // General Purpose: The result page for log-folder.
    const folder = this.log_dir();
    if (!folder) return "No log folder.";
    return `Log folder: ${folder}`;
  }

  _owned(filePath) {
    // A regular .log file whose resolved parent is the log folder.
    const folder = this.log_dir();
    if (!folder) return null;
    let root;
    try {
      root = fs.realpathSync(folder);
    } catch {
      return null;
    }
    const raw = coercePath(filePath);
    if (!raw) return null;
    let candidate;
    try {
      candidate = fs.realpathSync(raw);
    } catch {
      return null;
    }
    if (path.dirname(candidate) !== root) return null;
    if (path.extname(candidate) !== ".log") return null;
    try {
      if (!fs.statSync(candidate).isFile()) return null;
    } catch {
      return null;
    }
    return { full: candidate, name: path.basename(candidate), toString() { return candidate; } };
  }

  _note(operation, filePath) {
    // One status line before the read or the empty. component menu.
    if (this.logger == null) return;
    this.logger.log_message(`${operation} path=${filePath}`, { component: "menu" });
  }
}

function coercePath(filePath) {
  if (filePath == null) return "";
  if (typeof filePath === "string") return filePath;
  if (typeof filePath.full === "string") return filePath.full;
  if (typeof filePath.path === "string") return filePath.path;
  return String(filePath);
}
