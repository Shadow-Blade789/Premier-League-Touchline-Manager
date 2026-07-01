/* =========================================================================
   PLFC TOUCHLINE MANAGER — THE FA CUP
   A single-elimination cup that runs THROUGH the season alongside the two
   leagues: on six designated matchweeks you play a cup tie as well as your
   league game. The 64-team "competition proper" (Round 3) is the 20 Premier
   League clubs + 20 Championship clubs + 24 fixed lower-league "placeholder"
   minnows (generated once per career and reused every season). Draws are
   settled on penalties; cup goals stay out of the league leaderboards.
   ========================================================================= */

// Six rounds, each pinned to a matchweek so a cup game and a league game share
// certain weeks. field = number of teams entering that round.
const FA_CUP_ROUNDS = [
  { key: "R3", name: "Third Round",   short: "R3",    week: 9,  field: 64 },
  { key: "R4", name: "Fourth Round",  short: "R4",    week: 14, field: 32 },
  { key: "R5", name: "Fifth Round",   short: "R5",    week: 19, field: 16 },
  { key: "QF", name: "Quarter-Final", short: "QF",    week: 25, field: 8 },
  { key: "SF", name: "Semi-Final",    short: "SF",    week: 30, field: 4 },
  { key: "F",  name: "Final",         short: "Final", week: 36, field: 2 },
];

// The 24 lower-league / non-league sides that fill out Round 3. Fixed names so
// the cup feels consistent from season to season. Squads are generated once.
const FA_PLACEHOLDER_CLUBS = [
  { id: "man", name: "Mansfield Town", short: "MAN", colors: ["#FFD700", "#00205B"] },
  { id: "crw", name: "Crawley Town", short: "CRW", colors: ["#D2122E", "#FFFFFF"] },
  { id: "sal", name: "Salford City", short: "SAL", colors: ["#D2122E", "#000000"] },
  { id: "not", name: "Notts County", short: "NOT", colors: ["#000000", "#FFFFFF"] },
  { id: "gri", name: "Grimsby Town", short: "GRI", colors: ["#000000", "#FFFFFF"] },
  { id: "che", name: "Chesterfield", short: "CFC", colors: ["#0033A0", "#FFFFFF"] },
  { id: "yeo", name: "Yeovil Town", short: "YEO", colors: ["#007A33", "#FFFFFF"] },
  { id: "wok", name: "Woking", short: "WOK", colors: ["#D2122E", "#FFFFFF"] },
  { id: "sol", name: "Solihull Moors", short: "SOL", colors: ["#FDB827", "#000000"] },
  { id: "bar", name: "Barnet", short: "BAR", colors: ["#EE7203", "#000000"] },
  { id: "ald", name: "Aldershot Town", short: "ALD", colors: ["#D2122E", "#0033A0"] },
  { id: "eas", name: "Eastleigh", short: "EAS", colors: ["#0033A0", "#FFFFFF"] },
  { id: "alt", name: "Altrincham", short: "ALT", colors: ["#000000", "#FFFFFF"] },
  { id: "gat", name: "Gateshead", short: "GAT", colors: ["#000000", "#FFFFFF"] },
  { id: "bor", name: "Boreham Wood", short: "BOR", colors: ["#FFFFFF", "#000000"] },
  { id: "dag", name: "Dagenham & Redbridge", short: "DAG", colors: ["#D2122E", "#0033A0"] },
  { id: "har", name: "Hartlepool United", short: "HAR", colors: ["#00205B", "#FFFFFF"] },
  { id: "snd", name: "Southend United", short: "SND", colors: ["#00205B", "#FFFFFF"] },
  { id: "tor", name: "Torquay United", short: "TOR", colors: ["#FFCC00", "#00205B"] },
  { id: "hal", name: "Halifax Town", short: "HAL", colors: ["#00205B", "#FFFFFF"] },
  { id: "roc", name: "Rochdale", short: "ROC", colors: ["#00205B", "#FFFFFF"] },
  { id: "old", name: "Oldham Athletic", short: "OLD", colors: ["#00205B", "#FFFFFF"] },
  { id: "sto", name: "Stockport County", short: "STK", colors: ["#0033A0", "#FFFFFF"] },
  { id: "for", name: "Forest Green Rovers", short: "FGR", colors: ["#4C9A2A", "#FFFFFF"] },
];

