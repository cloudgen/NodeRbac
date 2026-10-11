# Requirements index

**Product:** NodeRbac (Node.js CLI — text menu and local web pages for online RBAC)
**Workspace state:** Specialized product law; **software-development** class; **npm/local package** install.
**Product version:** **1.0.0** (`package.json`, `src/NodeRbac/version.js`, root `README.md`)
**Updated:** 2026-10-11

| ID / key | Title | Area | Status | Path | Updated |
|----------|-------|------|--------|------|---------|
| requirement-class-software-dev | Software-development class law + residual stack (Node.js, npm) | class | Active | `requirement-class-software-dev.md` | 2026-10-11 |
| requirement-domain-noderbac | Domain surface: online RBAC and centralized configuration. Sign-in before the menu | domain | Active | `requirement-domain-noderbac.md` | 2026-10-11 |
| requirement-domain-videojoin | Retired welcome-line domain | domain | Retired | `requirement-domain-videojoin.md` | 2026-10-11 |
| requirement-nodejs | Node.js 22 runtime, independent of the language-track files | nodejs | Active | `requirement-nodejs.md` | 2026-10-11 |
| requirement-rbac | RBAC system map, permissions, data scope 1–4, seed on an empty database, protected rows | domain | Active | `requirement-rbac.md` | 2026-10-11 |
| requirement-database | sqlite3 default file and mysql tables, seed-once, auto-init | domain | Active | `requirement-database.md` | 2026-10-11 |
| requirement-environment | NODERBAC_* names, mode-0600 file, loopback bind | domain | Active | `requirement-environment.md` | 2026-10-11 |
| requirement-web-interface | Local HTML site, cookie, CSRF, shared service | domain | Active | `requirement-web-interface.md` | 2026-10-11 |
| requirement-nodejs-about | About page: identity, host check, star box. No `--json` | nodejs | Active | `requirement-nodejs-about.md` | 2026-10-11 |
| requirement-video-ffmpeg-pipeline | Retired. No encoder, no concat, no media publish | video | Retired | `requirement-video-ffmpeg-pipeline.md` | 2026-10-11 |
| requirement-nodejs-cli-interface | CLI entry, typed verbs, sign-in then menu on a terminal | nodejs | Active | `requirement-nodejs-cli-interface.md` | 2026-10-11 |
| requirement-nodejs-cli-logging | ChronicleLogger construct in `function main`; no passwords in the log | nodejs | Active | `requirement-nodejs-cli-logging.md` | 2026-10-11 |
| requirement-nodejs-tui | Text menu rows 2–9, sign-in first, path word, display columns | nodejs | Active | `requirement-nodejs-tui.md` | 2026-10-11 |
| requirement-nodejs-cli-language | Menu language: front row 4, codes 41–53, leaf `~/.local/NodeRbac/language` | nodejs | Active | `requirement-nodejs-cli-language.md` | 2026-10-11 |
| requirement-nodejs-oop | Class map, including Desk, Access, and WebApp | nodejs | Active | `requirement-nodejs-oop.md` | 2026-10-11 |
| requirement-nodejs-coding-style | Node.js style; one class per module; async store | nodejs | Active | `requirement-nodejs-coding-style.md` | 2026-10-11 |
| requirement-nodejs-packaging | `package.json` / version / console script `node-rbac` | nodejs | Active | `requirement-nodejs-packaging.md` | 2026-10-11 |
| requirement-nodejs-build-script | Maintainer `./build.sh` commands, including test-install | nodejs | Active | `requirement-nodejs-build-script.md` | 2026-10-11 |
| requirement-nodejs-project-structure | Repository and `src/NodeRbac` layout | nodejs | Active | `requirement-nodejs-project-structure.md` | 2026-10-11 |
| requirement-nodejs-readme | Root user document: sections, badges, absolute screenshot URLs | nodejs | Active | `requirement-nodejs-readme.md` | 2026-10-11 |
| requirement-nodejs-error-handling | Fail-closed errors; console sentences stay | nodejs | Active | `requirement-nodejs-error-handling.md` | 2026-10-11 |
| requirement-runtime-prerequisites | Node.js 22; node:sqlite by default; mysql2 when chosen; no root auto-install | runtime | Active | `requirement-runtime-prerequisites.md` | 2026-10-11 |

## Intentionally absent (by design)

| Surface | Status on NodeRbac |
|---------|----------------------|
| Shell online install / `curl\|sh` | **Absent** |
| Type 1 sudoers / root elevation inside the program | **Absent** |
| Code generation, AI, plugins, jobs, Redis, Vue bundle | **Absent** for 1.0.0 |
| Python, pip, setuptools | **Absent** |
| Second Active `requirement-domain-*` | **Forbidden** while `requirement-domain-noderbac` is Active |
| `hello`, `join`, `list-videos`, FFmpeg | **Absent** |
| `requirement-nodejs-json-output` | **Absent**. No `--json` |

**Install mode:** **npm / local package** (`node-rbac` console script).

**Runtime:** Node.js 22 or newer (`requirement-nodejs`). `function main` in `src/NodeRbac/cli.js` writes `new ChronicleLogger(`.

**Database:** sqlite3 by default, file `noderbac.sqlite3`, through `node:sqlite`. mysql through `mysql2` when `NODERBAC_DB_ENGINE=mysql`. Product mysql schema `noderbac`. mysql tests use `noderbac_test`.

**Rules for agents:**

1. Treat rows above as the live product-law inventory for NodeRbac.
2. Do not invent additional `requirement-*.md` paths without a registry row in the same change.
3. Product source comments cite only these live requirement files.
4. Keep Status and Path in sync with each file’s header.
5. Exactly one Active `requirement-domain-*` (`requirement-domain-noderbac`).
6. Do not write `ruoyi_db` or `ry`.

When adding a requirement: append a row, create the file under `docs/requirements/`, keep Status in sync with the file header.
