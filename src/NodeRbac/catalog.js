// =============================================================================
// Centralized parameters, dictionaries, and notices.
// requirement-domain-noderbac — setup surface.
// requirement-nodejs-oop — class Catalog.
// =============================================================================

import { AccessError } from './access.js';

export class Catalog {
  // sys_config, sys_dict_type, sys_dict_data, and sys_notice.
  // The same methods serve the terminal, the text menu, and the web pages.

  constructor(store, access, audit, logger = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message('instantiated', { component: 'Catalog' });
    }
    this.store = store;
    this.access = access;
    this.audit = audit;
  }

  _fail(message, nxt) {
    throw new AccessError(message, nxt, this.logger);
  }

  async config_list(actor) {
    await this.access.require(actor, 'system:config:list');
    return this.store.query_all(
      `
            SELECT config_key, config_name, config_value, config_type
            FROM sys_config
            ORDER BY config_id
            `,
    );
  }

  async config_set(actor, config_key, config_value) {
    await this.access.require(actor, 'system:config:edit');
    const row = await this.store.query_one(
      'SELECT config_id, config_key FROM sys_config WHERE config_key = %s',
      [config_key],
    );
    if (row == null) {
      this._fail(`Unknown parameter ${config_key}.`, 'node-rbac config-list');
    }
    const value = config_value == null ? '' : String(config_value);
    if (value.length > 500) {
      this._fail('config_value must be 500 characters or fewer.', 'shorten the value');
    }
    await this.store.execute(
      `
            UPDATE sys_config
            SET config_value = %s, update_by = %s, update_time = NOW()
            WHERE config_key = %s
            `,
      [value, actor.user_name, config_key],
    );
    await this.audit.write_oper(actor, 'Parameter', 2, 'config_set', 0, '', config_key);
    return config_key;
  }

  async config_add(actor, config_key, config_name, config_value) {
    await this.access.require(actor, 'system:config:add');
    const key = (config_key || '').trim();
    if (!key || key.length > 100) {
      this._fail('config_key is required.', 'set --config-key');
    }
    const existing = await this.store.query_one(
      'SELECT config_id FROM sys_config WHERE config_key = %s',
      [key],
    );
    if (existing) {
      this._fail(
        'That parameter already exists.',
        `node-rbac config-set --config-key ${key}`,
      );
    }
    await this.store.execute(
      `
            INSERT INTO sys_config
              (config_name, config_key, config_value, config_type, create_by, create_time)
            VALUES (%s, %s, %s, 'N', %s, NOW())
            `,
      [(config_name || key).slice(0, 100), key, (config_value || '').slice(0, 500), actor.user_name],
    );
    await this.audit.write_oper(actor, 'Parameter', 1, 'config_add', 0, '', key);
    return key;
  }

  async dict_list(actor) {
    await this.access.require(actor, 'system:dict:list');
    return this.store.query_all(
      `
            SELECT d.dict_type, d.dict_label, d.dict_value, d.status
            FROM sys_dict_data d
            ORDER BY d.dict_type, d.dict_sort, d.dict_code
            `,
    );
  }

  async dict_add(actor, dict_type, dict_label, dict_value) {
    await this.access.require(actor, 'system:dict:add');
    const kind = await this.store.query_one(
      "SELECT dict_type FROM sys_dict_type WHERE dict_type = %s AND status = '0'",
      [dict_type],
    );
    if (kind == null) {
      this._fail(`Unknown dictionary type ${dict_type}.`, 'node-rbac dict-list');
    }
    const label = (dict_label || '').trim();
    const value = (dict_value || '').trim();
    if (!label || !value) {
      this._fail('dict_label and dict_value are required.', 'set both');
    }
    await this.store.execute(
      `
            INSERT INTO sys_dict_data
              (dict_sort, dict_label, dict_value, dict_type, is_default, status,
               create_by, create_time)
            VALUES (0, %s, %s, %s, 'N', '0', %s, NOW())
            `,
      [label.slice(0, 100), value.slice(0, 100), dict_type, actor.user_name],
    );
    await this.audit.write_oper(actor, 'Dictionary', 1, 'dict_add', 0, '', dict_type);
    return label;
  }

  async notice_list(actor) {
    await this.access.require(actor, 'system:notice:list');
    return this.store.query_all(
      `
            SELECT notice_id, notice_title, notice_type, status
            FROM sys_notice
            ORDER BY notice_id
            `,
    );
  }

  async notice_add(actor, title, notice_type, content) {
    await this.access.require(actor, 'system:notice:add');
    const name = (title || '').trim();
    if (!name || name.length > 50) {
      this._fail('The notice title is required.', 'set --title');
    }
    if (!['1', '2'].includes(String(notice_type))) {
      this._fail(
        'notice_type must be 1 (notice) or 2 (announcement).',
        'set --notice-type 1',
      );
    }
    await this.store.execute(
      `
            INSERT INTO sys_notice
              (notice_title, notice_type, notice_content, status, create_by, create_time)
            VALUES (%s, %s, %s, '0', %s, NOW())
            `,
      [name, String(notice_type), content || '', actor.user_name],
    );
    await this.audit.write_oper(actor, 'Notice', 1, 'notice_add', 0, '', name);
    return name;
  }

  async oper_log(actor) {
    await this.access.require(actor, 'monitor:operlog:list');
    return this.audit.oper_rows();
  }

  async login_log(actor) {
    await this.access.require(actor, 'monitor:logininfor:list');
    return this.audit.login_rows();
  }

  async online_list(actor) {
    await this.access.require(actor, 'monitor:online:list');
    return this.audit.online_rows();
  }

  async online_logout(actor, token) {
    await this.access.require(actor, 'monitor:online:forceLogout');
    if (!token) this._fail('A session token is required.', 'node-rbac online-list');
    const count = await this.audit.drop_session(token);
    if (count === 0) this._fail('That session is not online.', 'node-rbac online-list');
    await this.audit.write_oper(actor, 'Online', 3, 'online_logout', 0, '', token.slice(0, 8));
    return count;
  }
}
