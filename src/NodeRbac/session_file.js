// =============================================================================
// Terminal session token file.
// requirement-environment — ~/.local/NodeRbac/session mode 0600.
// requirement-rbac — the token matches a sys_session row.
// requirement-nodejs-oop — class SessionFile.
// =============================================================================
import fs from "node:fs";
import path from "node:path";

export class SessionFile {
  // The token for this terminal. The web interface uses a cookie instead.

  static NAME = "session";

  constructor(settings, logger = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "SessionFile" });
    }
    this.settings = settings;
  }

  path() {
    const folder = this.settings.app_home();
    if (!folder) return "";
    return path.join(folder, this.constructor.NAME);
  }

  read() {
    // The token, or empty when the file is missing or not mode 0600.
    const filePath = this.path();
    if (!filePath) return "";
    let info;
    try {
      info = fs.statSync(filePath);
    } catch {
      return "";
    }
    if (!info.isFile()) return "";
    if ((info.mode & 0o777) !== 0o600) return "";
    try {
      return fs.readFileSync(filePath, "utf8").trim();
    } catch {
      return "";
    }
  }

  write(token) {
    // Replace the token file. The directory is mode 0700.
    const filePath = this.path();
    if (!filePath) {
      throw new Error("no home for the session file");
    }
    const folder = path.dirname(filePath);
    fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
    fs.chmodSync(folder, 0o700);
    const descriptor = fs.openSync(filePath, "w", 0o600);
    try {
      fs.writeSync(descriptor, `${token}\n`);
    } finally {
      fs.closeSync(descriptor);
    }
    fs.chmodSync(filePath, 0o600);
  }

  clear() {
    // Remove the token file. A missing file is success.
    const filePath = this.path();
    if (!filePath) return;
    try {
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
    } catch {
      /* a missing file is success */
    }
  }
}
