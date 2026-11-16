// List the databases this connection can see, for the wizard's dropdown
const { decrypt, notion, readJson, sendError, plainText } = require("./_utils");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") throw Object.assign(new Error("POST only"), { status: 405 });
    const { s } = await readJson(req);
    const { t } = decrypt(s);

    const results = [];
    let cursor = undefined;
    let pages = 0;
    do {
      const page = await notion(t, "POST", "/search", {
        filter: { property: "object", value: "database" },
        page_size: 100,
        start_cursor: cursor,
      });
      results.push(...page.results);
      if (!page.has_more) break;
      cursor = page.next_cursor;
      if (++pages >= 100) throw new Error("Too many databases to list. Paste the exact database link instead.");
    } while (cursor);

    const parents = new Map();
    for (const db of results) {
      const id = db.parent && db.parent.page_id;
      if (!id || parents.has(id)) continue;
      try {
        const page = await notion(t, "GET", "/pages/" + id);
        const title = Object.values(page.properties || {}).find(p => p.type === "title");
        parents.set(id, title ? plainText(title.title) : "");
      } catch { parents.set(id, ""); }
    }
    const databases = results.map((db) => ({
      id: db.id,
      parentTitle: parents.get(db.parent && db.parent.page_id) || "",
      url: db.url || "",
      title: plainText(db.title) || "Untitled database",
      icon: db.icon && db.icon.type === "emoji" ? db.icon.emoji : "",
    }));
    databases.sort((a, b) => a.title.localeCompare(b.title));
    res.status(200).json({ databases });
  } catch (e) {
    sendError(res, e);
  }
};

