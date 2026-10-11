// =============================================================================
// Tables and the first seed for NodeRbac.
// requirement-database — the same columns on sqlite3 and on MySQL.
// requirement-rbac — seed accounts, roles, menus, and permission strings.
// requirement-nodejs-oop — class Schema.
// =============================================================================

import { PasswordHash } from './password_hash.js';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class Schema {
  // Create the RBAC tables and seed them once when sys_user is empty.
  // This product writes its own SQL. The password column is VARCHAR(255) because
  // the hash is PBKDF2. Online sessions live in sys_session.

  static INITIAL_ADMIN_PASSWORD = 'admin123';
  static INITIAL_OPERATOR_PASSWORD = 'operator123';
  static INITIAL_LEAD_PASSWORD = 'lead123';
  static INITIAL_CLERK_PASSWORD = 'clerk123';

  static STATEMENTS = [
    `
        CREATE TABLE IF NOT EXISTS sys_dept (
          dept_id BIGINT NOT NULL AUTO_INCREMENT,
          parent_id BIGINT NOT NULL DEFAULT 0,
          ancestors VARCHAR(50) NOT NULL DEFAULT '',
          dept_name VARCHAR(30) NOT NULL DEFAULT '',
          order_num INT NOT NULL DEFAULT 0,
          leader VARCHAR(20) DEFAULT NULL,
          phone VARCHAR(11) DEFAULT NULL,
          email VARCHAR(50) DEFAULT NULL,
          status CHAR(1) NOT NULL DEFAULT '0',
          del_flag CHAR(1) NOT NULL DEFAULT '0',
          create_by VARCHAR(64) NOT NULL DEFAULT '',
          create_time DATETIME DEFAULT NULL,
          update_by VARCHAR(64) NOT NULL DEFAULT '',
          update_time DATETIME DEFAULT NULL,
          PRIMARY KEY (dept_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_user (
          user_id BIGINT NOT NULL AUTO_INCREMENT,
          dept_id BIGINT DEFAULT NULL,
          user_name VARCHAR(30) NOT NULL,
          nick_name VARCHAR(30) NOT NULL,
          user_type VARCHAR(2) NOT NULL DEFAULT '00',
          email VARCHAR(50) NOT NULL DEFAULT '',
          phonenumber VARCHAR(11) NOT NULL DEFAULT '',
          sex CHAR(1) NOT NULL DEFAULT '2',
          avatar VARCHAR(100) NOT NULL DEFAULT '',
          password VARCHAR(255) NOT NULL DEFAULT '',
          status CHAR(1) NOT NULL DEFAULT '0',
          del_flag CHAR(1) NOT NULL DEFAULT '0',
          login_ip VARCHAR(128) NOT NULL DEFAULT '',
          login_date DATETIME DEFAULT NULL,
          pwd_update_date DATETIME DEFAULT NULL,
          create_by VARCHAR(64) NOT NULL DEFAULT '',
          create_time DATETIME DEFAULT NULL,
          update_by VARCHAR(64) NOT NULL DEFAULT '',
          update_time DATETIME DEFAULT NULL,
          remark VARCHAR(500) DEFAULT NULL,
          PRIMARY KEY (user_id),
          UNIQUE KEY uk_sys_user_name (user_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_post (
          post_id BIGINT NOT NULL AUTO_INCREMENT,
          post_code VARCHAR(64) NOT NULL,
          post_name VARCHAR(50) NOT NULL,
          post_sort INT NOT NULL,
          status CHAR(1) NOT NULL DEFAULT '0',
          create_by VARCHAR(64) NOT NULL DEFAULT '',
          create_time DATETIME DEFAULT NULL,
          update_by VARCHAR(64) NOT NULL DEFAULT '',
          update_time DATETIME DEFAULT NULL,
          remark VARCHAR(500) DEFAULT NULL,
          PRIMARY KEY (post_id),
          UNIQUE KEY uk_sys_post_code (post_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_role (
          role_id BIGINT NOT NULL AUTO_INCREMENT,
          role_name VARCHAR(30) NOT NULL,
          role_key VARCHAR(100) NOT NULL,
          role_sort INT NOT NULL,
          data_scope CHAR(1) NOT NULL DEFAULT '1',
          menu_check_strictly TINYINT NOT NULL DEFAULT 1,
          dept_check_strictly TINYINT NOT NULL DEFAULT 1,
          status CHAR(1) NOT NULL,
          del_flag CHAR(1) NOT NULL DEFAULT '0',
          create_by VARCHAR(64) NOT NULL DEFAULT '',
          create_time DATETIME DEFAULT NULL,
          update_by VARCHAR(64) NOT NULL DEFAULT '',
          update_time DATETIME DEFAULT NULL,
          remark VARCHAR(500) DEFAULT NULL,
          PRIMARY KEY (role_id),
          UNIQUE KEY uk_sys_role_key (role_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_menu (
          menu_id BIGINT NOT NULL AUTO_INCREMENT,
          menu_name VARCHAR(50) NOT NULL,
          parent_id BIGINT NOT NULL DEFAULT 0,
          order_num INT NOT NULL DEFAULT 0,
          path VARCHAR(200) NOT NULL DEFAULT '',
          component VARCHAR(255) DEFAULT NULL,
          query VARCHAR(255) DEFAULT NULL,
          route_name VARCHAR(50) NOT NULL DEFAULT '',
          is_frame INT NOT NULL DEFAULT 1,
          is_cache INT NOT NULL DEFAULT 0,
          menu_type CHAR(1) NOT NULL DEFAULT '',
          visible CHAR(1) NOT NULL DEFAULT '0',
          status CHAR(1) NOT NULL DEFAULT '0',
          perms VARCHAR(100) DEFAULT NULL,
          icon VARCHAR(100) NOT NULL DEFAULT '#',
          create_by VARCHAR(64) NOT NULL DEFAULT '',
          create_time DATETIME DEFAULT NULL,
          update_by VARCHAR(64) NOT NULL DEFAULT '',
          update_time DATETIME DEFAULT NULL,
          remark VARCHAR(500) NOT NULL DEFAULT '',
          PRIMARY KEY (menu_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_user_role (
          user_id BIGINT NOT NULL,
          role_id BIGINT NOT NULL,
          PRIMARY KEY (user_id, role_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_user_post (
          user_id BIGINT NOT NULL,
          post_id BIGINT NOT NULL,
          PRIMARY KEY (user_id, post_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_role_menu (
          role_id BIGINT NOT NULL,
          menu_id BIGINT NOT NULL,
          PRIMARY KEY (role_id, menu_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_role_dept (
          role_id BIGINT NOT NULL,
          dept_id BIGINT NOT NULL,
          PRIMARY KEY (role_id, dept_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_dict_type (
          dict_id BIGINT NOT NULL AUTO_INCREMENT,
          dict_name VARCHAR(100) NOT NULL DEFAULT '',
          dict_type VARCHAR(100) NOT NULL DEFAULT '',
          status CHAR(1) NOT NULL DEFAULT '0',
          create_by VARCHAR(64) NOT NULL DEFAULT '',
          create_time DATETIME DEFAULT NULL,
          update_by VARCHAR(64) NOT NULL DEFAULT '',
          update_time DATETIME DEFAULT NULL,
          remark VARCHAR(500) DEFAULT NULL,
          PRIMARY KEY (dict_id),
          UNIQUE KEY uk_sys_dict_type (dict_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_dict_data (
          dict_code BIGINT NOT NULL AUTO_INCREMENT,
          dict_sort INT NOT NULL DEFAULT 0,
          dict_label VARCHAR(100) NOT NULL DEFAULT '',
          dict_value VARCHAR(100) NOT NULL DEFAULT '',
          dict_type VARCHAR(100) NOT NULL DEFAULT '',
          css_class VARCHAR(100) DEFAULT NULL,
          list_class VARCHAR(100) DEFAULT NULL,
          is_default CHAR(1) NOT NULL DEFAULT 'N',
          status CHAR(1) NOT NULL DEFAULT '0',
          create_by VARCHAR(64) NOT NULL DEFAULT '',
          create_time DATETIME DEFAULT NULL,
          update_by VARCHAR(64) NOT NULL DEFAULT '',
          update_time DATETIME DEFAULT NULL,
          remark VARCHAR(500) DEFAULT NULL,
          PRIMARY KEY (dict_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_config (
          config_id INT NOT NULL AUTO_INCREMENT,
          config_name VARCHAR(100) NOT NULL DEFAULT '',
          config_key VARCHAR(100) NOT NULL DEFAULT '',
          config_value VARCHAR(500) NOT NULL DEFAULT '',
          config_type CHAR(1) NOT NULL DEFAULT 'N',
          create_by VARCHAR(64) NOT NULL DEFAULT '',
          create_time DATETIME DEFAULT NULL,
          update_by VARCHAR(64) NOT NULL DEFAULT '',
          update_time DATETIME DEFAULT NULL,
          remark VARCHAR(500) DEFAULT NULL,
          PRIMARY KEY (config_id),
          UNIQUE KEY uk_sys_config_key (config_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_notice (
          notice_id INT NOT NULL AUTO_INCREMENT,
          notice_title VARCHAR(50) NOT NULL,
          notice_type CHAR(1) NOT NULL,
          notice_content TEXT,
          status CHAR(1) NOT NULL DEFAULT '0',
          create_by VARCHAR(64) NOT NULL DEFAULT '',
          create_time DATETIME DEFAULT NULL,
          update_by VARCHAR(64) NOT NULL DEFAULT '',
          update_time DATETIME DEFAULT NULL,
          remark VARCHAR(255) DEFAULT NULL,
          PRIMARY KEY (notice_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_oper_log (
          oper_id BIGINT NOT NULL AUTO_INCREMENT,
          title VARCHAR(50) NOT NULL DEFAULT '',
          business_type INT NOT NULL DEFAULT 0,
          method VARCHAR(100) NOT NULL DEFAULT '',
          request_method VARCHAR(10) NOT NULL DEFAULT '',
          operator_type INT NOT NULL DEFAULT 1,
          oper_name VARCHAR(50) NOT NULL DEFAULT '',
          dept_name VARCHAR(50) NOT NULL DEFAULT '',
          oper_url VARCHAR(255) NOT NULL DEFAULT '',
          oper_ip VARCHAR(128) NOT NULL DEFAULT '',
          oper_location VARCHAR(255) NOT NULL DEFAULT '',
          oper_param VARCHAR(2000) NOT NULL DEFAULT '',
          json_result VARCHAR(2000) NOT NULL DEFAULT '',
          status INT NOT NULL DEFAULT 0,
          error_msg VARCHAR(2000) NOT NULL DEFAULT '',
          oper_time DATETIME DEFAULT NULL,
          cost_time BIGINT NOT NULL DEFAULT 0,
          PRIMARY KEY (oper_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_logininfor (
          info_id BIGINT NOT NULL AUTO_INCREMENT,
          user_name VARCHAR(50) NOT NULL DEFAULT '',
          ipaddr VARCHAR(128) NOT NULL DEFAULT '',
          login_location VARCHAR(255) NOT NULL DEFAULT '',
          browser VARCHAR(50) NOT NULL DEFAULT '',
          os VARCHAR(50) NOT NULL DEFAULT '',
          status CHAR(1) NOT NULL DEFAULT '0',
          msg VARCHAR(255) NOT NULL DEFAULT '',
          login_time DATETIME DEFAULT NULL,
          PRIMARY KEY (info_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
    `
        CREATE TABLE IF NOT EXISTS sys_session (
          token VARCHAR(80) NOT NULL,
          user_id BIGINT NOT NULL,
          user_name VARCHAR(30) NOT NULL,
          ipaddr VARCHAR(128) NOT NULL DEFAULT '',
          user_agent VARCHAR(200) NOT NULL DEFAULT '',
          csrf VARCHAR(80) NOT NULL,
          surface VARCHAR(16) NOT NULL,
          login_time DATETIME NOT NULL,
          last_access DATETIME NOT NULL,
          PRIMARY KEY (token),
          KEY idx_sys_session_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `,
  ];

  // menu_id, name, parent, order, path, type, perms
  static MENUS = [
    [1, 'System', 0, 1, 'system', 'M', ''],
    [100, 'User', 1, 1, 'user', 'C', 'system:user:list'],
    [1001, 'User query', 100, 1, '', 'F', 'system:user:query'],
    [1002, 'User add', 100, 2, '', 'F', 'system:user:add'],
    [1003, 'User edit', 100, 3, '', 'F', 'system:user:edit'],
    [1004, 'User remove', 100, 4, '', 'F', 'system:user:remove'],
    [1005, 'Reset password', 100, 5, '', 'F', 'system:user:resetPwd'],
    [101, 'Role', 1, 2, 'role', 'C', 'system:role:list'],
    [1011, 'Role query', 101, 1, '', 'F', 'system:role:query'],
    [1012, 'Role edit', 101, 2, '', 'F', 'system:role:edit'],
    [102, 'Menu', 1, 3, 'menu', 'C', 'system:menu:list'],
    [1021, 'Menu add', 102, 1, '', 'F', 'system:menu:add'],
    [103, 'Department', 1, 4, 'dept', 'C', 'system:dept:list'],
    [1031, 'Department add', 103, 1, '', 'F', 'system:dept:add'],
    [104, 'Post', 1, 5, 'post', 'C', 'system:post:list'],
    [1041, 'Post add', 104, 1, '', 'F', 'system:post:add'],
    [2, 'Setup', 0, 2, 'setup', 'M', ''],
    [110, 'Parameter', 2, 1, 'config', 'C', 'system:config:list'],
    [1101, 'Parameter edit', 110, 1, '', 'F', 'system:config:edit'],
    [1102, 'Parameter add', 110, 2, '', 'F', 'system:config:add'],
    [111, 'Dictionary', 2, 2, 'dict', 'C', 'system:dict:list'],
    [1111, 'Dictionary add', 111, 1, '', 'F', 'system:dict:add'],
    [112, 'Notice', 2, 3, 'notice', 'C', 'system:notice:list'],
    [1121, 'Notice add', 112, 1, '', 'F', 'system:notice:add'],
    [3, 'Audit', 0, 3, 'audit', 'M', ''],
    [120, 'Operation log', 3, 1, 'operlog', 'C', 'monitor:operlog:list'],
    [121, 'Login log', 3, 2, 'logininfor', 'C', 'monitor:logininfor:list'],
    [122, 'Online', 3, 3, 'online', 'C', 'monitor:online:list'],
    [1221, 'Force logout', 122, 1, '', 'F', 'monitor:online:forceLogout'],
  ];

  static COMMON_MENUS = [1, 100, 1001, 2, 110, 112, 3, 120, 121];
  static LEAD_MENUS = [1, 100, 1001];

  constructor(store, passwords = null, logger = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message('instantiated', { component: 'Schema' });
    }
    this.store = store;
    this.passwords = passwords || new PasswordHash(logger);
  }

  // General Purpose: MySQL DDL, or the sqlite3 equivalent of those columns.
  statements() {
    let engine = 'mysql';
    const settings = this.store == null ? null : this.store.settings;
    if (settings != null) engine = settings.engine();
    if (engine === 'sqlite3') {
      return this.constructor.STATEMENTS.map((item) => Schema.sqlite_statement(item));
    }
    return this.constructor.STATEMENTS;
  }

  // General Purpose: One CREATE TABLE that sqlite3 accepts. No foreign key.
  static sqlite_statement(sql) {
    let text = String(sql).trim().split(/\s+/).join(' ');
    if (String(sql).trim() === '') text = '';
    text = text.replaceAll(' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4', '');
    text = text.replace(
      /\b(BIGINT|INT)\s+NOT NULL\s+AUTO_INCREMENT/g,
      'INTEGER PRIMARY KEY AUTOINCREMENT',
    );
    text = text.replace(/UNIQUE KEY \w+ \(([^)]+)\)/g, 'UNIQUE ($1)');
    text = text.replace(/,\s*KEY \w+ \([^)]+\)/g, '');
    const names = [];
    for (const match of text.matchAll(/(\w+)\s+INTEGER PRIMARY KEY AUTOINCREMENT/g)) {
      names.push(match[1]);
    }
    for (const name of names) {
      text = text.replace(new RegExp(`,\\s*PRIMARY KEY \\(${escapeRegExp(name)}\\)`, 'g'), '');
    }
    text = text.replace(/,\s*\)/g, ')');
    return text;
  }

  // General Purpose: Create tables. Seed only when no user row exists.
  async ensure() {
    for (const statement of this.statements()) {
      await this.store.execute(statement);
    }
    const row = await this.store.query_one('SELECT COUNT(*) AS n FROM sys_user');
    const count = row == null ? 0 : Number(row.n);
    if (count) return 'present';
    await this._seed();
    return 'seeded';
  }

  async _seed() {
    const passwords = this.passwords;
    const adminHash = passwords.hash(this.constructor.INITIAL_ADMIN_PASSWORD);
    const operatorHash = passwords.hash(this.constructor.INITIAL_OPERATOR_PASSWORD);
    const leadHash = passwords.hash(this.constructor.INITIAL_LEAD_PASSWORD);
    const clerkHash = passwords.hash(this.constructor.INITIAL_CLERK_PASSWORD);
    const menus = this.constructor.MENUS;
    const commonMenus = this.constructor.COMMON_MENUS;
    const leadMenus = this.constructor.LEAD_MENUS;

    const work = async (run) => {
      const now = (await run('SELECT NOW() AS t')).rows[0].t;
      const depts = [
        [100, 0, '0', 'Group', 0],
        [101, 100, '0,100', 'Engineering', 1],
        [102, 100, '0,100', 'Operations', 2],
        [103, 101, '0,100,101', 'Platform', 3],
      ];
      for (const item of depts) {
        await run(
          `
                    INSERT INTO sys_dept
                      (dept_id, parent_id, ancestors, dept_name, order_num,
                       status, del_flag, create_by, create_time)
                    VALUES (%s, %s, %s, %s, %s, '0', '0', 'schema', %s)
                    `,
          [item[0], item[1], item[2], item[3], item[4], now],
        );
      }
      const users = [
        [1, 101, 'admin', 'Administrator', adminHash],
        [2, 102, 'operator', 'Operator', operatorHash],
        [3, 103, 'clerk', 'Clerk', clerkHash],
        [4, 101, 'lead', 'Lead', leadHash],
      ];
      for (const item of users) {
        await run(
          `
                    INSERT INTO sys_user
                      (user_id, dept_id, user_name, nick_name, user_type, password,
                       status, del_flag, create_by, create_time, pwd_update_date)
                    VALUES (%s, %s, %s, %s, '00', %s, '0', '0', 'schema', %s, %s)
                    `,
          [item[0], item[1], item[2], item[3], item[4], now, now],
        );
      }
      const posts = [
        [1, 'ceo', 'Chief', 1],
        [2, 'se', 'Engineer', 2],
        [3, 'hr', 'People', 3],
        [4, 'user', 'Staff', 4],
      ];
      for (const item of posts) {
        await run(
          `
                    INSERT INTO sys_post
                      (post_id, post_code, post_name, post_sort, status, create_by, create_time)
                    VALUES (%s, %s, %s, %s, '0', 'schema', %s)
                    `,
          [item[0], item[1], item[2], item[3], now],
        );
      }
      const roles = [
        [1, 'Super administrator', 'admin', 1, '1', 'super administrator'],
        [2, 'Common', 'common', 2, '3', 'this department'],
        [3, 'Lead', 'lead', 3, '4', 'this department and children'],
      ];
      for (const item of roles) {
        await run(
          `
                    INSERT INTO sys_role
                      (role_id, role_name, role_key, role_sort, data_scope,
                       menu_check_strictly, dept_check_strictly, status, del_flag,
                       create_by, create_time, remark)
                    VALUES (%s, %s, %s, %s, %s, 1, 1, '0', '0', 'schema', %s, %s)
                    `,
          [item[0], item[1], item[2], item[3], item[4], now, item[5]],
        );
      }
      for (const menu of menus) {
        await run(
          `
                    INSERT INTO sys_menu
                      (menu_id, menu_name, parent_id, order_num, path, menu_type,
                       visible, status, perms, create_by, create_time)
                    VALUES (%s, %s, %s, %s, %s, %s, '0', '0', %s, 'schema', %s)
                    `,
          [menu[0], menu[1], menu[2], menu[3], menu[4], menu[5], menu[6], now],
        );
      }
      const links = [[1, 1], [2, 2], [3, 2], [4, 3]];
      for (const [userId, roleId] of links) {
        await run(
          'INSERT INTO sys_user_role (user_id, role_id) VALUES (%s, %s)',
          [userId, roleId],
        );
      }
      for (const menu of menus) {
        await run(
          'INSERT INTO sys_role_menu (role_id, menu_id) VALUES (1, %s)',
          [menu[0]],
        );
      }
      for (const menuId of commonMenus) {
        await run(
          'INSERT INTO sys_role_menu (role_id, menu_id) VALUES (2, %s)',
          [menuId],
        );
      }
      for (const menuId of leadMenus) {
        await run(
          'INSERT INTO sys_role_menu (role_id, menu_id) VALUES (3, %s)',
          [menuId],
        );
      }
      const configs = [
        [1, 'Skin name', 'sys.index.skinName', 'skin-blue', 'Y'],
        [2, 'Initial password', 'sys.user.initPassword', '123456', 'Y'],
        [3, 'Captcha', 'sys.account.captchaEnabled', 'false', 'Y'],
        [4, 'Registration', 'sys.account.registerUser', 'false', 'Y'],
      ];
      for (const item of configs) {
        await run(
          `
                    INSERT INTO sys_config
                      (config_id, config_name, config_key, config_value, config_type,
                       create_by, create_time)
                    VALUES (%s, %s, %s, %s, %s, 'schema', %s)
                    `,
          [item[0], item[1], item[2], item[3], item[4], now],
        );
      }
      const types = [
        [1, 'User sex', 'sys_user_sex'],
        [2, 'Normal or disabled', 'sys_normal_disable'],
        [3, 'Notice type', 'sys_notice_type'],
      ];
      for (const item of types) {
        await run(
          `
                    INSERT INTO sys_dict_type
                      (dict_id, dict_name, dict_type, status, create_by, create_time)
                    VALUES (%s, %s, %s, '0', 'schema', %s)
                    `,
          [item[0], item[1], item[2], now],
        );
      }
      const dataRows = [
        [1, 1, 'Male', '0', 'sys_user_sex', 'Y'],
        [2, 2, 'Female', '1', 'sys_user_sex', 'N'],
        [3, 3, 'Unknown', '2', 'sys_user_sex', 'N'],
        [4, 1, 'Normal', '0', 'sys_normal_disable', 'Y'],
        [5, 2, 'Disabled', '1', 'sys_normal_disable', 'N'],
        [6, 1, 'Notice', '1', 'sys_notice_type', 'Y'],
        [7, 2, 'Announcement', '2', 'sys_notice_type', 'N'],
      ];
      for (const item of dataRows) {
        await run(
          `
                    INSERT INTO sys_dict_data
                      (dict_code, dict_sort, dict_label, dict_value, dict_type,
                       is_default, status, create_by, create_time)
                    VALUES (%s, %s, %s, %s, %s, %s, '0', 'schema', %s)
                    `,
          [item[0], item[1], item[2], item[3], item[4], item[5], now],
        );
      }
      await run(
        `
                INSERT INTO sys_notice
                  (notice_id, notice_title, notice_type, notice_content, status,
                   create_by, create_time)
                VALUES (1, 'Welcome', '2', 'NodeRbac is ready.', '0', 'schema', %s)
                `,
        [now],
      );
      return null;
    };

    await this.store.transaction(work);
    if (this.logger != null) {
      this.logger.log_message('seeded rbac tables', { component: 'Schema' });
    }
  }
}
