#!/bin/sh
# requirement-nodejs-build-script
# Maintainer verbs only. node-rbac flags are not accepted here.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
cd "$ROOT"

PROJECT="NodeRbac"

out_err() {
    printf '%s\n' "$1" >&2
}

read_version() {
    node --input-type=module -e 'import { version } from "./src/NodeRbac/version.js"; if (typeof version !== "string" || !version) process.exit(1); process.stdout.write(version);'
}

VERSION=$(read_version 2>/dev/null || true)

need_version() {
    if [ -z "$VERSION" ]; then
        out_err "ERROR: Cannot read the package version from src/$PROJECT."
        out_err "   Next: set version in src/$PROJECT/version.js to match package.json, then ./build.sh version"
        exit 1
    fi
}

if [ -n "$VERSION" ]; then
    printf '%s\n' "$PROJECT build tool (v$VERSION)"
else
    printf '%s\n' "$PROJECT build tool (version unread)"
fi
printf '%s\n' "========================================"

show_help() {
    cat << EOF
Usage: ./build.sh <command>

Operational commands:
  help       Show this list (also: no command, -h, --help)
  version    Print the package version from this checkout
  setup      Install this package's npm dependencies
  clean      Remove dist and pack tarballs
  build      Pack an npm tarball into dist/
  upload     Publish the tarball in dist/. Does not build first
  git        Ask for one commit message, then stage, commit, and push
  tag        Create and push annotated tag v${VERSION:-unread}
  release    clean, then build, then upload, then tag
  all        Same chain as release
  test-install  Remove this project's global npm install, then install this checkout

Test command:
  test       Run tests/run.sh. No extra arguments.

Examples:
  ./build.sh version
  ./build.sh build
  ./build.sh test
  ./build.sh test-install
  ./build.sh release
EOF
}

do_setup() {
    npm install
}

do_clean() {
    rm -rf dist build
    rm -f ./noderbac-*.tgz
    printf '%s\n' "Clean complete"
}

do_build() {
    mkdir -p dist
    if ! npm pack --pack-destination dist; then
        out_err "ERROR: Package build failed."
        out_err "   Next: ./build.sh setup"
        exit 1
    fi
    printf '%s\n' "Build complete -> dist/"
    ls -lh dist/
}

do_upload() {
    tarball=$(find dist -maxdepth 1 -type f -name 'noderbac-*.tgz' | head -n 1)
    if [ -z "$tarball" ]; then
        out_err "ERROR: Upload failed."
        out_err "   Next: ./build.sh build"
        exit 1
    fi
    if ! npm publish "$tarball"; then
        out_err "ERROR: Upload failed."
        out_err "   Next: ./build.sh build"
        exit 1
    fi
    printf '%s\n' "Upload finished for $PROJECT v$VERSION"
}

do_git() {
    if [ -t 0 ]; then
        printf '%s\n' "Enter commit message:"
        read -r message || message=""
    else
        IFS= read -r message || message=""
    fi
    if [ -z "$message" ]; then
        out_err "ERROR: Commit message is empty."
        out_err "   Next: ./build.sh git"
        exit 1
    fi
    git add .
    git commit -m "$message"
    git push
}

do_tag() {
    need_version
    TAG="v$VERSION"
    printf '%s\n' "Creating and pushing tag: $TAG"
    git tag -a "$TAG" -m "Release $TAG"
    git push origin "$TAG"
}

read_project_name() {
    node -e 'const fs = require("fs"); const data = JSON.parse(fs.readFileSync("package.json", "utf8")); const name = data && data.name; if (typeof name !== "string" || !name.trim()) process.exit(1); process.stdout.write(name.trim());'
}

do_test_install() {
    name=$(read_project_name 2>/dev/null) || name=""
    if [ -z "$name" ]; then
        out_err "ERROR: Cannot read the project name from package.json."
        out_err "   Next: set name, then ./build.sh test-install"
        exit 1
    fi
    listing=$(npm ls -g --depth=0 2>/dev/null || true)
    if printf '%s\n' "$listing" | grep -F -q -- "${name}@"; then
        printf '%s\n' "Removing previous install of $name"
        if ! npm uninstall -g -- "$name"; then
            out_err "ERROR: Could not remove the installed copy."
            out_err "   Next: ./build.sh test-install"
            exit 1
        fi
    else
        printf '%s\n' "No previous install of $name"
    fi
    printf '%s\n' "Installing this checkout"
    if ! npm install -g -- "$ROOT"; then
        out_err "ERROR: Local install failed."
        out_err "   Next: ./build.sh test-install"
        exit 1
    fi
}

cmd=${1:-}
case "$cmd" in
    -h|--help|help|"")
        show_help
        ;;
    version)
        need_version
        printf '%s\n' "$PROJECT build tool (v$VERSION)"
        ;;
    setup)
        do_setup
        ;;
    clean)
        do_clean
        ;;
    build)
        do_build
        ;;
    upload)
        do_upload
        ;;
    git)
        do_git
        ;;
    tag)
        do_tag
        ;;
    test)
        shift
        if [ "$#" -ne 0 ]; then
            out_err "ERROR: ./build.sh test takes no extra arguments."
            out_err "   Next: ./build.sh test"
            exit 1
        fi
        if [ ! -f ./tests/run.sh ]; then
            out_err "ERROR: tests/run.sh is not in this checkout."
            out_err "   Next: add the suite runner, then ./build.sh test"
            exit 1
        fi
        ./tests/run.sh
        ;;
    test-install)
        shift
        if [ "$#" -ne 0 ]; then
            out_err "ERROR: ./build.sh test-install takes no extra arguments."
            out_err "   Next: ./build.sh test-install"
            exit 1
        fi
        do_test_install
        ;;
    release|all)
        need_version
        do_clean
        do_build
        do_upload
        do_tag
        ;;
    *)
        out_err "ERROR: Unknown command: $cmd"
        show_help
        exit 1
        ;;
esac

printf '%s\n' "Done."
