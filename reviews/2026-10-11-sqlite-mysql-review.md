# NodeRbac review — sqlite3 and mysql — 2026-10-11

**Product:** NodeRbac 1.0.0
**Scope:** Database engine choice on the command, the text menu, and the local web site. Default data file `noderbac.sqlite3`. mysql remains a stored choice.
**Result:** Pass for sqlite3 and for the stored mysql choice. The live mysql seed was not run.
**Suite:** `tests/test_rbac.js` case `sqlite3 is the default file and mysql is choice 2`, inside the 17-test run on 2026-10-11.

## What was checked

| Check | Result |
|-------|--------|
| Empty `NODERBAC_DB_ENGINE` is sqlite3. The file name ends with `noderbac.sqlite3` | Pass |
| Choice `1` or `sqlite3` stores `NODERBAC_DB_ENGINE=sqlite3` at mode 0600 and does not create the data file | Pass |
| Choice `2` or `mysql` stores mysql. A set environment value wins. Empty Enter on a mysql environment keeps mysql | Pass |
| `node-rbac db-engine` with no `--engine` and no terminal prints both choices and does not create the data file | Pass |
| First `db-init` on sqlite reports `seeded` and the line contains `noderbac.sqlite3` | Pass |
| Scope behavior passes on sqlite | Pass in the seed test |
| Setup row 78 is `db-engine` / `sqlite3 file or mysql` | Pass on the captured menu |
| `db-engine` does not open the database | Pass. The sqlite file is still absent after the command |
| mysql database `noderbac_test` | Not run. `mysql2` is not a package dependency and was not installed for this review |
| Output does not contain `ruoyi_db` or `ry` | Pass |

## How the choice is stored

Resolution stays environment, then the mode-0600 file `database`, then the default. The password has no default and is required only for mysql. `db-engine` does not call `ensure_database`.

A terminal with no arguments does not ask for the engine. It uses sqlite3 and the default file, creates missing tables, then asks for an account and a password.

Enter on `db-engine` and on setup row 78 selects sqlite3 and that file. Choice 2 selects mysql.

The sign-in page can post an engine with the account form. A different engine from a non-loopback address is refused.
