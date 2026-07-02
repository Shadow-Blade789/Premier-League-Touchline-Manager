/* =========================================================================
   PLFC TOUCHLINE MANAGER — SEASON
   Fixture generation (double round-robin), table maths, and the
   promotion / relegation / European-qualification turnover between
   seasons.
   ========================================================================= */

   const Season = {
    // Double round-robin schedule (38 rounds) for one set of 20 club ids.
    roundRobin(ids) {
      const n = ids.length; // 20
      const rotation = ids.slice(1); // all but the fixed first team
      const half = []; // first leg, n-1 rounds

      let arr = rotation.slice();
      for (let r = 0; r < n - 1; r++) {
        const round = [];
        const teams = [ids[0], ...arr];
        for (let i = 0; i < n / 2; i++) {
          const a = teams[i];
          const b = teams[n - 1 - i];
          // Alternate which side is "home" round to round for balance.
          if (r % 2 === 0) round.push({ home: a, away: b });
          else round.push({ home: b, away: a });
        }
        half.push(round);
        arr.unshift(arr.pop()); // rotate
      }
      // Second leg: same fixtures, venues swapped.
      const secondHalf = half.map(round => round.map(m => ({ home: m.away, away: m.home })));
      return [...half, ...secondHalf];
    },

    // Builds a separate schedule for each league.
    buildFixtures(state) {
      state.fixtures = {};
      LEAGUES.forEach(lg => {
        const ids = state.clubs.filter(c => c.league === lg).map(c => c.id);
        state.fixtures[lg] = this.roundRobin(ids);
      });
    },

    // Leagues have different sizes (20 vs 24 clubs) and therefore different
    // fixture counts. The season runs for as long as the USER's league does.
    totalWeeks(state) {
      const lg = Game.myLeague();
      return (state.fixtures[lg] || state.fixtures.PL || []).length;
    },

    // Leagues longer than the user's keep playing after the user's season is
    // done — quick-sim their outstanding rounds so every table is complete
    // before promotions and relegations are worked out.
    finishRemainingLeagues(state) {
      LEAGUES.forEach(lg => {
        const sched = state.fixtures[lg] || [];
        for (let w = state.week; w < sched.length; w++) {
          sched[w].forEach(m => {
            const home = state.clubs.find(c => c.id === m.home);
            const away = state.clubs.find(c => c.id === m.away);
            if (!home || !away) return;
            const { hg, ag } = MatchEngine.simulateQuick(home, away);
            this.recordResult(state, m.home, m.away, hg, ag);
            Stats.recordMatch(Lineup.starters(home), Lineup.starters(away), hg, ag);
          });
        }
      });
    },

    currentRound(state, league) {
      const sched = state.fixtures[league];
      return (sched && sched[state.week]) || null;
    },

    userMatchThisRound(state) {
      const round = this.currentRound(state, Game.myLeague());
      if (!round) return null;
      return round.find(m => m.home === state.clubId || m.away === state.clubId) || null;
    },
  
    recordResult(state, homeId, awayId, hg, ag) {
      const home = state.clubs.find(c => c.id === homeId);
      const away = state.clubs.find(c => c.id === awayId);
      home.played++; away.played++;
      home.gf += hg; home.ga += ag;
      away.gf += ag; away.ga += hg;
      if (hg > ag) { home.won++; home.points += 3; away.lost++; }
      else if (hg < ag) { away.won++; away.points += 3; home.lost++; }
      else { home.drawn++; away.drawn++; home.points += 1; away.points += 1; }
      state.results.push({ week: state.week, home: homeId, away: awayId, hg, ag });
      home.budget = Math.round((home.budget + Econ.weeklyIncome(home.tier, home.league)) * 10) / 10;
      away.budget = Math.round((away.budget + Econ.weeklyIncome(away.tier, away.league)) * 10) / 10;
    },
  
    // Simulate every match in BOTH leagues this round, except the user's own
    // match (which is played live). Stats are attributed for every game so the
    // per-league leaderboards reflect the whole division.
    simulateOtherMatchesThisRound(state) {
      LEAGUES.forEach(lg => {
        const round = this.currentRound(state, lg);
        if (!round) return;
        round.forEach(m => {
          if (m.home === state.clubId || m.away === state.clubId) return;
          const home = state.clubs.find(c => c.id === m.home);
          const away = state.clubs.find(c => c.id === m.away);
          const { hg, ag } = MatchEngine.simulateQuick(home, away);
          this.recordResult(state, m.home, m.away, hg, ag);
          Stats.recordMatch(Lineup.starters(home), Lineup.starters(away), hg, ag);
        });
      });
    },
  
    advanceWeek(state) {
      state.week++;
      const transition = Market.weeklyUpdate(state);
      Coaching.weeklyMarket(state); // fresh coach shortlist every matchweek
      return transition;
    },
  
    isSeasonOver(state) {
      return state.week >= this.totalWeeks(state);
    },

    table(state, league = "PL") {
      const rows = state.clubs.filter(c => c.league === league).map(c => ({
        id: c.id, name: c.name, short: c.short, colors: c.colors,
        played: c.played, won: c.won, drawn: c.drawn, lost: c.lost,
        gf: c.gf, ga: c.ga, gd: c.gf - c.ga, points: c.points,
      }));
      rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
      rows.forEach((r, i) => r.pos = i + 1);
      return rows;
    },

    // Promotion / relegation rules per division. The chain is closed
    // (PL ⇄ CH ⇄ L1 ⇄ L2): the Championship promotes 3 directly; League One and
    // Two promote 3 directly plus one play-off winner from the next four.
    // League Two has no relegation — its bottom four is a sacking zone.
    LEAGUE_RULES: {
      PL: { autoPromote: 0, playoff: 0, relegate: 3 },
      CH: { autoPromote: 3, playoff: 0, relegate: 4 },
      L1: { autoPromote: 3, playoff: 1, relegate: 4 },
      L2: { autoPromote: 3, playoff: 1, relegate: 0, sacking: 4 },
    },
    ORDER: ["PL", "CH", "L1", "L2"],
    leagueAbove(lg) { const i = this.ORDER.indexOf(lg); return i > 0 ? this.ORDER[i - 1] : null; },
    leagueBelow(lg) { const i = this.ORDER.indexOf(lg); return i >= 0 && i < this.ORDER.length - 1 ? this.ORDER[i + 1] : null; },

    // Coloured table zones, sized to the league (20 or 24 clubs).
    zoneFor(pos, league = "PL", size = 20) {
      const r = this.LEAGUE_RULES[league] || {};
      if (league === "PL") {
        if (pos === 1) return "champion";
        if (pos <= 4) return "ucl";
        if (pos === 5) return "uel";
        if (pos === 6) return "ecl";
        if (pos > size - r.relegate) return "relegation";
        return "";
      }
      if (pos <= r.autoPromote) return "promotion";
      if (r.playoff && pos <= r.autoPromote + 4) return "playoff";
      if (league === "L2") { if (pos > size - (r.sacking || 3)) return "sacking"; return ""; }
      if (pos > size - r.relegate) return "relegation";
      return "";
    },

    // Resolve a play-off among a league's next four (positions autoPromote+1..+4):
    // semis are 1v4 and 2v3 by seed, then a final. Returns { winner, finalists }.
    runPlayoff(state, table, autoPromote) {
      const c = table.slice(autoPromote, autoPromote + 4).map(r => r.id);
      if (c.length < 4) return { winner: c[0] || null, finalists: c.slice(0, 2) };
      const f1 = this.playoffWinner(state, c[0], c[3]); // seed 4 v 7
      const f2 = this.playoffWinner(state, c[1], c[2]); // seed 5 v 6
      const winner = this.playoffWinner(state, f1, f2);
      return { winner, finalists: [f1, f2], contenders: c };
    },
    playoffWinner(state, aId, bId) {
      const a = state.clubs.find(c => c.id === aId), b = state.clubs.find(c => c.id === bId);
      const ra = MatchEngine.overallRating(Lineup.starters(a)) + 1.5; // slight edge to the higher seed
      const rb = MatchEngine.overallRating(Lineup.starters(b));
      return Math.random() < ra / (ra + rb) ? aId : bId;
    },
  
    // League ladder, top → bottom.
    ORDER: ["PL", "CH", "L1", "L2"],
    leagueAbove(lg) { const i = this.ORDER.indexOf(lg); return i > 0 ? this.ORDER[i - 1] : null; },
    leagueBelow(lg) { const i = this.ORDER.indexOf(lg); return i >= 0 && i < this.ORDER.length - 1 ? this.ORDER[i + 1] : null; },

    endOfSeason(state) {
      // Finish any divisions that run longer than the user's before ranking.
      this.finishRemainingLeagues(state);

      const tables = {}; LEAGUES.forEach(lg => { tables[lg] = this.table(state, lg); });
      const awardsByLeague = {}; LEAGUES.forEach(lg => { awardsByLeague[lg] = Stats.awards(state, lg); });

      const userLeague = Game.myLeague();
      const myTable = tables[userLeague];
      const size = myTable.length;
      const champion = myTable[0];
      const myFinalPos = myTable.find(r => r.id === state.clubId).pos;
      const awards = awardsByLeague[userLeague]; // the user sees their own league's awards
      const faCup = Cup.seasonSummary(state, state.faCup, Cup.CUPS.fa);
      const eflCup = Cup.seasonSummary(state, state.eflCup, Cup.CUPS.efl);
      Vertu.autoResolve(state); // guarantee a Vertu Trophy winner
      const vertu = Vertu.seasonSummary(state);

      // Movement per league: N automatic promotions (+ a play-off winner where
      // applicable) go up; the bottom few go down.
      const promoteIds = {}; // clubs going UP out of each league
      const relegateIds = {}; // clubs going DOWN out of each league
      let userPlayoff = null;  // the user's play-off run, if any
      LEAGUES.forEach(lg => {
        const rules = this.LEAGUE_RULES[lg]; const tbl = tables[lg]; const n = tbl.length;
        if (rules.autoPromote) {
          const promoted = tbl.slice(0, rules.autoPromote).map(r => r.id);
          if (rules.playoff) {
            const po = this.runPlayoff(state, tbl, rules.autoPromote);
            if (po.winner) promoted.push(po.winner);
            if (lg === userLeague && po.contenders && po.contenders.includes(state.clubId)) {
              userPlayoff = po.winner === state.clubId ? "won"
                : po.finalists.includes(state.clubId) ? "lostFinal" : "lostSemi";
            }
          }
          promoteIds[lg] = promoted;
        }
        if (rules.relegate) relegateIds[lg] = tbl.slice(n - rules.relegate).map(r => r.id);
      });

      // Prize money for every club, scaled to its division.
      LEAGUES.forEach(lg => tables[lg].forEach(row => {
        const club = state.clubs.find(c => c.id === row.id);
        club.budget = Math.round((club.budget + Econ.endOfSeasonPrize(row.pos, lg)) * 10) / 10;
      }));

      // The user's fate.
      const rules = this.LEAGUE_RULES[userLeague];
      const isChampion = champion.id === state.clubId;
      const userPromoted = !!(promoteIds[userLeague] && promoteIds[userLeague].includes(state.clubId));
      const userRelegated = !!(relegateIds[userLeague] && relegateIds[userLeague].includes(state.clubId));
      const userSacked = userLeague === "L2" && myFinalPos > size - (rules.sacking || 4); // no floor below
      const toLeague = userPromoted ? this.leagueAbove(userLeague)
        : userRelegated ? this.leagueBelow(userLeague) : userLeague;

      state.history.push({
        season: state.season, league: userLeague, position: myFinalPos,
        champion: isChampion, promoted: userPromoted, relegated: userRelegated || userSacked,
        club: clubNameLookup(state, state.clubId),
      });
      if (isChampion && userLeague === "PL") state.titles++;

      // Trophy cabinet: record everything the manager won this season.
      state.honours = state.honours || [];
      const seasonPlayed = state.season;
      if (isChampion) state.honours.push({ type: userLeague, season: seasonPlayed });
      if (faCup && faCup.userWon) state.honours.push({ type: "facup", season: seasonPlayed });
      if (eflCup && eflCup.userWon) state.honours.push({ type: "carabao", season: seasonPlayed });
      if (vertu && vertu.userWon) state.honours.push({ type: "vertu", season: seasonPlayed });

      const resultBase = {
        userLeague, toLeague, myFinalPos, champion, isChampion,
        userPromoted, userRelegated, userSacked, userPlayoff,
        awards, tables, faCup, eflCup, vertu,
      };

      if (userSacked) {
        // Bottom of League Two — sacked. Career ends here.
        return { ...resultBase, bonusesGranted: [] };
      }

      // Off-season development for every club in all four divisions.
      const ageingNews = Aging.advanceSeason(state);
      // Club fortunes: reputations shift, squads/coaches follow, and the
      // chasing pack keeps a runaway leader honest.
      Dynamics.apply(state, tables);

      // Apply the swaps: relegated clubs drop a division, promoted clubs rise.
      // Clubs keep their squads and reputation tier; only their league changes.
      LEAGUES.forEach(lg => {
        (relegateIds[lg] || []).forEach(id => { const c = state.clubs.find(c => c.id === id); if (c) c.league = this.leagueBelow(lg); });
        (promoteIds[lg] || []).forEach(id => { const c = state.clubs.find(c => c.id === id); if (c) c.league = this.leagueAbove(lg); });
      });

      // Next season's form bonuses — top five of every category in every
      // league — then wipe season tallies (career totals persist).
      const allAwards = LEAGUES.flatMap(lg => awardsByLeague[lg]);
      const bonusesGranted = Stats.assignSeasonBonuses(state, allAwards);
      Stats.resetSeason(state);

      state.clubs.forEach(c => {
        c.points = 0; c.played = 0; c.won = 0; c.drawn = 0; c.lost = 0; c.gf = 0; c.ga = 0;
      });

      // Community Shield for the coming season: the Premier League champions
      // vs the FA Cup winners (the FA Cup runner-up deputises if they're the
      // same club). Played on matchweek 1 of the new season.
      const plChampionId = tables.PL[0].id;
      const faWinnerId = state.faCup && state.faCup.winner;
      const faRunnerUpId = state.faCup && state.faCup.runnerUp;
      state.pendingShield = faWinnerId
        ? { champion: plChampionId, faWinner: faWinnerId, faRunnerUp: faRunnerUpId }
        : null;

      state.season++;
      state.week = 0;
      state.results = [];
      this.buildFixtures(state);
      Cup.initSeason(state); // fresh FA Cup + Carabao Cup brackets
      Vertu.initSeason(state); // fresh Vertu Trophy
      state.windowWasOpen = false; // force the season-opening "window just opened" transition
      Market.weeklyUpdate(state);
      Coaching.weeklyMarket(state);

      return { ...resultBase, ageingNews, bonusesGranted };
    },
  };
  
  function clubNameLookup(state, id) {
    const c = state.clubs.find(c => c.id === id);
    return c ? c.name : id;
  }