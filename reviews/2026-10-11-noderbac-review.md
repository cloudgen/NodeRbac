# NodeRbac review — 2026-10-11

**Product:** NodeRbac 1.0.0
**Scope:** Requirements, RBAC behavior, sqlite3 default, web pages, text menu, packaging, and ChronicleLogger.
**Result:** Pass with the limits below.
**Suite:** `node --test --test-concurrency=1 tests/*.js` on 2026-10-11. 17 tests, 0 failures, about 18 seconds. The bind-fixture edit was included in a follow-up run of that case.

## What was checked

| Check | Result |
|-------|--------|
| Sole Active domain is `requirement-domain-noderbac` | Pass |
| `requirement-domain-videojoin` is Retired | Pass |
| Operator data scope 3 sees only `operator` | Pass in `tests/test_rbac.js` |
| Lead data scope 4 sees admin, clerk, and lead | Pass |
| Unknown scope 5 contributes no rows | Pass |
| User 1 cannot be removed or disabled. Role 1 is not granted | Pass |
| Web login posts to `/login`. Cookie is `noderbac_session`. CSRF mismatch is 400. Operator roles are 403 | Pass |
| Unsigned protected page redirects to `/login` | Pass |
| Non-loopback bind is refused unless `NODERBAC_ALLOW_REMOTE=yes`. Mode 0600 password file wins over a looser file | Pass |
| ChronicleLogger is constructed in `function main`. A wrong password stays out of the log | Pass |
| Menu rows 2–9, no session row, language 41–53, path label ignores `LANG` | Pass |
| Default engine is the sqlite3 file `noderbac.sqlite3`. Enter keeps that file. Choice 2 is mysql. `db-engine` does not create the file | Pass |
| `package.json` is `noderbac` 1.0.0, `engines.node` is `>=22`, and `mysql2` is not a dependency | Pass |
| README badge is 1.0.0. Screenshot URLs are absolute. The fence contains `**NodeRbac**(*1.0.0*)` | Pass |
| `ruoyi_db` and `ry` are not opened by the tests | Pass |

## Limits

- Captcha, export, import, and batch logout are not in 1.0.0.
- A live mysql connection was not opened. `mysql2` is not installed on the host that ran the suite. The engine choice is stored and tested. The seed against `noderbac_test` is not.
- `user-add` and `role-grant` use sequential statements. A crash between them can leave a partial write. The seed itself is one transaction.
- The web grant form can read menu ids for an editor who has role edit without menu list. The seeded administrator has both.
- Screenshots are captures of the running text menu at 40 rows by 110 columns. They are not a browser capture of the HTML pages.
- Row 5 is `setup` and opens parameters, dictionaries, notices, and `db-engine`. It is not an install row. Self-management is row 8.
- `./build.sh upload`, `git`, `tag`, and `release` were not run.

## Storage choices

- Passwords are PBKDF2-HMAC-SHA256, rather than bcrypt.
- Online sessions are `sys_session`, rather than Redis.
- Data scope stops at 4.
