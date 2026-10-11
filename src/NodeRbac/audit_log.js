// =============================================================================
// Login log, operation log, and online sessions.
// requirement-rbac — audit rows and online users.
// requirement-nodejs-cli-logging — the status logger is separate from these tables.
// requirement-nodejs-oop — class AuditLog.
// =============================================================================

function pyInt(value) {
  if (typeof value === 'boolean' || value == null) {
    throw new TypeError('int');
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('int');
    return Math.trunc(value);
  }
  if (typeof value === 'bigint') return Number(value);
  const text = String(value).trim();
  if (!/^[+-]?\d+$/.test(text)) throw new TypeError(`invalid literal for int(): ${text}`);
  return Number(text);
}

export class AuditLog {
  // Rows in sys_logininfor, sys_oper_log, and sys_session.
  // Passwords are never written into these rows.

  constructor(store, logger = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message('instantiated', { component: 'AuditLog' });
    }
    this.store = store;
  }

  // General Purpose: One login attempt. status 0 succeeded. status 1 failed.
  async write_login(user_name, ipaddr, status, message, browser = 'node-rbac', os_name = '') {
    await this.store.execute(
      `
            INSERT INTO sys_logininfor
              (user_name, ipaddr, browser, os, status, msg, login_time)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            `,
      [
        user_name || '',
        ipaddr || '',
        browser || '',
        os_name || '',
        status,
        message || '',
      ],
    );
  }

  // General Purpose: One mutation. business_type 1 add, 2 edit, 3 remove.
  async write_oper(actor, title, business_type, method, status = 0, error_msg = '', param = '') {
    let name = '';
    let dept = '';
    if (actor) {
      name = actor.user_name || '';
      dept = actor.dept_name || '';
    }
    await this.store.execute(
      `
            INSERT INTO sys_oper_log
              (title, business_type, method, request_method, operator_type,
               oper_name, dept_name, oper_param, status, error_msg, oper_time)
            VALUES (%s, %s, %s, 'CALL', 1, %s, %s, %s, %s, %s, NOW())
            `,
      [
        title,
        pyInt(business_type),
        method,
        name,
        dept,
        (param || '').slice(0, 2000),
        pyInt(status),
        (error_msg || '').slice(0, 2000),
      ],
    );
    if (this.logger != null) {
      this.logger.log_message(
        `${title} ${method} by ${name || 'unknown'}`,
        { component: 'AuditLog' },
      );
    }
  }

  // General Purpose: Newest login rows.
  async login_rows(limit = 100) {
    return this.store.query_all(
      `
            SELECT info_id, user_name, ipaddr, status, msg, login_time
            FROM sys_logininfor
            ORDER BY info_id DESC
            LIMIT %s
            `,
      [pyInt(limit)],
    );
  }

  // General Purpose: Newest operation rows.
  async oper_rows(limit = 100) {
    return this.store.query_all(
      `
            SELECT oper_id, title, business_type, method, oper_name, status, oper_time
            FROM sys_oper_log
            ORDER BY oper_id DESC
            LIMIT %s
            `,
      [pyInt(limit)],
    );
  }

  // General Purpose: Remember one signed-in session.
  async open_session(token, user, ipaddr, user_agent, csrf, surface) {
    await this.store.execute(
      `
            INSERT INTO sys_session
              (token, user_id, user_name, ipaddr, user_agent, csrf, surface,
               login_time, last_access)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            `,
      [
        token,
        user.user_id,
        user.user_name,
        ipaddr || '',
        (user_agent || '').slice(0, 200),
        csrf,
        surface,
      ],
    );
  }

  // General Purpose: Move last_access forward.
  async touch(token) {
    await this.store.execute(
      'UPDATE sys_session SET last_access = NOW() WHERE token = %s',
      [token],
    );
  }

  // General Purpose: One session, or null.
  async session_row(token) {
    if (!token) return null;
    return this.store.query_one(
      `
            SELECT token, user_id, user_name, ipaddr, user_agent, csrf, surface,
                   login_time, last_access
            FROM sys_session
            WHERE token = %s
            `,
      [token],
    );
  }

  // General Purpose: Every current session.
  async online_rows() {
    return this.store.query_all(
      `
            SELECT token, user_id, user_name, ipaddr, surface, login_time, last_access
            FROM sys_session
            ORDER BY last_access DESC
            `,
    );
  }

  // General Purpose: Remove one session. Returns how many rows changed.
  async drop_session(token) {
    const done = await this.store.execute(
      'DELETE FROM sys_session WHERE token = %s',
      [token],
    );
    return Number(done.rowcount || 0);
  }
}
