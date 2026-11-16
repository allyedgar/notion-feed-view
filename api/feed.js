// Return the feed: every row with an image, ordered by Feed Order (then date, newest first)
const { decrypt, notion, sendError, plainText, baseUrl } = require("./_utils");

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, baseUrl(req));
    const c = url.searchParams.get("c");
    if (!c) throw Object.assign(new Error("Missing config"), { status: 400 });
    const { t, db, d: dateProp, f: fileProp } = decrypt(c);

    const rows = [];
    let cursor = undefined;
    for (let i = 0; i < 5; i++) {
      const page = await notion(t, "POST", "/databases/" + db + "/query", {
        page_size: 100,
        start_cursor: cursor,
      });
      rows.push(...page.results);
      if (!page.has_more) break;
      cursor = page.next_cursor;
    }

    const items = [];
    for (const row of rows) {
      const props = row.properties || {};
      const fp = props[fileProp];
      const files = fp && fp.files ? fp.files : [];
      if (!files.length) continue;
      const f = files[0];
      const img = f.type === "external" ? f.external.url : f.file ? f.file.url : "";
      if (!img) continue;

      let caption = "";
      for (const p of Object.values(props)) {
        if (p.type === "title") { caption = plainText(p.title); break; }
      }
      const dp = dateProp && props[dateProp];
      const date = dp && dp.date ? dp.date.start : "";
      const op = props["Feed Order"];
      const order = op && typeof op.number === "number" ? op.number : null;
      const ap = props["Approval"];
      const approval = ap && ap.select ? ap.select.name : "";
      const cc = props["Client Comments"];
      const comments = cc ? plainText(cc.rich_text) : "";

      items.push({ id: row.id, img, caption, date, order, approval, comments });
    }

    items.sort((a, b) => {
      if (a.order != null && b.order != null) return a.order - b.order;
      if (a.order != null) return -1;
      if (b.order != null) return 1;
      return (b.date || "").localeCompare(a.date || ""); // newest first, like Instagram
    });

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ items });
  } catch (e) {
    sendError(res, e);
  }
};
