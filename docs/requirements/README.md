# Requirements

Authoritative specialized product law for **NodeRbac** lives here.

| Fact | Value |
|------|-------|
| Product | `NodeRbac` |
| npm name | `noderbac` |
| Version SSOT | **`1.0.0`** (`package.json` + `src/NodeRbac/version.js`) |
| Console script | `node-rbac` |
| Module | `node src/NodeRbac/cli.js` |
| Install mode | npm / local package |
| Runtime | `requirement-nodejs` — Node.js 22 or newer. Python is not required |
| Domain | `requirement-domain-noderbac` — online RBAC and centralized configuration |
| Menu language | `requirement-nodejs-cli-language` — row 4, codes 41–53, leaf `~/.local/NodeRbac/language` |
| Logger | `ChronicleLogger` in `src/NodeRbac/chronicle_logger.js`, constructed in `function main` |
| Database | sqlite3 file `noderbac.sqlite3` by default through `node:sqlite`; mysql and `mysql2` when chosen; mysql schema `noderbac` |
| Web | `127.0.0.1:8765` unless the environment says otherwise |
| Maintainer tool | `requirement-nodejs-build-script` — `./build.sh` |

The registry is [index.md](index.md).
