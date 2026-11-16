// Approve Post / Make A Change: set Approval and append the comment to Client Comments
const { decrypt, notion, readJson, sendError } = require("./_utils");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") throw Object.assign(new Error("POST only"), { status: 405 });
    const { c, pageId, action, comment } = await readJson(req);
    if (!pageId || !["approve", "change"].includes(action)) {
      throw Object.assign(new Error("Bad request"), { status: 400 });
    }
    const { t } = decrypt(c);

    const properties = {
      Approval: { select: { name: action === "approve" ? "Approved" : "Change Requested" } },
    };

    if (action === "change" && comment && comment.trim()) {
      // Append, don't overwrite — earlier rounds of feedback stay visible
      const page = await notion(t, "GET", "/pages/" + pageId);
      const existing = (page.properties["Client Comments"] || {}).rich_text || [];
      const stamp = new Date().toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      });
      const addition = (existing.length ? "\n" : "") + "[" + stamp + "] " + comment.trim().slice(0, 1800);
      properties["Client Comments"] = {
        rich_text: [
          ...existing.map((r) => ({ type: "text", text: { content: r.plain_text || "" } })),
          { type: "text", text: { content: addition }, annotations: { bold: false } },
        ].slice(-90), // Notion caps rich_text arrays at 100 items
      };
    }

    await notion(t, "PATCH", "/pages/" + pageId, { properties });
    res.status(200).json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
};
