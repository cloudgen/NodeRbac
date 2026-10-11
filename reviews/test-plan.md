# NodeRbac test plan — 2026-10-11

Run `./tests/run.sh` from the repository root. The runner executes `node --test tests/*.js`. The RBAC cases use a temporary sqlite3 file. They do not open a mysql server. They do not write `ruoyi_db` or `ry`.

| ID | File | Proves |
|----|------|--------|
| TP-TUI-09 | `tests/test_tui.js` | Path label stays `Path` until a saved language. `LANG` does not select a code |
| TP-TUI-10 | `tests/test_tui.js` | Wide columns count as two. The front board rows fit |
| TP-LANG-01 | `tests/test_language.js` | Row 4, codes 41–53, mode 0600 leaf, `NODERBAC_LANG` does not write |
| TP-ABOUT | `tests/test_about.js` | Identity block, host check, star box, empty download URL |
| TP-PACK-01 | `tests/test_packaging.js` | npm name `noderbac`, version `1.0.0`, Node.js `>=22`, no `mysql2` dependency |
| TP-RBAC-01 | `tests/test_rbac.js` | Seed once, scopes, protected user and role, web cookie, CSRF, operator 403 |
| TP-WEB-01 | `tests/test_rbac.js` | Login cookie `noderbac_session`, CSRF 400, unsigned redirect |
| TP-ENV-01 | `tests/test_rbac.js` | Mode 0600 file, environment wins, non-loopback bind refused unless allowed |
| TP-DB-02 | `tests/test_rbac.js` | A domain verb seeds a database that has no tables, once |
| TP-DB-03 | `tests/test_rbac.js` | Default sqlite3 file `noderbac.sqlite3`. Enter keeps sqlite3. Choice 2 is mysql. `db-engine` does not create the file |
| TP-LOG-01 | `tests/test_rbac.js` | `function main` constructs ChronicleLogger. A sign-in secret stays out of the log |
| TP-DOC-01 | `tests/test_docs.js` | README headings, version badge `1.0.0`, absolute screenshot URLs, seed names |
| TP-BUILD-01 | `./build.sh help` | Help lists the maintainer commands, including `test` and `test-install` |
| TP-BUILD-02 | `./build.sh test` and `test-install` | An extra token exits 1 and names the command |
| TP-BUILD-03 | `./build.sh version` | Prints `NodeRbac build tool (v1.0.0)` from `src/NodeRbac/version.js` |
| TP-BUILD-04 | `./build.sh clean` | Removes `dist/` and leaves `src/NodeRbac` |

A failure that names `ruoyi_db` or `ry` means the test pointed at the wrong schema. Stop and fix the environment before repeating the write.

The live mysql seed is not in this plan. `mysql2` is not installed by `npm install`. Install it only when a host is ready to open database `noderbac_test`.
