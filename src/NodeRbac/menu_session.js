// =============================================================================
// Run the text menu until Exit.
// requirement-nodejs-oop — class MenuSession.
// MenuScreenError shares tui.js with class Tui.
// requirement-nodejs-tui — one-second clock wait on the menu boards.
// requirement-nodejs-cli-language — a language pick writes the leaf.
// =============================================================================
import { MenuModel } from "./menu_model.js";
import { MenuPainter } from "./menu_painter.js";

const CLOCK_LAYERS = ["front", "self", "log", "lang", "access", "setup", "audit"];

export class MenuSession {
  // Run the text menu until row 9 Exit. Leaf commands return to the front board.
  // on_kind returns "leave" to close the screen, a string to show a result page,
  // or null to stay. This class does not draw the frame. MenuPainter does.

  constructor(
    appName,
    version,
    onVersion,
    onAbout,
    boards = null,
    onKind = null,
    logger = null,
    painter = null,
  ) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "MenuSession" });
    }
    this.app_name = appName;
    this.version = version;
    this.on_version = onVersion;
    this.on_about = onAbout;
    this.on_kind = onKind;
    this.leave_kind = null;
    if (painter == null) this.painter = new MenuPainter(logger);
    else this.painter = painter;
    this.model = new MenuModel(boards, logger, this.painter);
  }

  leave_to_front() {
    // Return the session to the front board. Does not leave the program.
    this.model.show_front();
  }

  async wait_key(screen) {
    // One key, or null when the one-second clock wait ended with no key.
    // A screen with no timeout keeps getch as it is. -1 stays end of input.
    // requirement-nodejs-tui rule 13. This wait is not a thread and not Esc.
    const showClock = this.model.phase !== "result" && CLOCK_LAYERS.includes(this.model.layer);
    if (typeof screen.timeout === "function") {
      screen.timeout(showClock ? 1000 : -1);
    }
    let key = screen.getch();
    if (key != null && typeof key.then === "function") key = await key;
    if (key === -1 && showClock && typeof screen.timeout === "function") return null;
    return key;
  }

  async run(screen) {
    // Imported here so this module can load before tui.js finishes.
    const { MenuScreenError } = await import("./tui.js");
    screen.keypad(true);
    const [height, width] = screen.getmaxyx();
    if (!this.painter.screen_can_hold(height, width)) {
      throw new MenuScreenError(
        "The text screen is too small for the menu and the input box.",
        this.logger,
      );
    }
    while (true) {
      this.painter.paint(screen, this.model, this.app_name, this.version);
      const [screenHeight] = screen.getmaxyx();
      const key = await this.wait_key(screen);
      if (key == null) continue;
      const action = this.model.apply_key(key, screenHeight);
      if ((await this.take_action(action)) === "exit") return 0;
    }
  }

  async take_action(action) {
    // Run one committed kind. A language pick saves, then returns to the front board.
    if (action === "exit") return "exit";
    if (typeof action === "string" && action.startsWith("set-")) {
      const message = this.painter.language.save(action.slice(4));
      this.model.show_front();
      this.model.notice = message;
      return "stay";
    }
    if (action === "version") {
      this.model.show_result(await this.on_version());
      return "stay";
    }
    if (action === "about") {
      this.model.show_result(await this.on_about());
      return "stay";
    }
    if (action) {
      let outcome = this.on_kind != null ? await this.on_kind(action) : null;
      if (outcome === "leave") {
        this.leave_kind = action;
        return "exit";
      }
      if (typeof outcome === "string" && outcome) this.model.show_result(outcome);
    }
    return "stay";
  }
}
