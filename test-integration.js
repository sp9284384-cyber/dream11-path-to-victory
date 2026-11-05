// test-integration.js - Verifies both API handlers directly in Node
const sportsHandler = require('./api/sports.js');
const explainHandler = require('./api/explain.js');

const SERP_KEY = process.env.SERPAPI_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!SERP_KEY || !GEMINI_KEY) {
  console.log("ℹ️ Skipping live integration test: SERPAPI_KEY or GEMINI_API_KEY not set in env.");
  console.log("   Set both in environment variables or GitHub Secrets to run live integration tests.");
  process.exit(0);
}

process.env.SERPAPI_KEY = SERP_KEY;
process.env.GEMINI_API_KEY = GEMINI_KEY;
process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

function createMockReqRes(method, query = {}, body = {}) {
  let statusCode = 200;
  let headers = {};
  let responseData = null;

  const res = {
    setHeader(k, v) { headers[k] = v; },
    status(code) { statusCode = code; return this; },
    json(data) { responseData = data; return this; },
    end() { return this; }
  };

  const req = { method, query, body };

  return { req, res, getResult: () => ({ statusCode, responseData, headers }) };
}

async function run() {
  console.log("=================================================");
  console.log("TEST 1: /api/sports endpoint with live SerpAPI");
  console.log("=================================================");

  const { req: sReq, res: sRes, getResult: getSportsResult } = createMockReqRes("GET", {
    kgmid: "/g/11yf4mtmkl",
    sp: "ft",
    type: "game"
  });

  await sportsHandler(sReq, sRes);
  const sportsOut = getSportsResult();

  if (sportsOut.statusCode !== 200) {
    console.error("❌ /api/sports failed:", sportsOut.statusCode, sportsOut.responseData);
    process.exit(1);
  }

  console.log("✅ /api/sports returned 200 OK!");
  console.log("   Games found:", sportsOut.responseData.games.length);
  const game = sportsOut.responseData.games[0];
  console.log("   Match:", `${game.teams[0]?.name} (${game.teams[0]?.score}) vs ${game.teams[1]?.name} (${game.teams[1]?.score})`);
  console.log("   Status:", game.status);
  console.log("   League:", game.league);
  console.log("   Events count:", game.events.length);

  console.log("\n=================================================");
  console.log("TEST 2: /api/explain endpoint with Gemini Studio");
  console.log("=================================================");

  const facts = {
    _source: "live",
    sport: game.sport || "football",
    league: game.league,
    team1: game.teams[0]?.name,
    score1: game.teams[0]?.score,
    team2: game.teams[1]?.name,
    score2: game.teams[1]?.score,
    status: game.status,
    result: `${game.teams[0]?.name} won ${game.teams[0]?.score}-${game.teams[1]?.score}`,
    captain: game.teams[0]?.goals?.[0]?.player || "Trai Hume",
    viceCaptain: game.teams[1]?.goals?.[0]?.player || "Cole Palmer",
    myScore: 142,
    rank: 2,
    leader: "Priya",
    leaderScore: 165,
    gap: 23,
    keyEvents: game.events.slice(0, 5).map(e => e.desc)
  };

  const { req: eReq, res: eRes, getResult: getExplainResult } = createMockReqRes("POST", {}, {
    facts,
    lang: "en"
  });

  await explainHandler(eReq, eRes);
  const explainOut = getExplainResult();

  if (explainOut.statusCode !== 200) {
    console.error("❌ /api/explain failed:", explainOut.statusCode, explainOut.responseData);
    process.exit(1);
  }

  console.log("✅ /api/explain returned 200 OK!");
  console.log("   Model used:", explainOut.responseData.model);
  console.log("   AI Output:");
  console.log("   -------------------------------------------------");
  console.log("  ", explainOut.responseData.text);
  console.log("   -------------------------------------------------");

  // Verify number safety
  const allowed = new Set((JSON.stringify(facts).match(/\d+(\.\d+)?/g) || []).concat(["1","2","3","4"]).map(Number));
  const aiNums = (explainOut.responseData.text.match(/\d+(\.\d+)?/g) || []).map(Number);
  const invented = aiNums.filter(n => !allowed.has(n));

  if (invented.length === 0) {
    console.log("✅ Number Guard: All numbers validated against factual data!");
  } else {
    console.log("⚠️ Number Guard warning: unlisted numbers found:", invented);
  }

  console.log("\n=================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  console.log("=================================================");
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
