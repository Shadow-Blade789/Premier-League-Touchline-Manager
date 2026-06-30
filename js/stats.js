/* =========================================================================
   PLFC TOUCHLINE MANAGER — PLAYER STATS, LEADERBOARDS & AWARDS
   Season-long per-player tallies (goals, assists, clean sheets, saves,
   appearances), attributed across EVERY match in the league — the user's
   live games and the AI-vs-AI quick sims alike — so the leaderboards and
   end-of-season awards are league-wide and fair. Award winners who play
   for the user's club carry a small, bounded performance bonus into the
   following season.
   ========================================================================= */

// Award categories. `key` matches the per-player stat field; `bonus` is the
// boost handed to a user-club winner for the next season (consumed by the
// match engine). Order here is the order shown on the hub and season-end.
const STAT_DEFS = [
  { key: "goals",       label: "Goals",        short: "G",  award: "Golden Boot",  icon: "🥇", bonus: { goal: 0.12 } },
  { key: "assists",     label: "Assists",      short: "A",  award: "Playmaker",    icon: "🎯", bonus: { assist: 0.12 } },
  { key: "cleanSheets", label: "Clean Sheets", short: "CS", award: "Golden Glove", icon: "🧤", bonus: { keeper: 0.06 } },
  { key: "saves",       label: "Saves",        short: "SV", award: "Shot Stopper", icon: "🧱", bonus: { keeper: 0.04 } },
];
const STAT_KEYS = ["goals", "assists", "cleanSheets", "saves", "apps"];
const BONUS_KEYS = ["goal", "assist", "keeper"];
const BONUS_CAP = 0.25; // a single player can never carry more than +25% in any track

