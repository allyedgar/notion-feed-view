// Step 2 of Connect to Notion: swap the code for a token, hand the wizard an encrypted session
const { encrypt, baseUrl, sendError, NOTION_VERSION } = require("./_utils");

module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, baseUrl(req));
    const code = url.searchParams.get("code");
    const oauthError = url.searchParams.get("error");
    if (oauthError) {
      res.writeHead(302, { Location: "/?error=" + encodeURIComponent(oauthError) });
      return res.end();
    }
    if (!code) throw new Error("Missing authorisation code");

    const basic = Buffer.from(
      process.env.NOTION_CLIENT_ID + ":" + process.env.NOTION_CLIENT_SECRET
    ).toString("base64");

    const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: "Basic " + basic,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: baseUrl(req) + "/api/callback",
      }),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok || !data.access_token) {
      throw new Error(data.error_description || data.error || "Token exchange failed");
    }

    const session = encrypt({
      t: data.access_token,
      w: data.workspace_name || "",
    });
    res.writeHead(302, { Location: "/?s=" + encodeURIComponent(session) });
    res.end();
  } catch (e) {
    sendError(res, e);
  }
};
