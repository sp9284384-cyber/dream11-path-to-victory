// api/explain.js - Vercel serverless function
// Accepts game facts (computed by the front-end deterministic engine OR
// pulled from real SerpAPI data) and returns an AI-worded explanation
// using Google AI Studio (Gemini) as the primary model.

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { facts, lang } = req.body || {};
  const raw = JSON.stringify(facts || {});

  if (!facts || typeof facts !== "object" || raw.length > 4000 || !["en", "hi"].includes(lang))
    return res.status(400).json({ error: "bad input" });

  const G = process.env.GEMINI_API_KEY;
  const A = process.env.ANTHROPIC_API_KEY;
  if (!G && !A) return res.status(503).json({ error: "no key configured" });

  // ── Prompt ──────────────────────────────────────────────────────────────
  const langDesc = lang === "en"
    ? "simple English"
    : "casual Hinglish (Hindi in Roman script mixed with English)";

  const isRealMatch = facts._source === "live";

  const prompt = `You are a friendly ${facts.sport || "cricket"} and fantasy-sports explainer for an Indian fan whose fantasy team is locked and cannot be changed.

${isRealMatch ? "This is REAL live match data fetched from Google Sports." : "This is a simulated demo match."}

Write exactly 3 short sentences in ${langDesc}:
1. What just happened in the match and how it moved the fan's fantasy points.
2. Their current rank, score, and gap to the leader.
3. The single most useful thing to watch for next (player, over, or event).

RULES:
- Use ONLY the numbers from the Facts JSON below — do NOT invent any number.
- Do NOT tell the fan to change their team (it is locked).
- No emojis.
- No markdown, no bullet points, plain prose only.

Facts: ${raw}`;

  try {
    let text = "";

    if (G) {
      // ── Google AI Studio / Gemini ───────────────────────────────────────
      const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": G,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 400, temperature: 0.3 },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
          }),
        }
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        return res.status(502).json({ error: `Gemini ${r.status}`, detail: err?.error?.message });
      }
      const d = await r.json();
      text = ((d.candidates?.[0]?.content?.parts) || [])
        .map(p => p.text || "")
        .join("")
        .trim();
    } else {
      // ── Anthropic fallback ───────────────────────────────────────────────
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": A,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        return res.status(502).json({ error: `Anthropic ${r.status}`, detail: err?.error?.message });
      }
      const d = await r.json();
      text = (d.content || [])
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("")
        .trim();
    }

    if (!text) return res.status(502).json({ error: "empty response from AI" });
    return res.status(200).json({ text, model: G ? "gemini" : "claude" });
  } catch (e) {
    return res.status(502).json({ error: "upstream failed", detail: e.message });
  }
};
