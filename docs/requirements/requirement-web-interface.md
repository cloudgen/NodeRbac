**file**: docs/requirements/requirement-web-interface.md
**Status**: Active (Version 1.1.0)
**Area**: domain
**Key**: `requirement-web-interface`
**Philosophy**: CIAO **v2.10.2** / CIAO-Lite (Caution • Intentional • Anti-fragile • Over-engineered / Over-protect)

## 1. Purpose

The web interface is a small standard-library HTTP site. It has no JavaScript. Every list and every form calls the same Access or Catalog method as the text menu. The typed verb `serve` listens in the foreground. Menu row 7 starts the listener in the background and prints the URL.

### 1.1 Human-facing

**In one sentence:** Open the printed URL, choose sqlite3 or mysql, sign in, and the pages you see are the actions your role allows.

| Box | Meaning | Example |
|-----|---------|---------|
| You / this login | The browser on this computer | `http://127.0.0.1:8765/` |
| The other role | The cookie `noderbac_session` | HttpOnly, SameSite=Lax |
| Not this file | The permission strings | `requirement-rbac` |

| Includes | Excludes |
|----------|----------|
| Login, the engine choice, users, roles, menus, departments, posts, parameters, dictionaries, notices, both logs, online users | A Vue bundle or a JSON API clone |
| A hidden CSRF field on POST | A script that fetches the next page |
| Forms only when the account has that permission | Showing an Add button the account cannot use |

## 2. Normative rules

1. **Bind.** The listener **MUST** use `requirement-environment`. The default is `127.0.0.1:8765`.
2. **Cookie.** A successful login **MUST** set `noderbac_session` with `HttpOnly`, `SameSite=Lax`, and `Path=/`, then redirect to `/`. The login page **MUST NOT** print the seed passwords.
3. **CSRF.** A POST other than login **MUST** include a hidden `csrf` field equal to the session row. A mismatch **MUST** be status 400.
4. **Auth.** A page other than `/login` without a session **MUST** redirect to `/login`. A missing permission **MUST** be status 403. Another access error **MUST** be status 400.
5. **Headers.** Each HTML response **MUST** send `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'`.
6. **Escape.** Text placed in HTML **MUST** be escaped. The online page **MUST** show an 8-character token prefix on the button and **MUST** send the full token only as a hidden field. The terminal `online-list` **MUST** show the full token so the operator can pass `--token`.
7. **Handler.** `ThreadingHTTPServer` constructs a nested handler inside `WebApp.make_server`. That nested class is the one exception to one-class-per-module. It **MUST** delegate to `WebApp`.
8. **Nav.** A link **MUST** be omitted when the account lacks the matching list permission.
9. **Engine choice.** The sign-in page **MUST** offer sqlite3, including the default file path, and mysql. The checked value **MUST** be the current engine. A sign-in from loopback **MAY** store a different engine before the password is checked. A sign-in from any other address **MUST NOT** switch the engine. The Database page **MUST** require `system:config:edit` and the session CSRF field. Saving a different engine there **MUST** clear the session cookie, because the session row remains in the previous database.

## 3. Acceptance checks

| ID | Check |
|----|-------|
| AC-1 | Admin login redirects and the users page includes Add a user |
| AC-2 | A POST with the wrong CSRF token is 400 |
| AC-3 | The operator users page omits Add a user and omits clerk |
| AC-4 | The operator roles page is 403 |
| AC-5 | A users request without a cookie redirects to `/login` |
| AC-6 | The sign-in page offers sqlite3, the default file, and mysql |

## Terminologies

| Term | Meaning in this file |
|------|----------------------|
| Session cookie | `noderbac_session`, the token stored in `sys_session` |
| CSRF field | The hidden form value that must match the session row |
| Foreground serve | `node-rbac serve`, which blocks until interrupted |
| Background serve | Menu row 7, which lives until the process exits |

## 7. Status history

| Date | Status | Note |
|------|--------|------|
| 2026-10-11 | Active 1.0.0 | Loopback HTML site, cookie, and CSRF |
| 2026-10-11 | Active 1.1.0 | Sign-in and Database pages choose sqlite3 or mysql |

---

**Last Updated**: 2026-10-11
**Owner**: project maintainers
**Alignment**: Registry `docs/requirements/index.md`; **CIAO** (https://github.com/cloudgen/ciao); CIAO-Lite (https://github.com/cloudgen/ciao-lite).
