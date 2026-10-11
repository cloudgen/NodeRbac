**file**: docs/requirements/requirement-nodejs.md
**Status**: Active (Version 1.0.0)
**Area**: nodejs
**Key**: `requirement-nodejs`
**Philosophy**: CIAO **v2.10.2** / CIAO-Lite (Caution • Intentional • Anti-fragile • Over-engineered / Over-protect)

## 1. Purpose

Node.js is an independent requirement of NodeRbac. The program runs on the `node` binary. It does not need Python, pip, or a CPython package. This file owns the runtime floor. It does not own the menu, the verbs, the tables, or the about-page lines.

### 1.1 Human-facing

**In one sentence:** Install Node.js 22 or newer, then run `node-rbac`. sqlite3 is built into that Node.js. mysql still needs the `mysql2` package and a database server you provide.

| Box | Meaning | Example |
|-----|---------|---------|
| You / this login | The operator | `node -v` prints v22 or newer |
| The other role | npm | Installs this package and, when you choose mysql, `mysql2` |
| Not this file | The permission table and the menu rows | `requirement-rbac`, `requirement-nodejs-tui` |

| Includes | Excludes |
|----------|----------|
| The Node.js major version, the `node` binary, and npm as the package tool | A Python interpreter, pip, or setuptools |
| `node:sqlite` as the default database client | Installing MariaDB or MySQL for the operator |

## 2. Normative rules

1. **Floor.** The process **MUST** run on Node.js 22 or newer. `function main` **MUST** read `process.versions.node`. When the major number is below 22, it **MUST** write `Node.js 22 or newer is required. Next step: install Node.js 22 or newer` to stderr and return 1. It **MUST** do that before it constructs `ChronicleLogger`.
2. **Independent.** This requirement stays Active even if a language-track file such as `requirement-nodejs-coding-style` changes. Those files own how the source is written. This file owns the runtime the operator installs.
3. **No Python.** The product **MUST NOT** invoke `python`, `python3`, `pip`, `pyenv`, or `conda`.
4. **sqlite.** The default engine **MUST** use the built-in `node:sqlite` module. The product **MUST NOT** require a native sqlite addon for that engine.
5. **mysql.** When the engine is mysql, a missing `mysql2` module **MUST** tell the operator `npm install mysql2`. The program **MUST NOT** install Node.js, npm, or a database server, and it **MUST NOT** call sudo.
6. **Package tool.** npm is the only package tool. The npm package name is `noderbac`. The console script is `node-rbac`.

## 3. Acceptance checks

| ID | Check |
|----|-------|
| AC-1 | Node.js older than 22 exits 1 with the sentence in rule 1 |
| AC-2 | The default engine opens `node:sqlite` and does not import `mysql2` |
| AC-3 | Source and the user document do not require Python |

## Terminologies

| Term | Meaning in this file |
|------|----------------------|
| Node.js floor | Major version 22 or newer |
| Independent requirement | This file. It is not a renamed copy of a Python coding rule |

## 7. Status history

| Date | Status | Note |
|------|--------|------|
| 2026-10-11 | Active 1.0.0 | Node.js 22 is required on its own. Python is not a runtime |

---

**Last Updated**: 2026-10-11
**Owner**: project maintainers
**Alignment**: Registry `docs/requirements/index.md`; **CIAO** (https://github.com/cloudgen/ciao); CIAO-Lite (https://github.com/cloudgen/ciao-lite).
