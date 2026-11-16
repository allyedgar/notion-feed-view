// Add any missing special columns to the database, then mint the embed link
const { decrypt, encrypt, notion, readJson, sendError, baseUrl } = require("./_utils");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") throw Object.assign(new Error("POST only"), { status: 405 });
    const { s, db, dateProp, fileProp, title } = await readJson(req);
    const { t } = decrypt(s);
    if (!db || !fileProp) throw Object.assign(new Error("Pick a database and an image column first"), { status: 400 });

    const info = await notion(t, "GET", "/databases/" + db);
    const props = info.properties || {};
    const toAdd = {};
    if (!props["Feed Order"]) toAdd["Feed Order"] = { number: {} };
    if (!props["Approval"]) {
      toAdd["Approval"] = {
        select: {
          options: [
            { name: "Pending", color: "gray" },
            { name: "Approved", color: "green" },
            { name: "Change Requested", color: "yellow" },
          ],
        },
      };
    }
    if (!props["Client Comments"]) toAdd["Client Comments"] = { rich_text: {} };
    if (Object.keys(toAdd).length) {
      await notion(t, "PATCH", "/databases/" + db, { properties: toAdd });
    }

    const c = encrypt({ t, db, d: dateProp || "", f: fileProp });
    const embedUrl =
      baseUrl(req) + "/embed.html?c=" + encodeURIComponent(c) +
      (title ? "&title=" + encodeURIComponent(title) : "");
    res.status(200).json({ embedUrl, readonlyUrl: embedUrl + "&readonly=1" });
  } catch (e) {
    sendError(res, e);
  }
};
