// =============================================================================
// Shared command desk for the terminal and the text menu.
// requirement-rbac — one service for both surfaces.
// requirement-nodejs-oop — class Desk.
// =============================================================================

import { Access, AccessError } from './access.js';
import { AuditLog } from './audit_log.js';
import { Catalog } from './catalog.js';
import { PasswordHash } from './password_hash.js';
import { ReportText } from './report_text.js';
import { Schema } from './schema.js';
import { SessionFile } from './session_file.js';
import { Settings, SettingsError } from './settings.js';
import { Store, StoreError } from './store.js';
import { WebApp } from './web_app.js';

export { AccessError, SettingsError, StoreError };

function pyInt(value) {
  if (typeof value === 'boolean' || value == null) throw new TypeError('int');
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('int');
    return Math.trunc(value);
  }
  if (typeof value === 'bigint') return Number(value);
  const text = String(value).trim();
  if (!/^[+-]?\d+$/.test(text)) throw new TypeError(`invalid literal for int(): ${text}`);
  return Number(text);
}

export class Desk {
  // Database, session file, and the verbs both surfaces call.
  // The web listener is created only when serve is chosen. A missing database
  // password stays quiet until a verb asks for a connection. A domain verb,
  // serve, and the text menu call ensure_database when the tables are missing.

