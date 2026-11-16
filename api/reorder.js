// Save a drag-and-drop reorder back to Notion as Feed Order numbers
const { decrypt, notion, readJson, sendError, sleep } = require("./_utils");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") throw Object.assign(new Error("POST only"), { status: 405 });
    const { c, order } = await readJson(req);
    if (!Array.isArray(order) || order.length > 300) {
      throw Object.assign(new Error("Bad order payload"), { status: 400 });
    }
    const { t } = decrypt(c);

    for (let i = 0; i < order.length; i++) {
      await notion(t, "PATCH", "/pages/" + order[i], {
        properties: { "Feed Order": { number: i + 1 } },
      });
      await sleep(120); // stay inside Notion's rate limit
    }
    res.status(200).json({ ok: true, saved: order.length });
  } catch (e) {
    sendError(res, e);
  }
};
