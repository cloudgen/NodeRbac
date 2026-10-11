**file**: docs/requirements/requirement-nodejs-build-script.md
**Status**: Active (Version 1.0.0)
**Area**: nodejs
**Key**: `requirement-nodejs-build-script`
**Philosophy**: CIAO **v2.10.2** / CIAO-Lite (Caution • Intentional • Anti-fragile • Over-engineered / Over-protect)

## 1. Purpose

`./build.sh` is the maintainer build script for this Node.js package. It is not `node-rbac`. It reads the package version through `node`, and it runs npm. The command set below is closed. The product CLI still runs when this script is absent.

### 1.1 Human-facing

**In one sentence:** From the repository root, `./build.sh` plus one command packs, installs, tests, or publishes this checkout.

| Box | Meaning | Example |
|-----|---------|---------|
| You / this login | The maintainer at the repository root | `./build.sh test-install` |
| The other role | `node` and `npm` on `PATH` | `npm pack`, `npm publish`, `npm install -g` |
| Not this file | The operator menu | `node-rbac` with no verb |

| Includes | Excludes |
|----------|----------|
| `help`, `version`, `setup`, `clean`, `build`, `upload`, `git`, `tag`, `release`, `all`, `test`, `test-install` | `node-rbac` verbs, the text menu, `db-init`, a database password, `sudo` |

## 2. Core Rules / Requirements (Mandatory)

1. **Entry.** The script lives at the repository root and is named `build.sh`. It **MUST** `cd` to its own directory before any command. It **MUST NOT** accept `node-rbac` flags.
2. **Banner.** Before the command, print `NodeRbac build tool (v` plus the version from `src/NodeRbac/version.js` plus `)` when that read works. When that read fails, print `NodeRbac build tool (version unread)`. Then print a line of forty `=` characters.
3. **Closed set.** The only commands are `help`, `version`, `setup`, `clean`, `build`, `upload`, `git`, `tag`, `test`, `test-install`, `release`, and `all`. No command, `-h`, and `--help` are `help`. An unknown token prints `ERROR: Unknown command: ` plus the token on stderr, prints the help list, and exits `1` without printing `Done.`
4. **Extra tokens.** `test` and `test-install` reject any extra token and exit `1`. Every other command ignores trailing tokens.
5. **Done.** A command that exits `0` prints `Done.` as its last line. A command that exits non-zero does not print `Done.`
6. **Errors.** Failures print `ERROR: …` and `   Next: …` on stderr. The next-step line names `./build.sh` and the command that repairs the failure.
7. **Runtime.** Version, pack, publish, and install run as `node` and `npm` on `PATH`. The script **MUST NOT** call `python3`, `pip`, or `sudo`.

### 2.1 Commands

