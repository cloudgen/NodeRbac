**file**: docs/requirements/requirement-nodejs-about.md
**Status**: Active (Version 1.0.0)
**Area**: nodejs
**Key**: `requirement-nodejs-about`
**Philosophy**: CIAO **v2.10.2** / CIAO-Lite (Caution • Intentional • Anti-fragile • Over-engineered / Over-protect)

## 1. Purpose

This file is the about page for NodeRbac. Menu action **about** returns one text page: the product identity lines, a host check, and a star-bordered box. This file names every line and the read that fills it.

The screen that shows the page stays on `requirement-nodejs-tui`. The version string stays the single `version` on `requirement-nodejs-packaging`. `--version` stays a one-line human string on `requirement-nodejs-cli-interface`. This product does not claim `--json`.

Node and nvm path reads for this page stay in this file. This product does not add a separate nvm requirement. It does not read Python, pyenv, or conda.

### 1.1 Human-facing

**In one sentence:** On the text menu, choose **about** and the page names this build, this computer, and where the program is running from.

| Box | Meaning | Example |
|-----|---------|---------|
| You / this login | Person reading the about page | Menu row **83 about**, under **8** self-management |
| The other role | The text-menu result page | `requirement-nodejs-tui` draws it and scrolls it |
| Not this file | The npm rows and a JSON object | CLI, and the absent JSON requirement |

| Includes | Excludes |
|----------|----------|
| Identity lines, the host-check lines, and the star box | A second about layout, a remote version lookup |
| How each value is read on this machine | Running `node` or `npm` to ask their version |
| Install kind: global, local, or uninstalled | An install command while this product has no download URL |
| nvm path reads used by the location lines | A Python, pyenv, or conda location line |

## 2. Core Rules (Mandatory)

1. **One page.** Menu action **about** and the verb `node-rbac about` **MUST** show one result page. The page **MUST** be three blocks in this order: identity, host check, star box. A blank line **MUST** separate the blocks. Without a terminal, that page **MUST** be the whole of standard output. The page **MUST NOT** be `--json`.
2. **Identity block.** The first four lines **MUST** be, in order: `{APP_NAME} {version}`, `Domain: Online RBAC and centralized configuration`, `Runtime tools: Node.js, node:sqlite (default file) or MariaDB or MySQL, mysql2`, `Entry points: node-rbac`. `{version}` **MUST** be the package version string. The page **MUST NOT** print an author email, `npm install`, or `python -m pip install`.
3. **Host-check header.** The check **MUST** start with `{local stamp} {APP_NAME}(v{version})  [CHECK SYSTEM]:` and the next line **MUST** be two spaces then `Now checking your operation system!`. The stamp **MUST** be local time `YYYY-MM-DD HH:MM:SS.ffffff`. There are two spaces before `[CHECK SYSTEM]:`.
4. **Host-check fields.** After the header, the page **MUST** print these labels in this order, each starting with four spaces, then the label, a colon, a space, and the value. A missing value **MUST** leave the line in place. The check **MUST NOT** spawn `node`, `npm`, `nvm`, `python2`, `python3`, `conda`, `pyenv`, or `id`.

| Label | Read |
|-------|------|
| `Node.js` | `process.versions.node` |
| `V8` | `process.versions.v8` |
| `Operation System` | `PRETTY_NAME` from `/etc/os-release` when that file yields a non-empty name. Otherwise `os.type()` plus a space plus `os.release()` |
| `Architecture` | Map `process.arch` ignoring case: `x64`, `x86_64`, and `amd64` to `amd64`; `aarch64` and `arm64` to `arm64`; `ia32`, `i386`, `i686`, and `x86` to `x86`. Any other name is kept |
| `Current User` | Environment `USER`, else `USERNAME`, else `os.userInfo().username`. On failure, empty |
| `Shell` | Environment `SHELL`, else empty |
| `Node executable` | Basename of `process.execPath`. Empty when that path is empty |
| `node location` | Rule 6, otherwise the first `node` on `PATH`, else empty |
| `npm location` | When rule 6 applies, `{version directory}/bin/npm` when that file exists. Otherwise the first `npm` on `PATH`, else empty |
| `nvm location` | When rule 6 applies, `{root}/nvm.sh` when that file exists. Otherwise the first `nvm` on `PATH`, else empty |
| `Inside docker container` | `True` when `/.dockerenv` exists, otherwise `False`. Those exact words |
| `Node ABI` | `process.versions.modules`, else empty |
| `Binary Type` | `{arch}-{libc}` when both are non-empty. `{arch}-` when libc is empty. Empty when arch is empty. libc is `gnu` when a glibc loader exists, `musl` when a musl loader exists, else empty |
| `Location` | The program path from rule 7. The same path **MUST** be the indented path inside the star box |
| `PID` | `process.pid` as decimal text |
| `Cache folder used` | Rule 8. The page **MUST NOT** create the cache directories |
| `Cache folder (preferred)` | Rule 8 |
| `Cache folder (1st fallback)` | Rule 8 |
| `Cache folder (2nd fallback)` | Rule 8. The leaf has no username |
| `Persistence storage` | Rule 8. The language leaf lives under this directory. This read **MUST NOT** create it |
| `TTY / Interactive` | `yes` when stdout is a terminal, otherwise `no` |

