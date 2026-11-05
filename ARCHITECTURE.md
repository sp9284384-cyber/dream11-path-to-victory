# Engineering Architecture & System Design
## Dream11 "Path to Victory" – Forward Deployed Engineer Prototype

### Overview
**Path to Victory** is an AI-powered live fantasy companion built for Dream11 fans. When a match starts, lineups lock permanently. Standard fantasy platforms only present passive tables and raw point totals. This prototype bridges the gap between on-field action and fan anxiety by computing deterministic winning scenarios and translating them into concise, natural-language guidance in real time.

---

### System Architecture Flow

```
┌────────────────────────────────────────────────────────┐
│               Live Sports Broadcast / Feed             │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            SerpAPI Google Sports Scraper Engine        │
│          (/api/sports serverless edge function)        │
└───────────────────────────┬────────────────────────────┘
                            │ Normalized Match JSON
                            ▼
┌────────────────────────────────────────────────────────┐
│           Deterministic Fantasy Scoring Engine         │
│          (Client-side / Dream11 Rules Evaluator)       │
│   • Captain 2× / VC 1.5× Multipliers                   │
│   • Deficit Calculation (Gap = Leader - MyScore)       │
│   • Scenario Modeling (Needed boundaries/wickets)      │
└───────────────────────────┬────────────────────────────┘
                            │ Structured Facts JSON
                            ▼
┌────────────────────────────────────────────────────────┐
│         Google AI Studio (Gemini 2.0 Flash Lite)       │
│          (/api/explain serverless edge function)       │
│   • Low-latency narrative generation (temperature: 0.3)│
│   • Language Support: English & Hinglish               │
│   • Fallback failover: gemini-3.5-flash-lite           │
└───────────────────────────┬────────────────────────────┘
                            │ Raw AI Text
                            ▼
┌────────────────────────────────────────────────────────┐
│            Client-Side Number Guard (numsOk)           │
│   • Regex extraction of all digits in AI response      │
│   • Set comparison against computed facts              │
│   • Auto-fallback to rule-based text on hallucination  │
└───────────────────────────┬────────────────────────────┘
                            │ Verified Narrative
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Fan Interface & Lock-Screen          │
│   • Multi-Sport Adapters (Cricket/Football/Basketball) │
│   • Lock-screen notification preview                   │
└────────────────────────────────────────────────────────┘
```

---

### Core Engineering Principles (FDE Perspective)

#### 1. The Deterministic vs. Generative Boundary
- **Never allow LLMs to calculate fantasy points or ranks.** Large Language Models are probabilistic and prone to hallucinating arithmetic in high-stress match contexts.
- Points, gaps, remaining overs, and required performances are computed **100% deterministically** by the math engine.
- The LLM is restricted to **linguistic synthesis**: turning strict JSON facts into empathetic, casual fan prose.

#### 2. The Zero-Hallucination Guard (`numsOk`)
Before displaying any AI output, the client extracts every number from the response via regex:
```javascript
function numsOk(text, facts) {
  const allowed = new Set(
    (JSON.stringify(facts).match(/\d+(\.\d+)?/g) || []).concat(["1", "2", "3", "4", "1.5"]).map(Number)
  );
  return (text.match(/\d+(\.\d+)?/g) || []).every(num => allowed.has(Number(num)));
}
```
If Gemini introduces any number not present in the pre-computed facts, the output is discarded and the rule-based backup is presented.

#### 3. Multi-Sport Normalization Adapter
The `/api/sports` microservice normalizes disparate sports data schemas into a uniform fantasy event structure:
- **Cricket:** Parses `score_per_innings`, runs, wickets, overs, balls, DLS adjustments, and toss outcomes.
- **Football:** Extracts goals, minute markers, own goals, yellow/red cards, and possession.
- **Basketball:** Tracks points, quarters, field goal percentages, rebounds, and assists.
- **Kabaddi:** Adapts raid points, tackle points, and all-out bonuses.

#### 4. Resilient Upstream Failover
Google AI Studio free tier models can occasionally experience traffic spikes. `/api/explain.js` implements automatic model cascade:
1. Primary: `gemini-flash-lite-latest` (Sub-400ms TTFT)
2. Failover: `gemini-3.5-flash-lite`
3. Safety Net: Rule-based template generation on HTTP 503/502.

---

### CI/CD Deployment Architecture

```
GitHub Push (main) ──► GitHub Actions Workflow
                             │
                             ├── 1. Lint & Validate (Node --check, JSON lint)
                             ├── 2. Security Scan (Regex scan: 0 hardcoded keys)
                             ├── 3. Vercel Prebuilt Deployment (CLI / Native)
                             └── 4. Production Smoke Tests (HTTP 200 verification)
```

- **Zero-Secret Commits:** All secrets (`SERPAPI_KEY`, `GEMINI_API_KEY`, `VERCEL_TOKEN`) reside exclusively in encrypted repository secrets and Vercel environment variables.
- **Local Dev Parity:** Includes a zero-dependency local Node server (`server.js`) and one-click launcher (`start-local.bat`) for offline experimentation.

---

### Live Artifact References
- **Production URL:** [https://dream11-path-to-victory.vercel.app](https://dream11-path-to-victory.vercel.app)
- **Source Code Repository:** [https://github.com/sp9284384-cyber/dream11-path-to-victory](https://github.com/sp9284384-cyber/dream11-path-to-victory)
