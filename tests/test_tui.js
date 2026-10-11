// TP-TUI-09 path label. TP-TUI-10 wide columns. Front board has no session row.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { MenuModel } from "../src/NodeRbac/menu_model.js";
import { MenuPainter, curses } from "../src/NodeRbac/menu_painter.js";
import { Tui } from "../src/NodeRbac/tui.js";

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
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

test("TP-TUI-09 English Path until a saved language, and LANG does not select it", () => {
  const home = tempDir("noderbac-tui-");
  const folder = tempDir("noderbac-cwd-");
  const previous = process.cwd();
  withEnv(
    {
      HOME: home,
      NODERBAC_LANG: null,
      LANG: "zh_TW.UTF-8",
      LANGUAGE: "zh_TW:zh",
      LC_ALL: "zh_TW.UTF-8",
      LC_MESSAGES: "zh_TW.UTF-8",
    },
    () => {
      process.chdir(folder);
      try {
        assert.equal(MenuPainter.PATH_LABEL_EN, "Path");
        assert.equal(MenuPainter.PATH_LABEL_ZH_HANT, "路徑");
        const painter = new MenuPainter(null, home);
        assert.equal(painter.path_label(), "Path");
        const clock = "14:05:09";
        painter.clock_text = () => clock;
        const current = path.resolve(folder);
        const logical = `Path: ${current}  ${clock}`;
        assert.equal(painter.path_line(), logical);
        assert.equal(logical.includes("路徑"), false);
        const narrow = "Path: ".length + 4;
        const shortened = painter.path_line(narrow);
        assert.equal(shortened, `Path: ${current.slice(-4)}`);
        assert.equal(shortened.includes(clock), false);
        const session = new Tui(null, "NodeRbac", "1.0.0");
        session.painter = new MenuPainter(null, home);
        session.painter.clock_text = () => clock;
        for (const line of [
          session.front_lines()[0],
          session.self_lines()[0],
          session.log_lines()[0],
          session.language_lines()[0],
        ]) {
          assert.equal(line, logical);
          assert.equal(line.startsWith("路徑"), false);
        }
      } finally {
        process.chdir(previous);
      }
    },
  );
});

test("TP-TUI-10 wide columns and the front board rows", () => {
  const home = tempDir("noderbac-wide-");
  const folder = tempDir("noderbac-wide-cwd-");
  const previous = process.cwd();
  withEnv({ HOME: home, NODERBAC_LANG: null, LANG: "C" }, () => {
    process.chdir(folder);
    try {
      assert.equal(MenuPainter.display_width("╭─╮"), 3);
      assert.equal(MenuPainter.display_width("█"), 1);
      assert.equal(MenuPainter.display_width("路径"), MenuPainter.display_width("Path"));
      assert.equal(MenuPainter.display_width("路徑"), 4);
      assert.equal(MenuPainter.display_width("パス"), 4);
      assert.equal(MenuPainter.display_width("경로"), 4);
      const clock = "14:05:09";
      const painter = new MenuPainter(null, home);
      painter.clock_text = () => clock;
      const wide = 79;
      const english = painter.path_line(wide);
      assert.equal(MenuPainter.display_width(english), wide);
      assert.equal(english.endsWith(clock), true);
      const labels = [
        ["路径", "路", "zh-Hans"],
        ["路徑", "路", "zh-Hant"],
        ["パス", "パ", "ja"],
        ["경로", "경", "ko"],
      ];
      for (const [label, first, code] of labels) {
        process.env.NODERBAC_LANG = code;
        const labeled = new MenuPainter(null, home);
        labeled.clock_text = () => clock;
        assert.equal(labeled.path_label(), label);
        const line = labeled.path_line(wide);
        assert.equal(line.startsWith(`${label}: `), true);
        assert.equal(line.endsWith(clock), true);
        assert.equal(MenuPainter.display_width(line), wide);
        assert.equal(labeled.path_line(1), "");
        assert.equal(labeled.path_line(2), first);
        assert.equal(labeled.path_line(3), first);
        assert.equal(labeled.path_line(5), `${label}:`);
      }
      delete process.env.NODERBAC_LANG;
      const rows = painter.display_rows("front");
      const numbers = rows.map((row) => row[0]);
      assert.deepEqual(numbers, [2, 3, 4, 5, 6, 7, 8, 9]);
      const kinds = rows.map((row) => row[3]);
      assert.deepEqual(kinds, [
        "access",
        "system-log",
        "language",
        "setup",
        "audit",
        "serve",
        "self-management",
        "exit",
      ]);
      assert.equal(kinds.includes("session"), false);
      assert.equal(kinds.includes("self-install"), false);
      assert.equal(kinds.includes("version"), false);
      assert.equal(kinds.includes("about"), false);
      const self = painter.display_rows("self").map((row) => row[3]);
      assert.equal(self.includes("version"), true);
      assert.equal(self.includes("about"), true);
      const model = new MenuModel(null, null, painter);
      const screen = new ColumnScreen();
      painter.paint(screen, model, "NodeRbac", "1.0.0");
      const status = screen.calls.filter((call) => call.text === "NodeRbac" && call.attr === curses.A_BOLD);
      assert.equal(status.length > 0, true);
      const version = screen.calls.find((call) => call.text === "1.0.0");
      assert.ok(version);
      assert.equal(version.attr, curses.A_ITALIC);
      assert.equal(version.x, status[0].x + "NodeRbac".length + 1);
    } finally {
      process.chdir(previous);
    }
  });
});

class ColumnScreen {
  constructor(size = [24, 80]) {
    this.size = size;
    this.calls = [];
  }

  getmaxyx() {
    return this.size;
  }

  erase() {
    this.calls = [];
  }

  addstr(y, x, text, attr = 0) {
    this.calls.push({ y, x, text, attr });
  }

  refresh() {}

  curs_set() {}

  move() {}
}
