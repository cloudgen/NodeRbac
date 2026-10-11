// =============================================================================
// Host check for the about page.
// requirement-nodejs-oop — class CheckSystem.
// requirement-nodejs-about — Node, npm, and nvm path reads. No pyenv and no conda.
// requirement-nodejs-cli-logging — the constructor reads the one logger.
// This module does not spawn node, npm, nvm, python, conda, pyenv, or id.
// =============================================================================
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_LEAF = 'NodeRbac';

function expand_user(input) {
  const text = String(input);
  if (text === '~') {
    return os.homedir();
  }
  if (text.startsWith('~/')) {
    return path.join(os.homedir(), text.slice(2));
  }
  return text;
}

function env_nonempty(name) {
  if (!Object.prototype.hasOwnProperty.call(process.env, name)) {
    return false;
  }
  return String(process.env[name]).trim() !== '';
}

function pad(value, width) {
  return String(value).padStart(width, '0');
}

function format_stamp(now) {
  if (now == null) {
    now = new Date();
  }
  let year;
  let month;
  let day;
  let hour;
  let minute;
  let second;
  let micro;
  if (typeof now === 'object' && typeof now.year === 'number') {
    year = now.year;
    month = now.month;
    day = now.day;
    hour = now.hour;
    minute = now.minute;
    second = now.second;
    micro = now.microsecond || 0;
  } else {
    const date = now instanceof Date ? now : new Date(now);
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
    hour = date.getHours();
    minute = date.getMinutes();
    second = date.getSeconds();
    micro = typeof now.microsecond === 'number' ? now.microsecond : date.getMilliseconds() * 1000;
  }
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)} ${pad(hour, 2)}:${pad(minute, 2)}:${pad(second, 2)}.${pad(micro, 6)}`;
}

function is_file(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function file_exists(file) {
  try {
    fs.accessSync(file, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function is_options(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  if (typeof value.log_message === 'function') {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(value, 'app_name')
    || Object.prototype.hasOwnProperty.call(value, 'version')
    || Object.prototype.hasOwnProperty.call(value, 'console_name')
    || Object.prototype.hasOwnProperty.call(value, 'logger')
    || Object.prototype.hasOwnProperty.call(value, 'location');
}

export class CheckSystem {
  constructor(logger = null, app_name = '', version = '', console_name = '', location = '') {
    if (is_options(logger)) {
      const given = logger;
      logger = given.logger ?? null;
      app_name = given.app_name ?? '';
      version = given.version ?? '';
      console_name = given.console_name ?? '';
      location = given.location ?? '';
    }
    this.logger = logger;
    if (logger != null) {
      logger.log_message('instantiated', { component: 'CheckSystem' });
    }
    this.app_name = app_name;
    this.version = version;
    this.console_name = console_name;
    this.location = location ? String(location) : '';
  }

  arch_label(arch = process.arch) {
    const name = String(arch || '').toLowerCase();
    if (name === 'x64' || name === 'x86_64' || name === 'amd64') {
      return 'amd64';
    }
    if (name === 'aarch64' || name === 'arm64') {
      return 'arm64';
    }
    if (name === 'ia32' || name === 'i386' || name === 'i686' || name === 'x86') {
      return 'x86';
    }
    return arch || '';
  }

  libc_name() {
    let gnu = false;
    try {
      const report = process.report.getReport();
      const runtime = report && report.header ? report.header.glibcVersionRuntime : '';
      if (runtime) {
        gnu = true;
      }
    } catch {
      gnu = false;
    }
    if (!gnu) {
      if (file_exists('/lib/x86_64-linux-gnu') || file_exists('/lib64/ld-linux-x86-64.so.2')) {
        gnu = true;
      }
    }
    if (gnu) {
      return 'gnu';
    }
    if (this._ld_musl_exists()) {
      return 'musl';
    }
    return '';
  }

  _ld_musl_exists() {
    for (const dir of ['/lib', '/lib64', '/usr/lib', '/usr/lib64']) {
      let names = [];
      try {
        names = fs.readdirSync(dir);
      } catch {
        continue;
      }
      for (const name of names) {
        if (String(name).startsWith('ld-musl')) {
          return true;
        }
      }
    }
    return false;
  }

  binary_type(arch, libc) {
    if (arch === '') {
      return '';
    }
    if (libc === '') {
      return `${arch}-`;
    }
    return `${arch}-${libc}`;
  }

  current_user() {
    const user = process.env.USER || process.env.USERNAME || '';
    if (user) {
      return user;
    }
    try {
      const info = os.userInfo();
      return info && info.username ? info.username : '';
    } catch {
      return '';
    }
  }

  shell_text() {
    return process.env.SHELL || '';
  }

  node_executable_name() {
    return path.basename(process.execPath || '');
  }

  command_location(name) {
    if (!name) {
      return '';
    }
    const text = String(name);
    if (text.includes('/') || text.includes('\\')) {
      return this._executable(text) ? text : '';
    }
    const path_env = process.env.PATH || '';
    for (const dir of path_env.split(path.delimiter)) {
      if (!dir) {
        continue;
      }
      const candidate = path.join(dir, text);
      if (this._executable(candidate)) {
        return candidate;
      }
    }
    return '';
  }

  _executable(file) {
    try {
      const stat = fs.statSync(file);
      if (!stat.isFile()) {
        return false;
      }
      fs.accessSync(file, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  nvm_root() {
    if (env_nonempty('NVM_DIR')) {
      const root = path.resolve(expand_user(String(process.env.NVM_DIR).trim()));
      if (file_exists(path.join(root, 'nvm.sh'))) {
        return root;
      }
    }
    const home = this._home_dir();
    if (!home) {
      return '';
    }
    const fallback = path.resolve(home, '.nvm');
    try {
      if (fs.statSync(fallback).isDirectory()) {
        return fallback;
      }
    } catch {
      return '';
    }
    return '';
  }

  under_nvm() {
    const root = this.nvm_root();
    const exec_path = process.execPath || '';
    if (root && exec_path.includes(`${root}${path.sep}versions${path.sep}node${path.sep}`)) {
      return true;
    }
    if (env_nonempty('NVM_BIN') || env_nonempty('NVM_DIR')) {
      return true;
    }
    return false;
  }

  _nvm_version_dir() {
    const root = this.nvm_root();
    const exec_path = process.execPath || '';
    if (root) {
      const marker = `${root}${path.sep}versions${path.sep}node${path.sep}`;
      const at = exec_path.indexOf(marker);
      if (at !== -1) {
        const version = exec_path.slice(at + marker.length).split(path.sep)[0];
        if (version && version !== '.' && version !== '..' && !version.includes('/') && !version.includes('\\')) {
          return path.join(root, 'versions', 'node', version);
        }
      }
    }
    if (env_nonempty('NVM_BIN')) {
      const resolved = path.resolve(expand_user(String(process.env.NVM_BIN).trim()));
      if (path.basename(resolved) === 'bin') {
        return path.dirname(resolved);
      }
    }
    return '';
  }

  node_location() {
    if (this.under_nvm()) {
      const exec_path = process.execPath || '';
      const root = this.nvm_root();
      if (root && exec_path.includes(`${root}${path.sep}versions${path.sep}node${path.sep}`)) {
        return exec_path;
      }
      const version_dir = this._nvm_version_dir();
      if (version_dir) {
        const candidate = path.join(version_dir, 'bin', 'node');
        if (file_exists(candidate)) {
          return candidate;
        }
      }
      if (env_nonempty('NVM_BIN')) {
        const candidate = path.join(String(process.env.NVM_BIN).trim(), 'node');
        if (file_exists(candidate)) {
          return candidate;
        }
      }
    }
    return this.command_location('node');
  }

  npm_location() {
    if (this.under_nvm()) {
      const version_dir = this._nvm_version_dir();
      if (version_dir) {
        const candidate = path.join(version_dir, 'bin', 'npm');
        if (file_exists(candidate)) {
          return candidate;
        }
      }
    }
    return this.command_location('npm');
  }

  nvm_location() {
    if (this.under_nvm()) {
      if (env_nonempty('NVM_DIR')) {
        const script = path.join(path.resolve(expand_user(String(process.env.NVM_DIR).trim())), 'nvm.sh');
        if (file_exists(script)) {
          return script;
        }
      }
      const root = this.nvm_root();
      if (root) {
        const script = path.join(root, 'nvm.sh');
        if (file_exists(script)) {
          return script;
        }
      }
    }
    return this.command_location('nvm');
  }

  os_text() {
    let pretty = '';
    try {
      const text = fs.readFileSync('/etc/os-release', 'utf8');
      pretty = this._pretty_name(text);
    } catch {
      pretty = '';
    }
    if (pretty) {
      return pretty;
    }
    return `${os.type()} ${os.release()}`;
  }

  _pretty_name(text) {
    for (const raw of String(text).split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }
      if (!line.startsWith('PRETTY_NAME=')) {
        continue;
      }
      let value = line.slice('PRETTY_NAME='.length).trim();
      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return value;
    }
    return '';
  }

  inside_docker(marker = '/.dockerenv') {
    return file_exists(marker);
  }

  node_abi() {
    return process.versions.modules || '';
  }

  process_id() {
    return String(process.pid);
  }

  _home_dir() {
    const home = process.env.HOME || '';
    if (String(home).trim()) {
      return String(home);
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

  _cache_leaf(username, pid_text) {
    const leaf = this.app_name || APP_LEAF;
    if (username) {
      return `cache-${leaf}-${username}-${pid_text}`;
    }
    return `cache-${leaf}-${pid_text}`;
  }

  cache_folder_preferred() {
    const leaf = this._cache_leaf(this.current_user(), this.process_id());
    return path.join('/dev/shm', 'cache', leaf);
  }

  cache_folder_first_fallback() {
    const leaf = this._cache_leaf(this.current_user(), this.process_id());
    return path.join('/tmp', 'cache', leaf);
  }

  cache_folder_second_fallback() {
    const home = this._home_dir();
    if (!home) {
      return '';
    }
    const leaf = `cache-${this.app_name || APP_LEAF}-${this.process_id()}`;
    return path.join(home, '.cache', leaf);
  }

  _is_dir(dir) {
    try {
      return fs.statSync(dir).isDirectory();
    } catch {
      return false;
    }
  }

  cache_folder_used() {
    if (this._is_dir('/dev/shm')) {
      return this.cache_folder_preferred();
    }
    if (this._is_dir('/tmp')) {
      return this.cache_folder_first_fallback();
    }
    return this.cache_folder_second_fallback();
  }

  persistence_storage() {
    if (env_nonempty('NODERBAC_HOME')) {
      return String(process.env.NODERBAC_HOME).trim();
    }
    const home = this._home_dir();
    if (!home) {
      return '';
    }
    return path.join(home, '.local', APP_LEAF);
  }

  tty_interactive(stream = null) {
    const target = stream == null ? process.stdout : stream;
    try {
      let interactive = false;
      if (target && typeof target.isatty === 'function') {
        interactive = Boolean(target.isatty());
      } else if (target && typeof target.isTTY === 'boolean') {
        interactive = target.isTTY;
      } else if (target && Object.prototype.hasOwnProperty.call(target, 'isTTY')) {
        interactive = Boolean(target.isTTY);
      }
      return interactive ? 'yes' : 'no';
    } catch {
      return 'no';
    }
  }

  self_location() {
    if (this.location) {
      return this.location;
    }
    let here = fileURLToPath(new URL('./cli.js', import.meta.url));
    try {
      here = fs.realpathSync(here);
    } catch {
      here = path.resolve(here);
    }
    const candidates = [];
    if (process.argv[1]) {
      candidates.push(process.argv[1]);
    }
    if (process.argv[0] && process.argv[0] !== process.execPath) {
      candidates.push(process.argv[0]);
    }
    for (const argv0 of candidates) {
      if (!argv0 || !is_file(argv0)) {
        continue;
      }
      let argv_real = path.resolve(argv0);
      try {
        argv_real = fs.realpathSync(argv0);
      } catch {
        argv_real = path.resolve(argv0);
      }
      const base = path.basename(argv_real);
      if (base === this.console_name || base === this.app_name) {
        return argv_real;
      }
      const same_dir = path.dirname(argv_real) === path.dirname(here);
      if (same_dir && (base === 'cli.js' || base === 'index.js')) {
        return argv_real;
      }
    }
    return here;
  }

  check_system_lines(now = null) {
    const stamp = format_stamp(now);
    const arch = this.arch_label();
    const libc = this.libc_name();
    const docker = this.inside_docker() ? 'True' : 'False';
    return [
      `${stamp} ${this.app_name}(v${this.version})  [CHECK SYSTEM]:`,
      '  Now checking your operation system!',
      `    Node.js: ${process.versions.node}`,
      `    V8: ${process.versions.v8}`,
      `    Operation System: ${this.os_text()}`,
      `    Architecture: ${arch}`,
      `    Current User: ${this.current_user()}`,
      `    Shell: ${this.shell_text()}`,
      `    Node executable: ${this.node_executable_name()}`,
      `    node location: ${this.node_location()}`,
      `    npm location: ${this.npm_location()}`,
      `    nvm location: ${this.nvm_location()}`,
      `    Inside docker container: ${docker}`,
      `    Node ABI: ${this.node_abi()}`,
      `    Binary Type: ${this.binary_type(arch, libc)}`,
      `    Location: ${this.self_location()}`,
      `    PID: ${this.process_id()}`,
      `    Cache folder used: ${this.cache_folder_used()}`,
      `    Cache folder (preferred): ${this.cache_folder_preferred()}`,
      `    Cache folder (1st fallback): ${this.cache_folder_first_fallback()}`,
      `    Cache folder (2nd fallback): ${this.cache_folder_second_fallback()}`,
      `    Persistence storage: ${this.persistence_storage()}`,
      `    TTY / Interactive: ${this.tty_interactive()}`,
    ];
  }
}
