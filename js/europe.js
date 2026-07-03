/* =========================================================================
   PLFC TOUCHLINE MANAGER — EUROPEAN COMPETITIONS
   The three UEFA club competitions run through the season for clubs that
   qualified via last season's league finish:
     • Champions League  — top 4 of each top flight
     • Europa League     — 5th
     • Conference League  — 6th
   Each uses the modern 36-team "League Phase" (a single Swiss-style table):
   every club plays 8 distinct opponents (two from each of four coefficient
   pots, four home and four away). Positions 1–8 go straight to the Round of
   16; 9–24 contest a two-legged knockout playoff for the other eight R16
   spots; 25–36 are eliminated outright (no drop into a lesser competition).
   The knockouts are two-legged (away goals abolished — level aggregate goes to
   a shootout) up to a single-leg Final.

   Because the world currently holds only England + Spain, each 36-team field
   is completed with the strongest remaining clubs by coefficient, standing in
   for the wider continent; as more countries are added the fields fill with
   genuine foreign qualifiers instead. You play YOUR competition in full (the
   whole league-phase table, your ties live); the other two are resolved in the
   background to a champion for the news and the honours board.
   ========================================================================= */

const EURO_COMPS = {
  ucl:  { key: "ucl",  name: "UEFA Champions League",  short: "UCL",  prestige: 3 },
  uel:  { key: "uel",  name: "UEFA Europa League",     short: "UEL",  prestige: 2 },
  uecl: { key: "uecl", name: "UEFA Conference League",  short: "UECL", prestige: 1 },
};
const EURO_COMP_KEYS = ["ucl", "uel", "uecl"];

// League-phase matchdays and the two-legged knockout weeks (0-based, within a
// 38-week top-flight season).
const EURO_MD_WEEKS = [3, 5, 7, 9, 12, 14, 16, 18];
const EURO_STAGE_ORDER = ["playoff", "r16", "qf", "sf", "final"];
const EURO_STAGE_META = {
  playoff: { name: "Knockout Playoff", short: "PO",  legWeeks: [21, 23], twoLeg: true },
  r16:     { name: "Round of 16",      short: "R16", legWeeks: [25, 27], twoLeg: true },
  qf:      { name: "Quarter-Final",    short: "QF",  legWeeks: [29, 31], twoLeg: true },
  sf:      { name: "Semi-Final",       short: "SF",  legWeeks: [33, 35], twoLeg: true },
  final:   { name: "Final",            short: "F",   legWeeks: [37],     twoLeg: false },
};

