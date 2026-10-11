**file**: docs/requirements/requirement-nodejs-coding-style.md
**Status**: Active (Version 1.0.0)
**Area**: nodejs
**Key**: `requirement-nodejs-coding-style`
**Philosophy**: CIAO **v2.10.2** / CIAO-Lite (Caution • Intentional • Anti-fragile • Over-engineered / Over-protect)

## 1. Purpose

Define Node.js coding style for NodeRbac. Each behavior lives on the class the class map names. Store calls are async. A finished file that must move across mounts is copied and then removed, not left as a bare rename that fails on a different mount.

### 1.1 Human-facing

**In one sentence:** New behavior goes on the class that already owns that job, and importing the package does not start the logger.

| Box | Meaning | Example |
|-----|---------|---------|
| You / this login | Maintainer changing the menu or the desk | Edit `Desk`, not a free function beside it |
| The other role | The class map | `requirement-nodejs-oop` |
| Not this file | The menu picture | `requirement-nodejs-tui` |

## 2. Normative rules

1. **Modules.** Source is ESM under `src/NodeRbac/`. One class per file. An error class may sit beside the class that raises it.
2. **Names.** Methods stay snake_case so the desk, the menu, and the web page call the same names.
3. **Constructors.** The site that needs an object **MUST** write `new ClassName(`. A function whose only job is to instantiate a mapped class is forbidden, except `function main`, which constructs `ChronicleLogger` and then `Cli`.
4. **Import.** Importing `src/NodeRbac/index.js` **MUST NOT** construct `ChronicleLogger`.
5. **Store.** Methods that call `Store` are `async` and callers `await` them. SQL from the product uses placeholders. Callers **MUST NOT** concatenate a typed name into SQL.
6. **Files.** A settings or session write uses a mode `0600` temporary file and `fs.rename` onto the destination in the same directory. The product **MUST NOT** call `sudo`.
7. **Comments.** Product source comments cite only live `requirement-*.md` keys.
8. **Secrets.** Source **MUST NOT** log a password. Source **MUST NOT** embed a database password.

## 7. Status history

| Date | Status | Note |
|------|--------|------|
| 2026-10-11 | Active 1.0.0 | ESM, one class per file, async store, no password in the log |

---

**Last Updated**: 2026-10-11
**Owner**: project maintainers
**Alignment**: Registry `docs/requirements/index.md`; **CIAO** (https://github.com/cloudgen/ciao); CIAO-Lite (https://github.com/cloudgen/ciao-lite).
