/* =========================================================================
   PLFC TOUCHLINE MANAGER — DOMESTIC CUPS (FA CUP + CARABAO CUP)
   A generic single-elimination engine that runs TWO knockouts through the
   season alongside the four leagues. Every entrant is a real league club (no
   placeholders). Clubs enter at staged rounds — minnows early, the biggest
   sides latest — so the field halves cleanly to a Final. On designated
   matchweeks you play a cup tie as well as your league game. Draws go to
   penalties; cup goals stay out of the league leaderboards.

   FA Cup: all 92 clubs. The weakest play a First Round; the rest are seeded
   into the 64-team Third Round.
   Carabao Cup: the 72 EFL clubs open in Round One; the 13 "non-European"
   Premier League clubs join in Round Two; the 7 "European" clubs in Round
   Three (European status approximated by squad strength).
   ========================================================================= */

const FA_CUP_ROUNDS = [
  { key: "R1", name: "First Round",   short: "R1",    week: 4 },
  { key: "R3", name: "Third Round",   short: "R3",    week: 9 },
  { key: "R4", name: "Fourth Round",  short: "R4",    week: 14 },
  { key: "R5", name: "Fifth Round",   short: "R5",    week: 19 },
  { key: "QF", name: "Quarter-Final", short: "QF",    week: 25 },
  { key: "SF", name: "Semi-Final",    short: "SF",    week: 30 },
  { key: "F",  name: "Final",         short: "Final", week: 36 },
];
const CARABAO_ROUNDS = [
  { key: "R1", name: "Round One",     short: "R1",    week: 2 },
  { key: "R2", name: "Round Two",     short: "R2",    week: 6 },
  { key: "R3", name: "Round Three",   short: "R3",    week: 11 },
  { key: "R4", name: "Round Four",    short: "R4",    week: 16 },
  { key: "QF", name: "Quarter-Final", short: "QF",    week: 22 },
  { key: "SF", name: "Semi-Final",    short: "SF",    week: 27 },
  { key: "F",  name: "Final",         short: "Final", week: 33 },
];

const Cup = {
  // Build functions return { participants: <round-0 field ids>, entrantsByRound:
  // { roundIndex: [ids joining at that round] } }.
  CUPS: {
    fa: {
      key: "fa", stateKey: "faCup", name: "FA Cup", rounds: FA_CUP_ROUNDS,
      build(state) {
        const ranked = state.clubs.slice().sort((a, b) => Stats.clubStrength(a) - Stats.clubStrength(b));
        const total = ranked.length;
        const prelimPlay = Math.max(0, 2 * (total - 64)); // play down to a 64-team Third Round
        const participants = ranked.slice(0, prelimPlay).map(c => c.id);
        const byes = ranked.slice(prelimPlay).map(c => c.id);
        return { participants, entrantsByRound: { 1: byes } };
      },
    },
    efl: {
      key: "efl", stateKey: "eflCup", name: "Carabao Cup", rounds: CARABAO_ROUNDS,
      build(state) {
        const byStrength = list => list.slice().sort((a, b) => Stats.clubStrength(b) - Stats.clubStrength(a)).map(c => c.id);
        const efl = byStrength(state.clubs.filter(c => c.league === "CH" || c.league === "L1" || c.league === "L2"));
        const pl = byStrength(state.clubs.filter(c => c.league === "PL"));
        const eflByes = efl.slice(0, 2);      // 2 strongest EFL sides skip Round One
        const round1 = efl.slice(2);           // remaining EFL clubs open the cup
        const euroPL = pl.slice(0, 7);         // "in Europe" — enter latest, Round Three
        const nonEuroPL = pl.slice(7);         // enter Round Two
        return { participants: round1, entrantsByRound: { 1: [...eflByes, ...nonEuroPL], 2: euroPL } };
      },
    },
  },

  initAll(state) { Object.values(this.CUPS).forEach(cfg => this.init(state, cfg)); },
  initCareer(state) { this.initAll(state); },
  initSeason(state) { this.initAll(state); },

  init(state, cfg) {
    const { participants, entrantsByRound } = cfg.build(state);
    let userEntryRound = participants.includes(state.clubId) ? 0 : null;
    if (userEntryRound === null) {
      for (const r of Object.keys(entrantsByRound)) {
        if (entrantsByRound[r].includes(state.clubId)) { userEntryRound = Number(r); break; }
      }
    }
    state[cfg.stateKey] = {
      season: state.season, roundIndex: 0, drawnRound: -1,
      participants, entrantsByRound, userEntryRound: userEntryRound == null ? 0 : userEntryRound,
      ties: [], winner: null, userOut: false, userExitRound: null, skipped: false,
    };
  },

  // ---- lookups & status ----------------------------------------------------

  isActive(fc) { return !!(fc && !fc.skipped); },
  clubByAnyId(state, id) { return state.clubs.find(c => c.id === id) || null; },
  clubName(state, id) { const c = this.clubByAnyId(state, id); return c ? c.name : id; },
  clubShort(state, id) { const c = this.clubByAnyId(state, id); return c ? c.short : id; },
  roundForWeek(cfg, week) { return cfg.rounds.find(r => r.week === week) || null; },
  currentRoundDef(cfg, fc) { return cfg.rounds[fc.roundIndex] || null; },
  userHasBye(fc) { return fc.winner == null && !fc.userOut && fc.roundIndex < fc.userEntryRound; },
  userTie(state, fc) {
    if (!this.isActive(fc)) return null;
    return fc.ties.find(t => t.home === state.clubId || t.away === state.clubId) || null;
  },

  // ---- drawing & resolving -------------------------------------------------

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  drawRound(state, fc) {
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

  simulateOtherTies(state, fc) {
    fc.ties.forEach(t => {
      if (t.played || t.home === state.clubId || t.away === state.clubId) return;
      const home = this.clubByAnyId(state, t.home);
      const away = this.clubByAnyId(state, t.away);
      const { hg, ag } = MatchEngine.simulateQuick(home, away);
      this.applyScore(state, t, hg, ag);
    });
  },

  recordUserTie(state, fc, hg, ag) {
    const tie = this.userTie(state, fc);
    if (tie && !tie.played) this.applyScore(state, tie, hg, ag);
    return tie;
  },

  // Advance the bracket once every tie has a winner; new entrants join the
  // survivors for the next round.
  completeRoundIfDone(state, fc) {
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
      const next = fc.roundIndex + 1;
      fc.participants = [...winners, ...(fc.entrantsByRound[next] || [])];
      fc.roundIndex = next;
    }
    return true;
  },

  // ---- season-end recap ----------------------------------------------------

  seasonSummary(state, fc, cfg) {
    if (!fc || fc.skipped) return null;
    let userResult = "Did not feature";
    if (fc.winner === state.clubId) userResult = "🏆 Winners";
    else if (fc.userExitRound != null) userResult = "Out in the " + cfg.rounds[fc.userExitRound].name;
    return { name: cfg.name, winner: fc.winner ? this.clubName(state, fc.winner) : "—", userWon: fc.winner === state.clubId, userResult };
  },
};
