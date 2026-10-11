// TP-DOC-01 — user document structure. Primary law: requirement-nodejs-readme.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const imageBase = "https://raw.githubusercontent.com/cloudgen/NodeRbac/main/screenshots/";
const headings = [
  "Features",
  "Quick Installation",
  "Usage",
  "Examples",
  "Platform Compatibility",
  "Related Projects",
  "Contributing",
  "License",
  "Last Update",
];
const shots = [
  "login-prompt.png",
  "main-menu-en.png",
  "access-menu.png",
  "system-log.png",
  "language-menu.png",
  "setup-menu.png",
  "audit-menu.png",
  "self-management.png",
  "main-menu-zh-hant.png",
  "main-menu-zh-hans.png",
  "main-menu-ja.png",
];

test("TP-DOC-01 headings, badge, seed, and absolute screenshots", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(manifest.version, "1.0.0");
  assert.match(readme, /^# NodeRbac - online role-based access control and centralized configuration\n/);
  assert.match(readme, /badge\/Version-1\.0\.0-blue/);
  assert.match(readme, /github\/stars\/cloudgen\/NodeRbac/);
  const found = [...readme.matchAll(/^## (.+)$/gm)].map((item) => item[1]);
  assert.deepEqual(found, headings);
  assert.match(readme, /\n### Screenshots\n/);
  const installAt = readme.indexOf("\n## Quick Installation\n");
  const usageAt = readme.indexOf("\n## Usage\n");
  const fenceAt = readme.indexOf("**NodeRbac**(*1.0.0*)");
  assert.ok(installAt >= 0 && fenceAt > installAt && fenceAt < usageAt);
  for (const name of shots) {
    assert.ok(readme.includes(imageBase + name), name);
    assert.ok(fs.statSync(path.join(root, "screenshots", name)).isFile(), name);
  }
  assert.equal(readme.includes("](screenshots/"), false);
  assert.equal(readme.includes("session-menu.png"), false);
  assert.equal(fs.existsSync(path.join(root, "screenshots", "session-menu.png")), false);
  for (const word of ["admin123", "operator123", "clerk123", "lead123", "PBKDF2", "sys_session"]) {
    assert.ok(readme.includes(word), word);
  }
  assert.match(readme, /NODERBAC_ALLOW_REMOTE=yes/);
  assert.match(readme, /~\/\.local\/NodeRbac\/noderbac\.sqlite3/);
  assert.match(readme, /Enter on `db-engine`/);
  assert.match(readme, /mysql is choice 2/);
  assert.match(readme, /--password/);
  assert.equal(/PyRbac|py-rbac|PYRBAC|pyrbac/.test(readme), false);
  assert.equal(readme.includes("vaults/"), false);
  assert.equal(readme.includes(["id", "ed25519"].join("_")), false);
  assert.equal(/\/home\/[A-Za-z0-9_-]+\//.test(readme), false);
  assert.equal(readme.includes("https://pypi.org/"), false);
});
