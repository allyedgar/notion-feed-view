// Step 1 of Connect to Notion: send the user to Notion's own permission screen
const { baseUrl, sendError } = require("./_utils");

module.exports = (req, res) => {
  try {
    const clientId = process.env.NOTION_CLIENT_ID;
    if (!clientId) throw new Error("NOTION_CLIENT_ID env var is not set");
    const redirect = baseUrl(req) + "/api/callback";
    const url =
      "https://api.notion.com/v1/oauth/authorize" +
      "?client_id=" + encodeURIComponent(clientId) +
      "&response_type=code&owner=user" +
      "&redirect_uri=" + encodeURIComponent(redirect);
    res.writeHead(302, { Location: url });
    res.end();
  } catch (e) {
    sendError(res, e);
  }
};
