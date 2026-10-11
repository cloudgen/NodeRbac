// =============================================================================
// Text tables shared by the terminal and the text menu.
// requirement-domain-noderbac — the same rows on both surfaces.
// requirement-nodejs-oop — class ReportText.
// =============================================================================

export class ReportText {
  // Plain text tables. The web pages use the same row dictionaries.

  constructor(logger = null) {
    this.logger = logger;
    if (logger != null) {
      logger.log_message("instantiated", { component: "ReportText" });
    }
  }

  table(columns, rows) {
    // A header and one line per row. Cells are separated by a bar.
    const lines = [columns.join("|")];
    if (!rows || rows.length === 0) {
      lines.push("(none)");
      return lines.join("\n");
    }
    for (const row of rows) {
      const cells = [];
      for (const name of columns) {
        let value = row[name];
        if (value == null) value = "";
        cells.push(String(value).replaceAll("|", "/").replaceAll("\n", " "));
      }
      lines.push(cells.join("|"));
    }
    return lines.join("\n");
  }

  users(rows) {
    return this.table(
      ["user_id", "user_name", "nick_name", "dept_id", "dept_name", "status"],
      rows,
    );
  }

  roles(rows) {
    return this.table(
      ["role_id", "role_name", "role_key", "data_scope", "status"],
      rows,
    );
  }

  menus(rows) {
    return this.table(
      ["menu_id", "parent_id", "menu_name", "menu_type", "perms"],
      rows,
    );
  }

  depts(rows) {
    return this.table(
      ["dept_id", "parent_id", "dept_name", "ancestors", "status"],
      rows,
    );
  }

  posts(rows) {
    return this.table(
      ["post_id", "post_code", "post_name", "post_sort", "status"],
      rows,
    );
  }

  configs(rows) {
    return this.table(
      ["config_key", "config_name", "config_value", "config_type"],
      rows,
    );
  }

  dicts(rows) {
    return this.table(
      ["dict_type", "dict_label", "dict_value", "status"],
      rows,
    );
  }

  notices(rows) {
    return this.table(
      ["notice_id", "notice_title", "notice_type", "status"],
      rows,
    );
  }

  login_log(rows) {
    return this.table(
      ["info_id", "user_name", "ipaddr", "status", "msg", "login_time"],
      rows,
    );
  }

  oper_log(rows) {
    return this.table(
      ["oper_id", "title", "business_type", "oper_name", "status", "oper_time"],
      rows,
    );
  }

  online(rows) {
    return this.table(
      ["token", "user_name", "ipaddr", "surface", "login_time"],
      rows,
    );
  }
}
