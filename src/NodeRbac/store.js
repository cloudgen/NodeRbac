// =============================================================================
// Database access for NodeRbac.
// requirement-database — sqlite3 or MySQL, one connection per call, parameters only.
// requirement-nodejs-oop — class Store and StoreError.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export class StoreError extends Error {
  constructor(message, nxt, logger = null) {
    super(message);
    this.name = 'StoreError';
    this.nxt = nxt;
    if (logger) logger.log_message('instantiated', { component: 'StoreError' });
  }

  toString() {
    return this.message;
  }
}

function errorText(exc) {
  if (exc instanceof Error) return exc.message;
  return String(exc);
}

function asInt(value) {
  if (typeof value === 'bigint') return Number(value);
  if (value == null || value === '') return 0;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function bindArgs(args) {
  if (args == null) return [];
  const list = Array.isArray(args) ? args : Array.from(args);
  return list.map((item) => (item === undefined ? null : item));
}

function plainRows(rows) {
  return rows.map((row) => Object.assign({}, row));
}

function parentDir(filePath) {
  const folder = path.dirname(filePath);
  if (!folder || folder === '.') return '';
  return folder;
}

export class Store {
  // Short connections. Callers pass parameters. This class does not build SQL from names.
  // sqlite3 is the default. mysql keeps the mysql2 statements. The sqlite3
  // path rewrites placeholders, NOW(), and FIND_IN_SET. It does not log SQL.

  constructor(settings, logger = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message('instantiated', { component: 'Store' });
    }
    this.settings = settings;
  }

  // General Purpose: One new connection. The caller closes it.
  async connect() {
    let engine;
    try {
      engine = this.settings.engine();
    } catch (exc) {
      const nxt = exc && exc.nxt ? exc.nxt : 'node-rbac db-engine';
      throw new StoreError(errorText(exc), nxt, this.logger);
    }
    if (engine === 'sqlite3') return this._connect_sqlite();
    return this._connect_mysql();
  }

  _connect_sqlite() {
    let filePath;
    try {
      filePath = this.settings.sqlite_path();
    } catch (exc) {
      const nxt = exc && exc.nxt ? exc.nxt : 'export NODERBAC_HOME';
      throw new StoreError(errorText(exc), nxt, this.logger);
    }
    const folder = parentDir(filePath);
    let db = null;
    try {
      if (folder) {
        fs.mkdirSync(folder, { recursive: true, mode: 0o700 });
        fs.chmodSync(folder, 0o700);
      }
      db = new DatabaseSync(filePath, {
        timeout: 5000,
        enableForeignKeyConstraints: false,
      });
      db.exec('PRAGMA foreign_keys = OFF');
      fs.chmodSync(filePath, 0o600);
    } catch (exc) {
      if (exc instanceof StoreError) throw exc;
      if (db) {
        try { db.close(); } catch { /* the open already failed */ }
      }
      if (this.logger != null) {
        this.logger.log_message('database open failed', {
          level: 'ERROR',
          component: 'Store',
        });
      }
      throw new StoreError(
        `Cannot open the sqlite3 file ${filePath}.`,
        'check that the folder is writable, or set NODERBAC_SQLITE_FILE, then node-rbac db-init',
        this.logger,
      );
    }
    return { engine: 'sqlite3', db };
  }

  async _connect_mysql() {
    let mysql;
    try {
      const loaded = await import('mysql2/promise');
      mysql = typeof loaded.createConnection === 'function' ? loaded : loaded.default;
    } catch (exc) {
      if (exc && (exc.code === 'ERR_MODULE_NOT_FOUND' || exc.code === 'MODULE_NOT_FOUND')) {
        throw new StoreError('mysql2 is required.', 'npm install mysql2', this.logger);
      }
      throw exc;
    }
    let cfg;
    try {
      cfg = this.settings.database();
    } catch (exc) {
      const nxt = exc && exc.nxt ? exc.nxt : 'check NODERBAC_DB_PASSWORD';
      throw new StoreError(errorText(exc), nxt, this.logger);
    }
    try {
      const db = await mysql.createConnection({
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
        charset: 'utf8mb4',
        dateStrings: true,
      });
      return { engine: 'mysql', db };
    } catch {
      if (this.logger != null) {
        this.logger.log_message('database open failed', {
          level: 'ERROR',
          component: 'Store',
        });
      }
      throw new StoreError(
        `Cannot open the MySQL database ${cfg.database}.`,
        'check NODERBAC_DB_HOST, NODERBAC_DB_USER, and NODERBAC_DB_PASSWORD, then node-rbac db-init',
        this.logger,
      );
    }
  }

  // sqlite3 uses ?, datetime('now','localtime'), and instr. mysql stays as written.
  // mysql2 binds ? at execute time. Callers keep %s.
  _sql(sql) {
    if (this.settings.engine() !== 'sqlite3') return sql;
    let text = String(sql).replaceAll('%s', '?');
    text = text.replace(/\bNOW\(\)/gi, "datetime('now','localtime')");
    text = text.replace(
      /FIND_IN_SET\(\s*\?\s*,\s*([A-Za-z0-9_.]+)\s*\)/gi,
      "(instr(',' || $1 || ',', ',' || ? || ',') > 0)",
    );
    return text;
  }

  async _execute(connection, sql, args, fetch) {
    const params = bindArgs(args);
    if (connection.engine === 'sqlite3') {
      const text = this._sql(sql);
      const stmt = connection.db.prepare(text);
      const returnsRows = stmt.columns().length > 0;
      if (returnsRows) {
        const raw = params.length === 0 ? stmt.all() : stmt.all(...params);
        const rows = plainRows(raw);
        return {
          rows: fetch ? rows : [],
          lastrowid: 0,
          rowcount: fetch ? rows.length : -1,
        };
      }
      const info = params.length === 0 ? stmt.run() : stmt.run(...params);
      return {
        rows: [],
        lastrowid: asInt(info.lastInsertRowid),
        rowcount: asInt(info.changes),
      };
    }
    const text = String(sql).replaceAll('%s', '?');
    const [result] = await connection.db.query(text, params);
    if (Array.isArray(result)) {
      const rows = plainRows(result);
      return {
        rows: fetch ? rows : [],
        lastrowid: 0,
        rowcount: fetch ? rows.length : -1,
      };
    }
    return {
      rows: [],
      lastrowid: asInt(result.insertId),
      rowcount: asInt(result.affectedRows),
    };
  }

  async _begin(connection) {
    if (connection.engine === 'sqlite3') {
      connection.db.exec('BEGIN');
      return;
    }
    await connection.db.beginTransaction();
  }

  async _commit(connection) {
    if (connection.engine === 'sqlite3') {
      connection.db.exec('COMMIT');
      return;
    }
    await connection.db.commit();
  }

  async _rollback(connection) {
    if (connection.engine === 'sqlite3') {
      connection.db.exec('ROLLBACK');
      return;
    }
    await connection.db.rollback();
  }

  async _close(connection) {
    if (connection == null || connection.db == null) return;
    if (connection.engine === 'sqlite3') {
      connection.db.close();
      return;
    }
    await connection.db.end();
  }

  async _run(sql, args, fetch) {
    const connection = await this.connect();
    try {
      await this._begin(connection);
      const done = await this._execute(connection, sql, args, fetch);
      await this._commit(connection);
      return done;
    } catch (exc) {
      if (!(exc instanceof StoreError)) {
        try {
          await this._rollback(connection);
        } catch {
          // Rollback is best-effort after a failed statement.
        }
        if (this.logger != null) {
          this.logger.log_message('database statement failed', {
            level: 'ERROR',
            component: 'Store',
          });
        }
        const failure = new StoreError(
          'The database statement failed.',
          'node-rbac db-init',
          this.logger,
        );
        failure.cause = exc;
        throw failure;
      }
      throw exc;
    } finally {
      await this._close(connection);
    }
  }

  // General Purpose: Every row from one parameterized statement.
  async query_all(sql, args = []) {
    return (await this._run(sql, args, true)).rows;
  }

  // General Purpose: The first row, or null.
  async query_one(sql, args = []) {
    const rows = await this.query_all(sql, args);
    if (!rows || rows.length === 0) return null;
    return rows[0];
  }

  // General Purpose: One write statement. Returns lastrowid and rowcount.
  async execute(sql, args = []) {
    return this._run(sql, args, false);
  }

  // General Purpose: Several statements. work(run) sees one connection. Commit is once.
  async transaction(work) {
    const connection = await this.connect();
    const run = async (sql, args = []) => this._execute(connection, sql, args, true);
    try {
      await this._begin(connection);
      const result = await work(run);
      await this._commit(connection);
      return result;
    } catch (exc) {
      try {
        await this._rollback(connection);
      } catch {
        // Rollback is best-effort after a failed transaction.
      }
      if (exc instanceof StoreError) throw exc;
      if (this.logger != null) {
        this.logger.log_message('database transaction failed', {
          level: 'ERROR',
          component: 'Store',
        });
      }
      const failure = new StoreError(
        'The database transaction failed.',
        'node-rbac db-init',
        this.logger,
      );
      failure.cause = exc;
      throw failure;
    } finally {
      await this._close(connection);
    }
  }
}
