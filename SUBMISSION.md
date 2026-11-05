# Dream11 Forward Deployed Engineer Intern — Submission

**Candidate:** Sunny  
**Artifact Link:** [https://dream11-path-to-victory.vercel.app](https://dream11-path-to-victory.vercel.app)  
**Repository:** [https://github.com/sp9284384-cyber/dream11-path-to-victory](https://github.com/sp9284384-cyber/dream11-path-to-victory)

---

### Short Note (Submission Response)

**1. What fan problem are you solving?**  
Once a live match begins, fantasy teams are locked. Fans casually checking scores see confusing leaderboard point shifts without understanding *why* their rank moved, how a specific ball or goal affected their team, or what must happen next for them to win.

**2. How does your solution help?**  
**Path to Victory** connects live sports feeds directly to fantasy contests. Instead of forcing fans to decipher raw numbers, a deterministic scoring engine computes rank deltas and calculates the exact "closer path" (e.g., *"Rohit Sharma (2×) needs 14 more runs to overtake rank #1"*). It displays sport-adaptive scoreboards (Cricket, Football, Basketball, Kabaddi), simulated lock-screen notification previews, and instant Hinglish/English updates.

**3. Which AI tools did you use?**  
- **Google AI Studio (Gemini 2.0 Flash Lite & 3.5 Flash Lite):** Translates computed match facts into personalized, 3-sentence live fan commentary.
- **SerpAPI (Google Sports Engine):** Ingests real-time match events, innings scores, and discipline data.
- **Client-Side Anti-Hallucination Guard:** Validates all AI numbers against factual JSON; discards any hallucinated points before rendering.
- **Vercel & GitHub Actions:** Automated CI/CD deployment pipeline with automated security audits and smoke tests.

*(Word count: 178 words)*
