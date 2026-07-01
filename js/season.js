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
      home.budget = Math.round((home.budget + Econ.weeklyIncome(home.tier)) * 10) / 10;
      away.budget = Math.round((away.budget + Econ.weeklyIncome(away.tier)) * 10) / 10;
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
      if (league === "CH") {
        if (pos <= 2) return "promotion";
        if (pos <= 6) return "playoff";
        if (pos >= 18) return "relegation";
        return "";
      }
      if (pos === 1) return "champion";
      if (pos <= 4) return "ucl";
      if (pos === 5) return "uel";
      if (pos === 6) return "ecl";
      if (pos >= 18) return "relegation";
      return "";
    },
  
    // Returns a fresh Championship club built around a real third-tier club
    // name pulled from the League One pool, with a generated lower-tier squad.
    makePromotedClub(state, name) {
      const idx = state.leagueOnePool.indexOf(name);
      if (idx >= 0) state.leagueOnePool.splice(idx, 1);
      const id = name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 3) + Math.floor(Math.random() * 90);
      const palette = [["#D2122E","#FFFFFF"],["#0033A0","#FFFFFF"],["#FDB927","#000000"],["#6F263D","#FFFFFF"],["#00A650","#FFFFFF"]];
      const colors = palette[Math.floor(Math.random() * palette.length)];
      const club = {
        id, name, short: name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase(),
        nick: name, city: name, stadium: name + " Stadium", colors, tier: 1, league: "CH",
        squad: [], crestInitials: name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase(),
        budget: Econ.startBudget(1),
        points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0,
        formation: "4-4-2", lineup: null,
      };
      ensureSquadDepth(club);
      club.squad.forEach(p => { p.club = club.id; });
      return club;
    },

    endOfSeason(state) {
      const tables = { PL: this.table(state, "PL"), CH: this.table(state, "CH") };
      const awardsByLeague = { PL: Stats.awards(state, "PL"), CH: Stats.awards(state, "CH") };

      const userLeague = Game.myLeague();
      const myTable = tables[userLeague];
      const champion = myTable[0];
      const myFinalPos = myTable.find(r => r.id === state.clubId).pos;
      const awards = awardsByLeague[userLeague]; // the user sees their own league's awards
      const faCup = Cup.seasonSummary(state); // FA Cup recap before it resets

      // Who moves: PL bottom 3 ↔ CH top 3, and CH bottom 3 drop to League One.
      const plRelegated = tables.PL.slice(17, 20).map(r => r.id);
      const chPromoted = tables.CH.slice(0, 3).map(r => r.id);
      const chRelegated = tables.CH.slice(17, 20).map(r => r.id);

      // Prize money for every club, scaled to its division.
      LEAGUES.forEach(lg => tables[lg].forEach(row => {
        const club = state.clubs.find(c => c.id === row.id);
        club.budget = Math.round((club.budget + Econ.endOfSeasonPrize(row.pos, lg)) * 10) / 10;
      }));

      // Work out the user's fate.
      const userPromoted = userLeague === "CH" && chPromoted.includes(state.clubId);
      const userRelegatedToCh = userLeague === "PL" && plRelegated.includes(state.clubId);
      const userRelegatedOut = userLeague === "CH" && chRelegated.includes(state.clubId);
      const isChampion = champion.id === state.clubId;
      const toLeague = userPromoted ? "PL" : userRelegatedToCh ? "CH" : userLeague;

      state.history.push({
        season: state.season, league: userLeague, position: myFinalPos,
        champion: isChampion, promoted: userPromoted, relegated: userRelegatedToCh || userRelegatedOut,
        club: clubNameLookup(state, state.clubId),
      });
      if (isChampion && userLeague === "PL") state.titles++;

      const resultBase = {
        userLeague, toLeague, myFinalPos, champion, isChampion,
        userPromoted, userRelegatedToCh, userRelegatedOut,
        awards, tables, faCup,
      };

      if (userRelegatedOut) {
        // Relegated out of the Championship — the hard floor. Career ends.
        return { ...resultBase, bonusesGranted: [] };
      }

      // Off-season development for every club in both divisions.
      const ageingNews = Aging.advanceSeason(state);

      // Promotion / relegation swaps. PL⇄CH clubs keep their squads (and tier),
      // they just change division; CH's bottom 3 leave for League One.
      plRelegated.forEach(id => { const c = state.clubs.find(c => c.id === id); if (c) c.league = "CH"; });
      chPromoted.forEach(id => { const c = state.clubs.find(c => c.id === id); if (c) c.league = "PL"; });
      chRelegated.forEach(id => {
        const club = state.clubs.find(c => c.id === id);
        if (club) state.leagueOnePool.push(club.name);
      });
      state.clubs = state.clubs.filter(c => !chRelegated.includes(c.id));

      const promotedNames = [];
      while (promotedNames.length < 3 && state.leagueOnePool.length) {
        const pick = state.leagueOnePool[Math.floor(Math.random() * state.leagueOnePool.length)];
        if (!promotedNames.includes(pick)) promotedNames.push(pick);
      }
      promotedNames.forEach(name => state.clubs.push(this.makePromotedClub(state, name)));

      // Hand out next season's form bonuses (top five of every category in BOTH
      // leagues), then wipe every player's tallies for the new campaign.
      const bonusesGranted = Stats.assignSeasonBonuses(state, [...awardsByLeague.PL, ...awardsByLeague.CH]);
      Stats.resetSeason(state);

      // Reset season-long table stats for every surviving/joining club.
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