5. **Program path.** If `process.argv[1]` is an existing file and its basename is `node-rbac`, `cli.js`, or `NodeRbac`, use its real path. Otherwise use the real path of `src/NodeRbac/cli.js`.
6. **nvm paths.** Under nvm means the root is non-empty. A non-empty `NVM_DIR` that contains `nvm.sh` is that root. Otherwise `~/.nvm` when that directory contains `nvm.sh`. Otherwise not under nvm. `nvm location` **MUST** be `{root}/nvm.sh`, not a copy under `versions/`. The selected Node directory is the directory of `process.execPath` when that path is `{root}/versions/node/{version}/bin/node`. `node location` is that `node` file when it exists. `npm location` is `{that bin}/npm` when it exists.
7. **Install kind.** Classify the real path in this order. A path that contains `node_modules` is packaged.
   - Not packaged, the path contains `{sep}src{sep}NodeRbac{sep}`, and a parent within eight levels has `package.json`: **uninstalled**.
   - Under the home directory, and packaged or the basename is `node-rbac` or `NodeRbac`: **local**.
   - Starts with `/usr/`, `/opt/`, or `/bin/`: **global**.
   - Packaged and not under the home directory: **global**.
   - Otherwise: **uninstalled**.
8. **Run lines.** `{APP_NAME}` is `NodeRbac`. Preferred leaf is `cache-NodeRbac-{username}-{pid}` when the username is non-empty, otherwise `cache-NodeRbac-{pid}`. Preferred path is `/dev/shm/cache/` plus that leaf. First fallback is `/tmp/cache/` plus that leaf. Second fallback is `{home}/.cache/cache-NodeRbac-{pid}` when home exists, with no username. Used is the preferred path when `/dev/shm` is a directory, otherwise the first fallback when `/tmp` is a directory, otherwise the second fallback. Persistence storage is `{home}/.local/NodeRbac` when home exists, or `NODERBAC_HOME` when that variable is set. The page **MUST NOT** create these directories.
9. **Star box sentences.** **global** **MUST** say `You are using the GLOBAL INSTALLED version, location:`. **local** **MUST** say `You are using the LOCAL INSTALLED version, location:`. **uninstalled** **MUST** say `You are using an UNINSTALLED version, location:`.
10. **Star box lines.** Inside the border, in order: the title `{APP_NAME} ({version}) by {author} on {date}`; a blank line; the install sentence; four spaces and the program path; a blank line; `Basic Usage:`; four spaces and the usage line; a blank line; `Please visit our homepage: `; four spaces, a double quote, the homepage, and a double quote; then the trailing blanks from rule 11. Author is `Wong Chun Fai`. Date is `2026-10-11`. Homepage is `https://github.com/cloudgen/NodeRbac`. Usage is `node-rbac login --user-name admin`.
11. **Border.** When the download URL is empty, pad every printed line on the right to the longest printed line and draw a star border. The product download URL **MUST** stay empty. The live about page **MUST NOT** contain `curl -fsSL`.
12. **No privilege and no network.** Building the page **MUST NOT** call `sudo`, open a socket, or recommend `sudo npm` or `sudo curl | sh`.
13. **Classes.** `CheckSystem` in `src/NodeRbac/check_system.js` owns the host-check reads. `AboutPage` in `src/NodeRbac/about_page.js` owns the composer. `Cli` writes `CheckSystem(...)` and then `AboutPage(...)`. `AboutPage` **MUST NOT** construct `CheckSystem`.
14. **Not printed.** `in_nvm` **MUST NOT** be printed and **MUST NOT** choose a location line by itself. The path reads in rule 6 choose the locations.

## 3. Acceptance checks

| ID | Check |
|----|-------|
| TP-ABOUT-01 | Identity lines, every host-check label, the star-box title, and the usage line. No `curl -fsSL`, no `python -m pip install`, no `py-tui` |
| TP-ABOUT-02 | Stamp shape, `[CHECK SYSTEM]:`, and field order |
| TP-ABOUT-03 | The star box is one rectangle. A `/usr` path uses the GLOBAL sentence |
| TP-ABOUT-06 | A source checkout is uninstalled. A home copy is local. `/usr` is global |
| TP-ABOUT-09 | nvm root, `nvm.sh`, and the selected `node` and `npm` paths |
| TP-ABOUT-13 | PID, four cache lines, persistence, and TTY. Building the page does not create those directories |
| TP-ABOUT-14 | Used follows `/dev/shm`, then `/tmp`, then the second fallback. The second leaf has no username |

## 4. Protection Rule (Sacred)

**Future AI assistants or maintainers MUST NOT:**

- Drop a host-check label or change its order.
- Add `python2 location`, `python3 location`, `conda location`, or `pyenv location`.
- Spawn `node`, `npm`, or `nvm` to fill a location line.
- Put `curl -fsSL` or `npm install` on the live about page while the download URL is empty.
- Freeze a Unix login or a home path into this requirement.
- Construct `CheckSystem` inside `AboutPage`.

## 5. Related artifacts

| Artifact | Role |
|----------|------|
| `docs/requirements/index.md` | Registry |
| `docs/requirements/requirement-domain-noderbac.md` | Domain sentence |
| `docs/requirements/requirement-nodejs-tui.md` | Result page and row 83 |
| `docs/requirements/requirement-nodejs.md` | Node.js floor |
| `src/NodeRbac/about_page.js` | Class `AboutPage` |
| `src/NodeRbac/check_system.js` | Class `CheckSystem` |
| `package.json` | Homepage and the version string |

## 7. Status history

| Date | Status | Note |
|------|--------|------|
| 2026-10-11 | Active 1.0.0 | Node.js, V8, npm, and nvm. No Python, pyenv, or conda lines |

---

**Last Updated**: 2026-10-11
**Owner**: project maintainers
**Alignment**: Registry `docs/requirements/index.md`; **CIAO** (https://github.com/cloudgen/ciao); CIAO-Lite (https://github.com/cloudgen/ciao-lite).
