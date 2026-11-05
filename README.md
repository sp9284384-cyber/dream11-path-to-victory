# Dream11 Path to Victory – Live Fantasy Explainer

A real-time fantasy sports explainer powered by **SerpAPI** (live match data) and **Google AI Studio / Gemini** (AI-worded explanations). Deploy-ready for Vercel with a full GitHub Actions CI/CD pipeline.

---

## Architecture

```
Browser (index.html)
  │
  ├── GET  /api/sports  ──► SerpAPI Google Sports engine ──► live match JSON
  │                                                                 │
  │         (normalised game object returned to browser)            │
  │◄─────────────────────────────────────────────────────────────────┘
  │
  └── POST /api/explain ──► Google AI Studio (Gemini 2.0 Flash Lite)
                                     │
                              3-sentence explanation
                              (numbers verified against facts)
```

**Security rule:** API keys live only in Vercel environment variables — never in the HTML page. The `numsOk()` guard in the browser rejects any AI text that invents a number not present in the computed facts JSON.

---

## Deploy in 5 minutes (Vercel + GitHub)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "feat: live SerpAPI + Gemini AI explainer"
git remote add origin https://github.com/YOUR_USERNAME/dream11-path-to-victory.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Framework preset: **Other** (no build step needed)
4. Click **Deploy**

### 3. Add Environment Variables

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Value | Required |
|----------|-------|----------|
| `SERPAPI_KEY` | your_serpapi_key_here | ✅ For live data |
| `GEMINI_API_KEY` | your_google_ai_studio_key_here | ✅ For AI explanations |
| `GEMINI_MODEL` | `gemini-2.0-flash-lite` | Optional (default) |
| `ANTHROPIC_API_KEY` | your key | Optional fallback |

> ⚠️ **Never** paste keys into `index.html` or any file committed to Git.

### 4. Enable GitHub Actions CI/CD

Add these **GitHub Secrets** (repo → Settings → Secrets → Actions):

| Secret | Where to get it |
|--------|----------------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel env pull` output or project JSON |
| `VERCEL_PROJECT_ID` | `vercel env pull` output or project JSON |

After this, every:
- **Push to `main`** → auto-deploys to production + smoke tests
- **Pull Request** → deploys a preview URL + posts it as a PR comment

---

## API Endpoints

### `GET /api/sports`

Fetches live match data from SerpAPI Google Sports.

| Query param | Default | Description |
|-------------|---------|-------------|
| `kgmid` | `/g/11yf4mtmkl` | Google Knowledge Graph ID for the match/tournament |
| `sp` | `ft` | Sport filter |
| `type` | `game` | Result type |

**Response:**
```json
{
  "source": "serpapi",
  "fetched_at": "2026-11-05T12:00:00.000Z",
  "games": [
    {
      "teams": [{"name":"MI","score":185,"wickets":4,"overs":"20.0"}, ...],
      "status": "MI won by 23 runs",
      "result": "MI won by 23 runs",
      "events": [{"over":"6.3","desc":"Rohit hits a six","player":"Rohit Sharma"}]
    }
  ]
}
```

### `POST /api/explain`

Sends game facts to Gemini and returns a 3-sentence fan explanation.

**Request body:**
```json
{
  "facts": { "_source": "live", "team1": "MI", "score1": 185, "myScore": 142, "rank": 2, "gap": 18, ... },
  "lang": "en"
}
```

**Response:**
```json
{ "text": "MI posted 185/4 in 20 overs...", "model": "gemini" }
```

---

## Finding a kgmid

1. Search Google for a live cricket match (e.g. "IPL MI vs CSK")
2. Click the match in the Sports box
3. Copy the URL — it contains `kgmid=/g/XXXXXXXX`
4. Paste it into the **Live (SerpAPI)** input box

---

## CI/CD Pipeline

```
Push to main
    │
    ├── lint       → validates JSON, Node syntax, HTML structure
    ├── security   → checks for hardcoded secrets
    └── deploy-production
           ├── vercel build --prod
           ├── vercel deploy --prod
           ├── smoke test: index.html returns 200
           └── smoke test: /api/sports responds

Pull Request
    ├── lint + security (same as above)
    └── deploy-preview
           ├── vercel build
           ├── vercel deploy (preview URL)
           └── posts preview URL as PR comment
```

---

## Local development

```bash
# Install Vercel CLI
npm install -g vercel

# Link project (first time)
vercel link

# Pull env vars
vercel env pull .env.local

# Run dev server (hot-reload)
vercel dev
# → Open http://localhost:3000
```

---

## Scoring model (demo mode)

| Role | Multiplier |
|------|-----------|
| Captain | 2× |
| Vice-captain | 1.5× |
| Others | 1× |

Points are computed **deterministically in the browser** from the event feed. The AI only *words* the result — it never calculates. If the AI text contains any number not present in the facts JSON, it is silently discarded and the rule-based text is shown instead.