const Stats = {
  blank() { return { goals: 0, assists: 0, cleanSheets: 0, saves: 0, apps: 0 }; },
  blankBonus() { return { goal: 0, assist: 0, keeper: 0 }; },

  // Guarantees a player has well-formed stats/bonus objects (used on load to
  // migrate older saves that predate this feature, and defensively elsewhere).
  ensure(p) {
    if (!p.stats) p.stats = this.blank();
    else STAT_KEYS.forEach(k => { if (p.stats[k] == null) p.stats[k] = 0; });
    if (!p.bonus) p.bonus = this.blankBonus();
    else BONUS_KEYS.forEach(k => { if (p.bonus[k] == null) p.bonus[k] = 0; });
    return p;
  },
  ensureAll(state) { state.clubs.forEach(c => c.squad.forEach(p => this.ensure(p))); },

  resetSeason(state) { state.clubs.forEach(c => c.squad.forEach(p => { p.stats = this.blank(); })); },
  clearBonuses(state) { state.clubs.forEach(c => c.squad.forEach(p => { p.bonus = this.blankBonus(); })); },

  // ---- match attribution ----------------------------------------------------

  // Saves: shots on target faced (scaled to the opponent's attack vs this
  // defence) minus the goals that beat the keeper, with a rare extra stop for
  // a Golden-Glove/Shot-Stopper keeper. Shared by every match so the
  // most-saves race is comparable across the whole division.
  recordSaves(gk, starters, oppStarters, goalsAgainst) {
    const oppAtt = MatchEngine.attackRating(oppStarters);
    const myDef = MatchEngine.defenseRating(starters);
    const keeperBonus = (gk.bonus && gk.bonus.keeper) || 0;
    const sot = poisson(clamp(oppAtt * 0.05 - myDef * 0.025 + 2.2, 0.4, 8));
    let saves = Math.max(0, sot - goalsAgainst);
    if (Math.random() < keeperBonus * 5) saves += 1;
    gk.stats.saves += saves;
  },

  // Credit appearances, clean sheet, saves for one side, then hand `goalsFor`
  // goals to scorers/assisters. When `scorers` (an ordered list of player ids
  // straight from the live commentary) is supplied, those exact players are
  // credited so the feed and the stat sheet never disagree; otherwise scorers
  // are drawn fresh (AI matches).
  recordSide(starters, oppStarters, goalsFor, goalsAgainst, scorers) {
    starters.forEach(p => { this.ensure(p); p.stats.apps++; });
    const gk = starters.find(p => p.pos === "GK");
    if (gk) {
      this.ensure(gk);
      if (goalsAgainst === 0) gk.stats.cleanSheets++;
      this.recordSaves(gk, starters, oppStarters, goalsAgainst);
    }

    const attackers = starters.filter(p => p.pos === "FW" || p.pos === "MF");
    const pool = attackers.length ? attackers : starters;
    for (let i = 0; i < goalsFor; i++) {
      let scorer = null;
      if (scorers && scorers[i]) scorer = starters.find(p => p.id === scorers[i]);
      if (!scorer) scorer = MatchEngine.weightedScorer(pool);
      if (!scorer) continue;
      this.ensure(scorer);
      scorer.stats.goals++;
      if (Math.random() < 0.72) {
        const assister = MatchEngine.weightedAssister(pool, scorer);
        if (assister) { this.ensure(assister); assister.stats.assists++; }
      }
    }
  },

  // AI-vs-AI fixtures: both sides attributed from the scoreline alone.
  recordMatch(hStarters, aStarters, hg, ag) {
    this.recordSide(hStarters, aStarters, hg, ag, null);
    this.recordSide(aStarters, hStarters, ag, hg, null);
  },

  // The user's watched match: goals follow the commentary's named scorers.
  recordUserMatch(hStarters, aStarters, hg, ag, homeScorers, awayScorers) {
    this.recordSide(hStarters, aStarters, hg, ag, homeScorers);
    this.recordSide(aStarters, hStarters, ag, hg, awayScorers);
  },

  // ---- leaderboards & awards ------------------------------------------------

  allEntries(state) {
    const out = [];
    state.clubs.forEach(c => c.squad.forEach(p => {
      this.ensure(p);
      out.push({
        id: p.id, name: p.name, pos: p.pos,
        clubId: c.id, clubShort: c.short, mine: c.id === state.clubId,
        stats: p.stats,
      });
    }));
    return out;
  },

  // Ranked list for one stat. Returns the top `n`, plus — when none of the
  // user's players made that cut — their single best performer with the
  // league rank they actually sit at.
  leaderboard(state, key, n = 5) {
    const ranked = this.allEntries(state)
      .filter(e => e.stats[key] > 0)
      .map(e => ({ id: e.id, name: e.name, pos: e.pos, clubShort: e.clubShort, mine: e.mine, value: e.stats[key] }));
    ranked.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
    ranked.forEach((e, i) => { e.rank = i + 1; });
    const top = ranked.slice(0, n);
    const yourBest = top.some(e => e.mine) ? null : (ranked.find(e => e.mine) || null);
    return { key, top, yourBest, all: ranked };
  },

  // The user's own squad ranked within a stat, each tagged with league rank.
  teamLeaders(state, key, n = 5) {
    return this.leaderboard(state, key, Infinity).all.filter(e => e.mine).slice(0, n);
  },

  // One bundle per award category, including the winner and the display board.
  awards(state) {
    return STAT_DEFS.map(def => {
      const lb = this.leaderboard(state, def.key, 5);
      return { def, winner: lb.all[0] || null, top: lb.top, yourBest: lb.yourBest };
    });
  },

  // Clear last season's boosts, then hand fresh ones to any user-club players
  // who topped a category. Returns a digest for the season-end screen.
  assignSeasonBonuses(state, awards) {
    this.clearBonuses(state);
    const myClub = state.clubs.find(c => c.id === state.clubId);
    if (!myClub) return [];
    const granted = [];
    awards.forEach(a => {
      if (!a.winner || !a.winner.mine) return;
      const player = myClub.squad.find(p => p.id === a.winner.id);
      if (!player) return; // winner may have retired in the off-season
      this.ensure(player);
      Object.entries(a.def.bonus).forEach(([k, v]) => {
        player.bonus[k] = Math.min((player.bonus[k] || 0) + v, BONUS_CAP);
      });
      granted.push({ name: player.name, award: a.def.award, icon: a.def.icon, value: a.winner.value, def: a.def });
    });
    return granted;
  },

  // Human-readable summary of a player's active boosts, e.g. "+12% goals".
  bonusTags(p) {
    if (!p.bonus) return [];
    const tags = [];
    if (p.bonus.goal) tags.push(`+${Math.round(p.bonus.goal * 100)}% goals`);
    if (p.bonus.assist) tags.push(`+${Math.round(p.bonus.assist * 100)}% assists`);
    if (p.bonus.keeper) tags.push(`+${Math.round(p.bonus.keeper * 100)}% keeping`);
    return tags;
  },
};
