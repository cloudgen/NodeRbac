**file**: docs/requirements/requirement-nodejs-cli-logging.md
**Status**: Active (Version 1.0.0)
**Area**: nodejs
**Key**: `requirement-nodejs-cli-logging`
**Philosophy**: CIAO **v2.10.2** / CIAO-Lite (Caution • Intentional • Anti-fragile • Over-engineered / Over-protect)

## 1. Purpose

`function main` instantiates `ChronicleLogger`. The instantiation is the statement `new ChronicleLogger(` written in that function, before the argument parser and before any product object. The class lives in `src/NodeRbac/chronicle_logger.js`. Node.js does not load the Python ChronicleLogger package. A Node.js older than 22 **MUST** exit 1 with the sentence in `requirement-nodejs` before that construct. The log **MUST NOT** contain a password or the process argument list.

### 1.1 Human-facing

**In one sentence:** `function main` writes `new ChronicleLogger(`, NodeRbac keeps a status file through that object, and those lines stay off the text menu.

| Box | Meaning | Example |
|-----|---------|---------|
| You / this login | Person running `node-rbac` | A failed sign-in is explained on the console, and the password is not in the log file |
| The other role | The status logger | `new ChronicleLogger({ logname: 'NodeRbac' })` |
| Not this file | How the menu is drawn | `requirement-nodejs-tui` |

## 2. Normative rules

1. **Construct.** `function main` **MUST** construct one `ChronicleLogger` with `new ChronicleLogger(`. The `logname` **MUST** be `NodeRbac`. Helpers receive that instance. The package **MUST NOT** construct it at import time and **MUST NOT** re-export it.
2. **Read-back.** Immediately after construct, `main` **MUST** call `logName()`, `baseDir()`, and `logDir()` before the first `log_message`.
3. **Debug.** `isDebug()` is true only when `DEBUG` or `NODERBAC_DEBUG` was `1`, `true`, `yes`, or `show` before construct. Product code **MUST** ask `logger.isDebug()` and **MUST NOT** add a `--debug` flag. When debug is on, `main` logs four lines with component `main`: the name, version, and file; `Using` plus `ChronicleLogger.class_version()`; the base directory; and `debug mode`.
4. **Quiet.** When this run will open the text screen, `main` **MUST** pass `is_quiet: true`. Empty argv on a terminal and `about` on a terminal open that screen. A quiet run **MUST NOT** print INFO lines on the console. ERROR lines that the product prints still use stderr through `report_error`.
5. **Passwords.** `log_message` **MUST NOT** write a message that contains `password` in any letter case. Product code **MUST NOT** pass a password, a database password, or `process.argv` into the logger.
6. **File.** The status file lives under the log directory the logger resolves, mode `0700` on the directory. The file is not `sys_oper_log`.
7. **Components.** `instantiated` uses the class name as `component`. Allowed components include `main`, `Cli`, `Desk`, `Store`, `Access`, `WebApp`, and `Tui`.

## 3. Acceptance checks

| ID | Check |
|----|-------|
| TP-LOG-01 | `cli.js` contains `new ChronicleLogger(`. A sign-in password is absent from the log file |

## 7. Status history

| Date | Status | Note |
|------|--------|------|
| 2026-10-11 | Active 1.0.0 | Local `ChronicleLogger` constructed in `function main`. No passwords |

---

**Last Updated**: 2026-10-11
**Owner**: project maintainers
**Alignment**: Registry `docs/requirements/index.md`; **CIAO** (https://github.com/cloudgen/ciao); CIAO-Lite (https://github.com/cloudgen/ciao-lite).
