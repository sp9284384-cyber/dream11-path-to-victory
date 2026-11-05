// api/sports.js - Vercel serverless function
// Fetches real live sports data from SerpAPI Google Sports engine
// and returns structured match/game info for the fantasy explainer.

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const SERP_KEY = process.env.SERPAPI_KEY;
  if (!SERP_KEY) return res.status(503).json({ error: "SERPAPI_KEY not configured" });

  // Allow caller to pass ?kgmid= and ?sp= and ?type= as query params,
  // falling back to the default match.
  const kgmid = req.query?.kgmid || "/g/11yf4mtmkl";
  const sp    = req.query?.sp    || "ft";
  const type  = req.query?.type  || "game";

  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_sports");
    url.searchParams.set("kgmid", kgmid);
    url.searchParams.set("sp", sp);
    url.searchParams.set("type", type);
    url.searchParams.set("api_key", SERP_KEY);

    const r = await fetch(url.toString());
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return res.status(502).json({ error: `SerpAPI ${r.status}`, detail: body.slice(0, 200) });
    }

    const data = await r.json();

    // ── Normalise game_results into a stable shape ──────────────────────────
    // SerpAPI returns game_results as either an object (single game detail) or an array
    const rawData = data.game_results || data.sports_results || [];
    const rawList = Array.isArray(rawData) ? rawData : (rawData && typeof rawData === "object" ? [rawData] : []);
    const games = rawList.map(normaliseGame);

    return res.status(200).json({
      source: "serpapi",
      fetched_at: new Date().toISOString(),
      games,
      raw_count: games.length,
    });
  } catch (e) {
    return res.status(502).json({ error: "upstream failed", detail: e.message });
  }
};

// ── Normaliser ──────────────────────────────────────────────────────────────
// Converts Google Sports data shape into something the front-end & AI explainer can rely on.
function normaliseGame(g) {
  const info = g.info || g;

  // Teams
  const teams = (info.teams || g.teams || []).map(t => ({
    name: t.name || t.short_name || t.team_name || "?",
    shortName: t.short_name || t.name || "?",
    code: t.short_code || null,
    score: t.score ?? t.runs ?? null,
    wickets: t.wickets ?? null,
    overs: t.overs ?? null,
    win: t.win ?? false,
    logo: t.thumbnail || t.logo || null,
    goals: (t.goal_summary || []).map(item => ({
      player: item.player?.name || item.player?.short_name || "Unknown",
      minute: item.goals?.[0]?.in_game_time?.minute ?? null,
      og: item.goals?.[0]?.extensions?.includes("OG") || false
    })),
    redCards: (t.red_card_summary || []).map(rc => rc.player?.name || rc.player?.short_name).filter(Boolean)
  }));

  // Status / result / venue
  const status   = info.status_original || info.status || g.status || g.game_spotlight?.status || "Unknown";
  const result   = g.result || info.status_original || g.game_spotlight?.result || null;
  const venue    = info.venue?.name || g.venue || g.game_spotlight?.venue || null;
  const date     = info.start_time || g.date || g.game_spotlight?.date || null;
  const league   = info.league?.name || g.league || g.tournament || "Sports League";
  const sport    = g.sport || (info.league?.name?.toLowerCase().includes("premier") ? "football" : "cricket");

  // Timeline / key events
  const timelineEvents = Array.isArray(g.timeline?.events)
    ? g.timeline.events
    : (Array.isArray(g.highlights) ? g.highlights : (Array.isArray(g.events) ? g.events : []));

  const events = timelineEvents
    .slice(0, 15)
    .map(ev => {
      const min = ev.in_game_time?.minute ? `${ev.in_game_time.minute}'` : (ev.over || ev.time || "");
      const desc = ev.title || ev.description || ev.text || ev.type || "";
      const player = ev.player?.name || ev.player?.short_name || ev.player || null;
      return {
        over: min,
        desc: player ? `${desc} (${player})` : desc,
        player,
        type: ev.type || "event"
      };
    })
    .filter(e => e.desc);

  return { teams, status, result, venue, date, league, sport, events };
}
