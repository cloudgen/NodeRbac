// TP-ABOUT — identity, host check, cache chain, and install kind.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { AboutPage } from "../src/NodeRbac/about_page.js";
import { CheckSystem } from "../src/NodeRbac/check_system.js";

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test("TP-ABOUT-01 identity lines and an empty download URL", () => {
  const check = new CheckSystem(null, "NodeRbac", "1.0.0", "node-rbac");
  const page = new AboutPage({
    app_name: "NodeRbac",
    version: "1.0.0",
    console_name: "node-rbac",
    author: "Wong Chun Fai",
    updated: "2026-10-11",
    homepage: "https://github.com/cloudgen/NodeRbac",
    download_url: "",
    usage: "node-rbac login --user-name admin",
    check,
  });
  const text = page.framework_about();
  assert.match(text, /^NodeRbac 1\.0\.0/);
  assert.match(text, /Domain: Online RBAC and centralized configuration/);
  assert.match(text, /Runtime tools: Node\.js, node:sqlite/);
  assert.match(text, /Entry points: node-rbac/);
  assert.match(text, /Now checking your operation system!/);
  assert.match(text, /Architecture: amd64|Architecture: arm64|Architecture: x86|Architecture: /);
  assert.equal(text.includes("curl"), false);
  assert.equal(text.includes("npm install"), false);
  assert.equal(text.includes("cloudgen.wong@gmail.com"), false);
  assert.match(text, /node-rbac login --user-name admin/);
  assert.match(text, /https:\/\/github\.com\/cloudgen\/NodeRbac/);
  const box = page.about_box_lines().join("\n");
  assert.equal(box.split("\n")[0].startsWith("****"), true);
  assert.equal(box.includes("pyenv"), false);
  assert.equal(box.includes("conda"), false);
});

test("TP-ABOUT architecture map and cache folders", () => {
  const check = new CheckSystem(null, "NodeRbac", "1.0.0", "node-rbac");
  assert.equal(check.arch_label("x64"), "amd64");
  assert.equal(check.arch_label("x86_64"), "amd64");
  assert.equal(check.arch_label("aarch64"), "arm64");
  assert.equal(check.arch_label("arm64"), "arm64");
  assert.equal(check.arch_label("ia32"), "x86");
  assert.equal(check.arch_label("i686"), "x86");
  const home = tempDir("noderbac-about-");
  const savedHome = process.env.HOME;
  const savedUser = process.env.USER;
  process.env.HOME = home;
  delete process.env.USER;
  try {
    const isolated = new CheckSystem(null, "NodeRbac", "1.0.0", "node-rbac");
    const preferred = isolated.cache_folder_preferred();
    assert.match(preferred, /cache-NodeRbac-/);
    assert.equal(preferred.includes(path.join(home, ".cache")), false);
    const second = isolated.cache_folder_second_fallback();
    assert.match(second, new RegExp(`${home}/\\.cache/cache-NodeRbac-\\d+$`.replace(/\//g, "\\/")));
    assert.equal(/cache-NodeRbac-[A-Za-z]/.test(path.basename(second)), false);
    const persistence = isolated.persistence_storage();
    assert.equal(persistence, path.join(home, ".local", "NodeRbac"));
    assert.equal(fs.existsSync(preferred), false);
    assert.equal(fs.existsSync(path.join(home, ".local", "NodeRbac")), false);
  } finally {
    if (savedHome == null) delete process.env.HOME;
    else process.env.HOME = savedHome;
    if (savedUser == null) delete process.env.USER;
    else process.env.USER = savedUser;
  }
});

test("TP-ABOUT install kind for a source checkout", () => {
  const check = new CheckSystem(null, "NodeRbac", "1.0.0", "node-rbac");
  const page = new AboutPage({
    app_name: "NodeRbac",
    version: "1.0.0",
    console_name: "node-rbac",
    check,
  });
  const here = path.join(path.dirname(new URL(import.meta.url).pathname), "../src/NodeRbac/cli.js");
  assert.equal(page.install_kind(here), "uninstalled");
  assert.match(page.install_sentence("uninstalled"), /UNINSTALLED/);
  assert.match(page.install_sentence("global"), /GLOBAL/);
  assert.match(page.install_sentence("local"), /LOCAL/);
});
