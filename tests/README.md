# Tests — NodeRbac

Executable proof for product law. The public plan is `reviews/test-plan.md`.

## Run

```bash
./tests/run.sh
```

The runner is `node --test tests/*.js`. RBAC cases use a temporary sqlite3 file. A mysql case uses database `noderbac_test` when that server is reachable and skips otherwise. The cases do not write `ruoyi_db` or `ry`.

| File | What it proves |
|------|----------------|
| `test_tui.js` | Path label and wide columns |
| `test_language.js` | Row 4, codes 41–53, `NODERBAC_LANG` |
| `test_about.js` | About page and host check |
| `test_packaging.js` | `package.json` name, version, and engines |
| `test_rbac.js` | Scope, web cookie, CSRF, environment, ChronicleLogger, sqlite3 default |
| `test_docs.js` | README headings, version badge, and absolute screenshot URLs |
