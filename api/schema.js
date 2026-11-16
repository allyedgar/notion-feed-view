// Inspect a chosen database: auto-detect the date + image columns,
// and report whether the Feed Order / Approval / Client Comments columns exist yet
const { decrypt, notion, readJson, sendError, plainText } = require("./_utils");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") throw Object.assign(new Error("POST only"), { status: 405 });
    const { s, db } = await readJson(req);
    const { t } = decrypt(s);

    const info = await notion(t, "GET", "/databases/" + db);
    const props = info.properties || {};

    const dateProps = [];
    const fileProps = [];
    for (const [name, p] of Object.entries(props)) {
      if (p.type === "date") dateProps.push(name);
      if (p.type === "files") fileProps.push(name);
    }

    // Best guesses: a column literally called Date / Feed View wins, else first of its type
    const guessDate =
      dateProps.find((n) => /^date$/i.test(n)) ||
      dateProps.find((n) => /date|publish|post/i.test(n)) ||
      dateProps[0] || "";
    const guessFile =
      fileProps.find((n) => /feed view/i.test(n)) ||
      fileProps.find((n) => /feed|image|visual|photo|cover|design/i.test(n)) ||
      fileProps[0] || "";

    res.status(200).json({
      id: info.id,
      title: plainText(info.title) || "Untitled database",
      url: info.url || "",
      dateProps,
      fileProps,
      guessDate,
      guessFile,
      has: {
        feedOrder: Object.entries(props).some(([n, p]) => n === "Feed Order" && p.type === "number"),
        approval: Object.entries(props).some(([n, p]) => n === "Approval" && p.type === "select"),
        clientComments: Object.entries(props).some(([n, p]) => n === "Client Comments" && p.type === "rich_text"),
      },
    });
  } catch (e) {
    sendError(res, e);
  }
};

