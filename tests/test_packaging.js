// Packaging law: requirement-nodejs-packaging.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("package.json is noderbac 1.0.0 and does not require mysql2", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(manifest.name, "noderbac");
  assert.equal(manifest.version, "1.0.0");
  assert.equal(manifest.type, "module");
  assert.equal(manifest.bin["node-rbac"], "./src/NodeRbac/cli.js");
  assert.equal(manifest.engines.node, ">=22");
  assert.equal(manifest.homepage, "https://github.com/cloudgen/NodeRbac");
  assert.equal(manifest.dependencies, undefined);
  assert.equal(manifest.optionalDependencies, undefined);
  assert.equal(JSON.stringify(manifest).toLowerCase().includes("password"), false);
});

test("version.js matches package.json", async () => {
  const { version } = await import("../src/NodeRbac/version.js");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(version, manifest.version);
  assert.equal(version, "1.0.0");
});
