# Dream11 FDE Intern Submission: Path to Victory

**Candidate:** Sunny  
**Role:** Forward Deployed Engineer Intern  
**Working Artifact Link:** [https://dream11-path-to-victory.vercel.app](https://dream11-path-to-victory.vercel.app)  
**GitHub Repository:** [https://github.com/sp9284384-cyber/dream11-path-to-victory](https://github.com/sp9284384-cyber/dream11-path-to-victory)  

---

## Short Note (Submission Response)

### 1. What fan problem are you solving?
Once a match starts, a fantasy fan's team is locked. Standard leaderboards show fluctuating ranks and raw scores, but never explain *why* a rank changed or *what specific on-field event must happen next* for the fan to win. Fans are forced into stressful mental arithmetic across opponent rosters while trying to enjoy the live game.

### 2. How does your solution help?
**"Path to Victory"** pairs live match telemetry with a deterministic scoring engine (Captain 2×, Vice-Captain 1.5×). Instead of raw tables, it translates the live state into 3 actionable sentences in English or Hinglish:
1. What on-field event just impacted your locked roster.
2. Current standing and exact point gap to #1.
3. The single player, wicket, or boundary needed next to close the deficit.

A client-side number guard verifies every digit against computed facts, rejecting hallucinations so fans receive 100% reliable insights.

### 3. Which AI tools did you use?
- **Google AI Studio (Gemini 2.0 Flash Lite / 3.5 Flash Lite):** Low-latency narrative generation strictly conditioned on JSON facts.
- **SerpAPI (Google Sports Engine):** Real-time live scorecards across Cricket, Football, Basketball, and Kabaddi.
- **Vercel Serverless & GitHub Actions CI/CD:** Automated testing, security scanning, and production deployment.

*(Word count: 188 words)*
