**file**: docs/requirements/requirement-nodejs-oop.md
**Status**: Active (Version 1.0.0)
**Area**: nodejs
**Key**: `requirement-nodejs-oop`
**Philosophy**: CIAO **v2.10.2** / CIAO-Lite (Caution • Intentional • Anti-fragile • Over-engineered / Over-protect)

## 1. Purpose

Each module defines one class. An error type may sit beside the class that raises it. `function main` in `cli.js` is the function that constructs `ChronicleLogger`. Collaborators are created in the constructor. There is no module-level helper that does product work.

### 1.1 Human-facing

**In one sentence:** Each behavior lives on one class, and `main` builds the logger before it builds the program.

| Box | Meaning | Example |
|-----|---------|---------|
| You / this login | A reader of `src/NodeRbac` | `Desk` calls `Access` |
| The other role | The logger | Passed into the constructor |
| Not this file | The permission table | `requirement-rbac` |

## 2. Class map

| Module | Class |
|--------|-------|
| `version.js` | version string only |
| `chronicle_logger.js` | `ChronicleLogger` |
| `cli.js` | `Cli`, and `function main` |
| `tui.js` | `Tui` and `MenuScreenError` |
| `menu_painter.js` | `MenuPainter` |
| `menu_model.js` | `MenuModel` |
| `menu_session.js` | `MenuSession` |
| `menu_language.js` | `MenuLanguage` |
| `about_page.js` | `AboutPage` |
| `check_system.js` | `CheckSystem` |
| `self_management.js` | `SelfManage` |
| `system_log.js` | `SystemLog` |
| `desk.js` | `Desk` |
| `settings.js` | `Settings` and `SettingsError` |
| `store.js` | `Store` and `StoreError` |
| `schema.js` | `Schema` |
| `password_hash.js` | `PasswordHash` |
| `access.js` | `Access` and `AccessError` |
| `catalog.js` | `Catalog` |
| `audit_log.js` | `AuditLog` |
| `report_text.js` | `ReportText` |
| `session_file.js` | `SessionFile` |
| `web_app.js` | `WebApp` |

## 3. Normative rules

1. **Logger.** A class that accepts `logger` **MUST** log `instantiated` from the constructor when the logger is present.
2. **Web handler.** `WebApp` **MAY** close over request functions because `node:http` calls them. Those functions **MUST** call `WebApp`. No other module **MAY** add a second product class.
3. **Version.** `version` in `version.js` is the only version string. It is `1.0.0`. `index.js` re-exports it.
4. **Async store.** A method that calls `Store` **MUST** be `async`. Method names stay snake_case.
5. **No hello.** There is no `Tui.hello_text`.

## 7. Status history

| Date | Status | Note |
|------|--------|------|
| 2026-10-11 | Active 1.0.0 | ESM classes under `src/NodeRbac`. Version string `1.0.0` |

---

**Last Updated**: 2026-10-11
**Owner**: project maintainers
**Alignment**: Registry `docs/requirements/index.md`; **CIAO** (https://github.com/cloudgen/ciao); CIAO-Lite (https://github.com/cloudgen/ciao-lite).