  constructor(logger = null, environ = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message('instantiated', { component: 'Desk' });
    }
    this.settings = new Settings(environ, null, logger);
    this.sessions = new SessionFile(this.settings, logger);
    this.store = new Store(this.settings, logger);
    this.audit = new AuditLog(this.store, logger);
    this.passwords = new PasswordHash(logger);
    this.access = new Access(this.store, this.audit, this.passwords, logger);
    this.catalog = new Catalog(this.store, this.access, this.audit, logger);
    this.report = new ReportText(logger);
    this.schema = new Schema(this.store, this.passwords, logger);
    this._web = null;
  }

  // General Purpose: The one web listener for this process.
  web() {
    if (this._web == null) {
      this._web = new WebApp(
        this.settings,
        this.access,
        this.catalog,
        this.report,
        this.logger,
        this.ensure_database.bind(this),
      );
    }
    return this._web;
  }

  // General Purpose: The account for the terminal token, or null.
  async actor() {
    const token = this.sessions.read();
    if (!token) return null;
    return this.access.actor_from_token(token);
  }

  // General Purpose: The signed-in account, or a next-step error.
  async require_actor() {
    const actor = await this.actor();
    if (actor == null) {
      throw new AccessError('Not signed in.', 'node-rbac login --user-name NAME', this.logger);
    }
    return actor;
  }

  _need(options, name, nxt) {
    const value = options == null ? undefined : options[name];
    if (value == null || String(value).trim() === '') {
      throw new AccessError(
        `${name.replaceAll('_', '-')} is required.`,
        nxt,
        this.logger,
      );
    }
    return String(value).trim();
  }

  _optional(options, name) {
    const value = options == null ? undefined : options[name];
    if (value == null) return '';
    return String(value).trim();
  }

  _int(value, label) {
    try {
      return pyInt(value);
    } catch {
      throw new AccessError(
        `${label} must be a whole number.`,
        'pass a whole number',
        this.logger,
      );
    }
  }

  _optional_int(value, label) {
    if (value == null || String(value).trim() === '') return null;
    return this._int(value, label);
  }

  _ints(text, label) {
    if (text == null || String(text).trim() === '') return [];
    const found = [];
    for (const part of String(text).split(',')) {
      const piece = part.trim();
      if (piece) found.push(this._int(piece, label));
    }
    return found;
  }

  // General Purpose: Check the password and store the terminal token.
  async login(user_name, password) {
    const user = await this.access.login(user_name, password, '127.0.0.1', 'cli', 'node-rbac');
    this.sessions.write(user.token);
    return `Signed in as ${user.user_name}.`;
  }

  // General Purpose: Drop this terminal session and remove the token file.
  async logout() {
    const token = this.sessions.read();
    if (!token) {
      throw new AccessError('Not signed in.', 'node-rbac login --user-name NAME', this.logger);
    }
    await this.access.logout(token);
    this.sessions.clear();
    return 'Signed out.';
  }

  // General Purpose: Describe the signed-in account. No password and no token.
  async whoami() {
    return this.access.describe(await this.require_actor());
  }

  // General Purpose: Create missing tables and seed when sys_user is empty.
  // A later call returns present and does not add another administrator.
  async ensure_database() {
    return this.schema.ensure();
  }

  // General Purpose: Create tables and seed only when sys_user is empty.
  async db_init() {
    const state = await this.ensure_database();
    return `Database ${this.settings.storage_label()}: ${state}.`;
  }

  // General Purpose: Start the site on a background thread and report the URL.
  async serve_background() {
    await this.ensure_database();
    const url = await this.web().start_background();
    return `Web interface: ${url}\nIt stays up while this process is open.`;
  }

  // General Purpose: Run one domain verb and return the text to show.
  async execute(verb, options) {
    if (verb === 'db-engine') {
      return this.settings.apply_choice(this._optional(options, 'engine'));
    }
    if (verb === 'db-init') return this.db_init();
    await this.ensure_database();
    if (verb === 'login') {
      return this.login(
        this._need(options, 'user_name', 'node-rbac login --user-name NAME'),
        this._need(options, 'password', 'node-rbac login --user-name NAME'),
      );
    }
    if (verb === 'logout') return this.logout();
    if (verb === 'whoami') return this.whoami();
    if (verb === 'serve') return this.serve_background();
    const actor = await this.require_actor();
    if (verb === 'user-list') return this.report.users(await this.access.user_list(actor));
    if (verb === 'user-add') {
      const row = await this.access.user_add(
        actor,
        this._need(options, 'user_name', 'node-rbac user-add --user-name NAME --nick-name NAME --dept-id N --role-id N'),
        this._need(options, 'nick_name', 'set --nick-name'),
        this._int(this._need(options, 'dept_id', 'set --dept-id'), 'dept-id'),
        this._int(this._need(options, 'role_id', 'set --role-id'), 'role-id'),
        this._optional(options, 'password'),
      );
      return `Added ${row.user_name}.`;
    }
    if (verb === 'user-edit') {
      const nick = this._optional(options, 'nick_name') || null;
      const dept = this._optional_int(this._optional(options, 'dept_id'), 'dept-id');
      const status = this._optional(options, 'status') || null;
      if (nick == null && dept == null && status == null) {
        throw new AccessError(
          'user-edit needs a name, a department, or a status.',
          'node-rbac user-edit --user-id N --nick-name NAME',
          this.logger,
        );
      }
      const row = await this.access.user_edit(
        actor,
        this._int(this._need(options, 'user_id', 'set --user-id'), 'user-id'),
        nick,
        dept,
        status,
      );
      return `Updated ${row.user_name}.`;
    }
    if (verb === 'user-remove') {
      const name = await this.access.user_remove(
        actor,
        this._int(this._need(options, 'user_id', 'set --user-id'), 'user-id'),
      );
      return `Removed ${name}.`;
    }
    if (verb === 'user-reset-password') {
      const name = await this.access.user_reset_password(
        actor,
        this._int(this._need(options, 'user_id', 'set --user-id'), 'user-id'),
        this._need(options, 'password', 'set --password'),
      );
      return `Password updated for ${name}.`;
    }
    if (verb === 'role-list') return this.report.roles(await this.access.role_list(actor));
    if (verb === 'role-grant') {
      const row = await this.access.role_grant(
        actor,
        this._int(this._need(options, 'role_id', 'set --role-id'), 'role-id'),
        this._ints(this._need(options, 'menu_ids', 'set --menu-ids'), 'menu-id'),
        this._optional(options, 'data_scope') || null,
        this._ints(this._optional(options, 'dept_ids'), 'dept-id'),
      );
      return `Granted role ${row.role_id} (${row.role_key}), data_scope ${row.data_scope}.`;
    }
    if (verb === 'menu-list') return this.report.menus(await this.access.menu_list(actor));
    if (verb === 'menu-add') {
      const menu_id = await this.access.menu_add(
        actor,
        this._need(options, 'menu_name', 'set --menu-name'),
        this._int(this._need(options, 'parent_id', 'set --parent-id'), 'parent-id'),
        this._need(options, 'menu_type', 'set --menu-type M, C, or F'),
        this._optional(options, 'perms'),
        this._optional(options, 'path'),
      );
      return `Added menu ${menu_id}.`;
    }
    if (verb === 'dept-list') return this.report.depts(await this.access.dept_list(actor));
    if (verb === 'dept-add') {
      const dept_id = await this.access.dept_add(
        actor,
        this._need(options, 'dept_name', 'set --dept-name'),
        this._int(this._need(options, 'parent_id', 'set --parent-id'), 'parent-id'),
      );
      return `Added department ${dept_id}.`;
    }
    if (verb === 'post-list') return this.report.posts(await this.access.post_list(actor));
    if (verb === 'post-add') {
      const post_id = await this.access.post_add(
        actor,
        this._need(options, 'post_code', 'set --post-code'),
        this._need(options, 'post_name', 'set --post-name'),
      );
      return `Added post ${post_id}.`;
    }
    if (verb === 'config-list') return this.report.configs(await this.catalog.config_list(actor));
    if (verb === 'config-set') {
      const key = await this.catalog.config_set(
        actor,
        this._need(options, 'config_key', 'set --config-key'),
        this._need(options, 'config_value', 'set --config-value'),
      );
      return `Set ${key}.`;
    }
    if (verb === 'config-add') {
      const key = await this.catalog.config_add(
        actor,
        this._need(options, 'config_key', 'set --config-key'),
        this._need(options, 'config_name', 'set --config-name'),
        this._need(options, 'config_value', 'set --config-value'),
      );
      return `Added parameter ${key}.`;
    }
    if (verb === 'dict-list') return this.report.dicts(await this.catalog.dict_list(actor));
    if (verb === 'dict-add') {
      const label = await this.catalog.dict_add(
        actor,
        this._need(options, 'dict_type', 'set --dict-type'),
        this._need(options, 'dict_label', 'set --dict-label'),
        this._need(options, 'dict_value', 'set --dict-value'),
      );
      return `Added dictionary value ${label}.`;
    }
    if (verb === 'notice-list') return this.report.notices(await this.catalog.notice_list(actor));
    if (verb === 'notice-add') {
      const title = await this.catalog.notice_add(
        actor,
        this._need(options, 'notice_title', 'set --notice-title'),
        this._optional(options, 'notice_type') || '1',
        this._optional(options, 'content'),
      );
      return `Added notice ${title}.`;
    }
    if (verb === 'oper-log') return this.report.oper_log(await this.catalog.oper_log(actor));
    if (verb === 'login-log') return this.report.login_log(await this.catalog.login_log(actor));
    if (verb === 'online-list') return this.report.online(await this.catalog.online_list(actor));
    if (verb === 'online-logout') {
      const count = await this.catalog.online_logout(
        actor,
        this._need(options, 'token', 'node-rbac online-list'),
      );
      return `Closed ${count} session.`;
    }
    throw new AccessError(`Unknown verb '${verb}'.`, 'node-rbac help', this.logger);
  }
}
