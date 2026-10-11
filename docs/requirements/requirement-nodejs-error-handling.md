**file**: docs/requirements/requirement-nodejs-error-handling.md
**Status**: Active (Version 1.3.0)
**Area**: nodejs
**Key**: `requirement-nodejs-error-handling`
**Philosophy**: CIAO **v2.10.2** / CIAO-Lite (Caution • Intentional • Anti-fragile • Over-engineered / Over-protect)

## 1. Purpose

Define how NodeRbac reports a failure on the console and on the text menu. A failed sign-in, a refused permission, or a closed database tells the operator what failed and the next command. Source rows that the operator did not ask to remove stay in place.

Console sentences in this file stay required. Durable status, once the logger exists, is `requirement-nodejs-cli-logging`. ChronicleLogger is the local class in `src/NodeRbac/chronicle_logger.js`.

### 1.1 Human-facing

**In one sentence:** When a command cannot finish, NodeRbac prints the reason and the next step, and it does not print a stack trace for a mistake you can correct.

| Box | Meaning | Example |
|-----|---------|---------|
| You / this login | Person who typed a bad password or has no mysql driver | You see the reason and the next command |
| The other role | The status file | The same fact is written after `main` has constructed the logger |
| Not this file | The menu frame, and the permission table | `requirement-nodejs-tui`, `requirement-rbac` |

| Includes | Excludes |
|----------|----------|
| `ERROR:` and `   Next:` on stderr, then exit 1 | A silent success after the database refused the statement |
| The same sentence in the menu region when the board is open | A stack trace for a wrong password |
| Help text and exit 0 when argv is empty and stdout is not a terminal | Waiting on a prompt in that case |

| Surface | What you open | What for |
|---------|---------------|----------|
| A typed verb | stderr | `ERROR:` then `   Next:` |
| The text menu | The region above the box | The same reason, and the board stays open |
| Node.js older than 22 | stderr, before the logger | `Node.js 22 or newer is required.` |

## 2. Core Rules (Mandatory)

### 2.1 Fail-closed principles

1. **MUST NOT** treat a refused sign-in, a missing permission, or a failed statement as success.
2. **MUST** prefer a short sentence over a stack trace for an expected mistake.
3. **MUST NOT** print a password, a session token, or SQL text in the error or in the log.
4. **MUST** leave rows the operator did not name. A failed remove does not delete a different account.

### 2.2 Required error categories

| Category | Detection | Required action |
|----------|-----------|-----------------|
| Node.js older than 22 | `process.versions.node` major is below 22 | stderr `Node.js 22 or newer is required.` and `Next step: install Node.js 22 or newer`. Return 1 before `new ChronicleLogger(` |
| sqlite file | the file cannot be opened | `Cannot open the sqlite3 file {path}.` Next: `check that the folder is writable, or set NODERBAC_SQLITE_FILE, then node-rbac db-init` |
| mysql database | the server refuses the connection | `Cannot open the MySQL database {name}.` Next: `check NODERBAC_DB_HOST, NODERBAC_DB_USER, and NODERBAC_DB_PASSWORD, then node-rbac db-init` |
| mysql driver | `mysql2` cannot be loaded | `mysql2 is required.` Next: `npm install mysql2` |
| statement | the statement throws | `The database statement failed.` Next: `node-rbac db-init`. The log line is `database statement failed` and does not include the SQL |
| Empty argv, no terminal | stdout is not a terminal and argv is empty | Help text. Return 0. This is not a failure |
| Product mistake | Access, Settings, or Store raises | stderr `ERROR: {message}` and `   Next: {next}`. Return 1 |

### 2.3 Logging and the console

5. `Cli.report_error` prints `ERROR: {message}` and `   Next: {next}` on stderr and returns 1.
6. When the logger exists, the same call writes `{message} Next: {next}` at level `ERROR` with component `main`.
7. A quiet logger does not replace the stderr lines or the menu sentence.
8. The program **MUST NOT** wait for input when stdout is not a terminal and the verb is not the text menu.

## Under command line for normal user only

On Termux, Git Bash, Windows cmd, or the same class, failure sentences are for the normal user who started `node-rbac`. **This requirement:** do not use administrator privilege, `sudo`, or `apt` to report an error. Do not pipe a downloaded script into a shell.

## 3. Design Principles (CIAO / CIAO-Lite)

- **Caution:** A refused database call is a failure sentence, not a success.
- **Intentional:** The category table is the failure contract.
- **Anti-fragile:** The next-step line names the command that repairs the failure.
- **Over-protect:** Passwords and SQL stay out of the sentence and the log.

## 4. Protection Rule (Sacred)

**Future AI assistants, Grok, or maintainers MUST NOT**:

1. Hide a failed statement behind a success exit.
2. Print a password, a session token, or the SQL text.
3. Replace `ERROR:` and `   Next:` with a stack trace for an expected mistake.
4. Call the logger optional after `function main` has started the product.
5. Send the Node.js 22 refusal through `log_message`. That line is printed before the construct.
6. Wait on a prompt when there is no terminal.

**Violating this rule is a critical safety regression.**

## 5. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-1 | A product failure prints `ERROR:` and `   Next:` and returns 1 |
| AC-2 | sqlite, mysql, the missing driver, and a failed statement use the sentences in §2.2 |
| AC-3 | Empty argv off a terminal prints help and returns 0 |
| AC-4 | Node.js older than 22 returns 1 before the logger construct |
| AC-5 | The log file does not contain the sign-in password |

## 6. Related requirements (peer keys only)

| Key | Relationship |
|-----|----------------|
| `requirement-nodejs` | The Node.js 22 floor |
| `requirement-nodejs-cli-interface` | Verb exits |
| `requirement-nodejs-tui` | Where the sentence sits on the screen |
| `requirement-nodejs-cli-logging` | Durable status after the construct |
| `requirement-database` | Open and statement failures |
| `requirement-domain-noderbac` | Sign-in before the menu |
| `docs/requirements/index.md` | Registry |

## Design-time verification

| TP family / ID | Suite | Status | Note |
|----------------|-------|--------|------|
| **TP-ERR-01** | `tests/test_errors.js` | have | stderr `ERROR:` and `   Next:`, exit 1 |
| **TP-LOG-01** | `tests/test_logging.js` | have | `new ChronicleLogger(` in `cli.js`. A sign-in password is absent from the log |

**Matrix:** `docs/reviews/requirement-test-matrix.md`
**Map:** `docs/reviews/test-plan.md`

## 7. Status history

| Date | Status | Note |
|------|--------|------|
| 2026-08-09 | Active 1.0.0 | Initial error-handling law |
| 2026-10-04 | Active 1.2.0 | ChronicleLogger is required for durable status |
| 2026-10-11 | Active 1.3.0 | RBAC sentences. No encoder. Node.js 22 floor. npm driver line |

---

**Last Updated**: 2026-10-11
**Owner**: project maintainers
**Alignment**: Registry `docs/requirements/index.md`; **CIAO** (https://github.com/cloudgen/ciao); CIAO-Lite (https://github.com/cloudgen/ciao-lite).
