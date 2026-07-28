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
  
  // Award boosts (carried by a user-club winner into the next season) nudge a
  // player's effective contribution. Team-level effects are deliberately half
  // the headline number so a "+12% goals" striker lifts the whole attack only
  // modestly, while their personal share of the goals gets the full boost in
  // weightedScorer below.
  function goalBoost(p) { return (p.bonus && p.bonus.goal) || 0; }
  function assistBoost(p) { return (p.bonus && p.bonus.assist) || 0; }
  function keeperBoost(p) { return (p.bonus && p.bonus.keeper) || 0; }
  function defenseBoost(p) { return (p.bonus && p.bonus.defense) || 0; }
  // A tired player contributes less: full at 100% fitness, ~0.82 at 40%.
  // Foreign/generated players have no fitness field and are unaffected.
  function fitFactor(p) { const f = typeof p.fitness === "number" ? p.fitness : 100; return 0.7 + 0.3 * (f / 100); }

  const MatchEngine = {
    attackRating(players) {
      const eff = p => p.rating * (1 + 0.5 * goalBoost(p) + 0.3 * assistBoost(p)) * fitFactor(p);
      const fw = players.filter(p => p.pos === "FW");
      const mf = players.filter(p => p.pos === "MF");
      const avg = arr => arr.length ? arr.reduce((s, p) => s + eff(p), 0) / arr.length : 60;
      return avg(fw) * 0.6 + avg(mf) * 0.4;
    },
    defenseRating(players) {
      const df = players.filter(p => p.pos === "DF");
      const gk = players.filter(p => p.pos === "GK");
      const avgDf = df.length ? df.reduce((s, p) => s + p.rating * (1 + defenseBoost(p)) * fitFactor(p), 0) / df.length : 60;
      const avgGk = gk.length ? gk.reduce((s, p) => s + p.rating * (1 + keeperBoost(p)) * fitFactor(p), 0) / gk.length : 60;
      return avgDf * 0.72 + avgGk * 0.28;
    },
    overallRating(players) {
      if (!players.length) return 60;
      return players.reduce((s, p) => s + p.rating, 0) / players.length;
    },

    // Attack/defense ratings for a club, whichever way it's modelled.
    // A club managed at player level (the user's country) has a real squad, so
    // its ratings come from its starting XI. A "strength-only" foreign club
    // (no stored squad — see the lightweight rest-of-world model) is simulated
    // from a single `strength` number, used for both attack and defense. This
    // keeps every quick-sim call site working for both kinds of club with no
    // change, and is bit-identical to the old path for squad clubs.
    sideRatings(club) {
      if (!club.strengthOnly && club.squad && club.squad.length) {
        const st = Lineup.starters(club);
        return { att: this.attackRating(st), def: this.defenseRating(st), starters: st };
      }
      const s = typeof club.strength === "number" ? club.strength : 60;
      return { att: s, def: s, starters: null };
    },

    // A disposable XI for a strength-only club, so it can appear in a LIVE
    // match (Europe) with named players for the commentary/scorers. Generated
    // around the club's strength and never stored — the club stays squad-less.
    tempStarters(club) {
      const s = typeof club.strength === "number" ? club.strength : 60;
      const out = [];
      [["GK", 1], ["DF", 4], ["MF", 4], ["FW", 2]].forEach(([pos, n]) => {
        for (let i = 0; i < n; i++) {
          const nm = (typeof randomProspect === "function") ? randomProspect().name : (club.short + " " + pos + (i + 1));
          out.push({ id: club.id + "_t" + out.length, name: nm, pos, bonus: {},
            rating: Math.max(40, Math.min(95, Math.round(s + (Math.random() * 8 - 4)))) });
        }
      });
      return out;
    },

    // Picks a goalscorer, weighted toward forwards and toward anyone carrying a
    // goalscoring boost. Promoted to the engine so the stat attributor and the
    // live commentary draw scorers from the exact same model.
    weightedScorer(list) {
      if (!list.length) return null;
      const weights = list.map(p => p.rating * (p.pos === "FW" ? 1.9 : 1.0) * (1 + goalBoost(p)));
      const total = weights.reduce((s, w) => s + w, 0);
      let r = Math.random() * total;
      for (let i = 0; i < list.length; i++) { r -= weights[i]; if (r <= 0) return list[i]; }
      return list[list.length - 1];
    },
    // Picks an assister (midfield-weighted, boost-aware), never the scorer.
    weightedAssister(list, scorer) {
      const pool = scorer ? list.filter(p => p.id !== scorer.id) : list.slice();
      const src = pool.length ? pool : list;
      if (!src.length) return null;
      const weights = src.map(p => p.rating * (p.pos === "MF" ? 1.6 : 1.0) * (1 + assistBoost(p)));
      const total = weights.reduce((s, w) => s + w, 0);
      let r = Math.random() * total;
      for (let i = 0; i < src.length; i++) { r -= weights[i]; if (r <= 0) return src[i]; }
      return src[src.length - 1];
    },
  
    // Converts a rating gap into a goal-rate multiplier. Exponential rather
    // than linear/ratio-based, so a big quality gap (10+ rating points,
    // roughly a top-half side vs a relegation-threatened one) produces a
    // genuinely dominant favorite instead of a near coin-flip, while small
    // gaps stay close to fair. Clamped so even huge mismatches keep a small
    // chance of an upset rather than becoming a foregone conclusion.
    goalRatio(att, def) {
      // Compressed vs. before so even a big favourite can't run up cricket
      // scores every week — dominance shows over a season, not in one blowout.
      return clamp(Math.pow(1.045, att - def), 0.25, 3.6);
    },

    // A per-match "form" swing (±20%) applied to each side, so a strong team can
    // have an off day and an underdog can catch fire — the source of the odd
    // dropped point and giant-killing that make a perfect season very hard.
    form() { return 0.8 + Math.random() * 0.4; },

    // Fast result for AI-vs-AI matches: no commentary, just a scoreline.
    simulateQuick(home, away) {
      const H = this.sideRatings(home), A = this.sideRatings(away);
      const hAtt = H.att * 1.04;
      const hDef = H.def;
      const aAtt = A.att;
      const aDef = A.def;

      const hxg = clamp(1.28 * this.goalRatio(hAtt, aDef) * this.form(), 0.2, 5.2);
      const axg = clamp(1.05 * this.goalRatio(aAtt, hDef) * this.form(), 0.22, 4.8);

      const hg = poisson(hxg);
      const ag = poisson(axg);
      return { hg, ag };
    },
  
    // Builds the full minute-by-minute event timeline for a live, watched match.
    simulateFull(home, away) {
      const H = this.sideRatings(home), A = this.sideRatings(away);
      const hStarters = H.starters || this.tempStarters(home);
      const aStarters = A.starters || this.tempStarters(away);
      const hAtt = H.att * 1.04;
      const hDef = H.def;
      const aAtt = A.att;
      const aDef = A.def;
  
      const pHomeGoal = clamp(0.0130 * this.goalRatio(hAtt, aDef) * this.form(), 0.004, 0.062);
      const pAwayGoal = clamp(0.0110 * this.goalRatio(aAtt, hDef) * this.form(), 0.004, 0.058);
  
      const timeline = [];
      let hg = 0, ag = 0;
      const homeScorers = [], awayScorers = []; // ordered scorer ids, fed to the stat sheet
      const reds = []; // {side, playerId} — used to suspend the user's player next match
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
      const weightedScorer = list => MatchEngine.weightedScorer(list);

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
          hg++; const scorer = weightedScorer(hAttackers); homeScorers.push(scorer.id);
          push({ minute: minuteLabel, stoppage: isStoppage, type: "goal", side: "home", text: fmt(pick(Commentary.goal), { player: scorer.name, team: home.name }), hg, ag });
        } else if (roll < pHomeGoal + pAwayGoal) {
          ag++; const scorer = weightedScorer(aAttackers); awayScorers.push(scorer.id);
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
          if (isRed && player) reds.push({ side: homeChance ? "home" : "away", playerId: player.id, name: player.name });
          push({ minute: minuteLabel, stoppage: isStoppage, type: isRed ? "red" : "yellow", side: homeChance ? "home" : "away", playerId: player && player.id, text: fmt(pick(isRed ? Commentary.red : Commentary.yellow), { player: player.name, team: team.name }), hg, ag });
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
  
      return { timeline, hg, ag, hStarters, aStarters, homeScorers, awayScorers, reds };
    },

    // A LIVE, steppable match the manager can intervene in (make subs). The user's
    // side is driven minute-by-minute so substitutions genuinely change what happens
    // next; the AI side auto-subs on the hour. Tracks per-player minutes for the
    // user's club so fitness drain can be proportional to time on the pitch.
    liveMatch(home, away, userClubId) {
      const eng = this;
      const H = this.sideRatings(home), A = this.sideRatings(away);
      const hStart = (H.starters || this.tempStarters(home)).slice();
      const aStart = (A.starters || this.tempStarters(away)).slice();
      const userSide = home.id === userClubId ? "home" : away.id === userClubId ? "away" : null;
      const formFactor = this.form();
      const st = {
        home, away, userSide,
        hOn: hStart.slice(), aOn: aStart.slice(), hStart, aStart,
        minute: 0, hg: 0, ag: 0, momentum: 50, done: false,
        homeScorers: [], awayScorers: [], reds: [],
        hSubsUsed: 0, aSubsUsed: 0, userSubsUsed: 0, USER_SUB_MAX: 5,
        stoppage1: 1 + Math.floor(Math.random() * 4),
        stoppage2: 1 + Math.floor(Math.random() * 6),
        minutes: {}, seq: 0,
      };
      st.totalMinutes = 45 + st.stoppage1 + 45 + st.stoppage2;
      (userSide === "home" ? hStart : userSide === "away" ? aStart : []).forEach(p => { st.minutes[p.id] = 0; });

      const attackers = list => { const l = list.filter(p => p.pos === "FW" || p.pos === "MF"); return l.length ? l : list; };
      function recalc() {
        st.hAtt = eng.attackRating(st.hOn) * 1.04; st.hDef = eng.defenseRating(st.hOn);
        st.aAtt = eng.attackRating(st.aOn); st.aDef = eng.defenseRating(st.aOn);
        st.pHomeGoal = clamp(0.0130 * eng.goalRatio(st.hAtt, st.aDef) * formFactor, 0.004, 0.062);
        st.pAwayGoal = clamp(0.0110 * eng.goalRatio(st.aAtt, st.hDef) * formFactor, 0.004, 0.058);
      }
      recalc();
      const label = () => (st.minute <= 45 + st.stoppage1 ? Math.min(st.minute, 45) : Math.min(st.minute - st.stoppage1, 90));
      const mk = (min, type, text, extra) => ({ minute: min, type, text, side: null, hg: st.hg, ag: st.ag, mom: Math.round(st.momentum), seq: st.seq++, ...extra });

      return {
        state: st,
        subsLeft() { return st.USER_SUB_MAX - st.userSubsUsed; },
        onPitchUser() { return (st.userSide === "home" ? st.hOn : st.userSide === "away" ? st.aOn : []).slice(); },

        stepMinute() {
          if (st.done) return [];
          const events = [];
          st.minute++;
          const m = st.minute;
          (st.userSide === "home" ? st.hOn : st.userSide === "away" ? st.aOn : []).forEach(p => { if (st.minutes[p.id] != null) st.minutes[p.id]++; });

          if (m === 46 + st.stoppage1) events.push(mk(45, "half", fmt(pick(Commentary.half), { stadium: st.home.stadium })));

          const driftTarget = 50 + (st.hAtt - st.aAtt + (st.aDef - st.hDef)) * 1.4;
          st.momentum = clamp(st.momentum + (driftTarget - st.momentum) * 0.04 + (Math.random() - 0.5) * 6, 5, 95);
          const isStoppage = (m > 45 && m <= 45 + st.stoppage1) || (m > 45 + st.stoppage1 + 45);
          const lab = label();
          const roll = Math.random();

          if (roll < st.pHomeGoal) {
            st.hg++; const s = eng.weightedScorer(attackers(st.hOn)); st.homeScorers.push(s.id);
            events.push(mk(lab, "goal", fmt(pick(Commentary.goal), { player: s.name, team: st.home.name }), { side: "home", stoppage: isStoppage }));
          } else if (roll < st.pHomeGoal + st.pAwayGoal) {
            st.ag++; const s = eng.weightedScorer(attackers(st.aOn)); st.awayScorers.push(s.id);
            events.push(mk(lab, "goal", fmt(pick(Commentary.goal), { player: s.name, team: st.away.name }), { side: "away", stoppage: isStoppage }));
          } else if (roll < st.pHomeGoal + st.pAwayGoal + 0.05) {
            const homeChance = Math.random() * 100 < st.momentum;
            const team = homeChance ? st.home : st.away;
            const p = eng.weightedScorer(attackers(homeChance ? st.hOn : st.aOn));
            const flavor = Math.random();
            const pool = flavor < 0.45 ? Commentary.chanceMiss : flavor < 0.85 ? Commentary.shotSaved : Commentary.woodwork;
            events.push(mk(lab, "chance", fmt(pick(pool), { player: p.name, team: team.name }), { stoppage: isStoppage }));
          } else if (roll < st.pHomeGoal + st.pAwayGoal + 0.06) {
            const homeChance = Math.random() < 0.5;
            const team = homeChance ? st.home : st.away;
            const p = pick(homeChance ? st.hOn : st.aOn);
            const isRed = Math.random() < 0.05;
            if (isRed && p) st.reds.push({ side: homeChance ? "home" : "away", playerId: p.id, name: p.name });
            events.push(mk(lab, isRed ? "red" : "yellow", fmt(pick(isRed ? Commentary.red : Commentary.yellow), { player: p.name, team: team.name }), { side: homeChance ? "home" : "away", playerId: p && p.id, stoppage: isStoppage }));
          } else {
            // AI auto-subs on the hour, but only for a side the user isn't managing.
            const aiSub = (club, onArr, used, at) => {
              if (m !== at || used() >= 1 || !club.lineup) return null;
              const bench = club.lineup.bench.map(id => club.squad.find(pp => pp.id === id)).filter(Boolean);
              if (!bench.length) return null;
              const off = pick(onArr); const on = pick(bench);
              const i = onArr.indexOf(off); if (i >= 0) onArr[i] = on;
              return mk(lab, "sub", fmt(pick(Commentary.sub), { team: club.name, playerOff: off.name, playerOn: on.name }), { stoppage: isStoppage });
            };
            if (st.userSide !== "home") { const e = aiSub(st.home, st.hOn, () => st.hSubsUsed, 60 + (m > 45 ? st.stoppage1 : 0)); if (e) { st.hSubsUsed++; recalc(); events.push(e); } }
            if (st.userSide !== "away") { const e = aiSub(st.away, st.aOn, () => st.aSubsUsed, 67 + (m > 45 ? st.stoppage1 : 0)); if (e) { st.aSubsUsed++; recalc(); events.push(e); } }
          }

          if (m >= st.totalMinutes) { st.done = true; events.push(mk(90, "full", fmt(pick(Commentary.full), {}), { stoppage: st.stoppage2 > 0 })); }
          return events;
        },

        // Bring a bench player on for a starter (user's side only). Returns the
        // commentary event, or null if it can't be done.
        substitute(offId, onId) {
          if (st.done || !st.userSide || st.userSubsUsed >= st.USER_SUB_MAX) return null;
          const onArr = st.userSide === "home" ? st.hOn : st.aOn;
          const club = st.userSide === "home" ? st.home : st.away;
          const offP = onArr.find(p => p.id === offId);
          const onP = (club.squad || []).find(p => p.id === onId);
          if (!offP || !onP || onArr.some(p => p.id === onId)) return null;
          onArr[onArr.indexOf(offP)] = onP;
          st.userSubsUsed++;
          if (st.minutes[onId] == null) st.minutes[onId] = 0; // starts accruing from now
          recalc();
          return mk(label(), "sub", fmt(pick(Commentary.sub), { team: club.name, playerOff: offP.name, playerOn: onP.name }), { stoppage: (st.minute > 45 && st.minute <= 45 + st.stoppage1) || (st.minute > 45 + st.stoppage1 + 45) });
        },

        result() {
          return { hg: st.hg, ag: st.ag, hStarters: st.hStart, aStarters: st.aStart, homeScorers: st.homeScorers, awayScorers: st.awayScorers, reds: st.reds, timeline: [] };
        },
        minutesMap() { return st.minutes; },
      };
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