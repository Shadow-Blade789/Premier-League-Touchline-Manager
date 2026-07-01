/* =========================================================================
   PLFC TOUCHLINE MANAGER — THE FA CUP
   A single-elimination cup that runs THROUGH the season alongside the four
   leagues: on designated matchweeks you play a cup tie as well as your league
   game. Every entrant is a REAL club from one of the four divisions (no
   placeholders). With 80 clubs, the 32 weakest contest a preliminary First
   Round; the 48 strongest are seeded straight into the 64-team Third Round
   proper, after which it's a clean 64 → 1 knockout. Draws go to penalties,
   and cup goals stay out of the league leaderboards.
   ========================================================================= */

// Rounds, each pinned to a matchweek. field = teams entering that round.
const FA_CUP_ROUNDS = [
  { key: "R1", name: "First Round",   short: "R1",    week: 4,  field: 32 },
  { key: "R3", name: "Third Round",   short: "R3",    week: 9,  field: 64 },
  { key: "R4", name: "Fourth Round",  short: "R4",    week: 14, field: 32 },
  { key: "R5", name: "Fifth Round",   short: "R5",    week: 19, field: 16 },
  { key: "QF", name: "Quarter-Final", short: "QF",    week: 25, field: 8 },
  { key: "SF", name: "Semi-Final",    short: "SF",    week: 30, field: 4 },
  { key: "F",  name: "Final",         short: "Final", week: 36, field: 2 },
];
const FA_PRELIM_SIZE = 32; // weakest clubs that must win a First Round tie

const Cup = {
  ROUNDS: FA_CUP_ROUNDS,

  // Kept for API symmetry with the rest of the app.
  initCareer(state) { this.initSeason(state); },

  // Build a fresh bracket for the new season from all 80 league clubs. The 32
  // weakest (by squad strength) start in the First Round; the other 48 get a
  // bye into the Third Round.
  initSeason(state) {
    const ranked = state.clubs
      .filter(c => c.league === "PL" || c.league === "CH" || c.league === "L1" || c.league === "L2")
      .slice()
      .sort((a, b) => Stats.clubStrength(a) - Stats.clubStrength(b));
    const prelim = ranked.slice(0, FA_PRELIM_SIZE).map(c => c.id);
    const byes = ranked.slice(FA_PRELIM_SIZE).map(c => c.id);
    state.faCup = {
      season: state.season,
      roundIndex: 0,
      drawnRound: -1,
      participants: prelim,   // First Round field
      byes,                   // seeded into the Third Round after the prelim
      userEntryRound: byes.includes(state.clubId) ? 1 : 0, // 0 = First Round, 1 = Third Round
      ties: [],
      winner: null,
      userOut: false,
      userExitRound: null,
      skipped: false,
    };
    delete state.faTeams; // no placeholders anymore
  },

  // ---- lookups & status ----------------------------------------------------

  isActive(state) { return !!(state.faCup && !state.faCup.skipped); },
  clubByAnyId(state, id) { return state.clubs.find(c => c.id === id) || null; },
  clubName(state, id) { const c = this.clubByAnyId(state, id); return c ? c.name : id; },
  clubShort(state, id) { const c = this.clubByAnyId(state, id); return c ? c.short : id; },
  roundForWeek(week) { return FA_CUP_ROUNDS.find(r => r.week === week) || null; },
  currentRoundDef(state) { return FA_CUP_ROUNDS[state.faCup.roundIndex] || null; },
  userHasBye(state) {
    return state.faCup.roundIndex === 0 && state.faCup.userEntryRound === 1;
  },
  userTie(state) {
    if (!this.isActive(state)) return null;
    return state.faCup.ties.find(t => t.home === state.clubId || t.away === state.clubId) || null;
  },

  // ---- drawing & resolving -------------------------------------------------

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  drawRound(state) {
    const fc = state.faCup;
    if (fc.winner || fc.drawnRound === fc.roundIndex) return;
    const pool = this.shuffle(fc.participants.slice());
    const ties = [];
    for (let i = 0; i + 1 < pool.length; i += 2) {
      ties.push({ home: pool[i], away: pool[i + 1], played: false, winner: null, hg: 0, ag: 0, pens: false });
    }
    fc.ties = ties;
    fc.drawnRound = fc.roundIndex;
  },

  penaltyWinner(home, away) {
    const rh = MatchEngine.overallRating(Lineup.starters(home));
    const ra = MatchEngine.overallRating(Lineup.starters(away));
    return Math.random() < rh / (rh + ra) ? home.id : away.id;
  },

  applyScore(state, tie, hg, ag) {
    tie.hg = hg; tie.ag = ag;
    if (hg > ag) tie.winner = tie.home;
    else if (ag > hg) tie.winner = tie.away;
    else {
      tie.pens = true;
      tie.winner = this.penaltyWinner(this.clubByAnyId(state, tie.home), this.clubByAnyId(state, tie.away));
    }
    tie.played = true;
  },

  simulateOtherTies(state) {
    state.faCup.ties.forEach(t => {
      if (t.played || t.home === state.clubId || t.away === state.clubId) return;
      const home = this.clubByAnyId(state, t.home);
      const away = this.clubByAnyId(state, t.away);
      const { hg, ag } = MatchEngine.simulateQuick(home, away);
      this.applyScore(state, t, hg, ag);
    });
  },

  recordUserTie(state, tie, hg, ag) {
    if (!tie.played) this.applyScore(state, tie, hg, ag);
    return tie;
  },

  // Advance the bracket once every tie in the round has a winner. After the
  // First Round the 48 seeded byes join the 16 winners to make the 64.
  completeRoundIfDone(state) {
    const fc = state.faCup;
    if (!fc.ties.length || fc.ties.some(t => !t.played)) return false;
    const winners = fc.ties.map(t => t.winner);
    const userWasIn = fc.ties.some(t => t.home === state.clubId || t.away === state.clubId);
    if (userWasIn && !winners.includes(state.clubId) && !fc.userOut) {
      fc.userOut = true;
      fc.userExitRound = fc.roundIndex;
    }
    if (winners.length === 1) {
      fc.winner = winners[0];
    } else {
      fc.participants = fc.roundIndex === 0 ? [...(fc.byes || []), ...winners] : winners;
      fc.byes = [];
      fc.roundIndex++;
    }
    return true;
  },

  // ---- season-end recap ----------------------------------------------------

  seasonSummary(state) {
    const fc = state.faCup;
    if (!fc || fc.skipped) return null;
    let userResult = "Did not feature";
    if (fc.winner === state.clubId) userResult = "🏆 Winners";
    else if (fc.userExitRound != null) userResult = "Out in the " + FA_CUP_ROUNDS[fc.userExitRound].name;
    return { winner: fc.winner ? this.clubName(state, fc.winner) : "—", userWon: fc.winner === state.clubId, userResult };
  },
};
