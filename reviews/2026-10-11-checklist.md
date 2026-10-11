# NodeRbac checklist — 2026-10-11

Use this list before a push to `cloudgen/NodeRbac`.

## Requirements

- [x] Exactly one Active domain file: `requirement-domain-noderbac`
- [x] `requirement-domain-videojoin` and `requirement-video-ffmpeg-pipeline` stay Retired
- [x] Independent `requirement-nodejs` plus the converted `requirement-nodejs-*` files
- [x] RBAC, database, environment, and web requirements exist
- [x] ChronicleLogger lives in `src/NodeRbac/chronicle_logger.js` and `function main` constructs it
- [x] Index status matches the file headers

## Behavior

- [x] Empty argv on a terminal uses the sqlite3 default file, then a sign-in, then the menu
- [x] Front rows are access, system-log, language, setup, audit, serve, self-management, Exit. There is no session row
- [x] Language stays on row 4, codes 41–53, leaf `~/.local/NodeRbac/language`
- [x] System-log stays on 3 and 31–33. Self-management stays on 8 and 82–87
- [x] Data scope 1–4. An unknown scope shows no users
- [x] Web bind defaults to loopback. Cookie `noderbac_session` and CSRF are present
- [x] Passwords are not written to the ChronicleLogger file
- [x] The sqlite experimental warning does not paint over the text menu

## Database

- [x] Default engine is sqlite3 file `noderbac.sqlite3`. mysql schema name is `noderbac`
- [x] The command, the text menu, and the web page each offer sqlite3 and mysql
- [x] `db-init` seeds only when `sys_user` is empty
- [x] A menu, `serve`, or domain verb initializes a missing database before it continues
- [x] Tests do not write `ruoyi_db` or `ry`
- [ ] A live mysql seed against `noderbac_test` was not run on this host

## Document

- [x] README screenshots use absolute raw GitHub URLs
- [x] The live menu fence sits in Quick Installation and shows `**NodeRbac**(*1.0.0*)`
- [x] Seeded passwords are documented with a change-them warning
- [x] No vault path, private key, or live database password in versioned docs
- [x] `screenshots/session-menu.png` is not in the tree

## Publish

- [x] Public repository `cloudgen/NodeRbac` created with GitHub REST. It is public and has no generated commit
- [x] The push identity is the account that answered `Hi cloudgen!`
- [x] Origin fetch and push are `git@github.com:cloudgen/NodeRbac.git`. The previous remotes are not configured
