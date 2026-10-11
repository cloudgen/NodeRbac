# CHANGELOG

All notable changes to **NodeRbac** are documented here.
Version SSOT: `package.json` and `src/NodeRbac/version.js`.

## [1.0.0] - 2026-10-11

### Added

- Online role-based access control and centralized configuration for the text menu, typed verbs, and a local web page.
- Node.js 22 or newer. The console script is `node-rbac`. The npm package name is `noderbac`.
- sqlite3 file `~/.local/NodeRbac/noderbac.sqlite3` through `node:sqlite`. mysql through optional `mysql2` when `NODERBAC_DB_ENGINE=mysql`. The mysql database name is `noderbac`.
- Data scope 1–4. Sessions in `sys_session`. Passwords as PBKDF2-HMAC-SHA256.
- Environment names `NODERBAC_DB_*`, `NODERBAC_BIND`, `NODERBAC_PORT`, `NODERBAC_ALLOW_REMOTE`, `NODERBAC_LANG`, and `NODERBAC_HOME`.
- ChronicleLogger in `src/NodeRbac/chronicle_logger.js`, constructed in `function main`.
- A terminal with no arguments uses the sqlite3 default file, asks for the account and the password, and opens the menu. It does not ask for the engine or the file path.
- Enter on `node-rbac db-engine` and on setup row 78 selects sqlite3 and that default file. Choice 2 is mysql. `db-engine` does not open the database.
- Front rows 2–9: access, system-log, language, setup, audit, serve, self-management, and Exit. There is no session row.
- The about page domain line is `Online RBAC and centralized configuration`.
