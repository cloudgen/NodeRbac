#!/bin/sh
# NodeRbac test runner. requirement-nodejs-project-structure.
# mysql cases skip themselves when noderbac_test cannot be opened.
set -eu
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
exec node --test tests/*.js
