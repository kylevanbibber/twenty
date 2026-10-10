# Bingo Buddy

A fast, phone-first bingo tracker (React + Vite). It tracks called balls across all your cards, shows which card is closest to a win, verifies bingos square by square, scans paper cards with the camera, and syncs saved games across devices with Supabase.

## Rules it models
- **Double bingo** (default): two distinct enabled patterns completed on the **same card**. Overlapping squares only need calling once. Single-pattern bingo can be switched on in **Patterns**.
- **Wild 5s**: 5, 15, 25 … 75 count on every card (toggle in **Patterns**). The FREE center always counts.
- The 18 cards transcribed from the two sheet photos, and the printed pattern list, are preserved. Specialty pattern orientations still need confirming with your hall.

## Features
- **Tracker**: type `12` or `B12` (or tap the keypad), see the last call with one-tap undo, call history, cards ranked by numbers still needed, and a **“Wins on the next ball”** list (exact, not simulated). On a win, the phone vibrates and a banner opens a checklist of each square (called as #n / wild / free) for checking against paper.
- **Odds**: Monte Carlo (runs in a Web Worker) giving the chance of a bingo within the next 1–30 calls with a ±95% range, the median number of calls to a win, the best cards, an option for wild balls that are still drawn and announced, and an opponent model that simulates N random standard cards in the hall. The opponent model is labelled as a model: real opponents' cards aren't known.
- **Patterns**: visual previews, enable/disable each pattern, and a tap-to-draw **custom pattern** editor (saved with the game).
- **Cards**: **camera scanning** of one card or a whole sheet (1, 2, 4, 6 or 9-up). OCR runs on the device, using files served from this site. Unsure squares are highlighted yellow, numbers outside their B/I/N/G/O range or duplicated are flagged red, and nothing is saved until you confirm it. You can also type a card by hand, mark cards **verified** against paper, and remove cards.
- **Games**: multiple saved games (new round with the same cards, duplicate, original 18 cards), JSON export/import, and Supabase sign-in by email link **or code** with automatic per-game sync.
- Installable to the home screen (web manifest) and saved on the device after every change.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173 (also on your LAN for testing on a phone)
npm test         # rules, odds and scan-parsing tests
npm run build
```

## Deploy to Vercel
1. In Vercel: **Add New → Project → Import** this GitHub repository.
2. Framework **Vite** (auto-detected from `vercel.json`). Build `npm run build`, output `dist`.
3. Deploy. The app works immediately with on-device saving; cloud sync just needs the two variables below.

## Cloud sync with Supabase
1. Create a Supabase project. In **SQL Editor**, run `supabase/schema.sql` (safe to re-run). It creates `bingo_games` with row-level security so each user only sees their own games.
2. **Authentication → URL Configuration**: set **Site URL** to your Vercel URL (e.g. `https://bingo-buddy.vercel.app`) and add `https://bingo-buddy.vercel.app/**` to Redirect URLs. Add `http://localhost:5173/**` for local testing.
3. Optional but recommended for phones: **Authentication → Email Templates → Magic Link**, add `{{ .Token }}` to the template so the email also contains a code. That lets you sign in inside the home-screen app, where tapping the link would open a different browser.
4. In Vercel **Settings → Environment Variables** (and in a local `.env`), set:
   - `VITE_SUPABASE_URL`: the project URL
   - `VITE_SUPABASE_ANON_KEY`: the **anon / publishable** key (never the service_role or secret key)
5. Redeploy. Sign in from the **Games** tab. On every sign-in, all cloud games are merged with this device's games, keeping the most recently changed copy of each.

## Notes and limits
- Verify transcribed and scanned cards against paper before real play. The **Cards** tab tracks which ones you've checked.
- Scanning works best with a flat, well-lit, straight-on photo. For sheets, choose the layout so each card is cropped separately; photograph single cards if a sheet scan flags a lot.
- Sync is last-write-wins per game. Editing the same game on two devices at once keeps the later edit.
- Check whether your hall and local law permit electronic tracking during play.
