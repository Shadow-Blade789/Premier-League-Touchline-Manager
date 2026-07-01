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

    totalWeeks(state) {
      return (state.fixtures.PL || []).length;
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
      return Market.weeklyUpdate(state);
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

    // Coloured zones differ by division: the Premier League has European spots
    // and relegation; the Championship has automatic promotion, the play-offs,
    // and relegation.
    zoneFor(pos, league = "PL") {
      if (league === "CH" || league === "L1") {
        if (pos <= 2) return "promotion";
        if (pos <= 6) return "playoff";
        if (pos >= 18) return "relegation";
        return "";
      }
      if (league === "L2") {
        // No division below — the bottom three is a "sacking zone" instead.
        if (pos <= 2) return "promotion";
        if (pos <= 6) return "playoff";
        if (pos >= 18) return "sacking";
        return "";
      }
      if (pos === 1) return "champion";
      if (pos <= 4) return "ucl";
      if (pos === 5) return "uel";
      if (pos === 6) return "ecl";
      if (pos >= 18) return "relegation";
      return "";
    },
  
    // League ladder, top → bottom.
    ORDER: ["PL", "CH", "L1", "L2"],
    leagueAbove(lg) { const i = this.ORDER.indexOf(lg); return i > 0 ? this.ORDER[i - 1] : null; },
    leagueBelow(lg) { const i = this.ORDER.indexOf(lg); return i >= 0 && i < this.ORDER.length - 1 ? this.ORDER[i + 1] : null; },

    endOfSeason(state) {
      const tables = {}; LEAGUES.forEach(lg => { tables[lg] = this.table(state, lg); });
      const awardsByLeague = {}; LEAGUES.forEach(lg => { awardsByLeague[lg] = Stats.awards(state, lg); });

      const userLeague = Game.myLeague();
      const myTable = tables[userLeague];
      const champion = myTable[0];
      const myFinalPos = myTable.find(r => r.id === state.clubId).pos;
      const awards = awardsByLeague[userLeague]; // the user sees their own league's awards
      const faCup = Cup.seasonSummary(state); // FA Cup recap before it resets

      // Movement, computed per league: top 3 promote, bottom 3 relegate. The
      // chain PL⇄CH⇄L1⇄L2 is closed (3 up, 3 down each rung), and League Two
      // has no relegation — its bottom 3 is a sacking zone for the user only.
      const promoteIds = {}; // clubs going UP out of each league
      const relegateIds = {}; // clubs going DOWN out of each league
      LEAGUES.forEach(lg => {
        if (this.leagueAbove(lg)) promoteIds[lg] = tables[lg].slice(0, 3).map(r => r.id);
        if (this.leagueBelow(lg)) relegateIds[lg] = tables[lg].slice(17, 20).map(r => r.id);
      });

      // Prize money for every club, scaled to its division.
      LEAGUES.forEach(lg => tables[lg].forEach(row => {
        const club = state.clubs.find(c => c.id === row.id);
        club.budget = Math.round((club.budget + Econ.endOfSeasonPrize(row.pos, lg)) * 10) / 10;
      }));

      // The user's fate.
      const isChampion = champion.id === state.clubId;
      const userPromoted = !!(promoteIds[userLeague] && promoteIds[userLeague].includes(state.clubId));
      const userRelegated = !!(relegateIds[userLeague] && relegateIds[userLeague].includes(state.clubId));
      const userSacked = userLeague === "L2" && myFinalPos >= 18; // no floor below League Two
      const toLeague = userPromoted ? this.leagueAbove(userLeague)
        : userRelegated ? this.leagueBelow(userLeague) : userLeague;

      state.history.push({
        season: state.season, league: userLeague, position: myFinalPos,
        champion: isChampion, promoted: userPromoted, relegated: userRelegated || userSacked,
        club: clubNameLookup(state, state.clubId),
      });
      if (isChampion && userLeague === "PL") state.titles++;

      const resultBase = {
        userLeague, toLeague, myFinalPos, champion, isChampion,
        userPromoted, userRelegated, userSacked,
        awards, tables, faCup,
      };

      if (userSacked) {
        // Bottom three of League Two — sacked. Career ends here.
        return { ...resultBase, bonusesGranted: [] };
      }

      // Off-season development for every club in all four divisions.
      const ageingNews = Aging.advanceSeason(state);

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

      state.season++;
      state.week = 0;
      state.results = [];
      this.buildFixtures(state);
      Cup.initSeason(state); // fresh FA Cup bracket for the new season
      state.windowWasOpen = false; // force the season-opening "window just opened" transition
      Market.weeklyUpdate(state);

      return { ...resultBase, ageingNews, bonusesGranted };
    },
  };
  
  function clubNameLookup(state, id) {
    const c = state.clubs.find(c => c.id === id);
    return c ? c.name : id;
  }