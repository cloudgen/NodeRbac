#!/usr/bin/env node
// =============================================================================
// NodeRbac CLI — text menu and typed verbs.
// Law keys: requirement-nodejs-cli-interface, requirement-nodejs-cli-logging,
//           requirement-nodejs-tui, requirement-nodejs-oop,
//           requirement-nodejs-about, requirement-domain-noderbac,
//           requirement-nodejs-error-handling, requirement-nodejs-coding-style,
//           requirement-runtime-prerequisites
// Video join, FFmpeg, and file listing are not part of this program.
// main writes new ChronicleLogger(. This module does not construct it
// at import time and does not re-export it.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { AboutPage } from './about_page.js';
import { CheckSystem } from './check_system.js';
import { ChronicleLogger } from './chronicle_logger.js';
import { AccessError, Desk, SettingsError, StoreError } from './desk.js';
import { SelfManage } from './self_management.js';
import { Tui } from './tui.js';
import { version } from './version.js';

// node:sqlite emits ExperimentalWarning on the next turn after import. The
// default listener writes that line to the same terminal as the text menu.
// Drop the default listener, ignore that one warning, and keep every other
// warning on stderr.
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning && warning.name === 'ExperimentalWarning') return;
  const text = warning && warning.stack ? warning.stack : String(warning);
  process.stderr.write(`${text}\n`);
});

const OPTION_SPECS = [
  { flags: ['-h', '--help'], dest: 'help', nargs: 0, help: 'show this help message and exit' },
  { flags: ['--version'], dest: 'version', nargs: 0, help: "show program's version number and exit" },
  { flags: ['--force'], dest: 'force', nargs: 0, help: 'Confirm self-uninstall. Required on the command line.' },
  { flags: ['--user-name'], dest: 'user_name', help: 'Login name.' },
  { flags: ['--password'], dest: 'password', help: 'Password. Visible in the process list. The menu masks this field.' },
  { flags: ['--nick-name'], dest: 'nick_name', help: '' },
  { flags: ['--dept-id'], dest: 'dept_id', help: '' },
  { flags: ['--role-id'], dest: 'role_id', help: '' },
  { flags: ['--user-id'], dest: 'user_id', help: '' },
  { flags: ['--status'], dest: 'status', help: '0 normal, 1 disabled.' },
  { flags: ['--menu-ids'], dest: 'menu_ids', help: 'Comma-separated menu ids.' },
  { flags: ['--data-scope'], dest: 'data_scope', help: '1 all, 2 custom, 3 this department, 4 children.' },
  { flags: ['--dept-ids'], dest: 'dept_ids', help: 'Comma-separated department ids for data scope 2.' },
  { flags: ['--menu-name'], dest: 'menu_name', help: '' },
  { flags: ['--parent-id'], dest: 'parent_id', help: '' },
  { flags: ['--menu-type'], dest: 'menu_type', help: 'M directory, C page, F button.' },
  { flags: ['--perms'], dest: 'perms', help: '' },
  { flags: ['--path'], dest: 'path', help: '' },
  { flags: ['--post-code'], dest: 'post_code', help: '' },
  { flags: ['--post-name'], dest: 'post_name', help: '' },
  { flags: ['--dept-name'], dest: 'dept_name', help: '' },
  { flags: ['--config-key'], dest: 'config_key', help: '' },
  { flags: ['--config-name'], dest: 'config_name', help: '' },
  { flags: ['--config-value'], dest: 'config_value', help: '' },
  { flags: ['--dict-type'], dest: 'dict_type', help: '' },
  { flags: ['--dict-label'], dest: 'dict_label', help: '' },
  { flags: ['--dict-value'], dest: 'dict_value', help: '' },
  { flags: ['--notice-title'], dest: 'notice_title', help: '' },
  { flags: ['--notice-type'], dest: 'notice_type', help: '1 notice, 2 announcement.' },
  { flags: ['--content'], dest: 'content', help: '' },
  { flags: ['--token'], dest: 'token', help: 'Online session token from online-list.' },
  { flags: ['--engine'], dest: 'engine', help: 'For db-engine: sqlite3 (the default file) or mysql.' },
];

class ParserExit extends Error {
  constructor(code) {
    super('SystemExit');
    this.name = 'SystemExit';
    this.code = code;
  }
}

function terminal_width() {
  const columns = process.stdout.isTTY && process.stdout.columns
    ? process.stdout.columns
    : 80;
  return Math.max(columns - 2, 11);
}

