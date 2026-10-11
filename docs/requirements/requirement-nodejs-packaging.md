**file**: docs/requirements/requirement-nodejs-packaging.md
**Status**: Active (Version 1.0.0)
**Area**: nodejs
**Key**: `requirement-nodejs-packaging`
**Philosophy**: CIAO **v2.10.2** / CIAO-Lite (Caution • Intentional • Anti-fragile • Over-engineered / Over-protect)

## 1. Purpose

`package.json` is the install manifest. The npm name is `noderbac`, the version is `1.0.0`, and the console script is `node-rbac`.

### 1.1 Human-facing

**In one sentence:** npm installs noderbac 1.0.0 and the command `node-rbac`. sqlite3 comes with Node.js. mysql needs `mysql2`, which is not a required dependency of the default install.

| Box | Meaning | Example |
|-----|---------|---------|
| You / this login | The operator | `npm install -g noderbac` |
| The other role | The manifest | `package.json` |
| Not this file | MariaDB itself | `requirement-runtime-prerequisites` |

## 2. Normative rules

1. **Name and version.** `name` is `noderbac`. `version` is `1.0.0`, the same string as `version` in `src/NodeRbac/version.js`.
2. **Script.** `bin.node-rbac` points at `src/NodeRbac/cli.js`. That file starts with `#!/usr/bin/env node`.
3. **Module.** `"type"` is `module`. The package **MUST NOT** re-export `ChronicleLogger`. Public exports are `version` and `main`.
4. **Dependencies.** The default install **MUST NOT** depend on a Python package. `mysql2` is optional and is installed only when the operator chooses mysql. Node.js itself is `requirement-nodejs`.
5. **Author.** Wong Chun Fai, `cloudgen.wong@gmail.com`. Homepage `https://github.com/cloudgen/NodeRbac`.
6. **Engines.** `engines.node` is `>=22`.
7. **Secrets.** The manifest **MUST NOT** contain a database password.
8. **Maintainer tool.** Commands of `./build.sh` are owned by `requirement-nodejs-build-script`. This file owns the install manifest.

## Terminologies

| Term | Meaning in this file |
|------|----------------------|
| Console script | `node-rbac` |
| npm name | `noderbac` |

## 7. Status history

| Date | Status | Note |
|------|--------|------|
| 2026-10-11 | Active 1.0.0 | npm package `noderbac`, version 1.0.0, script `node-rbac` |

---

**Last Updated**: 2026-10-11
**Owner**: project maintainers
**Alignment**: Registry `docs/requirements/index.md`; **CIAO** (https://github.com/cloudgen/ciao); CIAO-Lite (https://github.com/cloudgen/ciao-lite).
