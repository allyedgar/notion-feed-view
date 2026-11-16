// List the databases this connection can see, for the wizard's dropdown
const { decrypt, notion, readJson, sendError, plainText } = require("./_utils");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") throw Object.assign(new Error("POST only"), { status: 405 });
    const { s } = await readJson(req);
    const { t } = decrypt(s);

    const results = [];
    let cursor = undefined;
    for (let i = 0; i < 5; i++) {
      const page = await notion(t, "POST", "/search", {
        filter: { property: "object", value: "database" },
        page_size: 100,
        start_cursor: cursor,
      });
      results.push(...page.results);
      if (!page.has_more) break;
      cursor = page.next_cursor;
    }

    const databases = results.map((db) => ({
      id: db.id,
      title: plainText(db.title) || "Untitled database",
      icon: db.icon && db.icon.type === "emoji" ? db.icon.emoji : "",
    }));
    databases.sort((a, b) => a.title.localeCompare(b.title));
    res.status(200).json({ databases });
  } catch (e) {
    sendError(res, e);
  }
};
