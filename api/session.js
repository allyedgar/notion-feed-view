// Turn a manually pasted internal-integration token into an encrypted session blob
// (fallback path for anyone who prefers not to use the Connect button)
const { encrypt, notion, readJson, sendError } = require("./_utils");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") throw Object.assign(new Error("POST only"), { status: 405 });
    const { token } = await readJson(req);
    if (!token || !/^(secret_|ntn_)/.test(token.trim())) {
      throw Object.assign(new Error("That doesn't look like a Notion integration token"), { status: 400 });
    }
    const me = await notion(token.trim(), "GET", "/users/me");
    const workspace =
      (me.bot && me.bot.workspace_name) || me.name || "your workspace";
    const session = encrypt({ t: token.trim(), w: workspace });
    res.status(200).json({ s: session, workspace });
  } catch (e) {
    sendError(res, e);
  }
};
