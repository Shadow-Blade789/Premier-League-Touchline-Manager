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
js/data.js           Club & player data (all four leagues), career estimation, formations, name pools
js/state.js          Career state, save/load + migration, squad-depth helper
js/lineup.js         Formation handling, best-XI auto-pick
js/match.js          Match engine: quick AI sim + full live commentary timeline
js/stats.js          Player stats, per-league leaderboards, season awards & bonuses
js/cup.js            Domestic cups (FA + Carabao): generic staged-entry knockout engine
js/vertu.js          Vertu Trophy: League One & Two group stage + knockout
js/season.js         Per-league fixtures & tables, promotion/relegation between divisions
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
- **Four divisions**: a 20-club Premier League plus a 24-club Championship,
  League One and League Two — 92 real clubs. Each runs its own separate season
  (a 20-team league is 38 games, a 24-team league 46), table, stats,
  leaderboards and awards. You can start a career in any of them (the club
  picker is grouped by league). The season lasts as long as *your* league;
  divisions that run longer are completed before promotions are worked out.
  Every matchweek your own match is played live and every other game across
  all four divisions is quick-simmed. The lower leagues run on far smaller
  budgets and weaker squads.
- **Promotion & relegation** flow up and down a closed chain
  (PL ⇄ CH ⇄ L1 ⇄ L2). The Championship promotes 3 directly; League One and
  League Two promote 3 directly **plus one play-off winner** from the next
  four (positions 4–7, semis + final, quick-simmed and reported at season's
  end). Relegation counts keep every league at its size. The Premier League
  has European spots; the lower leagues show automatic-promotion, play-off and
  relegation zones. Clubs keep their squads when they change division.
- **Careers survive relegation** all the way down — you just drop a division
  and play on. **League Two has no relegation** (there's nothing below it);
  instead its bottom four is a *sacking zone* — finish there and the board
  dismiss you, ending the career.
- **Shared transfer market**: one market spans all divisions, so you can buy
  from and sell to clubs in any league. Rival AI clubs also **trade among
  themselves** while a window is open — squads churn, money changes hands, and
  players (with their stats and career records) move between clubs — so the
  world isn't static around you. Your own club is never touched automatically.
- **Squad development is league-wide**: every club's players — not just yours —
  gain or lose overall rating each off-season based on the same
  performance-relative model (`Aging.advanceSeason` + `Stats.performanceIndex`).
- **Two domestic cups** run *through* the season as knockouts, not at the end,
  and every entrant is a real club (no placeholders). On a cup week you play
  your league game *and*, if still in, your cup tie — two live matches with
  clear competition banners. Draws go to penalties, cup goals stay out of the
  league leaderboards, and the hub shows a panel per cup with your run and the
  round-by-round schedule. Clubs enter at staged rounds (minnows early, the
  biggest sides latest), so the field halves cleanly to a Wembley final.
  - **FA Cup** — all 92 clubs: the weakest 16 open the First Round, the next
    tier joins the Second Round, and the strongest are seeded into the 64-team
    Third Round; then a clean knockout to the Final.
  - **Carabao Cup** — the 72 EFL clubs open in Round One; the 13
    "non-European" Premier League clubs join in Round Two; the 7 "European"
    clubs (approximated by squad strength) in Round Three.
  - Tune the rounds, weeks and entry structure in `js/cup.js` (a single
    generic engine drives both cups).
- **The Vertu Trophy** (EFL Trophy) is a League One & League Two competition
  (48 clubs): a group stage of 16 groups of three — each club plays the other
  two home and away (3 pts a win) — and the 16 group winners go into a straight
  knockout to the Final at Wembley. If you manage a third- or fourth-tier club
  you play your group games and knockout ties live (the hub shows your group
  table and progress); for anyone else it plays out in the background. Lives in
  `js/vertu.js`.
- **The Community Shield** opens every season (matchweek 1) — last season's
  Premier League champions vs the FA Cup winners (the FA Cup runner-up
  deputises if they're the same club). You play it live if your club is one of
  the two; it doesn't count for the leagues, just the honours board.
- **Trophy cabinet**: the 🏆 button in the top bar opens your manager's honours
  — league titles, FA Cup, Carabao Cup, Vertu Trophy and Community Shields,
  each with a count and the seasons you won them.
- **Career records**: every player carries lifetime totals — appearances,
  goals, assists, clean sheets, saves — that accumulate across seasons.
  Made-up players are seeded with a plausible history estimated from their
  rating, age and position. In the transfer market each listing shows the
  player's career appearances plus the headline stat for their position
  (forwards → goals, midfielders → assists, defenders → clean sheets,
  keepers → saves).
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
- **Season awards** crown a Golden Boot (goals), Playmaker (assists), Best
  Defender (defender clean sheets), Golden Glove (keeper clean sheets) and
  Shot Stopper (saves) at season's end, with full top-five boards. A clean
  sheet is credited to the keeper *and* every starting defender, so it feeds
  both keeper and defender races.
- **Form bonuses** go to the top five of every category at *every* club —
  the winner gets the full boost (+12% goal/assist weighting, +6% defending
  or keeping, +4% keeping for saves), ranks 2–5 a 40% share. They fold into
  the match engine, last one season, must be re-won, and are capped at +25%
  per track (`BONUS_CAP`/`TOP5_BONUS_SCALE` in `js/stats.js`).
- **Performance-based development**: at season's end every player in the
  league has their potential and overall nudged by how they did — judged
  *relative to their own level* (a 64-rated regular surviving the Prem is an
  achievement; an 88 is expected to dominate) and lifted or dragged by how
  their club finished versus its tier. Strong seasons grow players and raise
  ceilings; poor ones trim both. Tune the model in `Stats.performanceIndex`
  (`js/stats.js`) and `Aging.advanceSeason` (`js/state.js`).
- **Scouted potential**: the transfer market reveals a player's potential
  only as a 5-wide band (an 83 shows as `80-85`); your own squad list shows
  each player's exact potential.

## Customizing

- Swap club colors/names/players in `RAW_CLUBS` (`js/data.js`).
- Tune scoring rates in `js/match.js` (`pHomeGoal`/`pAwayGoal` and the
  `simulateQuick` xG formulas) if you want a higher- or lower-scoring league.
- Add formations by extending `FORMATIONS` and `FORMATION_LAYOUT` in
  `js/data.js` (the layout array needs one `[x%, y%]` pair per outfield
  slot, GK first).