function wrap_words(text, width) {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if (!word) {
      continue;
    }
    if (!line) {
      line = word;
      continue;
    }
    if (line.length + 1 + word.length <= width) {
      line = `${line} ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines.length ? lines : [''];
}

function option_metavar(spec) {
  return spec.dest.toUpperCase();
}

function usage_part(spec) {
  if (spec.nargs === 0) {
    return `[${spec.flags[0]}]`;
  }
  return `[${spec.flags[0]} ${option_metavar(spec)}]`;
}

function invocation(spec) {
  if (spec.nargs === 0) {
    return spec.flags.join(', ');
  }
  const meta = option_metavar(spec);
  return spec.flags.map((flag) => `${flag} ${meta}`).join(', ');
}

function option_label(spec) {
  return spec.flags.join('/');
}

function format_usage(prog, width) {
  const prefix = 'usage: ';
  const text_width = width;
  const opt_parts = OPTION_SPECS.map((spec) => usage_part(spec));
  const pos_parts = ['[verb]'];
  const indent = ' '.repeat(prefix.length + prog.length + 1);

  function get_lines(parts, line_indent, first_prefix) {
    const lines = [];
    let line = [];
    const indent_length = line_indent.length;
    let line_len = first_prefix != null ? first_prefix.length - 1 : indent_length - 1;
    for (const part of parts) {
      if (line_len + 1 + part.length > text_width && line.length) {
        lines.push(line_indent + line.join(' '));
        line = [];
        line_len = indent_length - 1;
      }
      line.push(part);
      line_len += part.length + 1;
    }
    if (line.length) {
      lines.push(line_indent + line.join(' '));
    }
    if (first_prefix != null && lines.length) {
      lines[0] = lines[0].slice(indent_length);
    }
    return lines;
  }

  const lines = get_lines([prog, ...opt_parts], indent, prefix);
  lines.push(...get_lines(pos_parts, indent, null));
  return `${prefix}${lines.join('\n')}\n\n`;
}

function format_action(spec, help_position, help_width, current_indent) {
  const action_width = help_position - current_indent - 2;
  const header = spec.dest === 'verb' ? 'verb' : invocation(spec);
  const help = spec.help || '';
  if (!help) {
    return `${' '.repeat(current_indent)}${header}\n`;
  }
  const help_lines = wrap_words(help, help_width);
  if (header.length <= action_width) {
    const padded = header + ' '.repeat(action_width - header.length);
    let text = `${' '.repeat(current_indent)}${padded}  ${help_lines[0]}\n`;
    for (const extra of help_lines.slice(1)) {
      text += `${' '.repeat(help_position)}${extra}\n`;
    }
    return text;
  }
  let text = `${' '.repeat(current_indent)}${header}\n`;
  for (const extra of help_lines) {
    text += `${' '.repeat(help_position)}${extra}\n`;
  }
  return text;
}

function format_help(prog, description, width) {
  const max_help_position = Math.min(24, Math.max(width - 20, 4));
  const headers = OPTION_SPECS.map((spec) => invocation(spec));
  headers.push('verb');
  const action_max = headers.reduce((max, item) => Math.max(max, item.length), 0);
  const help_position = Math.min(action_max + 2, max_help_position);
  const help_width = Math.max(width - help_position, 11);
  const indent = 2;
  let text = format_usage(prog, width);
  text += `${description}\n\n`;
  text += 'positional arguments:\n';
  text += format_action(
    { dest: 'verb', help: `Product verb. ${prog} help lists them.` },
    help_position,
    help_width,
    indent,
  );
  text += '\n';
  text += 'options:\n';
  for (const spec of OPTION_SPECS) {
    text += format_action(spec, help_position, help_width, indent);
  }
  return text;
}

class ProductParser {
  constructor(prog, description, version_text) {
    this.prog = prog;
    this.description = description;
    this.version_text = version_text;
  }

  print_usage(stream) {
    const width = terminal_width();
    stream.write(format_usage(this.prog, width));
  }

  print_help(stream = process.stdout) {
    stream.write(format_help(this.prog, this.description, terminal_width()));
  }

  _fail(message) {
    this.print_usage(process.stderr);
    process.stderr.write(`${this.prog}: error: ${message}\n`);
    throw new ParserExit(2);
  }

  _match_long(name) {
    const exact = OPTION_SPECS.find((spec) => spec.flags.includes(name));
    if (exact) {
      return exact;
    }
    const matches = [];
    for (const spec of OPTION_SPECS) {
      for (const flag of spec.flags) {
        if (flag.startsWith('--') && flag.startsWith(name)) {
          matches.push(flag);
          break;
        }
      }
    }
    if (matches.length === 1) {
      const flag = matches[0];
      return OPTION_SPECS.find((spec) => spec.flags.includes(flag));
    }
    if (matches.length > 1) {
      this._fail(`ambiguous option: ${name} could match ${matches.join(', ')}`);
    }
    return null;
  }

  parse_args(argv) {
    const args = {
      verb: null,
      force: false,
    };
    for (const spec of OPTION_SPECS) {
      if (spec.nargs === 0) {
        if (spec.dest !== 'help' && spec.dest !== 'version') {
          args[spec.dest] = false;
        }
      } else if (!(spec.dest in args)) {
        args[spec.dest] = '';
      }
    }
    const positionals = [];
    const unknown = [];
    let end = false;
    for (let index = 0; index < argv.length; index += 1) {
      const token = String(argv[index]);
      if (end) {
        positionals.push(token);
        continue;
      }
      if (token === '--') {
        end = true;
        continue;
      }
      if (token.startsWith('--')) {
        const eq = token.indexOf('=');
        const name = eq === -1 ? token : token.slice(0, eq);
        const inline = eq === -1 ? undefined : token.slice(eq + 1);
        const spec = this._match_long(name);
        if (!spec) {
          unknown.push(token);
          continue;
        }
        if (spec.nargs === 0) {
          if (inline !== undefined) {
            this._fail(`argument ${option_label(spec)}: ignored explicit argument '${inline}'`);
          }
          if (spec.dest === 'help') {
            this.print_help(process.stdout);
            throw new ParserExit(0);
          }
          if (spec.dest === 'version') {
            process.stdout.write(`${this.version_text}\n`);
            throw new ParserExit(0);
          }
          args[spec.dest] = true;
          continue;
        }
        let value = inline;
        if (value === undefined) {
          if (index + 1 >= argv.length) {
            this._fail(`argument ${option_label(spec)}: expected one argument`);
          }
          const next = String(argv[index + 1]);
          if (next.startsWith('-') && next !== '-') {
            this._fail(`argument ${option_label(spec)}: expected one argument`);
          }
          index += 1;
          value = next;
        }
        args[spec.dest] = value;
        continue;
      }
      if (token.startsWith('-') && token !== '-') {
        if (token === '-h') {
          this.print_help(process.stdout);
          throw new ParserExit(0);
        }
        unknown.push(token);
        continue;
      }
      positionals.push(token);
    }
    if (positionals.length) {
      args.verb = positionals[0];
      unknown.push(...positionals.slice(1));
    }
    if (unknown.length) {
      this._fail(`unrecognized arguments: ${unknown.join(' ')}`);
    }
    return args;
  }
}

function read_console_line(prompt) {
  return new Promise((resolve, reject) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: Boolean(process.stdin.isTTY),
    });
    let settled = false;
    rl.question(prompt, (answer) => {
      settled = true;
      rl.close();
      resolve(answer);
    });
    rl.on('close', () => {
      if (!settled) {
        settled = true;
        const error = new Error('EOF');
        error.name = 'EOFError';
        reject(error);
      }
    });
  });
}

function text_of(exc) {
  if (exc == null) {
    return '';
  }
  if (typeof exc.message === 'string' && exc.message) {
    return exc.message;
  }
  return String(exc);
}

function has_own(obj, key) {
  return Boolean(obj) && Object.prototype.hasOwnProperty.call(obj, key);
}

function is_named(exc, names) {
  if (!exc || typeof exc !== 'object') {
    return false;
  }
  return names.includes(exc.name);
}

function is_os_error(exc) {
  if (!exc || typeof exc !== 'object') {
    return false;
  }
  if (typeof exc.code === 'string' && /^E[A-Z0-9]+$/.test(exc.code)) {
    return true;
  }
  return typeof exc.errno === 'number';
}

function description_text() {
  const verbs = Cli.PRODUCT_VERBS.join(', ');
  return [
    `${Cli.APP_NAME} — online RBAC and centralized configuration.`,
    'With no arguments on a terminal, uses the sqlite3 default file,',
    'then asks for an account and a password, then opens the text menu.',
    'It creates missing tables first. db-engine: Enter selects sqlite3',
    'and that file. 2 selects mysql. db-engine does not open the database.',
    'With no arguments and no terminal, prints this help and stops.',
    `Product verbs: ${verbs}.`,
    'The text menu has no session row. Row 7 serve starts the site.',
    'This program does not join media or list files in this folder.',
    'version-check runs: npm view noderbac version',
    'self-update runs: npm install -g noderbac@latest',
    'self-install runs: npm install -g noderbac',
    'self-uninstall runs: npm uninstall -g noderbac',
    'and needs --force. Empty arguments do not install or update.',
    '--password is visible in the process list. The menu masks it.',
    'Change the seeded passwords after the first sign-in.',
  ].join('\n');
}

export class Cli {
  static VERSION = version;
  static APP_NAME = 'NodeRbac';
  static CONSOLE_NAME = 'node-rbac';
  static PRODUCT_VERBS = Object.freeze([
    'help',
    'version',
    'about',
    'self-install',
    'version-check',
    'self-update',
    'self-uninstall',
    'login',
    'logout',
    'whoami',
    'serve',
    'db-init',
    'db-engine',
    'user-list',
    'user-add',
    'user-edit',
    'user-remove',
    'user-reset-password',
    'role-list',
    'role-grant',
    'menu-list',
    'menu-add',
    'dept-list',
    'dept-add',
    'post-list',
    'post-add',
    'config-list',
    'config-set',
    'config-add',
    'dict-list',
    'dict-add',
    'notice-list',
    'notice-add',
    'oper-log',
    'login-log',
    'online-list',
    'online-logout',
  ]);
  static LIFECYCLE_VERBS = Object.freeze([
    'version',
    'self-install',
    'version-check',
    'self-update',
    'self-uninstall',
  ]);
  static DOMAIN_VERBS = Object.freeze([
    'login',
    'logout',
    'whoami',
    'db-init',
    'user-list',
    'user-add',
    'user-edit',
    'user-remove',
    'user-reset-password',
    'role-list',
    'role-grant',
    'menu-list',
    'menu-add',
    'dept-list',
    'dept-add',
    'post-list',
    'post-add',
    'config-list',
    'config-set',
    'config-add',
    'dict-list',
    'dict-add',
    'notice-list',
    'notice-add',
    'oper-log',
    'login-log',
    'online-list',
    'online-logout',
  ]);
  static AUTHOR_NAME = 'Wong Chun Fai';
  static AUTHOR_EMAIL = 'cloudgen.wong@gmail.com';
  static HOMEPAGE = 'https://github.com/cloudgen/NodeRbac';
  static LAST_UPDATE = '2026-10-11';
  static DOWNLOAD_URL = '';
  static BASIC_USAGE = 'node-rbac login --user-name admin';

  constructor(logger = null) {
    if (
      logger
      && typeof logger === 'object'
      && Object.prototype.hasOwnProperty.call(logger, 'logger')
      && typeof logger.log_message !== 'function'
    ) {
      logger = logger.logger;
    }
    this.logger = logger;
    if (logger != null) {
      logger.log_message('instantiated', { component: 'Cli' });
    }
    this.app_name = Cli.APP_NAME;
    this.version = Cli.VERSION;
    this.PRODUCT_VERBS = Cli.PRODUCT_VERBS;
    this.LIFECYCLE_VERBS = Cli.LIFECYCLE_VERBS;
    this.DOMAIN_VERBS = Cli.DOMAIN_VERBS;
    this.CONSOLE_NAME = Cli.CONSOLE_NAME;
    this.AUTHOR_NAME = Cli.AUTHOR_NAME;
    this.AUTHOR_EMAIL = Cli.AUTHOR_EMAIL;
    this.HOMEPAGE = Cli.HOMEPAGE;
    this.LAST_UPDATE = Cli.LAST_UPDATE;
    this.DOWNLOAD_URL = Cli.DOWNLOAD_URL;
    this.BASIC_USAGE = Cli.BASIC_USAGE;
    this.about = new AboutPage(
      new CheckSystem(
        logger,
        Cli.APP_NAME,
        Cli.VERSION,
        Cli.CONSOLE_NAME,
      ),
      Cli.APP_NAME,
      Cli.VERSION,
      Cli.AUTHOR_NAME,
      Cli.LAST_UPDATE,
      Cli.HOMEPAGE,
      Cli.DOWNLOAD_URL,
      Cli.BASIC_USAGE,
      Cli.CONSOLE_NAME,
      logger,
    );
    this.self_manage = new SelfManage(Cli.APP_NAME, Cli.VERSION, null, logger);
    this.desk = new Desk(logger);
    this.tui = new Tui(this, Cli.APP_NAME, Cli.VERSION, logger);
  }

  static stdout_is_tty() {
    try {
      return Boolean(process.stdout.isTTY);
    } catch {
      return false;
    }
  }

  stdout_is_tty() {
    return Cli.stdout_is_tty();
  }

  static opens_text_screen(argv = null) {
    if (argv == null) {
      argv = process.argv.slice(2);
    }
    argv = Array.from(argv);
    if (argv.includes('--help') || argv.includes('-h') || argv.includes('--version')) {
      return false;
    }
    if (!Cli.stdout_is_tty()) {
      return false;
    }
    let verb = null;
    let saw_force = false;
    for (const token of argv) {
      if (token === '--force') {
        saw_force = true;
        continue;
      }
      if (String(token).startsWith('-')) {
        return false;
      }
      if (verb == null) {
        verb = token;
        continue;
      }
      return false;
    }
    if (saw_force && verb !== 'self-uninstall') {
      return false;
    }
    if (verb === 'about') {
      return true;
    }
    return verb == null;
  }

  opens_text_screen(argv = null) {
    return Cli.opens_text_screen(argv);
  }

  report_error(message, nxt) {
    if (this.logger != null) {
      this.logger.log_message(`${message} Next: ${nxt}`, {
        level: 'ERROR',
        component: 'main',
      });
    }
    process.stderr.write(`ERROR: ${message}\n`);
    process.stderr.write(`   Next: ${nxt}\n`);
    return 1;
  }

  build_parser() {
    return new ProductParser(Cli.CONSOLE_NAME, description_text(), `${Cli.APP_NAME} ${Cli.VERSION}`);
  }

  _page(text) {
    process.stdout.write(`${text}\n`);
    return 0;
  }

  _unknown_verb(token) {
    const names = Cli.PRODUCT_VERBS.join(', ');
    return this.report_error(
      `Unknown verb '${token}'.`,
      `${Cli.CONSOLE_NAME} help — verbs: ${names}`,
    );
  }

  async _dispatch(args) {
    const verb = args.verb;
    if (args.force && verb !== 'self-uninstall') {
      return this.report_error(
        '--force is only for self-uninstall.',
        `${Cli.CONSOLE_NAME} self-uninstall --force`,
      );
    }
    if (verb === 'about') {
      const result = await this.tui.about_on_screen();
      if (typeof result === 'number') {
        return result;
      }
      return this._page(result);
    }
    if (verb === 'version') {
      return this._page(this.self_manage.local_version());
    }
    if (verb === 'self-uninstall') {
      if (!args.force) {
        return this.report_error(
          'self-uninstall removes this package with npm.',
          `${Cli.CONSOLE_NAME} self-uninstall --force`,
        );
      }
      return this.self_manage.emit(verb);
    }
    if (verb === 'version-check' || verb === 'self-update' || verb === 'self-install') {
      return this.self_manage.emit(verb);
    }
    if (verb === 'serve') {
      return this._verb_serve();
    }
    if (verb === 'db-engine') {
      return this._verb_engine(args);
    }
    if (Cli.DOMAIN_VERBS.includes(verb)) {
      return this._verb_domain(verb, args);
    }
    if (verb != null) {
      return this._unknown_verb(verb);
    }
    if (!Cli.stdout_is_tty()) {
      this.build_parser().print_help();
      return 0;
    }
    const action = await this.tui.open_text_menu();
    if (action === 'missing') {
      return 1;
    }
    return 0;
  }

  async run(argv = null) {
    if (argv == null) {
      argv = process.argv.slice(2);
    }
    argv = Array.from(argv);
    const parser = this.build_parser();
    let args;
    try {
      args = parser.parse_args(argv);
    } catch (exc) {
      if (exc instanceof ParserExit || (exc && exc.name === 'SystemExit')) {
        const code = exc.code;
        if (code == null || code === 0) {
          return 0;
        }
        return Number(code);
      }
      throw exc;
    }
    if (args.verb === 'help') {
      parser.print_help();
      return 0;
    }
    return this._dispatch(args);
  }

  async _verb_domain(verb, args) {
    try {
      const text = await this.desk.execute(verb, args);
      if (text) {
        process.stdout.write(`${text}\n`);
      }
      return 0;
    } catch (exc) {
      if (
        exc instanceof AccessError
        || exc instanceof SettingsError
        || exc instanceof StoreError
        || is_named(exc, ['AccessError', 'SettingsError', 'StoreError'])
      ) {
        return this.report_error(text_of(exc), exc.nxt);
      }
      throw exc;
    }
  }

  async _verb_engine(args) {
    const settings = this.desk.settings;
    if (args.engine) {
      try {
        const sentence = await settings.apply_choice(args.engine);
        process.stdout.write(`${sentence}\n`);
      } catch (exc) {
        if (exc instanceof SettingsError || is_named(exc, ['SettingsError'])) {
          return this.report_error(text_of(exc), exc.nxt);
        }
        throw exc;
      }
      return 0;
    }
    let lines;
    try {
      lines = await settings.choice_lines();
    } catch (exc) {
      if (exc instanceof SettingsError || is_named(exc, ['SettingsError'])) {
        return this.report_error(text_of(exc), exc.nxt);
      }
      throw exc;
    }
    for (const line of lines) {
      process.stdout.write(`${line}\n`);
    }
    if (!Cli.stdout_is_tty()) {
      return 0;
    }
    let picked;
    try {
      picked = await read_console_line('Choice [sqlite3]: ');
    } catch (exc) {
      if (exc && exc.name === 'EOFError') {
        return 0;
      }
      throw exc;
    }
    try {
      const sentence = await settings.apply_choice(picked);
      process.stdout.write(`${sentence}\n`);
    } catch (exc) {
      if (exc instanceof SettingsError || is_named(exc, ['SettingsError'])) {
        return this.report_error(text_of(exc), exc.nxt);
      }
      throw exc;
    }
    return 0;
  }

  async _block_until_sigint() {
    await new Promise((resolve) => {
      process.once('SIGINT', () => resolve());
    });
  }

  async _verb_serve() {
    let web;
    try {
      await this.desk.ensure_database();
      web = await this.desk.web();
      if (web && typeof web.make_server === 'function') {
        await web.make_server();
      }
    } catch (exc) {
      if (
        exc instanceof SettingsError
        || exc instanceof StoreError
        || is_named(exc, ['SettingsError', 'StoreError'])
        || is_os_error(exc)
      ) {
        const nxt = has_own(exc, 'nxt') ? exc.nxt : 'keep NODERBAC_BIND=127.0.0.1';
        return this.report_error(text_of(exc), nxt);
      }
      throw exc;
    }
    const address = web && typeof web.url === 'function' ? await web.url() : '';
    process.stdout.write(`${address}\n`);
    try {
      await this._block_until_sigint();
    } finally {
      if (web && typeof web.stop === 'function') {
        await web.stop();
      }
    }
    return 0;
  }
}

export async function main(argv = null, basedir = '', logdir = '') {
  const major = Number.parseInt(String(process.versions.node).split('.')[0], 10);
  if (!(major >= 22)) {
    process.stderr.write('Node.js 22 or newer is required. Next step: install Node.js 22 or newer\n');
    return 1;
  }
  if (argv == null) {
    argv = process.argv.slice(2);
  }
  argv = Array.from(argv);
  const screen = Cli.opens_text_screen(argv);
  const logger = new ChronicleLogger({
    logname: Cli.APP_NAME,
    is_quiet: screen,
    basedir,
    logdir,
  });
  const appname = logger.logName();
  const resolved_base = logger.baseDir();
  logger.logDir();

  if (logger.isDebug()) {
    logger.log_message(
      `${appname} v${version} (${fileURLToPath(import.meta.url)})`,
      { component: 'main' },
    );
    logger.log_message(
      `Using ${ChronicleLogger.class_version()}`,
      { component: 'main' },
    );
    logger.log_message(
      `Base ${resolved_base}`,
      { level: 'DEBUG', component: 'main' },
    );
    logger.log_message('debug mode', { component: 'main' });
  }

  const app = new Cli(logger);
  return app.run(argv);
}

function same_file(left, right) {
  try {
    return fs.realpathSync(left) === fs.realpathSync(right);
  } catch {
    return path.resolve(left) === path.resolve(right);
  }
}

function invoked_directly() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  try {
    return same_file(fileURLToPath(import.meta.url), entry);
  } catch {
    try {
      return import.meta.url === pathToFileURL(entry).href;
    } catch {
      return false;
    }
  }
}

if (invoked_directly()) {
  main().then((code) => {
    process.exit(Number.isInteger(code) ? code : 1);
  }).catch((exc) => {
    console.error(exc);
    process.exit(1);
  });
}
