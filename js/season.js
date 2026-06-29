/* =========================================================================
   PLFC TOUCHLINE MANAGER — SEASON
   Fixture generation (double round-robin), table maths, and the
   promotion / relegation / European-qualification turnover between
   seasons.
   ========================================================================= */

   const Season = {
    buildFixtures(state) {
      const ids = state.clubs.map(c => c.id);
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
        // rotate
        arr.unshift(arr.pop());
      }
      // Second leg: same fixtures, venues swapped.
      const secondHalf = half.map(round => round.map(m => ({ home: m.away, away: m.home })));
      state.fixtures = [...half, ...secondHalf];
    },
  
    currentRound(state) {
      return state.fixtures[state.week] || null;
    },
  
    userMatchThisRound(state) {
      const round = this.currentRound(state);
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
  
    // Simulate every match in the current round EXCEPT the user's club's match.
    simulateOtherMatchesThisRound(state) {
      const round = this.currentRound(state);
      if (!round) return;
      round.forEach(m => {
        if (m.home === state.clubId || m.away === state.clubId) return;
        const home = state.clubs.find(c => c.id === m.home);
        const away = state.clubs.find(c => c.id === m.away);
        const { hg, ag } = MatchEngine.simulateQuick(home, away);
        this.recordResult(state, m.home, m.away, hg, ag);
      });
    },
  
    advanceWeek(state) {
      state.week++;
      return Market.weeklyUpdate(state);
    },
  
    isSeasonOver(state) {
      return state.week >= state.fixtures.length;
    },
  
    table(state) {
      const rows = state.clubs.map(c => ({
        id: c.id, name: c.name, short: c.short, colors: c.colors,
        played: c.played, won: c.won, drawn: c.drawn, lost: c.lost,
        gf: c.gf, ga: c.ga, gd: c.gf - c.ga, points: c.points,
      }));
      rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
      rows.forEach((r, i) => r.pos = i + 1);
      return rows;
    },
  
    zoneFor(pos) {
      if (pos === 1) return "champion";
      if (pos <= 4) return "ucl";
      if (pos === 5) return "uel";
      if (pos === 6) return "ecl";
      if (pos >= 18) return "relegation";
      return "";
    },
  
    // Returns a fresh "promoted" club object built around a real club name
    // pulled from the feeder pool, with a generated lower-tier squad.
    makePromotedClub(state, name) {
      const idx = state.feederPool.indexOf(name);
      if (idx >= 0) state.feederPool.splice(idx, 1);
      const id = name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 3) + Math.floor(Math.random() * 90);
      const palette = [["#D2122E","#FFFFFF"],["#0033A0","#FFFFFF"],["#FDB927","#000000"],["#6F263D","#FFFFFF"],["#00A650","#FFFFFF"]];
      const colors = palette[Math.floor(Math.random() * palette.length)];
      const club = {
        id, name, short: name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase(),
        nick: name, city: name, stadium: name + " Stadium", colors, tier: 1,
        squad: [], crestInitials: name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase(),
        budget: Econ.startBudget(1),
        points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0,
        formation: "4-4-2", lineup: null,
      };
      ensureSquadDepth(club);
      return club;
    },
  
    endOfSeason(state) {
      const table = this.table(state);
      const champion = table[0];
      const relegated = table.slice(17, 20).map(r => r.id);
      const myFinalPos = table.find(r => r.id === state.clubId).pos;
  
      state.history.push({
        season: state.season, position: myFinalPos,
        champion: champion.id === state.clubId,
        club: clubNameLookup(state, state.clubId),
      });
      if (champion.id === state.clubId) state.titles++;
  
      // End-of-season prize money for every club.
      table.forEach(row => {
        const club = state.clubs.find(c => c.id === row.id);
        club.budget = Math.round((club.budget + Econ.endOfSeasonPrize(row.pos)) * 10) / 10;
      });
  
      const userRelegated = relegated.includes(state.clubId);
      if (userRelegated) {
        // Career ends here — relegation from the Premier League is a hard stop.
        return { champion, relegated, userRelegated, myFinalPos, table };
      }
  
      // Off-season development: every player in the league ages a year, grows
      // toward (or declines from) potential, and the oldest retire.
      const ageingNews = Aging.advanceSeason(state);
  
      // Remove relegated clubs, return their names to the feeder pool, pull in
      // three fresh promoted sides.
      relegated.forEach(id => {
        const club = state.clubs.find(c => c.id === id);
        if (club) state.feederPool.push(club.name);
      });
      state.clubs = state.clubs.filter(c => !relegated.includes(c.id));
  
      const promotedNames = [];
      while (promotedNames.length < 3 && state.feederPool.length) {
        const pick = state.feederPool[Math.floor(Math.random() * state.feederPool.length)];
        if (!promotedNames.includes(pick)) promotedNames.push(pick);
      }
      promotedNames.forEach(name => {
        state.clubs.push(this.makePromotedClub(state, name));
      });
  
      // Reset season-long stats for every surviving/joining club.
      state.clubs.forEach(c => {
        c.points = 0; c.played = 0; c.won = 0; c.drawn = 0; c.lost = 0; c.gf = 0; c.ga = 0;
      });
  
      state.season++;
      state.week = 0;
      state.results = [];
      this.buildFixtures(state);
      state.windowWasOpen = false; // force the season-opening "window just opened" transition
      Market.weeklyUpdate(state);
  
      return { champion, relegated, userRelegated, myFinalPos, table, ageingNews };
    },
  };
  
  function clubNameLookup(state, id) {
    const c = state.clubs.find(c => c.id === id);
    return c ? c.name : id;
  }