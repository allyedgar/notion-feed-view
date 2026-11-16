// Shared helpers for all API routes
const crypto = require("crypto");

const NOTION_VERSION = "2022-06-28";

function key() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) throw new Error("ENCRYPTION_KEY env var is not set");
  return crypto.createHash("sha256").update(secret).digest();
}

// Encrypt a JS object -> base64url blob (AES-256-GCM)
function encrypt(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(obj), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

// Decrypt base64url blob -> JS object (throws if tampered)
function decrypt(blob) {
  const buf = Buffer.from(blob, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString("utf8"));
}

async function notion(token, method, path, body) {
  const res = await fetch("https://api.notion.com/v1" + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.message ? data.message : "Notion API error " + res.status;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

function baseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return proto + "://" + host;
}

async function readJson(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function sendError(res, e) {
  const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 500;
  res.status(status).json({ error: e.message || "Something went wrong" });
}

// Pull plain text out of a Notion rich_text / title array
function plainText(arr) {
  return (arr || []).map((t) => t.plain_text || "").join("");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { encrypt, decrypt, notion, baseUrl, readJson, sendError, plainText, sleep, NOTION_VERSION };
