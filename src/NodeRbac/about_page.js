// =============================================================================
// About page composer.
// requirement-nodejs-oop — class AboutPage.
// requirement-nodejs-about — identity lines, host check, and the star box.
// requirement-domain-noderbac — the domain sentence on the identity block.
// An empty download URL omits the install line. The author email is not printed.
// =============================================================================
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { CheckSystem } from './check_system.js';

function is_file(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function realpath_soft(file) {
  const abs = path.resolve(String(file));
  try {
    return fs.realpathSync(abs);
  } catch {
    const tail = [];
    let cursor = abs;
    while (true) {
      try {
        const real = fs.realpathSync(cursor);
        return tail.length ? path.join(real, ...tail.reverse()) : real;
      } catch {
        const parent = path.dirname(cursor);
        if (parent === cursor) {
          return abs;
        }
        tail.push(path.basename(cursor));
        cursor = parent;
      }
    }
  }
}

function is_about_options(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.prototype.hasOwnProperty.call(value, 'check'),
  );
}

export class AboutPage {
  constructor(
    check,
    app_name,
    version,
    author,
    updated,
    homepage,
    download_url,
    usage,
    console_name,
    logger = null,
  ) {
    if (is_about_options(check)) {
      ({
        check,
        app_name,
        version,
        author,
        updated,
        homepage,
        download_url,
        usage,
        console_name,
        logger = null,
      } = check);
    }
    this.logger = logger;
    if (logger != null) {
      logger.log_message('instantiated', { component: 'AboutPage' });
    }
    if (!(check instanceof CheckSystem)) {
      throw new TypeError('about host check is CheckSystem');
    }
    this.check = check;
    this.app_name = app_name;
    this.version = version;
    this.author = author;
    this.updated = updated;
    this.homepage = homepage;
    this.download_url = download_url;
    this.usage = usage;
    this.console_name = console_name;
  }

  _is_source_checkout(file_path) {
    const marker = `${path.sep}src${path.sep}NodeRbac${path.sep}`;
    if (!String(file_path).includes(marker)) {
      return false;
    }
    let cursor = path.dirname(file_path);
    for (let step = 0; step < 8; step += 1) {
      if (is_file(path.join(cursor, 'package.json'))) {
        return true;
      }
      const parent = path.dirname(cursor);
      if (parent === cursor) {
        return false;
      }
      cursor = parent;
    }
    return false;
  }

  install_kind(file_path) {
    const resolved = realpath_soft(file_path);
    const parts = resolved.split(path.sep);
    const packaged = parts.includes('node_modules');
    if (!packaged && this._is_source_checkout(resolved)) {
      return 'uninstalled';
    }
    let home = '';
    try {
      home = realpath_soft(os.homedir());
    } catch {
      home = '';
    }
    const in_home = Boolean(home) && (resolved === home || resolved.startsWith(`${home}${path.sep}`));
    const base = path.basename(resolved);
    if (in_home && (packaged || base === this.console_name || base === this.app_name)) {
      return 'local';
    }
    if (resolved.startsWith('/usr/') || resolved.startsWith('/opt/') || resolved.startsWith('/bin/')) {
      return 'global';
    }
    if (packaged && !in_home) {
      return 'global';
    }
    return 'uninstalled';
  }

  install_sentence(kind) {
    if (kind === 'global') {
      return 'You are using the GLOBAL INSTALLED version, location:';
    }
    if (kind === 'local') {
      return 'You are using the LOCAL INSTALLED version, location:';
    }
    return 'You are using an UNINSTALLED version, location:';
  }

  about_box_lines(
    usage = null,
    location = null,
    kind = null,
    homepage = null,
    download_url = null,
    author = null,
    updated = null,
  ) {
    if (usage && typeof usage === 'object' && !Array.isArray(usage)) {
      ({
        usage = null,
        location = null,
        kind = null,
        homepage = null,
        download_url = null,
        author = null,
        updated = null,
      } = usage);
    }
    if (usage == null) {
      usage = this.usage;
    }
    if (location == null) {
      location = this.check.self_location();
    }
    if (kind == null) {
      kind = this.install_kind(location);
    }
    if (homepage == null) {
      homepage = this.homepage;
    }
    if (download_url == null) {
      download_url = this.download_url;
    }
    if (author == null) {
      author = this.author;
    }
    if (updated == null) {
      updated = this.updated;
    }
    const app = this.install_sentence(kind);
    const node_exe = this.check.node_executable_name() || 'node';
    const msg1 = `${this.app_name} (${this.version}) by ${author} on ${updated}`;
    let msg;
    if (download_url === '') {
      msg = [
        msg1,
        '',
        app,
        `    ${location}`,
        '',
        'Basic Usage:',
        `    ${usage}`,
        '',
        'Please visit our homepage: ',
        `    "${homepage}"`,
        '',
        '',
        '',
        '',
      ];
    } else {
      msg = [
        msg1,
        '',
        app,
        `    ${location}`,
        '',
        'Basic Usage:',
        `    ${usage}`,
        '',
        'Please visit our homepage: ',
        `    "${homepage}"`,
        '',
        'Installation command:',
        `    curl -fsSL ${download_url} | ${node_exe}`,
        '',
      ];
    }
    let max_line;
    if (download_url === '') {
      if (homepage === '') {
        max_line = msg.length - 3;
      } else {
        max_line = msg.length - 2;
      }
    } else {
      max_line = msg.length - 1;
    }
    if (max_line < 1) {
      max_line = msg.length;
    }
    let max_len = 0;
    for (let index = 0; index < max_line; index += 1) {
      if (msg[index].length > max_len) {
        max_len = msg[index].length;
      }
    }
    const boxed = [];
    for (let index = 0; index < max_line; index += 1) {
      boxed.push(msg[index] + (' '.repeat(max_len - msg[index].length)));
    }
    const star = '*'.repeat(max_len + 4);
    const blank = ' '.repeat(max_len);
    const lines = [star, `* ${blank} *`];
    for (const row of boxed) {
      lines.push(`* ${row} *`);
    }
    lines.push(`* ${blank} *`);
    lines.push(star);
    return lines;
  }

  framework_about() {
    const lines = [
      `${this.app_name} ${this.version}`,
      'Domain: Online RBAC and centralized configuration',
      'Runtime tools: Node.js, node:sqlite (default file) or MariaDB or MySQL, mysql2',
      `Entry points: ${this.console_name}`,
      '',
    ];
    lines.push(...this.check.check_system_lines());
    lines.push('');
    lines.push(...this.about_box_lines());
    return lines.join('\n');
  }
}
