// Serverless proxy to the Monday.com GraphQL API.
//
// The browser sends the developer's own Monday personal token in the
// "x-monday-token" header. This function attaches it as the Authorization
// header and relays the GraphQL request to api.monday.com. The token is
// never logged and never stored server-side - it lives only in the caller's
// browser and in this single in-memory request.
//
// Runtime: Vercel Node (Node 18+, global fetch available).

const MONDAY_URL = "https://api.monday.com/v2";

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const token = req.headers["x-monday-token"];
  if (!token) return res.status(401).json({ error: "Missing x-monday-token header" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const query = body && body.query;
  const variables = (body && body.variables) || {};
  if (!query) return res.status(400).json({ error: "Missing GraphQL query" });

  try {
    const upstream = await fetch(MONDAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
        "API-Version": "2024-10",
      },
      body: JSON.stringify({ query, variables }),
    });
    const data = await upstream.json();
    // Pass through Monday's status and payload (including any GraphQL errors).
    return res.status(upstream.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: "Upstream error: " + (e && e.message ? e.message : String(e)) });
  }
};

function setCors(res) {
  // Same-origin in production, but permissive so the page also works if served
  // from a different host during local development.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-monday-token");
}
