# PLFC Touchline Manager

A Premier League club-management browser game — pick a club, run the transfer
market, set your matchday XI on a tactics board, then watch the match play
out minute-by-minute with live commentary. Built as a static site: plain
HTML/CSS/JS, no build step, no server.

## Play it locally

Just open `index.html` in a browser. Everything (career data, squads,
transfer market, save file) runs client-side and is stored in
`localStorage`.

## Deploy to GitHub Pages

1. Create a new repository (e.g. `plfc-manager`) and push these files to it:
   ```
   git init
   git add .
   git commit -m "PLFC Touchline Manager"
   git branch -M main
   git remote add origin https://github.com/<you>/plfc-manager.git
   git push -u origin main
   ```
2. In the repo settings, go to **Settings → Pages**, set **Source** to
   `Deploy from a branch`, branch `main`, folder `/ (root)`.
3. Your game will be live at `https://<you>.github.io/plfc-manager/` within
   a minute or two.

No build tools, bundlers, or dependencies are required — it's the same
zero-config setup as the original NRL game this was modeled on.

## How it's structured

```
index.html          All screens (start, hub, squad, market, lineup, match, table)
css/styles.css       Design tokens + all styling
js/data.js           Club & player data, formations, name pools
js/state.js          Career state, save/load, squad-depth helper
js/lineup.js         Formation handling, best-XI auto-pick
js/match.js          Match engine: quick AI sim + full live commentary timeline
js/stats.js          Player stats, league leaderboards, season awards & bonuses
js/season.js         Fixture generation, league table, promotion/relegation
js/squad.js          Transfer market (buy/sell)
js/ui.js             Rendering functions
js/main.js           App controller, event wiring, live match player
```

## Gameplay notes

- **Squads** are built around real 2026/27 Premier League rosters (plus
  generated squad depth so every club has enough players for a full XI and
  bench). Player data is a snapshot for gameplay purposes, not a live
  database — real transfers will make it drift out of date. Update the
  `squad` arrays in `js/data.js` whenever you want to refresh a club.
- **Transfer market** listings are freshly generated free agents/loanees
  each reroll, priced off the same rating curve used for your own squad.
- **Season structure** is a real 38-game double round-robin across 20 clubs.
  Top 4 get the Champions League, 5th the Europa League, 6th the Conference
  League, and the bottom 3 are relegated and replaced by three sides pulled
  from a rotating pool of real Championship clubs.
- **Relegation ends your career** (a hard stop, same as falling out of the
  league for real) — you'll get a "Start New Career" prompt rather than
  silently continuing.
- **Live matches** are a precomputed minute-by-minute event timeline
  (goals, chances, cards, subs, half/full time) revealed at your chosen
  speed (1x/2x/4x), with a momentum bar driven by the same model.
- **Player stats** (goals, assists, clean sheets, saves, appearances) are
  tracked for *every* player in the league — your own live matches and the
  AI-vs-AI quick sims alike — so the leaderboards are division-wide. Your
  live match's goals are credited to the exact scorers named in the
  commentary. The hub's **Season Stat Leaders** panel toggles between the
  league top five (your players highlighted, your best appended with their
  rank if they miss the cut) and a **My Squad** view ranked within your team.
- **Season awards** crown a Golden Boot (goals), Playmaker (assists), Golden
  Glove (clean sheets) and Shot Stopper (saves) at season's end, with full
  top-five boards. Any of *your* players who win carry a small, bounded
  **form bonus** into the next season — +12% goal/assist weighting or +4–6%
  goalkeeping — folded into the match engine. Bonuses last one season and
  must be re-won to keep. Tune the categories, bonuses and the `BONUS_CAP`
  in `js/stats.js`.

## Customizing

- Swap club colors/names/players in `RAW_CLUBS` (`js/data.js`).
- Tune scoring rates in `js/match.js` (`pHomeGoal`/`pAwayGoal` and the
  `simulateQuick` xG formulas) if you want a higher- or lower-scoring league.
- Add formations by extending `FORMATIONS` and `FORMATION_LAYOUT` in
  `js/data.js` (the layout array needs one `[x%, y%]` pair per outfield
  slot, GK first).
