// TP-LANG-01 — menu language. Primary law: requirement-nodejs-cli-language.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { MenuLanguage } from "../src/NodeRbac/menu_language.js";

function tempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "noderbac-lang-"));
}

function withEnv(updates, work) {
  const saved = {};
  for (const name of Object.keys(updates)) {
    saved[name] = Object.prototype.hasOwnProperty.call(process.env, name)
      ? process.env[name]
      : undefined;
    const value = updates[name];
    if (value == null) delete process.env[name];
    else process.env[name] = value;
  }
  try {
    return work();
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value == null) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("TP-LANG-01 codes, default English, and LANG does not select a code", () => {
  const home = tempHome();
  withEnv(
    { HOME: home, NODERBAC_LANG: null, LANG: "zh_TW.UTF-8", LC_ALL: "zh_TW.UTF-8" },
    () => {
      const language = new MenuLanguage(null, home);
      assert.equal(language.code(), "en");
      assert.equal(language.path_label(), "Path");
      assert.deepEqual(language.codes().slice(0, 3), ["en", "zh-Hans", "zh-Hant"]);
      assert.equal(language.codes().length, 13);
      assert.equal(language.endonym("zh-Hant"), "繁體中文");
      assert.equal(language.endonym("el"), "Ελληνικά");
      assert.equal(language.number_for("zh-Hant"), 43);
      assert.equal(language.code_for_number(41), "en");
      assert.equal(language.code_for_number(40), null);
      assert.equal(language.code_for_number(54), null);
      assert.equal(fs.existsSync(path.join(home, ".local")), false);
    },
  );
});

test("TP-LANG-01 save writes mode 0600 and Traditional Chinese path word", () => {
  const home = tempHome();
  withEnv({ HOME: home, NODERBAC_LANG: null, LANG: "zh_TW.UTF-8" }, () => {
    const language = new MenuLanguage(null, home);
    const leaf = language.leaf_path();
    assert.equal(fs.existsSync(leaf), false);
    const message = language.save("zh-Hant");
    assert.equal(language.code(), "zh-Hant");
    assert.equal(language.path_label(), "路徑");
    assert.equal(fs.readFileSync(leaf, "utf8"), "zh-Hant\n");
    assert.equal(fs.statSync(leaf).mode & 0o777, 0o600);
    assert.equal(fs.statSync(path.dirname(leaf)).mode & 0o777, 0o700);
    assert.match(message, /繁體中文/);
    assert.equal(language.row_short("access", "access"), "access");
    assert.equal(language.row_short("view-log", "view-log"), "view-log");
  });
});

test("TP-LANG-01 invalid leaf stays English and NODERBAC_LANG does not write", () => {
  const home = tempHome();
  withEnv({ HOME: home, NODERBAC_LANG: null, LANG: "zh_TW.UTF-8" }, () => {
    const language = new MenuLanguage(null, home);
    const leaf = language.leaf_path();
    fs.mkdirSync(path.dirname(leaf), { recursive: true, mode: 0o700 });
    fs.writeFileSync(leaf, "nope\nzh-Hant\n");
    fs.chmodSync(path.dirname(leaf), 0o700);
    fs.chmodSync(leaf, 0o600);
    const loaded = new MenuLanguage(null, home);
    assert.equal(loaded.code(), "en");
    assert.equal(loaded.path_label(), "Path");
    assert.equal(fs.readFileSync(leaf, "utf8"), "nope\nzh-Hant\n");
    process.env.NODERBAC_LANG = "zh-Hant";
    const forced = new MenuLanguage(null, home);
    assert.equal(forced.code(), "zh-Hant");
    assert.equal(forced.path_label(), "路徑");
    assert.equal(fs.readFileSync(leaf, "utf8"), "nope\nzh-Hant\n");
    delete process.env.NODERBAC_LANG;
    fs.writeFileSync(leaf, "es\r\n");
    const cr = new MenuLanguage(null, home);
    cr.load();
    assert.equal(cr.code(), "es");
    assert.equal(cr.path_label(), "Ruta");
  });
});

test("TP-LANG-01 a failed write keeps the previous code", () => {
  const home = tempHome();
  withEnv({ HOME: home, NODERBAC_LANG: null }, () => {
    const empty = new MenuLanguage(null, "");
    assert.equal(empty.save("es"), "Could not save the menu language");
    assert.equal(empty.code(), "en");
    const language = new MenuLanguage(null, home);
    language.save("zh-Hant");
    const local = path.join(home, ".local");
    fs.renameSync(local, `${local}.kept`);
    fs.writeFileSync(local, "x");
    const message = language.save("es");
    assert.equal(language.code(), "zh-Hant");
    assert.equal(message, "無法儲存選單語言");
  });
});
