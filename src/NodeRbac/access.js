// =============================================================================
// RBAC commands shared by the terminal, the text menu, and the web interface.
// requirement-rbac — users, roles, menus, departments, posts, data scope.
// requirement-nodejs-oop — class Access and AccessError.
// =============================================================================

import crypto from 'node:crypto';

import { PasswordHash } from './password_hash.js';

export class AccessError extends Error {
  constructor(message, nxt, logger = null) {
    super(message);
    this.name = 'AccessError';
    this.nxt = nxt;
    if (logger) logger.log_message('instantiated', { component: 'AccessError' });
  }

  toString() {
    return this.message;
  }
}

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

function tokenUrlSafe(nbytes) {
  return crypto.randomBytes(nbytes).toString('base64url');
}

export class Access {
  // Users, roles, menus, departments, and posts.
  // Data scope is 1 all, 2 custom departments, 3 this department, and 4 this
  // department and children. Any other scope contributes no rows. role_key
  // admin bypasses permission and scope.

  static USER_NAME = /^[A-Za-z][A-Za-z0-9_]{2,29}$/;
  static SCOPES = ['1', '2', '3', '4'];
  static PROTECTED_USER = 1;
  static PROTECTED_ROLE = 1;

  constructor(store, audit, passwords = null, logger = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message('instantiated', { component: 'Access' });
    }
    this.store = store;
    this.audit = audit;
    this.passwords = passwords || new PasswordHash(logger);
    this._dummy = this.passwords.hash('not-a-real-password');
  }

  _fail(message, nxt) {
    throw new AccessError(message, nxt, this.logger);
  }

  async roles_of(user_id) {
    return this.store.query_all(
      `
            SELECT r.role_id, r.role_key, r.role_name, r.data_scope, r.status
            FROM sys_role r
            JOIN sys_user_role ur ON ur.role_id = r.role_id
            WHERE ur.user_id = %s AND r.del_flag = '0' AND r.status = '0'
            `,
      [user_id],
    );
  }

  async is_admin(user_id) {
    for (const role of await this.roles_of(user_id)) {
      if (role.role_key === 'admin') return true;
    }
    return false;
  }

  async perms_of(user_id) {
    if (await this.is_admin(user_id)) return new Set(['*:*:*']);
    const rows = await this.store.query_all(
      `
            SELECT DISTINCT m.perms AS perms
            FROM sys_menu m
            JOIN sys_role_menu rm ON rm.menu_id = m.menu_id
            JOIN sys_user_role ur ON ur.role_id = rm.role_id
            JOIN sys_role r ON r.role_id = ur.role_id
            WHERE ur.user_id = %s
              AND r.del_flag = '0' AND r.status = '0'
              AND m.status = '0'
              AND m.perms IS NOT NULL AND m.perms <> ''
            `,
      [user_id],
    );
    return new Set(rows.map((row) => row.perms));
  }

  async allows(user_id, perm) {
    if (await this.is_admin(user_id)) return true;
    return (await this.perms_of(user_id)).has(perm);
  }

  async require(actor, perm) {
    if (actor == null) {
      this._fail('Sign in first.', 'node-rbac login --user-name NAME --password SECRET');
    }
    if (!(await this.allows(actor.user_id, perm))) {
      this._fail(
        `Missing permission ${perm}.`,
        `ask an administrator to grant ${perm}`,
      );
    }
    return actor;
  }

  async user_by_id(user_id) {
    return this.store.query_one(
      `
            SELECT u.user_id, u.user_name, u.nick_name, u.dept_id, u.email,
                   u.phonenumber, u.sex, u.status, u.del_flag, d.dept_name
            FROM sys_user u
            LEFT JOIN sys_dept d ON d.dept_id = u.dept_id AND d.del_flag = '0'
            WHERE u.user_id = %s AND u.del_flag = '0'
            `,
      [user_id],
    );
  }

  async actor_from_token(token) {
    const row = await this.audit.session_row(token);
    if (row == null) return null;
    const user = await this.user_by_id(row.user_id);
    if (user == null || String(user.status) !== '0') return null;
    user.token = row.token;
    user.csrf = row.csrf;
    await this.audit.touch(token);
    return user;
  }

  // General Purpose: Check the password and open a session. Returns the user.
  async login(user_name, password, ipaddr = '', surface = 'cli', user_agent = '') {
    const name = (user_name || '').trim();
    const row = await this.store.query_one(
      `
            SELECT user_id, user_name, nick_name, password, status, del_flag, dept_id
            FROM sys_user
            WHERE user_name = %s AND del_flag = '0'
            `,
      [name],
    );
    if (row == null) {
      this.passwords.verify(password || '', this._dummy);
      await this.audit.write_login(name, ipaddr, '1', 'unknown account');
      this._fail(
        'Unknown account or wrong password.',
        'node-rbac login --user-name NAME --password SECRET',
      );
    }
    if (String(row.status) !== '0') {
      this.passwords.verify(password || '', this._dummy);
      await this.audit.write_login(name, ipaddr, '1', 'disabled');
      this._fail('This account is disabled.', 'ask an administrator to enable it');
    }
    if (!this.passwords.verify(password || '', row.password || '')) {
      await this.audit.write_login(name, ipaddr, '1', 'wrong password');
      this._fail(
        'Unknown account or wrong password.',
        'node-rbac login --user-name NAME --password SECRET',
      );
    }
    const token = tokenUrlSafe(32);
    const csrf = tokenUrlSafe(24);
    const user = await this.user_by_id(row.user_id);
    await this.audit.open_session(token, user, ipaddr, user_agent, csrf, surface);
    await this.store.execute(
      `
            UPDATE sys_user
            SET login_ip = %s, login_date = NOW()
            WHERE user_id = %s
            `,
      [ipaddr || '', row.user_id],
    );
    await this.audit.write_login(name, ipaddr, '0', 'success');
    if (this.logger != null) {
      this.logger.log_message(`login ${name} via ${surface}`, { component: 'Access' });
    }
    user.token = token;
    user.csrf = csrf;
    return user;
  }

  async logout(token) {
    return this.audit.drop_session(token || '');
  }

  async _scope(actor) {
    if (await this.is_admin(actor.user_id)) return ['1=1', []];
    const roles = await this.roles_of(actor.user_id);
    if (roles.some((role) => String(role.data_scope) === '1')) return ['1=1', []];
    const parts = [];
    const args = [];
    const dept_id = actor.dept_id;
    for (const role of roles) {
      const scope = String(role.data_scope);
      if (scope === '2') {
        const chosen = await this.store.query_all(
          'SELECT dept_id FROM sys_role_dept WHERE role_id = %s',
          [role.role_id],
        );
        const ids = chosen.map((item) => item.dept_id);
        if (ids.length === 0) continue;
        const marks = ids.map(() => '%s').join(', ');
        parts.push(`u.dept_id IN (${marks})`);
        args.push(...ids);
      } else if (scope === '3') {
        if (dept_id == null) continue;
        parts.push('u.dept_id = %s');
        args.push(dept_id);
      } else if (scope === '4') {
        if (dept_id == null) continue;
        parts.push('(u.dept_id = %s OR FIND_IN_SET(%s, d.ancestors))');
        args.push(dept_id, String(dept_id));
      }
    }
    if (parts.length === 0) return ['1=0', []];
    return [`(${parts.join(' OR ')})`, args];
  }

  async user_list(actor) {
    await this.require(actor, 'system:user:list');
    const [clause, args] = await this._scope(actor);
    const sql = `
            SELECT u.user_id, u.user_name, u.nick_name, u.dept_id,
                   d.dept_name, u.status
            FROM sys_user u
            LEFT JOIN sys_dept d ON d.dept_id = u.dept_id
            WHERE u.del_flag = '0' AND ${clause}
            ORDER BY u.user_id
            LIMIT 200
        `;
    return this.store.query_all(sql, args);
  }

  _check_name(user_name) {
    if (!this.constructor.USER_NAME.test(user_name || '')) {
      this._fail(
        'user_name must start with a letter and use 3 to 30 letters, digits, or underscores.',
        'pick another user_name',
      );
    }
  }

  async _dept_exists(dept_id) {
    const row = await this.store.query_one(
      "SELECT dept_id FROM sys_dept WHERE dept_id = %s AND del_flag = '0'",
      [dept_id],
    );
    if (row == null) this._fail(`Unknown department ${dept_id}.`, 'node-rbac dept-list');
  }

  async _role_exists(role_id) {
    const row = await this.store.query_one(
      "SELECT role_id FROM sys_role WHERE role_id = %s AND del_flag = '0'",
      [role_id],
    );
    if (row == null) this._fail(`Unknown role ${role_id}.`, 'node-rbac role-list');
  }

  async init_password() {
    const row = await this.store.query_one(
      'SELECT config_value FROM sys_config WHERE config_key = %s',
      ['sys.user.initPassword'],
    );
    if (row && row.config_value) return row.config_value;
    return '123456';
  }

  async user_add(actor, user_name, nick_name, dept_id, role_id, password = '') {
    await this.require(actor, 'system:user:add');
    this._check_name(user_name);
    const nick = (nick_name || '').trim();
    if (!nick || nick.length > 30) {
      this._fail('nick_name is required and must be 30 characters or fewer.', 'set --nick-name');
    }
    await this._dept_exists(dept_id);
    await this._role_exists(role_id);
    const existing = await this.store.query_one(
      "SELECT user_id FROM sys_user WHERE user_name = %s AND del_flag = '0'",
      [user_name],
    );
    if (existing) this._fail('That user_name is already in use.', 'pick another user_name');
    const secret = password || await this.init_password();
    if (secret.length < 5) {
      this._fail('The password must be at least 5 characters.', 'set --password');
    }
    const stored = this.passwords.hash(secret);
    const done = await this.store.execute(
      `
            INSERT INTO sys_user
              (dept_id, user_name, nick_name, password, status, del_flag,
               create_by, create_time, pwd_update_date)
            VALUES (%s, %s, %s, %s, '0', '0', %s, NOW(), NOW())
            `,
      [dept_id, user_name, nick, stored, actor.user_name],
    );
    const user_id = done.lastrowid;
    await this.store.execute(
      'INSERT INTO sys_user_role (user_id, role_id) VALUES (%s, %s)',
      [user_id, role_id],
    );
    await this.audit.write_oper(actor, 'User', 1, 'user_add', 0, '', user_name);
    return this.user_by_id(user_id);
  }

  async user_edit(actor, user_id, nick_name = null, dept_id = null, status = null) {
    await this.require(actor, 'system:user:edit');
    const user = await this.user_by_id(user_id);
    if (user == null) this._fail(`Unknown user ${user_id}.`, 'node-rbac user-list');
    if (pyInt(user_id) === this.constructor.PROTECTED_USER && status != null && String(status) !== '0') {
      this._fail('The built-in administrator stays enabled.', 'leave status 0');
    }
    if (dept_id != null) await this._dept_exists(dept_id);
    if (nick_name != null) {
      const nick = nick_name.trim();
      if (!nick || nick.length > 30) {
        this._fail('nick_name is required and must be 30 characters or fewer.', 'set --nick-name');
      }
      await this.store.execute(
        'UPDATE sys_user SET nick_name = %s, update_by = %s, update_time = NOW() WHERE user_id = %s',
        [nick, actor.user_name, user_id],
      );
    }
    if (dept_id != null) {
      await this.store.execute(
        'UPDATE sys_user SET dept_id = %s, update_by = %s, update_time = NOW() WHERE user_id = %s',
        [dept_id, actor.user_name, user_id],
      );
    }
    if (status != null) {
      if (!['0', '1'].includes(String(status))) {
        this._fail('status must be 0 or 1.', 'use 0 for normal or 1 for disabled');
      }
      await this.store.execute(
        'UPDATE sys_user SET status = %s, update_by = %s, update_time = NOW() WHERE user_id = %s',
        [String(status), actor.user_name, user_id],
      );
    }
    await this.audit.write_oper(actor, 'User', 2, 'user_edit', 0, '', String(user_id));
    return this.user_by_id(user_id);
  }

  async user_remove(actor, user_id) {
    await this.require(actor, 'system:user:remove');
    if (pyInt(user_id) === this.constructor.PROTECTED_USER) {
      this._fail('The built-in administrator cannot be removed.', 'disable another account instead');
    }
    if (pyInt(user_id) === pyInt(actor.user_id)) {
      this._fail('You cannot remove the account you are using.', 'sign in as another administrator');
    }
    const user = await this.user_by_id(user_id);
    if (user == null) this._fail(`Unknown user ${user_id}.`, 'node-rbac user-list');
    await this.store.execute(
      `
            UPDATE sys_user
            SET del_flag = '2', update_by = %s, update_time = NOW()
            WHERE user_id = %s
            `,
      [actor.user_name, user_id],
    );
    await this.store.execute('DELETE FROM sys_user_role WHERE user_id = %s', [user_id]);
    await this.store.execute('DELETE FROM sys_user_post WHERE user_id = %s', [user_id]);
    await this.audit.write_oper(actor, 'User', 3, 'user_remove', 0, '', user.user_name);
    return user.user_name;
  }

  async user_reset_password(actor, user_id, password) {
    await this.require(actor, 'system:user:resetPwd');
    const user = await this.user_by_id(user_id);
    if (user == null) this._fail(`Unknown user ${user_id}.`, 'node-rbac user-list');
    if (!password || password.length < 5) {
      this._fail('The password must be at least 5 characters.', 'set --password');
    }
    const stored = this.passwords.hash(password);
    await this.store.execute(
      `
            UPDATE sys_user
            SET password = %s, pwd_update_date = NOW(), update_by = %s, update_time = NOW()
            WHERE user_id = %s
            `,
      [stored, actor.user_name, user_id],
    );
    await this.audit.write_oper(actor, 'User', 2, 'user_reset_password', 0, '', user.user_name);
    return user.user_name;
  }

  async role_list(actor) {
    await this.require(actor, 'system:role:list');
    return this.store.query_all(
      `
            SELECT role_id, role_name, role_key, data_scope, status
            FROM sys_role
            WHERE del_flag = '0'
            ORDER BY role_sort, role_id
            `,
    );
  }

  async role_grant(actor, role_id, menu_ids, data_scope = null, dept_ids = null) {
    await this.require(actor, 'system:role:edit');
    await this._role_exists(role_id);
    if (pyInt(role_id) === this.constructor.PROTECTED_ROLE) {
      this._fail(
        'The built-in administrator role is not edited here.',
        'grant menus on another role',
      );
    }
    if (data_scope != null && !this.constructor.SCOPES.includes(String(data_scope))) {
      this._fail(
        'data_scope must be 1, 2, 3, or 4.',
        '1 all, 2 custom departments, 3 this department, 4 this department and children',
      );
    }
    const clean_menus = [];
    for (const item of menu_ids) {
      const row = await this.store.query_one(
        'SELECT menu_id FROM sys_menu WHERE menu_id = %s',
        [pyInt(item)],
      );
      if (row == null) this._fail(`Unknown menu ${item}.`, 'node-rbac menu-list');
      clean_menus.push(pyInt(item));
    }
    await this.store.execute('DELETE FROM sys_role_menu WHERE role_id = %s', [role_id]);
    for (const menu_id of clean_menus) {
      await this.store.execute(
        'INSERT INTO sys_role_menu (role_id, menu_id) VALUES (%s, %s)',
        [role_id, menu_id],
      );
    }
    if (data_scope != null) {
      await this.store.execute(
        `
                UPDATE sys_role
                SET data_scope = %s, update_by = %s, update_time = NOW()
                WHERE role_id = %s
                `,
        [String(data_scope), actor.user_name, role_id],
      );
    }
    let scope_now = data_scope != null ? String(data_scope) : null;
    if (scope_now == null) {
      const current = await this.store.query_one(
        'SELECT data_scope FROM sys_role WHERE role_id = %s',
        [role_id],
      );
      scope_now = current ? String(current.data_scope) : '1';
    }
    await this.store.execute('DELETE FROM sys_role_dept WHERE role_id = %s', [role_id]);
    if (scope_now === '2') {
      for (const dept_id of dept_ids || []) {
        await this._dept_exists(pyInt(dept_id));
        await this.store.execute(
          'INSERT INTO sys_role_dept (role_id, dept_id) VALUES (%s, %s)',
          [role_id, pyInt(dept_id)],
        );
      }
    }
    await this.audit.write_oper(actor, 'Role', 2, 'role_grant', 0, '', String(role_id));
    return this.store.query_one(
      'SELECT role_id, role_name, role_key, data_scope, status FROM sys_role WHERE role_id = %s',
      [role_id],
    );
  }

  async menu_list(actor) {
    await this.require(actor, 'system:menu:list');
    return this.store.query_all(
      `
            SELECT menu_id, parent_id, menu_name, menu_type, perms
            FROM sys_menu
            WHERE status = '0'
            ORDER BY parent_id, order_num, menu_id
            `,
    );
  }

  async menu_add(actor, menu_name, parent_id, menu_type, perms = '', path = '') {
    await this.require(actor, 'system:menu:add');
    const name = (menu_name || '').trim();
    if (!name || name.length > 50) this._fail('menu_name is required.', 'set --menu-name');
    if (!['M', 'C', 'F'].includes(menu_type)) {
      this._fail('menu_type must be M, C, or F.', 'M directory, C page, F button');
    }
    if (pyInt(parent_id) !== 0) {
      const parent = await this.store.query_one(
        'SELECT menu_id FROM sys_menu WHERE menu_id = %s',
        [pyInt(parent_id)],
      );
      if (parent == null) this._fail(`Unknown parent menu ${parent_id}.`, 'node-rbac menu-list');
    }
    const done = await this.store.execute(
      `
            INSERT INTO sys_menu
              (menu_name, parent_id, order_num, path, menu_type, visible, status,
               perms, create_by, create_time)
            VALUES (%s, %s, 0, %s, %s, '0', '0', %s, %s, NOW())
            `,
      [name, pyInt(parent_id), path || '', menu_type, perms || '', actor.user_name],
    );
    await this.audit.write_oper(actor, 'Menu', 1, 'menu_add', 0, '', name);
    return done.lastrowid;
  }

  async dept_list(actor) {
    await this.require(actor, 'system:dept:list');
    return this.store.query_all(
      `
            SELECT dept_id, parent_id, dept_name, ancestors, status
            FROM sys_dept
            WHERE del_flag = '0'
            ORDER BY parent_id, order_num, dept_id
            `,
    );
  }

  async dept_add(actor, dept_name, parent_id) {
    await this.require(actor, 'system:dept:add');
    const name = (dept_name || '').trim();
    if (!name || name.length > 30) this._fail('dept_name is required.', 'set --dept-name');
    let ancestors;
    if (pyInt(parent_id) === 0) {
      ancestors = '0';
    } else {
      const parent = await this.store.query_one(
        `
                SELECT dept_id, ancestors FROM sys_dept
                WHERE dept_id = %s AND del_flag = '0'
                `,
        [pyInt(parent_id)],
      );
      if (parent == null) {
        this._fail(`Unknown parent department ${parent_id}.`, 'node-rbac dept-list');
      }
      ancestors = `${parent.ancestors},${parent.dept_id}`;
    }
    const done = await this.store.execute(
      `
            INSERT INTO sys_dept
              (parent_id, ancestors, dept_name, order_num, status, del_flag,
               create_by, create_time)
            VALUES (%s, %s, %s, 0, '0', '0', %s, NOW())
            `,
      [pyInt(parent_id), ancestors, name, actor.user_name],
    );
    await this.audit.write_oper(actor, 'Department', 1, 'dept_add', 0, '', name);
    return done.lastrowid;
  }

  async post_list(actor) {
    await this.require(actor, 'system:post:list');
    return this.store.query_all(
      `
            SELECT post_id, post_code, post_name, post_sort, status
            FROM sys_post
            ORDER BY post_sort, post_id
            `,
    );
  }

  async post_add(actor, post_code, post_name) {
    await this.require(actor, 'system:post:add');
    const code = (post_code || '').trim();
    const name = (post_name || '').trim();
    if (!code || !name) this._fail('post_code and post_name are required.', 'set both');
    const existing = await this.store.query_one(
      'SELECT post_id FROM sys_post WHERE post_code = %s',
      [code],
    );
    if (existing) this._fail('That post_code is already in use.', 'pick another post_code');
    const done = await this.store.execute(
      `
            INSERT INTO sys_post
              (post_code, post_name, post_sort, status, create_by, create_time)
            VALUES (%s, %s, 0, '0', %s, NOW())
            `,
      [code, name, actor.user_name],
    );
    await this.audit.write_oper(actor, 'Post', 1, 'post_add', 0, '', code);
    return done.lastrowid;
  }

  // General Purpose: Who is signed in, without a password or a full token.
  async describe(actor) {
    const roles = await this.roles_of(actor.user_id);
    const names = roles.map((role) => role.role_key).join(', ') || '(none)';
    const admin = (await this.is_admin(actor.user_id)) ? 'yes' : 'no';
    const dept = actor.dept_id == null ? 'None' : actor.dept_id;
    return (
      `user_name=${actor.user_name}\n` +
      `nick_name=${actor.nick_name}\n` +
      `dept_id=${dept}\n` +
      `roles=${names}\n` +
      `admin=${admin}`
    );
  }
}