const Cup = {
  ROUNDS: FA_CUP_ROUNDS,

  // ---- setup ---------------------------------------------------------------

  // A deliberately weak squad (~48-60 rated) so the minnows can be beaten but
  // occasionally spring an upset — the magic of the cup.
  generatePlaceholderSquad(club) {
    const need = { GK: 2, DF: 6, MF: 6, FW: 4 };
    POSITIONS.forEach(pos => {
      for (let i = 0; i < need[pos]; i++) {
        const age = 20 + Math.floor(Math.random() * 14);
        const rating = 48 + Math.floor(Math.random() * 13);
        const { name, nat } = randomProspect();
        const p = P(name, pos, age, rating, { nat });
        p.club = club.id;
        club.squad.push(p);
      }
    });
  },

  // Build the fixed placeholder clubs once per career.
  initCareer(state) {
    state.faTeams = FA_PLACEHOLDER_CLUBS.map(t => {
      const club = {
        id: "fa_" + t.id, name: t.name, short: t.short, nick: t.name,
        city: t.name, stadium: t.name, colors: t.colors, tier: 0, league: "FA",
        crestInitials: t.short, squad: [], formation: "4-4-2", lineup: null, budget: 0,
      };
      this.generatePlaceholderSquad(club);
      return club;
    });
    this.initSeason(state);
  },

  // Reset the bracket for a new season: all 40 league clubs + 24 placeholders.
  initSeason(state) {
    if (!state.faTeams) this.initCareer(state);
    const realIds = state.clubs.filter(c => c.league === "PL" || c.league === "CH").map(c => c.id);
    const faIds = state.faTeams.map(c => c.id);
    state.faCup = {
      season: state.season,
      roundIndex: 0,
      drawnRound: -1,
      participants: [...realIds, ...faIds], // 64
      ties: [],
      winner: null,
      userOut: false,
      userExitRound: null,
      skipped: false,
    };
  },

  // ---- lookups & status ----------------------------------------------------

  isActive(state) {
    return !!(state.faCup && !state.faCup.skipped);
  },
  clubByAnyId(state, id) {
    return state.clubs.find(c => c.id === id) || (state.faTeams || []).find(c => c.id === id) || null;
  },
  clubName(state, id) {
    const c = this.clubByAnyId(state, id);
    return c ? c.name : id;
  },
  clubShort(state, id) {
    const c = this.clubByAnyId(state, id);
    return c ? c.short : id;
  },
  roundForWeek(week) {
    return FA_CUP_ROUNDS.find(r => r.week === week) || null;
  },
  currentRoundDef(state) {
    return FA_CUP_ROUNDS[state.faCup.roundIndex] || null;
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

  // Random pairings among the surviving participants for the current round.
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

  // Quick-sim every tie in the round except the user's (played live).
  simulateOtherTies(state) {
    state.faCup.ties.forEach(t => {
      if (t.played || t.home === state.clubId || t.away === state.clubId) return;
      const home = this.clubByAnyId(state, t.home);
      const away = this.clubByAnyId(state, t.away);
      const { hg, ag } = MatchEngine.simulateQuick(home, away);
      this.applyScore(state, t, hg, ag);
    });
  },

  // Record the user's live cup result.
  recordUserTie(state, tie, hg, ag) {
    if (!tie.played) this.applyScore(state, tie, hg, ag);
    return tie;
  },

  // Once every tie in the round has a winner, advance the bracket.
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
      fc.participants = winners;
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
