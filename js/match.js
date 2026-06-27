/* =========================================================================
   PLFC TOUCHLINE MANAGER — MATCH ENGINE
   Quick simulation for AI-vs-AI fixtures, plus a full minute-by-minute
   timeline generator (with commentary) for the user's live matches.
   ========================================================================= */

   const Commentary = {
    kickoff: [
      "{home} get us underway at {stadium}.",
      "We're off! {home} versus {away} begins here.",
      "Kick-off at {stadium} — {home} in possession to start.",
    ],
    chanceMiss: [
      "{player} drives forward but the final ball goes astray.",
      "{player} works a yard of space but fires well over the bar.",
      "Half-chance for {team} — {player}'s effort drifts wide.",
      "{player} can't quite get hold of it, the shot balloons off target.",
    ],
    shotSaved: [
      "{player} tests the keeper with a firm strike — well saved!",
      "Good save! {player}'s effort was heading in before the stop.",
      "{player} shoots — pushed away at full stretch by the goalkeeper.",
    ],
    woodwork: [
      "{player} crashes the woodwork! So close for {team}.",
      "Off the post! {player} will wonder how that stayed out.",
    ],
    goal: [
      "GOAL! {player} finishes brilliantly for {team}!",
      "GOAL! {team} are ahead — {player} with the finish!",
      "GOAL! {player} slots it home, {team} fans erupt!",
      "GOAL! A composed finish from {player} for {team}!",
    ],
    yellow: [
      "{player} goes into the book for {team} after a late challenge.",
      "Yellow card shown to {player}.",
    ],
    red: [
      "RED CARD! {player} is sent off for {team} — big moment in this game.",
    ],
    sub: [
      "{team} make a change: {playerOff} makes way for {playerOn}.",
    ],
    half: ["Half-time at {stadium}."],
    full: ["That's full-time."],
  };
  
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function fmt(tpl, vars) { return tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? ""); }
  
  const MatchEngine = {
    attackRating(players) {
      const fw = players.filter(p => p.pos === "FW");
      const mf = players.filter(p => p.pos === "MF");
      const avg = arr => arr.length ? arr.reduce((s, p) => s + p.rating, 0) / arr.length : 60;
      return avg(fw) * 0.6 + avg(mf) * 0.4;
    },
    defenseRating(players) {
      const df = players.filter(p => p.pos === "DF");
      const gk = players.filter(p => p.pos === "GK");
      const avg = arr => arr.length ? arr.reduce((s, p) => s + p.rating, 0) / arr.length : 60;
      return avg(df) * 0.72 + avg(gk) * 0.28;
    },
    overallRating(players) {
      if (!players.length) return 60;
      return players.reduce((s, p) => s + p.rating, 0) / players.length;
    },
  
    // Fast result for AI-vs-AI matches: no commentary, just a scoreline.
    simulateQuick(home, away) {
      const hStarters = Lineup.starters(home);
      const aStarters = Lineup.starters(away);
      const hAtt = this.attackRating(hStarters) * 1.06;
      const hDef = this.defenseRating(hStarters);
      const aAtt = this.attackRating(aStarters);
      const aDef = this.defenseRating(aStarters);
  
      const hxg = clamp(1.4 + (hAtt - aDef) / 18, 0.3, 4.0);
      const axg = clamp(1.15 + (aAtt - hDef) / 18, 0.25, 3.6);
  
      const hg = poisson(hxg);
      const ag = poisson(axg);
      return { hg, ag };
    },
  
    // Builds the full minute-by-minute event timeline for a live, watched match.
    simulateFull(home, away) {
      const hStarters = Lineup.starters(home);
      const aStarters = Lineup.starters(away);
      const hAtt = this.attackRating(hStarters) * 1.06;
      const hDef = this.defenseRating(hStarters);
      const aAtt = this.attackRating(aStarters);
      const aDef = this.defenseRating(aStarters);
  
      const pHomeGoal = clamp(0.0145 * clamp(hAtt / aDef, 0.5, 2.3), 0.004, 0.055);
      const pAwayGoal = clamp(0.0123 * clamp(aAtt / hDef, 0.5, 2.3), 0.004, 0.05);
  
      const timeline = [];
      let hg = 0, ag = 0;
      let momentum = 50;
      const push = obj => { timeline.push({ ...obj, mom: Math.round(momentum), seq: timeline.length }); };
  
      const attackersOf = (club, starters) => {
        const list = starters.filter(p => p.pos === "FW" || p.pos === "MF");
        return list.length ? list : starters;
      };
      const hAttackers = attackersOf(home, hStarters);
      const aAttackers = attackersOf(away, aStarters);
      const weightedPlayer = list => {
        const total = list.reduce((s, p) => s + p.rating, 0);
        let r = Math.random() * total;
        for (const p of list) { r -= p.rating; if (r <= 0) return p; }
        return list[list.length - 1];
      };
      const weightedScorer = list => {
        const weights = list.map(p => p.rating * (p.pos === "FW" ? 1.9 : 1.0));
        const total = weights.reduce((s, w) => s + w, 0);
        let r = Math.random() * total;
        for (let i = 0; i < list.length; i++) { r -= weights[i]; if (r <= 0) return list[i]; }
        return list[list.length - 1];
      };
  
      push({ minute: 0, type: "kickoff", text: fmt(pick(Commentary.kickoff), { home: home.name, away: away.name, stadium: home.stadium }), hg, ag });
  
      let hSubsUsed = 0, aSubsUsed = 0;
      const stoppage1 = 1 + Math.floor(Math.random() * 4);
      const stoppage2 = 1 + Math.floor(Math.random() * 6);
      const totalMinutes = 45 + stoppage1 + 45 + stoppage2;
  
      for (let m = 1; m <= totalMinutes; m++) {
        if (m === 46 + stoppage1) {
          push({ minute: 45, type: "half", text: fmt(pick(Commentary.half), { stadium: home.stadium }), hg, ag });
        }
        const driftTarget = 50 + (hAtt - aAtt + (aDef - hDef)) * 1.4;
        momentum += (driftTarget - momentum) * 0.04 + (Math.random() - 0.5) * 6;
        momentum = clamp(momentum, 5, 95);
  
        const minuteLabel = m <= 45 + stoppage1 ? Math.min(m, 45) : Math.min(m - stoppage1, 90);
        const isStoppage = (m > 45 && m <= 45 + stoppage1) || (m > 45 + stoppage1 + 45);
  
        const roll = Math.random();
        if (roll < pHomeGoal) {
          hg++; const scorer = weightedScorer(hAttackers);
          push({ minute: minuteLabel, stoppage: isStoppage, type: "goal", side: "home", text: fmt(pick(Commentary.goal), { player: scorer.name, team: home.name }), hg, ag });
        } else if (roll < pHomeGoal + pAwayGoal) {
          ag++; const scorer = weightedScorer(aAttackers);
          push({ minute: minuteLabel, stoppage: isStoppage, type: "goal", side: "away", text: fmt(pick(Commentary.goal), { player: scorer.name, team: away.name }), hg, ag });
        } else if (roll < pHomeGoal + pAwayGoal + 0.05) {
          const homeChance = Math.random() * 100 < momentum;
          const team = homeChance ? home : away;
          const list = homeChance ? hAttackers : aAttackers;
          const player = weightedPlayer(list);
          const flavor = Math.random();
          const pool = flavor < 0.45 ? Commentary.chanceMiss : flavor < 0.85 ? Commentary.shotSaved : Commentary.woodwork;
          push({ minute: minuteLabel, stoppage: isStoppage, type: "chance", text: fmt(pick(pool), { player: player.name, team: team.name }), hg, ag });
        } else if (roll < pHomeGoal + pAwayGoal + 0.06) {
          const homeChance = Math.random() < 0.5;
          const team = homeChance ? home : away;
          const list = homeChance ? hStarters : aStarters;
          const player = pick(list);
          const isRed = Math.random() < 0.05;
          push({ minute: minuteLabel, stoppage: isStoppage, type: isRed ? "red" : "yellow", text: fmt(pick(isRed ? Commentary.red : Commentary.yellow), { player: player.name, team: team.name }), hg, ag });
        } else if (m === 60 + (m > 45 ? stoppage1 : 0) && hSubsUsed < 1 && home.lineup) {
          const bench = home.lineup.bench.map(id => home.squad.find(p => p.id === id)).filter(Boolean);
          const off = pick(hStarters);
          const on = pick(bench.length ? bench : hStarters);
          hSubsUsed++;
          push({ minute: minuteLabel, stoppage: isStoppage, type: "sub", text: fmt(pick(Commentary.sub), { team: home.name, playerOff: off.name, playerOn: on.name }), hg, ag });
        } else if (m === 67 + (m > 45 ? stoppage1 : 0) && aSubsUsed < 1 && away.lineup) {
          const bench = away.lineup.bench.map(id => away.squad.find(p => p.id === id)).filter(Boolean);
          const off = pick(aStarters);
          const on = pick(bench.length ? bench : aStarters);
          aSubsUsed++;
          push({ minute: minuteLabel, stoppage: isStoppage, type: "sub", text: fmt(pick(Commentary.sub), { team: away.name, playerOff: off.name, playerOn: on.name }), hg, ag });
        }
      }
  
      push({ minute: 90, stoppage: stoppage2 > 0, type: "full", text: fmt(pick(Commentary.full), {}), hg, ag });
  
      return { timeline, hg, ag };
    },
  };
  
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function poisson(lambda) {
    // Knuth's algorithm — fine at these small lambdas.
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  }