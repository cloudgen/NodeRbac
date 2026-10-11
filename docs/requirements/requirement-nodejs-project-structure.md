**file**: docs/requirements/requirement-nodejs-project-structure.md
**Status**: Active (Version 1.0.0)
**Area**: nodejs
**Key**: `requirement-nodejs-project-structure`
**Philosophy**: CIAO **v2.10.2** / CIAO-Lite (Caution • Intentional • Anti-fragile • Over-engineered / Over-protect)

## 1. Purpose

The installable package is `src/NodeRbac`. Tests live in `tests/`. Product law that is committed lives in `docs/requirements/`. Public reviews live in `reviews/` because the rest of `docs/` is gitignored.

### 1.1 Human-facing

**In one sentence:** The code is under `src/NodeRbac`, and the public review notes are under `reviews/`.

| Box | Meaning | Example |
|-----|---------|---------|
| You / this login | A reader of the tree | `src/NodeRbac/cli.js` |
| The other role | gitignore | `docs/**` ignored except `docs/requirements/**` |
| Not this file | The class list | `requirement-nodejs-oop` |

## 2. Normative rules

1. **Package.** Import path `src/NodeRbac`. There is no `src/HelloTui`, no `src/PyRbac`, and no `src/VideoJoin` in this product.
2. **Manifest.** `package.json` is at the repository root. There is no `pyproject.toml`.
3. **Tracked docs.** `docs/requirements/**` is tracked. Other `docs/` trees stay local.
4. **Reviews.** A review, checklist, or test plan that must be in the public repository **MUST** live under `reviews/`.
5. **Screenshots.** Running-menu captures live in `screenshots/` and are tracked.
6. **Samples.** This product has no `sample-videos/` tree.
7. **Build script.** `./build.sh` is tracked at the repository root. Its commands are owned by `requirement-nodejs-build-script`.
8. **Tests.** `tests/run.sh` runs the Node.js test runner. There is no `unittest` module.

## 7. Status history

| Date | Status | Note |
|------|--------|------|
| 2026-10-11 | Active 1.0.0 | `src/NodeRbac`, `package.json`, and `reviews/` |

---

**Last Updated**: 2026-10-11
**Owner**: project maintainers
**Alignment**: Registry `docs/requirements/index.md`; **CIAO** (https://github.com/cloudgen/ciao); CIAO-Lite (https://github.com/cloudgen/ciao-lite).
