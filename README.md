# Bingo Buddy — Cloud Ready Prototype

A working, responsive React + Vite bingo tracker based on the ChatGPT prototype.

## What is included
- 18 manually transcribed cards from the **two most recent photos**, with card number correction.
- Double bingo: two distinct enabled patterns on **the same card**. Union of both pattern sets is used so overlaps count only once.
- All eight 5-ending numbers count as wild; free center counts automatically.
- Choose/disable individual regular and specialty patterns from the printed pattern sheet. Note that specialty orientations and interpretations **must be verified with the bingo hall**.
- Called-ball entry, 75-number keypad, undo and reset, sorted nearest cards and winning alerts.
- Monte Carlo odds estimate (chance at least one of your cards completes two patterns within next 1/3/5/10/20 eligible calls). It does NOT claim to predict other players or being first to win.
- Local auto-save, JSON export/import, optional private Supabase cloud sync by email magic-link authentication.

## Run locally
```bash
npm install
npm run dev
```
Open the local URL Vite prints (usually http://localhost:5173).

## Cloud deploy with Vercel
1. Push the project folder to a GitHub repository (e.g. by opening it in Claude Code).
2. In Vercel, create a project from that repository, choose **Vite** as framework; build command `npm run build`, output directory `dist`.
3. Optional cloud sync: create Supabase project, run `supabase/schema.sql` in SQL Editor. Email authentication should be enabled.
4. Add environment variables in Vercel **and locally in `.env`**:
   - `VITE_SUPABASE_URL` = Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase publishable/anon key (NOT service_role or secret key)
5. In Supabase Authentication > URL Configuration, set Site URL to your deployed domain and add its redirect URL (`https://yourdomain.com/**`). Redeploy.
6. Sign in from the Save / Cloud tab; changes sync for that account after edits. On a new device, sign in and press **Restore latest cloud game**.

## Limitations / next Claude Code tasks
- IMPORTANT: Before real usage verify all 18 manually transcribed cards. The camera OCR/scanner is **not implemented**. Use 'Correct card numbers' for mistakes.
- Several specialty patterns on the photo are partly cropped or visually ambiguous. Confirm positions and whether orientation variations count with the hall. Each variant should be modeled as a distinct named pattern; decide whether two variations of one pattern type may count as two wins.
- The current app treats any two distinct selected patterns as Double Bingo, including overlapping patterns. Confirm rules with the bingo hall. No physical daub detection or automatic OCR.
- App saves ONE active game locally. Cloud table supports multiple rows per user, but the UI currently restores the latest cloud game; add a session list and conflict resolution if needed.
- A user's cloud session must be restored explicitly after login on a second device to avoid overwriting an existing game.
- Odds treat wild numbers as covered already and sample among the remaining eligible non-wild balls. This approximates subsequent *eligible* calls, not necessarily literal caller draws if wild-number balls are still physically drawn and announced.
- Competitor-card counts are not modeled as independent probabilities, and there is no precise first-winner odds estimate yet. Do not display fabricated winning-before-opponents estimates.
- Check whether the bingo hall and state law permit electronic tracking assistance during play.

## Paste into Claude Code
"Review this repository and improve Bingo Buddy. Preserve the 18 provided cards, double bingo any-two-distinct-enabled-pattern rule, and ends-in-5 wild numbers. First verify/fix the specialty pattern variants against photos I attach. Then implement phone camera scanning with manual OCR corrections, authenticated multi-game cloud saving, and deployment to Vercel. Add automated tests covering overlapping patterns, FREE center, wild 5s, and correct winning alerts. Never fabricate odds or assume specialty configurations without verification."
