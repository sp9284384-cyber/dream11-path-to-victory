// api/sports.js - Vercel serverless function
// Fetches real live sports data from SerpAPI Google Sports engine
// and returns structured match/game info formatted by sport.

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const SERP_KEY = process.env.SERPAPI_KEY;
  if (!SERP_KEY) return res.status(503).json({ error: "SERPAPI_KEY not configured" });

  const requestedSport = (req.query?.sport || "").toLowerCase().trim();
  const kgmid          = req.query?.kgmid || (requestedSport === "football" ? "/g/11yf4mtmkl" : "/g/11zcgpk5v8");
  const sp             = req.query?.sp    || "ft";
  const type           = req.query?.type  || "game";

  try {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_sports");
    url.searchParams.set("kgmid", kgmid);
    url.searchParams.set("sp", sp);
    url.searchParams.set("type", type);
    url.searchParams.set("hl", "en");
    url.searchParams.set("api_key", SERP_KEY);

    const r = await fetch(url.toString());
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return res.status(502).json({ error: `SerpAPI ${r.status}`, detail: body.slice(0, 200) });
    }

    const data = await r.json();

    // ── Normalise game_results into a stable shape ──────────────────────────
    const rawData = data.game_results || data.sports_results || [];
    const rawList = Array.isArray(rawData) ? rawData : (rawData && typeof rawData === "object" ? [rawData] : []);
    const games = rawList.map(g => normaliseGame(g, requestedSport));

    return res.status(200).json({
      source: "serpapi",
      sport_detected: games[0]?.sport || requestedSport || "cricket",
      fetched_at: new Date().toISOString(),
      games,
      raw_count: games.length,
    });
  } catch (e) {
    return res.status(502).json({ error: "upstream failed", detail: e.message });
  }
};

// ── Normaliser ──────────────────────────────────────────────────────────────
function normaliseGame(g, requestedSport = "") {
  const info = g.info || g;
  const leagueName = (info.league?.name || g.league || g.tournament || "").toLowerCase();

  // Detect sport accurately
  const isCricket = requestedSport === "cricket" ||
    leagueName.includes("cricket") || leagueName.includes("icc") || leagueName.includes("ipl") || leagueName.includes("t20") ||
    info.teams?.some(t => t.score_per_innings) || info.toss != null;

  const isFootball = !isCricket && (requestedSport === "football" ||
    leagueName.includes("premier") || leagueName.includes("liga") || leagueName.includes("serie") || leagueName.includes("uefa") || leagueName.includes("football") || leagueName.includes("soccer") ||
    info.teams?.[0]?.goal_summary || Array.isArray(info.teams?.[0]?.goals));

  const isBasketball = !isCricket && !isFootball && (requestedSport === "basketball" ||
    leagueName.includes("nba") || leagueName.includes("basket") || leagueName.includes("wnba"));

  const isKabaddi = !isCricket && !isFootball && !isBasketball && (requestedSport === "kabaddi" ||
    leagueName.includes("kabaddi") || leagueName.includes("pkl"));

  let sport = "cricket";
  if (isCricket) sport = "cricket";
  else if (isFootball) sport = "football";
  else if (isBasketball) sport = "basketball";
  else if (isKabaddi) sport = "kabaddi";
  else if (requestedSport) sport = requestedSport;

  // Teams
  const teams = (info.teams || g.teams || []).map(t => {
    // In cricket, scores are inside score_per_innings array
    const inn = (Array.isArray(t.score_per_innings) && t.score_per_innings[0]) || {};
    const runs = t.score ?? t.runs ?? inn.runs ?? null;
    const wickets = t.wickets ?? inn.wickets ?? null;
    const overs = t.overs ?? (inn.overs != null ? `${inn.overs}${inn.balls ? "." + inn.balls : ""}` : null);
    const scoreOriginal = inn.score_original || (runs != null ? (wickets != null ? `${runs}/${wickets}` : `${runs}`) : null);

    return {
      name: t.name || t.short_name || t.team_name || "?",
      shortName: t.short_name || t.name || "?",
      code: t.short_code || null,
      score: runs ?? scoreOriginal ?? t.points ?? 0,
      scoreOriginal: scoreOriginal || runs || "0",
      wickets: wickets,
      overs: overs,
      win: t.win ?? false,
      logo: t.thumbnail || t.logo || null,
      goals: (t.goal_summary || []).map(item => ({
        player: item.player?.name || item.player?.short_name || "Unknown",
        minute: item.goals?.[0]?.in_game_time?.minute ?? null,
        og: item.goals?.[0]?.extensions?.includes("OG") || false
      })),
      redCards: (t.red_card_summary || []).map(rc => rc.player?.name || rc.player?.short_name).filter(Boolean)
    };
  });

  // Status / result / venue
  const status   = info.summary_text || info.status_original || info.status || g.status || "Match Completed";
  const result   = info.summary_text || g.result || info.status_original || "Match finished";
  const venue    = info.venue?.name || g.venue || null;
  const date     = info.start_time || g.date || null;
  const league   = info.league?.name || g.league || (isCricket ? "ICC Cricket" : "Sports League");
  const toss     = info.toss || null;

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

  if (toss && events.length === 0) {
    events.push({ over: "Toss", desc: toss, type: "toss" });
  }

  return { teams, status, result, venue, date, league, sport, toss, events };
}
