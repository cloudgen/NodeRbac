// =============================================================================
// Local status logger. There is no separate npm ChronicleLogger.
// requirement-nodejs-cli-logging — one daily file, quiet console, no passwords.
// requirement-nodejs-oop — class ChronicleLogger.
// =============================================================================
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function kebab_name(name) {
  return String(name).replace(/(?<!^)(?=[A-Z])/g, '-').toLowerCase();
}

function home_dir() {
  const named = process.env.HOME;
  if (named != null && String(named).trim() !== '') {
    return String(named);
  }
  try {
    const expanded = os.homedir();
    if (expanded && path.isAbsolute(expanded)) {
      return expanded;
    }
  } catch {
    return '';
  }
  return '';
}

function stamp_now(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function debug_from_env() {
  const names = ['DEBUG', 'NODERBAC_DEBUG'];
  for (const name of names) {
    const raw = process.env[name];
    const value = raw == null ? '' : String(raw).trim().toLowerCase();
    if (value === '1' || value === 'true' || value === 'yes' || value === 'show') {
      return true;
    }
  }
  return false;
}

function day_token(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export class ChronicleLogger {
  static class_version() {
    return '1.3.1';
  }

  constructor({ logname = '', is_quiet = false, basedir = '', logdir = '' } = {}) {
    this.is_quiet = Boolean(is_quiet);
    this._basedir_arg = basedir ? String(basedir) : '';
    this._logdir_arg = logdir ? String(logdir) : '';
    this._logname = '';
    this._debug = debug_from_env();
    if (logname == null || String(logname) === '') {
      return;
    }
    this._logname = kebab_name(logname);
    const dir = this.logDir();
    this._ensure_dir(dir);
    this._touch_log();
  }

  logName() {
    return this._logname;
  }

  baseDir() {
    if (this._basedir_arg) {
      return this._basedir_arg;
    }
    const home = home_dir();
    if (!home) {
      return '';
    }
    return path.join(home, '.local', 'NodeRbac');
  }

  logDir() {
    if (this._logdir_arg) {
      return this._logdir_arg;
    }
    const base = this.baseDir();
    if (!base) {
      return '';
    }
    return path.join(base, 'logs');
  }

  isDebug() {
    return this._debug === true;
  }

  log_message(message, { level = 'INFO', component = '' } = {}) {
    const text = message == null ? '' : String(message);
    const component_text = component == null ? '' : String(component);
    const level_text = String(level || 'INFO').toUpperCase();
    if (`${text}\n${component_text}`.toLowerCase().includes('password')) {
      return;
    }
    const now = new Date();
    const component_slot = component_text ? ` @${component_text}` : '';
    const line = `[${stamp_now(now)}] pid:${process.pid} [${level_text}]${component_slot} :] ${text}`;
    if (!this.is_quiet) {
      const stream = level_text === 'ERROR' || level_text === 'FATAL' || level_text === 'CRITICAL'
        ? process.stderr
        : process.stdout;
      try {
        stream.write(`${line}\n`);
      } catch {
        // A closed console is not a failed product verb.
      }
    }
    this._append(line, now);
  }

  _log_file(now) {
    const dir = this.logDir();
    const name = this._logname || 'node-rbac';
    if (!dir) {
      return '';
    }
    return path.join(dir, `${name}-${day_token(now)}.log`);
  }

  _ensure_dir(dir) {
    if (!dir) {
      return;
    }
    let existed = false;
    try {
      existed = fs.existsSync(dir);
    } catch {
      existed = false;
    }
    try {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      if (!existed) {
        try {
          fs.chmodSync(dir, 0o700);
        } catch {
          // The folder may already be owned by this login with a tighter mode.
        }
        if (!this.is_quiet) {
          try {
            process.stdout.write(`Created directory: ${dir}\n`);
          } catch {
            // Quiet is about the menu. A closed stdout still keeps the file.
          }
        }
      }
    } catch {
      // An unwritable log folder must not crash the process.
    }
  }

  _touch_log() {
    const file = this._log_file(new Date());
    if (!file) {
      return;
    }
    try {
      fs.appendFileSync(file, '\n', { encoding: 'utf8', mode: 0o600 });
    } catch {
      // Same rule as a later line: the product still runs.
    }
  }

  _append(line, now) {
    const dir = this.logDir();
    if (!dir) {
      return;
    }
    this._ensure_dir(dir);
    const file = this._log_file(now);
    if (!file) {
      return;
    }
    try {
      fs.appendFileSync(file, `${line}\n`, { encoding: 'utf8', mode: 0o600 });
    } catch {
      // An unwritable daily file must not crash the process.
    }
  }
}