| Command | Behavior |
|---------|----------|
| `help` | Print the usage list in §2.2. Exit `0`. |
| `version` | If the version was unread, exit `1` with `ERROR: Cannot read the package version from src/NodeRbac.` and `   Next: set version in src/NodeRbac/version.js to match package.json, then ./build.sh version`. Otherwise print `NodeRbac build tool (v` plus that version plus `)` again. |
| `setup` | `npm install`. This installs the manifest. It does not install a database server. |
| `clean` | Remove `dist/`, `build/`, and `noderbac-*.tgz` in the root. Print `Clean complete`. Do not remove `src/`, `reviews/`, or `screenshots/`. |
| `build` | `npm pack --pack-destination dist`. On failure exit `1` with `ERROR: Package build failed.` and `   Next: ./build.sh setup`. On success print `Build complete -> dist/` and a long listing of `dist/`. Do not clean first. Do not upload. Do not tag. |
| `upload` | `npm publish` of the tarball in `dist/`. Do not build first. On failure exit `1` with `ERROR: Upload failed.` and `   Next: ./build.sh build`. On success print `Upload finished for NodeRbac v` plus the version string read at startup. Do not print a token. |
| `git` | When stdin is a terminal, print `Enter commit message:` and read one line. Otherwise read one line from stdin. An empty line exits `1` with `ERROR: Commit message is empty.` and `   Next: ./build.sh git`. Otherwise run `git add .`, `git commit -m` with that one line, then `git push` with no flags. Do not pass `--force`. |
| `tag` | Require a readable version, as `version` does. The tag name is `v` plus that version. Print `Creating and pushing tag: ` plus the name. Create an annotated tag with message `Release ` plus the tag name, then `git push origin` plus that tag. |
| `test` | No extra arguments. If `tests/run.sh` is missing, exit `1` with `ERROR: tests/run.sh is not in this checkout.` and `   Next: add the suite runner, then ./build.sh test`. Otherwise run `./tests/run.sh`. |
| `test-install` | No extra arguments. Read `name` from `package.json` with `node`. If the name cannot be read, exit `1` with `ERROR: Cannot read the project name from package.json.` and `   Next: set name, then ./build.sh test-install`. When `npm ls -g --depth=0` shows that name, print `Removing previous install of ` plus the name and run `npm uninstall -g` for it. Uninstall failure exits `1` with `ERROR: Could not remove the installed copy.` and `   Next: ./build.sh test-install`. When npm does not show the name, print `No previous install of ` plus the name. Then print `Installing this checkout` and run `npm install -g` on this repository directory. Failure exits `1` with `ERROR: Local install failed.` and `   Next: ./build.sh test-install`. |
| `release` | Require a readable version, then run `clean`, `build`, `upload`, and `tag` in that order. Stop at the first failure. |
| `all` | Same chain as `release`. |

### 2.2 Help list

The help text **MUST** name the usage line `Usage: ./build.sh <command>` and **MUST** keep `test` under the heading `Test command:`.

- `help` — Show this list (also: no command, `-h`, `--help`)
- `version` — Print the package version from this checkout
- `setup` — Install this package's npm dependencies
- `clean` — Remove dist and pack tarballs
- `build` — Pack an npm tarball into dist/
- `upload` — Publish the tarball in dist/. Does not build first
- `git` — Ask for one commit message, then stage, commit, and push
- `tag` — Create and push annotated tag `v` plus the version, or `vunread` when the version was unread
- `release` — clean, then build, then upload, then tag
- `all` — Same chain as release
- `test-install` — Remove this project's global npm install, then install this checkout
- `test` — Run tests/run.sh. No extra arguments.

The examples **MUST** include `./build.sh version`, `./build.sh build`, `./build.sh test`, `./build.sh test-install`, and `./build.sh release`.

### 2.3 Implementation Notes (this project)

| Field | Value |
|-------|-------|
| Script | `./build.sh` |
| Package | `NodeRbac` |
| npm name | `noderbac` |
| Version read | `src/NodeRbac/version.js` (`1.0.0`) |
| `test-install` target | The repository directory that contains `build.sh` |
| `test` target | `tests/run.sh` |
| Tag remote | `origin` |
| Registry credentials | Not stored in this script or in this requirement |
| Product CLI | Unchanged. `node-rbac` does not gain these commands |

## Under command line for normal user only

On Termux, Git Bash, Windows cmd, or the same class, the maintainer runs `./build.sh` as the normal user. **This requirement:** do not call `sudo`, `apt`, or Termux `pkg`, and do not create a dedicated system user. `setup` and `test-install` use `npm` only.

## 7. Status history

| Date | Status | Note |
|------|--------|------|
| 2026-10-11 | Active 1.0.0 | Maintainer script uses node and npm |

---

**Last Updated**: 2026-10-11
**Owner**: project maintainers
**Alignment**: Registry `docs/requirements/index.md`; **CIAO** (https://github.com/cloudgen/ciao); CIAO-Lite (https://github.com/cloudgen/ciao-lite).