const Euro = {
  COMPS: EURO_COMPS,
  MD_WEEKS: EURO_MD_WEEKS,

  stageName(key) { return (EURO_STAGE_META[key] || {}).name || key; },
  club(state, id) { return state.clubs.find(c => c.id === id) || null; },
  coeff(club) { return Stats.clubStrength(club) + (club.tier || 0) * 0.4; },
  isActive(state) { return !!(state.euro && state.euro.userComp && state.euro.user); },

  // ---- qualification -------------------------------------------------------

  // Positions 1–4 of each top flight → UCL, 5th → UEL, 6th → UECL. Stored as
  // plain arrays so it survives JSON save/load.
  qualificationFromTables(state, tables) {
    const q = { ucl: [], uel: [], uecl: [] };
    COUNTRIES.forEach(co => {
      const lg = LEAGUE_CHAINS[co][0]; // the country's top flight
      const tbl = tables[lg];
      if (!tbl) return;
      tbl.slice(0, 4).forEach(r => q.ucl.push(r.id));
      if (tbl[4]) q.uel.push(tbl[4].id);
      if (tbl[5]) q.uecl.push(tbl[5].id);
    });
    return q;
  },

  // Season 1 has no prior finish — seed qualification from current strength.
  bootstrapQualification(state) {
    const q = { ucl: [], uel: [], uecl: [] };
    COUNTRIES.forEach(co => {
      const lg = LEAGUE_CHAINS[co][0];
      const clubs = state.clubs.filter(c => c.league === lg)
        .sort((a, b) => Stats.clubStrength(b) - Stats.clubStrength(a));
      clubs.slice(0, 4).forEach(c => q.ucl.push(c.id));
      if (clubs[4]) q.uel.push(clubs[4].id);
      if (clubs[5]) q.uecl.push(clubs[5].id);
    });
    return q;
  },

  // Partition the strongest clubs into three disjoint 36-team fields: guaranteed
  // qualifiers first, then filled by coefficient (UCL gets the pick of the rest).
  buildFields(state, q) {
    const ranked = state.clubs.slice().sort((a, b) => this.coeff(b) - this.coeff(a)).map(c => c.id);
    const assigned = new Set();
    const fields = { ucl: [], uel: [], uecl: [] };
    EURO_COMP_KEYS.forEach(k => (q[k] || []).forEach(id => {
      if (!assigned.has(id)) { fields[k].push(id); assigned.add(id); }
    }));
    EURO_COMP_KEYS.forEach(k => {
      for (const id of ranked) {
        if (fields[k].length >= 36) break;
        if (!assigned.has(id)) { fields[k].push(id); assigned.add(id); }
      }
    });
    return fields;
  },

  // ---- season init ---------------------------------------------------------

  initSeason(state) {
    state.euro = { season: state.season, userComp: null, champions: {}, user: null };
    const q = state.pendingEuro || this.bootstrapQualification(state);
    state.pendingEuro = null;

    const fields = this.buildFields(state, q);
    const userComp = EURO_COMP_KEYS.find(k => (q[k] || []).includes(state.clubId)) || null;
    state.euro.userComp = userComp;

    // Background champions for the competitions the user isn't playing.
    EURO_COMP_KEYS.forEach(k => {
      if (k === userComp) return;
      state.euro.champions[k] = this.resolveBackgroundChampion(state, fields[k]);
    });

    if (userComp) this.setupUserComp(state, userComp, fields[userComp]);
  },

  // A lightweight seeded knockout among a field's 16 strongest, to name a winner.
  resolveBackgroundChampion(state, field) {
    let alive = field.slice()
      .sort((a, b) => Stats.clubStrength(this.club(state, b)) - Stats.clubStrength(this.club(state, a)))
      .slice(0, 16);
    let guard = 0;
    while (alive.length > 1 && guard++ < 8) {
      alive.sort((a, b) => Stats.clubStrength(this.club(state, b)) - Stats.clubStrength(this.club(state, a)));
      const winners = [];
      for (let i = 0; i < alive.length / 2; i++) {
        const hi = this.club(state, alive[i]);
        const lo = this.club(state, alive[alive.length - 1 - i]);
        const { hg, ag } = MatchEngine.simulateQuick(hi, lo);
        winners.push(hg >= ag ? hi.id : lo.id);
      }
      alive = winners;
    }
    return alive[0] || field[0];
  },

  setupUserComp(state, comp, field) {
    const eu = {
      comp, field: field.slice(), pots: [], table: {}, fixtures: [], stage: "league",
      ranking: [], seedOf: {}, ko: null, finalPos: null,
      winner: null, runnerUp: null, userOut: false, userExitStage: null,
    };
    // Four coefficient pots of nine.
    const ranked = field.slice().sort((a, b) => this.coeff(this.club(state, b)) - this.coeff(this.club(state, a)));
    for (let p = 0; p < 4; p++) eu.pots.push(ranked.slice(p * 9, p * 9 + 9));
    field.forEach(id => eu.table[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });

    const { matches, userFixtures } = this.buildSchedule(state, eu);
    userFixtures.forEach((f, i) => { f.week = EURO_MD_WEEKS[i]; f.played = false; f.hg = 0; f.ag = 0; eu.fixtures.push(f); });

    // Spread the background matches across the eight matchdays so the table
    // fills alongside the user's own games rather than all at once up front.
    eu.bgMatches = matches.map((m, i) => ({ home: m.home, away: m.away, week: EURO_MD_WEEKS[i % EURO_MD_WEEKS.length], played: false }));
    state.euro.user = eu;
  },

  // Quick-sim every background league-phase match scheduled for this week.
  simBackgroundMatchday(state, week) {
    if (!this.isActive(state)) return;
    const eu = state.euro.user;
    if (!eu.bgMatches || eu.stage !== "league") return;
    eu.bgMatches.forEach(m => {
      if (m.played || m.week !== week) return;
      const { hg, ag } = MatchEngine.simulateQuick(this.club(state, m.home), this.club(state, m.away));
      this.applyLeagueResult(eu, m.home, m.away, hg, ag);
      m.played = true;
    });
  },

  // An (approximately) 8-regular schedule on the 36 clubs, with the user's eight
  // games locked first (two per pot, four home / four away).
  buildSchedule(state, eu) {
    const ids = eu.field;
    const uid = state.clubId;
    const need = {}, played = {}, homeCount = {};
    ids.forEach(id => { need[id] = 8; played[id] = new Set(); homeCount[id] = 0; });

    // Lock the user's opponents: two from each pot.
    const userFixtures = [];
    eu.pots.forEach(pot => {
      const cands = Cup.shuffle(pot.filter(id => id !== uid && !played[uid].has(id)));
      let picked = 0;
      for (const id of cands) {
        if (picked >= 2) break;
        played[uid].add(id); played[id].add(uid); need[uid]--; need[id]--;
        userFixtures.push({ opp: id }); picked++;
      }
    });
    // Four home, four away.
    Cup.shuffle(userFixtures);
    userFixtures.forEach((f, i) => {
      const userHome = i < 4;
      f.home = userHome ? uid : f.opp;
      f.away = userHome ? f.opp : uid;
      homeCount[f.home]++;
    });

    // Greedy-pair the rest until everyone has (close to) eight games.
    const matches = [];
    let guard = 0;
    while (guard++ < 400000) {
      const pending = ids.filter(id => need[id] > 0);
      if (!pending.length) break;
      pending.sort((a, b) => need[b] - need[a]);
      const a = pending[0];
      const cands = pending.filter(b => b !== a && !played[a].has(b));
      if (!cands.length) { need[a] = 0; continue; } // rare dead-end: drop remaining games
      const b = cands[Math.floor(Math.random() * cands.length)];
      const home = homeCount[a] <= homeCount[b] ? a : b;
      const away = home === a ? b : a;
      matches.push({ home, away });
      homeCount[home]++; played[a].add(b); played[b].add(a); need[a]--; need[b]--;
    }
    return { matches, userFixtures };
  },

  applyLeagueResult(eu, h, a, hg, ag) {
    const H = eu.table[h], A = eu.table[a];
    if (!H || !A) return;
    H.p++; A.p++; H.gf += hg; H.ga += ag; A.gf += ag; A.ga += hg;
    if (hg > ag) { H.w++; H.pts += 3; A.l++; }
    else if (ag > hg) { A.w++; A.pts += 3; H.l++; }
    else { H.d++; A.d++; H.pts++; A.pts++; }
  },

  // ---- league phase (user side) -------------------------------------------

  userLeagueFixtureThisWeek(state) {
    if (!this.isActive(state)) return null;
    const eu = state.euro.user;
    if (eu.stage !== "league") return null;
    return eu.fixtures.find(f => f.week === state.week && !f.played) || null;
  },

  recordUserLeagueGame(state, fixture, hg, ag) {
    const eu = state.euro.user;
    fixture.hg = hg; fixture.ag = ag; fixture.played = true;
    this.applyLeagueResult(eu, fixture.home, fixture.away, hg, ag);
    if (eu.fixtures.every(f => f.played)) this.finalizeLeaguePhase(state);
  },

  tableSorted(state, eu) {
    const gd = id => eu.table[id].gf - eu.table[id].ga;
    return eu.field.slice().sort((a, b) =>
      (eu.table[b].pts - eu.table[a].pts) || (gd(b) - gd(a)) || (eu.table[b].gf - eu.table[a].gf) ||
      (Stats.clubStrength(this.club(state, b)) - Stats.clubStrength(this.club(state, a)))
    );
  },

  finalizeLeaguePhase(state) {
    const eu = state.euro.user;
    // Safety net: settle any background match that hasn't been played yet.
    (eu.bgMatches || []).forEach(m => {
      if (m.played) return;
      const { hg, ag } = MatchEngine.simulateQuick(this.club(state, m.home), this.club(state, m.away));
      this.applyLeagueResult(eu, m.home, m.away, hg, ag);
      m.played = true;
    });
    const ranked = this.tableSorted(state, eu);
    eu.ranking = ranked;
    eu.seedOf = {}; ranked.forEach((id, i) => eu.seedOf[id] = i + 1);
    eu.finalPos = eu.seedOf[state.clubId];
    eu.top8 = ranked.slice(0, 8);
    eu.poField = ranked.slice(8, 24);
    eu.eliminated = ranked.slice(24);
    eu.ko = { order: EURO_STAGE_ORDER.slice(), stages: {} };
    if (eu.finalPos >= 25) { eu.stage = "out"; eu.userOut = true; eu.userExitStage = "League Phase"; }
    else eu.stage = "ko";
  },

  // ---- knockout bracket ----------------------------------------------------

  pairBySeed(eu, alive) {
    const sorted = alive.slice().sort((a, b) => eu.seedOf[a] - eu.seedOf[b]);
    const pairs = []; const n = sorted.length;
    for (let i = 0; i < n / 2; i++) pairs.push([sorted[i], sorted[n - 1 - i]]);
    return pairs;
  },

  ensureDrawn(state, eu, stageKey) {
    if (eu.ko.stages[stageKey]) return eu.ko.stages[stageKey];
    let alive;
    if (stageKey === "playoff") alive = eu.poField.slice();
    else if (stageKey === "r16") alive = eu.top8.concat(this.resolveStage(state, eu, "playoff").winners);
    else alive = this.resolveStage(state, eu, { qf: "r16", sf: "qf", final: "sf" }[stageKey]).winners.slice();

    const meta = EURO_STAGE_META[stageKey];
    const ties = this.pairBySeed(eu, alive).map(([hi, lo]) => {
      const legs = meta.twoLeg
        ? [{ home: lo, away: hi, week: meta.legWeeks[0], played: false, hg: 0, ag: 0 },
           { home: hi, away: lo, week: meta.legWeeks[1], played: false, hg: 0, ag: 0 }]
        : [{ home: hi, away: lo, week: meta.legWeeks[0], played: false, hg: 0, ag: 0 }];
      return { hi, lo, legs, winner: null, pens: false };
    });
    eu.ko.stages[stageKey] = { alive, ties, resolved: false, winners: null };
    return eu.ko.stages[stageKey];
  },

  simStageLeg(state, eu, stageKey, legIndex) {
    const st = eu.ko.stages[stageKey];
    if (!st) return;
    st.ties.forEach(t => {
      const lf = t.legs[legIndex];
      if (!lf || lf.played) return;
      if (t.hi === state.clubId || t.lo === state.clubId) return; // user's leg is played live
      const { hg, ag } = MatchEngine.simulateQuick(this.club(state, lf.home), this.club(state, lf.away));
      lf.hg = hg; lf.ag = ag; lf.played = true;
    });
  },

  resolveTie(state, eu, t, stageKey) {
    if (t.winner) return;
    const meta = EURO_STAGE_META[stageKey];
    if (!meta.twoLeg) {
      const lf = t.legs[0];
      if (!lf.played) return;
      if (lf.hg > lf.ag) t.winner = lf.home;
      else if (lf.ag > lf.hg) t.winner = lf.away;
      else { t.pens = true; t.winner = Cup.penaltyWinner(this.club(state, lf.home), this.club(state, lf.away)); }
    } else {
      const [l1, l2] = t.legs;
      if (!l1.played || !l2.played) return;
      const aggHi = l1.ag + l2.hg, aggLo = l1.hg + l2.ag; // l1: lo home, l2: hi home
      if (aggHi > aggLo) t.winner = t.hi;
      else if (aggLo > aggHi) t.winner = t.lo;
      else { t.pens = true; t.winner = Cup.penaltyWinner(this.club(state, t.hi), this.club(state, t.lo)); }
    }
  },

  resolveStage(state, eu, stageKey) {
    const st = this.ensureDrawn(state, eu, stageKey);
    if (st.resolved) return st;
    EURO_STAGE_META[stageKey].legWeeks.forEach((w, li) => this.simStageLeg(state, eu, stageKey, li));
    st.ties.forEach(t => this.resolveTie(state, eu, t, stageKey));
    if (st.ties.some(t => !t.winner)) return st; // a user leg still outstanding — resolve later
    st.winners = st.ties.map(t => t.winner);
    st.resolved = true;
    const ut = st.ties.find(t => t.hi === state.clubId || t.lo === state.clubId);
    if (ut && ut.winner !== state.clubId && !eu.userOut) { eu.userOut = true; eu.userExitStage = EURO_STAGE_META[stageKey].name; }
    if (stageKey === "final") {
      const f = st.ties[0];
      eu.winner = f.winner; eu.runnerUp = f.winner === f.hi ? f.lo : f.hi; eu.stage = "done";
    }
    return st;
  },

  // Bring every stage whose legs are already in the past up to date.
  syncTo(state, eu, week) {
    for (const k of eu.ko.order) {
      const meta = EURO_STAGE_META[k];
      if (meta.legWeeks[0] > week) break;
      this.ensureDrawn(state, eu, k);
      if (meta.legWeeks[meta.legWeeks.length - 1] < week) this.resolveStage(state, eu, k);
    }
  },

  // The user's live knockout leg this week (also simulates the round's other
  // legs in the background). Returns null when the user has nothing to play.
  userKoLegThisWeek(state, club) {
    const eu = state.euro.user;
    if (!eu || eu.stage !== "ko") return null;
    const week = state.week;
    const stageKey = eu.ko.order.find(k => EURO_STAGE_META[k].legWeeks.includes(week));
    if (!stageKey) return null;
    this.syncTo(state, eu, week);
    if (eu.stage === "done") return null;
    this.ensureDrawn(state, eu, stageKey);
    const legIndex = EURO_STAGE_META[stageKey].legWeeks.indexOf(week);
    this.simStageLeg(state, eu, stageKey, legIndex);
    const st = eu.ko.stages[stageKey];
    const t = st.ties.find(t => t.hi === club.id || t.lo === club.id);
    if (t) {
      const lf = t.legs[legIndex];
      if (lf && !lf.played) return { comp: eu.comp, stageKey, tie: t, legIndex, legFix: lf, meta: EURO_STAGE_META[stageKey] };
    }
    return null;
  },

  // Record a user knockout leg and (if the tie is complete) settle it. Returns a
  // short status string for the match screen.
  recordUserKoLeg(state, item, hg, ag) {
    const eu = state.euro.user;
    const t = item.tie, lf = item.legFix;
    lf.hg = hg; lf.ag = ag; lf.played = true;
    this.resolveTie(state, eu, t, item.stageKey);
    if (!t.winner) {
      // First leg of a two-legged tie.
      return `1st leg · ${hg}–${ag}`;
    }
    const meta = item.meta;
    const userWon = t.winner === state.clubId;
    if (!userWon && !eu.userOut) { eu.userOut = true; eu.userExitStage = meta.name; }
    if (item.stageKey === "final") {
      eu.winner = t.winner; eu.runnerUp = t.winner === t.hi ? t.lo : t.hi; eu.stage = "done";
      eu.ko.stages.final.resolved = true; eu.ko.stages.final.winners = [t.winner];
      return userWon ? `🏆 ${EURO_COMPS[eu.comp].short} Winners!` : `${Cup.clubShort(state, t.winner)} win the ${EURO_COMPS[eu.comp].short}`;
    }
    if (meta.twoLeg) {
      const aggHi = t.legs[0].ag + t.legs[1].hg, aggLo = t.legs[0].hg + t.legs[1].ag;
      const hiG = Math.max(aggHi, aggLo), loG = Math.min(aggHi, aggLo);
      const tag = t.pens ? "Pens" : `Agg ${hiG}–${loG}`;
      return `${tag} · ${userWon ? "Through!" : Cup.clubShort(state, t.winner) + " advance"}`;
    }
    return userWon ? "Through!" : "Eliminated";
  },

  // ---- season recap --------------------------------------------------------

  ordinalPos(state, eu) {
    const ranked = this.tableSorted(state, eu);
    return ranked.indexOf(state.clubId) + 1;
  },

  seasonSummary(state) {
    const e = state.euro;
    if (!e) return null;
    const comp = e.userComp;
    const champions = { ...(e.champions || {}) };
    if (comp && e.user) champions[comp] = e.user.winner;
    if (!comp) return { name: "Europe", comp: null, userWon: false, winner: "—", userResult: "Did not qualify", eligible: false, champions };
    const eu = e.user; const meta = EURO_COMPS[comp];
    let userResult;
    if (eu.winner === state.clubId) userResult = "🏆 Winners";
    else if (eu.userExitStage) userResult = "Out in the " + eu.userExitStage;
    else if (eu.finalPos) userResult = "League phase — finished " + eu.finalPos + "th of 36";
    else userResult = "Eliminated";
    return {
      name: meta.name, comp, userWon: eu.winner === state.clubId,
      winner: eu.winner ? Cup.clubName(state, eu.winner) : "—", userResult, eligible: true, champions,
    };
  },
};
