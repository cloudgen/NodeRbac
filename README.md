# NodeRbac - online role-based access control and centralized configuration

![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
[![CIAO](https://img.shields.io/badge/Philosophy-CIAO%20(Caution%20%E2%80%A2%20Intentional%20%E2%80%A2%20Anti--fragile%20%E2%80%A2%20Over--engineered)-purple.svg)](https://github.com/cloudgen/ciao)
[![Stars](https://img.shields.io/github/stars/cloudgen/NodeRbac?style=flat-square)](https://github.com/cloudgen/NodeRbac)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-blue?style=flat-square)](https://nodejs.org/)

NodeRbac is a local program for accounts, roles, menus, and shared settings. One desk serves the typed commands, the text menu, and a plain web page on this computer. A terminal with no arguments uses the sqlite3 file, asks for an account and a password, and then opens the menu. The menu has no session row. The run creates missing tables before that question.

## Features

- Accounts, roles, menus, departments, posts, parameters, dictionaries, and notices.
- Data scope is 1 (all), 2 (chosen departments), 3 (the signed-in user's department), or 4 (that department and its descendants). Any other scope shows no rows.
- Passwords are stored as PBKDF2-HMAC-SHA256. They are not bcrypt.
- Signed-in sessions are rows in `sys_session`. They are not Redis keys.
- The same permission check serves the menu, the command, and the web page. A missing permission fails closed.
- The site listens on `127.0.0.1` unless `NODERBAC_ALLOW_REMOTE=yes`.
- sqlite3 is the default file `~/.local/NodeRbac/noderbac.sqlite3`. Enter on `db-engine` selects that file. mysql is choice 2.
- The text menu can show English, 简体中文, 繁體中文, and 日本語, plus the other languages on row 4.

## Quick Installation

Node.js 22 or newer is required. There is no shell installer.

```bash
npm install -g noderbac
```

From a checkout of this repository:

```bash
npm install -g .
```

mysql is optional. Install `mysql2` only when you choose that engine. The program does not install it for you.

On a terminal, run `node-rbac` with no arguments. The path line names the current directory. The first question is the account name. The password field is masked. `9` leaves the program. `0` on a later board returns to the front board.

```text
**NodeRbac**(*1.0.0*) — login
user_name
╭───────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ > █                                                                                                       │
╰───────────────────────────────────────────────────────────────────────────────────────────────────────────╯
  **NodeRbac**(*1.0.0*)  │  login  │  Up/Down  •  Enter
```

```text
Path: /tmp/noderbac-demo                                                                             11:06:15
2. **access**         : *users, roles, menus, departments, and posts*
3. **system-log**     : *view, clear, and the log folder*
4. **language**       : *display language for this menu*
5. **setup**          : *parameters, dictionaries, and notices*
6. **audit**          : *operation log, login log, and online users*
7. **serve**          : *start the web interface on this computer*
8. **self-management**: *version, about, and npm lifecycle*
9. **Exit**           : *leave*
╭───────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ > █                                                                                                       │
╰───────────────────────────────────────────────────────────────────────────────────────────────────────────╯
  **NodeRbac**(*1.0.0*)  │  main menu  │  Up/Down  •  Enter
```

```text
Path: /tmp/noderbac-demo                                                                             11:06:16
21. **user-list**          : *accounts you are allowed to see*
22. **user-add**           : *add an account*
23. **user-edit**          : *change a name, department, or status*
24. **user-remove**        : *mark an account deleted*
25. **user-reset-password**: *set a new password*
26. **role-list**          : *roles and data scope*
27. **role-grant**         : *menus and data scope for one role*
28. **menu-list**          : *menu and permission strings*
29. **menu-add**           : *add a directory, page, or button*
30. **dept-list**          : *departments*
31. **dept-add**           : *add a department*
32. **post-list**          : *posts*
33. **post-add**           : *add a post*
 0. **Back**               : *return to the main menu*
  **NodeRbac**(*1.0.0*)  │  access  │  Up/Down  •  Enter
```

```text
Path: /tmp/noderbac-demo                                                                             11:06:17
31. **view-log**  : *list a log file and show it*
32. **clear-log** : *empty one log file*
33. **log-folder**: *show the log folder*
 0. **Back**      : *return to the main menu*
  **NodeRbac**(*1.0.0*)  │  system-log  │  Up/Down  •  Enter
```

```text
Path: /tmp/noderbac-demo                                                                             11:06:19
41. **English**   : *use English for this menu*
42. **简体中文**  : *use 简体中文 for this menu*
43. **繁體中文**  : *use 繁體中文 for this menu*
44. **Español**   : *use Español for this menu*
45. **العربية**   : *use العربية for this menu*
46. **Français**  : *use Français for this menu*
47. **Português** : *use Português for this menu*
48. **Русский**   : *use Русский for this menu*
49. **Deutsch**   : *use Deutsch for this menu*
50. **日本語**    : *use 日本語 for this menu*
51. **한국어**    : *use 한국어 for this menu*
52. **Nederlands**: *use Nederlands for this menu*
53. **Ελληνικά**  : *use Ελληνικά for this menu*
 0. **Back**      : *return to the main menu*
  **NodeRbac**(*1.0.0*)  │  language  │  Up/Down  •  Enter
```

```text
Path: /tmp/noderbac-demo                                                                             11:06:20
71. **config-list**: *parameters*
72. **config-set** : *change one parameter*
73. **config-add** : *add a parameter*
74. **dict-list**  : *dictionary values*
75. **dict-add**   : *add a dictionary value*
76. **notice-list**: *notices*
77. **notice-add** : *add a notice*
78. **db-engine**  : *sqlite3 file or mysql*
 0. **Back**       : *return to the main menu*
  **NodeRbac**(*1.0.0*)  │  setup  │  Up/Down  •  Enter
```

```text
Path: /tmp/noderbac-demo                                                                             11:06:22
61. **oper-log**     : *operation log*
62. **login-log**    : *login log*
63. **online-list**  : *sessions that are signed in*
64. **online-logout**: *close one online session*
 0. **Back**         : *return to the main menu*
  **NodeRbac**(*1.0.0*)  │  audit  │  Up/Down  •  Enter
```

```text
Path: /tmp/noderbac-demo                                                                             11:06:24
82. **version**       : *show the installed version*
83. **about**         : *version and this computer*
84. **version-check** : *compare this install with npm*
85. **self-update**   : *upgrade this package with npm*
86. **self-uninstall**: *remove this package with npm*
87. **self-install**  : *install this package with npm*
 0. **Back**          : *return to the main menu*
  **NodeRbac**(*1.0.0*)  │  self-management  │  Up/Down  •  Enter
```

`NODERBAC_LANG` selects a menu language for that run and does not write the language file. The path word changes with the saved language. These three fronts were captured that way.

```text
路徑: /tmp/noderbac-demo                                                                             11:06:27
2. **access**  : *users, roles, menus, departments, and posts*
3. **系統日誌**: *查看、清空，以及日誌資料夾*
4. **語言**    : *這個選單的顯示語言*
5. **setup**   : *parameters, dictionaries, and notices*
6. **audit**   : *operation log, login log, and online users*
7. **serve**   : *start the web interface on this computer*
8. **自我管理**: *版本、關於，以及 npm 生命週期*
9. **離開**    : *離開*
  **NodeRbac**(*1.0.0*)  │  主選單  │  Up/Down  •  Enter
```

```text
路径: /tmp/noderbac-demo                                                                             11:06:29
2. **access**  : *users, roles, menus, departments, and posts*
3. **系统日志**: *查看、清空，以及日志文件夹*
4. **语言**    : *此菜单的显示语言*
5. **setup**   : *parameters, dictionaries, and notices*
6. **audit**   : *operation log, login log, and online users*
7. **serve**   : *start the web interface on this computer*
8. **自我管理**: *版本、关于，以及 npm 生命周期*
9. **离开**    : *离开*
  **NodeRbac**(*1.0.0*)  │  主菜单  │  Up/Down  •  Enter
```

```text
パス: /tmp/noderbac-demo                                                                             11:06:32
2. **access**      : *users, roles, menus, departments, and posts*
3. **システムログ**: *表示、消去、ログフォルダ*
4. **言語**        : *このメニューの表示言語*
5. **setup**       : *parameters, dictionaries, and notices*
6. **audit**       : *operation log, login log, and online users*
7. **serve**       : *start the web interface on this computer*
8. **自己管理**    : *バージョン、概要、npm のライフサイクル*
9. **終了**        : *終了*
  **NodeRbac**(*1.0.0*)  │  メインメニュー  │  Up/Down  •  Enter
```

Choose a number, or type the command name. A number that is not on the list prints an error and lets you choose again. It does not exit. After a command finishes, the front board is shown again.

## Usage

```bash
node-rbac
node-rbac --help
node-rbac --version
node-rbac login --user-name admin
node-rbac whoami
node-rbac db-init
node-rbac db-engine
node-rbac user-list
node-rbac serve
```

`--password` is accepted and is visible in the process list. The menu masks that field. Prefer the menu question or a prompt that does not put the secret on the command line.

`db-init` creates the tables and, when `sys_user` is empty, inserts the seed. A later `db-init` reports that the seed is already present. `db-engine` stores the choice and does not open the database. With no `--engine` on a terminal it asks `Choice [sqlite3]: `. Enter selects sqlite3 and `~/.local/NodeRbac/noderbac.sqlite3`. Choice `2` selects mysql. A value already set in `NODERBAC_DB_ENGINE` is kept when you press Enter.

`serve`, and menu row 7, start the web page. The default bind is `127.0.0.1` port `8765`. Set `NODERBAC_ALLOW_REMOTE=yes` before a non-loopback bind. The cookie name is `noderbac_session`. A form post must send the matching `csrf` field. A sign-in from another computer cannot switch the database engine.

| Variable | Role |
|----------|------|
| `NODERBAC_HOME` | Settings folder. Default `~/.local/NodeRbac`. |
| `NODERBAC_DB_ENGINE` | `sqlite3` or `mysql`. Empty means sqlite3. |
| `NODERBAC_SQLITE_FILE` | sqlite3 file. Default `~/.local/NodeRbac/noderbac.sqlite3`. |
| `NODERBAC_DB_HOST` | mysql host. Default `127.0.0.1`. |
| `NODERBAC_DB_PORT` | mysql port. Default `3306`. |
| `NODERBAC_DB_USER` | mysql user. Default `noderbac`. |
| `NODERBAC_DB_NAME` | mysql database. Default `noderbac`. |
| `NODERBAC_DB_PASSWORD` | mysql password. No default. A mode `0600` file named `database` under the settings folder can hold it. |
| `NODERBAC_BIND` | Web bind address. Default `127.0.0.1`. |
| `NODERBAC_PORT` | Web port. Default `8765`. |
| `NODERBAC_ALLOW_REMOTE` | Set to `yes` to allow a non-loopback bind. |
| `NODERBAC_LANG` | Menu language for this run. Does not write the language file. |

The first seed creates these accounts. Change each password after the first sign-in.

| Account | Password | Department | Data scope |
|---------|----------|------------|------------|
| admin | admin123 | Engineering | 1, all rows |
| operator | operator123 | Operations | 3, that department |
| clerk | clerk123 | Platform | 3, that department |
| lead | lead123 | Engineering | 4, that department and descendants |

The parameter `sys.user.initPassword` is `123456`. Change that too. It is the password offered for a new account, not a back door.

The built-in administrator (user 1) cannot be removed or disabled. Role 1 cannot be narrowed from the role-grant command. The signed-in user cannot remove that same account.

### Screenshots

The path line shows the current directory. These pictures are the running text menu.

![Sign-in question](https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/login-prompt.png)

![English front board](https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/main-menu-en.png)

![Access board](https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/access-menu.png)

![System log board](https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/system-log.png)

![Language board](https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/language-menu.png)

![Setup board](https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/setup-menu.png)

![Audit board](https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/audit-menu.png)

![Self-management board](https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/self-management.png)

![Traditional Chinese front board](https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/main-menu-zh-hant.png)

![Simplified Chinese front board](https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/main-menu-zh-hans.png)

![Japanese front board](https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/main-menu-ja.png)

## Examples

Create the default sqlite3 file and sign in on the command line. You will be asked for the password:

```bash
node-rbac db-init
node-rbac login --user-name admin
node-rbac user-list
node-rbac logout
```

Store mysql as the engine without opening it:

```bash
node-rbac db-engine --engine mysql
```

Open the site on this computer:

```bash
node-rbac serve
```

## Platform Compatibility

| Surface | Status |
|---------|--------|
| Linux, Node.js 22 or newer | Used to run the suite and the menu capture |
| `node:sqlite` | Default database. No extra package |
| MariaDB or MySQL with `mysql2` | Optional. Not part of `npm install` |
| Text menu | A terminal that understands ANSI |
| Web page | A browser on `127.0.0.1` unless remote bind is allowed |

macOS and Windows were not part of this release check.

## Related Projects

- https://github.com/cloudgen/NodeRbac
- https://github.com/cloudgen/ciao
- https://github.com/cloudgen/ciao-lite

## Contributing

Issues and pull requests go to https://github.com/cloudgen/NodeRbac. The project follows [CIAO](https://github.com/cloudgen/ciao): fail closed, keep the permission check in one place, ignore a password file that is not mode `0600`, and do not call sudo.

Run `./tests/run.sh` from a checkout. Node.js 22 or newer is required.

## License

MIT. See [LICENSE.md](LICENSE.md). Copyright (c) 2026 Wong Chun Fai.

## Last Update

2026-10-11. Version 1.0.0.
