// Shared helper for the Vercel functions: fetch CoinGecko server-side and let Vercel's CDN cache the answer,
// so every visitor shares one cached response (no per-visitor rate limits, no browser CORS problems).
async function proxy(res, url, valid) {
  try {
    const r = await fetch(url, { headers: { accept: "application/json", "user-agent": "lenstedreal-quantum-terminal" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    if (!valid(data)) throw new Error("empty");
    res.setHeader("Cache-Control", "public, s-maxage=45, stale-while-revalidate=600");
    res.status(200).json(data);
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(502).json({ error: "upstream", detail: String((e && e.message) || e) });
  }
}
module.exports = { proxy };
