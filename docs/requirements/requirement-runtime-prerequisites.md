**file**: docs/requirements/requirement-runtime-prerequisites.md
**Status**: Active (Version 1.4.0)
**Area**: runtime
**Key**: `requirement-runtime-prerequisites`
**Philosophy**: CIAO **v2.10.2** / CIAO-Lite (Caution • Intentional • Anti-fragile • Over-engineered / Over-protect)

## 1. Purpose

NodeRbac needs Node.js 22 or newer (`requirement-nodejs`) and the status logger constructed in `function main`. sqlite3 comes with that Node.js and is the default database. mysql also needs the `mysql2` package and a MariaDB or MySQL server that already has the `noderbac` schema and account. The program does not install those with root and does not call sudo.

### 1.1 Human-facing

**In one sentence:** Install Node.js, then this package with npm. sqlite3 needs no extra server. mysql still needs MariaDB or MySQL that you provide, plus `npm install mysql2`.

| Box | Meaning | Example |
|-----|---------|---------|
| You / this login | The operator | MariaDB is already running |
| The other role | npm | Installs this package, and mysql2 when you choose mysql |
| Not this file | The table list | `requirement-database` |

## 2. Normative rules

1. **Runtime.** Missing Node.js 22 **MUST** exit 1 with the next-step sentence in `requirement-nodejs`.
2. **Logger.** `function main` **MUST** construct `ChronicleLogger` as `requirement-nodejs-cli-logging` says. The log **MUST NOT** contain a password.
3. **Driver.** sqlite3 **MUST** use `node:sqlite`. Missing `mysql2` on a mysql connection **MUST** tell the operator to run `npm install mysql2`.
4. **Server.** The program **MUST NOT** install MariaDB, Node.js, or sqlite, create a system user, or call sudo. A connection failure **MUST** name the settings to check and `node-rbac db-init`. sqlite3 **MUST** name the file. mysql **MUST** name the host, user, and password settings.
5. **No encoder.** FFmpeg is not a prerequisite. Python is not a prerequisite.

## Terminologies

| Term | Meaning in this file |
|------|----------------------|
| Prerequisite | Something the operator provides before a verb can succeed |
| Next step | The sentence that names the install or the setting to fix |

## 7. Status history

| Date | Status | Note |
|------|--------|------|
| 2026-10-11 | Active 1.3.0 | sqlite3 is the default and needs no separate server |
| 2026-10-11 | Active 1.4.0 | Node.js 22 and `node:sqlite`. mysql uses `mysql2`. Python is not required |

---

**Last Updated**: 2026-10-11
**Owner**: project maintainers
**Alignment**: Registry `docs/requirements/index.md`; **CIAO** (https://github.com/cloudgen/ciao); CIAO-Lite (https://github.com/cloudgen/ciao-lite).
