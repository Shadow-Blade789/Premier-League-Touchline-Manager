/* =========================================================================
   PLFC TOUCHLINE MANAGER — STATE
   Career state, save/load, and squad-depth helpers.
   ========================================================================= */

   const SAVE_KEY = "plfc_manager_save_v1";

   const Econ = {
     leagueFactor(league) { return LEAGUE_ECON[league] || 1; },
     // Starting transfer kitty by club reputation tier, scaled down hard for
     // the lower divisions.
     startBudget(tier, league = "PL") {
       const base = { 5: 80, 4: 45, 3: 25, 2: 12, 1: 5, 0: 2.5 }[tier] ?? 10;
       return Math.max(0.5, Math.round(base * this.leagueFactor(league) * 10) / 10);
     },
     // Per-matchweek broadcast/prize income trickle.
     weeklyIncome(tier, league = "PL") {
       const base = { 5: 2.2, 4: 1.4, 3: 1.0, 2: 0.6, 1: 0.4, 0: 0.25 }[tier] ?? 0.8;
       return Math.max(0.1, Math.round(base * this.leagueFactor(league) * 10) / 10);
     },
     // End-of-season prize money by final position, scaled by division.
     endOfSeasonPrize(position, league = "PL") {
       const prize = Math.max(4, Math.round((35 - position * 1.1) * 10) / 10);
       return Math.max(0.5, Math.round(prize * this.leagueFactor(league) * 10) / 10);
     },
   };
   
   function ensureSquadDepth(club) {
     const need = { GK: 2, DF: 7, MF: 6, FW: 4 };
     const have = { GK: 0, DF: 0, MF: 0, FW: 0 };
     club.squad.forEach(p => have[p.pos]++);
     // Gradient by tier so squads step down PL → CH → L1 → L2.
     const baseRating = Math.max(46, 54 + club.tier * 3);
     for (const pos of POSITIONS) {
       while (have[pos] < need[pos]) {
         // Skew young: most fill-ins are academy-aged depth, with a handful of
         // older journeymen for squad balance.
         const age = Math.random() < 0.65 ? 17 + Math.floor(Math.random() * 6) : 24 + Math.floor(Math.random() * 10);
         const rating = baseRating - 6 + Math.floor(Math.random() * 10) - (age < 21 ? 4 : 0);
         const { name, nat } = randomProspect();
         const p = P(name, pos, age, rating, { nat });
         p.club = club.id;
         club.squad.push(p);
         have[pos]++;
       }
     }
   }
   
   function freshClubsCopy() {
     // Deep-ish copy so a new career never mutates the shared template data.
     const copy = CLUBS.map(c => ({
       ...c,
       // Clone stats/bonus/career too — a shallow {...p} would otherwise share
       // those objects with the shared CLUBS template and leak across careers.
       squad: c.squad.map(p => ({ ...p, stats: Stats.blank(), bonus: Stats.blankBonus(), career: { ...p.career } })),
     }));
     copy.forEach(ensureSquadDepth);
     return copy;
   }
   
   function newCareerState(managerName, clubId) {
     const clubs = freshClubsCopy();
     clubs.forEach(c => {
       c.budget = Econ.startBudget(c.tier, c.league);
       c.points = 0; c.played = 0; c.won = 0; c.drawn = 0; c.lost = 0;
       c.gf = 0; c.ga = 0;
       c.formation = "4-4-2";
       c.lineup = null; // filled by auto-pick on first use
       Coaching.initClubCoaches(c); // tier-appropriate starting staff
     });

     return {
       managerName,
       clubId,
       season: 2026,
       week: 0,
       clubs,                 // every club across both leagues, tagged c.league
       fixtures: { PL: [], CH: [] }, // generated per league by Season.buildFixtures
       results: [],           // completed match results this season
       market: [],            // current transfer market listings (shared by both leagues)
       history: [],           // past season summaries {season, league, position, ...}
       titles: 0,             // Premier League titles won
       honours: [],           // trophy cabinet: [{type, season}]
       coachMarket: [],       // hireable coaches, refreshed each matchweek
       pendingShield: null,   // Community Shield participants for the coming season
       pendingMatch: null,    // result payload waiting to be viewed live
       windowWasOpen: false,
     };
   }
   
   const Aging = {
     retirementChance(age, pos) {
       const effAge = pos === "GK" ? age - 2 : age;
       if (effAge < 33) return 0;
       if (effAge >= 39) return 1;
       return clamp01((effAge - 32) * 0.15);
     },
   
     growthStep(age) {
       if (age <= 20) return 2 + Math.round(Math.random() * 4); // +2..6
       if (age <= 23) return 1 + Math.round(Math.random() * 3); // +1..4
       if (age <= 26) return Math.round(Math.random() * 2);     // +0..2
       if (age <= 29) return Math.random() < 0.5 ? 1 : 0;
       return 0;
     },
     declineStep(age) {
       if (age < 30) return 0;
       if (age < 33) return Math.random() < 0.4 ? 1 : 0;
       if (age < 36) return 1 + Math.round(Math.random() * 2);  // +1..3
       return 2 + Math.round(Math.random() * 3);                // +2..5
     },
   
     // Ages every player across the league by one year, grows or declines
     // ratings, retires the oldest, and tops squads back up. Returns a news
     // digest for the season-end screen.
     advanceSeason(state) {
       const news = { retirements: [], breakouts: [], totalRetired: 0 };

       // Judge everyone's season BEFORE ratings move, then let it reshape both
       // potential and rating — relative to the player's own level, judged
       // within their own division, for every club in both leagues.
       const perfIndex = Stats.performanceIndex(state);

       state.clubs.forEach(club => {
         const survivors = [];
         club.squad.forEach(p => {
           p.age += 1;
           const retireChance = this.retirementChance(p.age, p.pos);
           if (p.age >= 43 || Math.random() < retireChance) {
             news.totalRetired++;
             if (club.id === state.clubId) news.retirements.push({ name: p.name, age: p.age, pos: p.pos });
             return; // not pushed to survivors — retires
           }
           const before = p.rating;
           const perf = perfIndex[p.id] || 0;
           // How far a season BEAT expectation (a relegation-tipped side finishing
           // top five scores big here) — the part that still earns huge growth.
           const over = perf > 0.5 ? perf - 0.5 : 0;
           // Coaching is the dominant driver of development.
           const coachMult = Coaching.growthMultiplier(club, p.pos);

           // Potential: a small nudge for an ordinary season, a big jump for a
           // dramatic overachievement; a strong coach can unlock a touch more.
           let potDelta = clamp(Math.round(perf * 2 + over * 9), -4, 9);
           if (p.age < 24 && coachMult > 1 && Math.random() < coachMult - 1) potDelta += 1;
           p.potential = clamp(p.potential + potDelta, 40, 99);

           // Rating: coaching drives growth toward potential (and cushions
           // decline); the season result is only a small nudge unless the
           // overachievement was dramatic.
           let delta = 0;
           if (p.age < 30) {
             if (p.rating < p.potential) delta += this.growthStep(p.age) * coachMult;
           } else {
             delta -= this.declineStep(p.age) * clamp(1.3 - coachMult * 0.3, 0.55, 1.3);
           }
           delta += clamp(Math.round(perf * 1.0 + over * 8), -2, 9);
           p.rating = clamp(Math.round(p.rating + delta), 40, 99);
           // A storming season can push a player past their old ceiling.
           if (p.rating > p.potential) p.potential = p.rating;

           if (club.id === state.clubId && p.rating - before >= 4) {
             news.breakouts.push({ name: p.name, age: p.age, from: before, to: p.rating });
           }
           survivors.push(p);
         });
         club.squad = survivors;
         ensureSquadDepth(club);
         // Ratings/values/wages drift, so keep them consistent with the new numbers.
         club.squad.forEach(p => {
           const rf = Math.max(0, p.rating - 55);
           const ageMult = p.age < 21 ? 1.35 : p.age < 24 ? 1.2 : p.age < 29 ? 1.0 : p.age < 32 ? 0.7 : p.age < 35 ? 0.45 : 0.25;
           p.value = Math.max(0.3, Math.round(Math.pow(rf, 1.7) * ageMult * 0.16 * 10) / 10);
           p.wage = Math.max(3, Math.round(Math.pow(rf, 1.45) * 2.6 + 4));
         });
         club.lineup = null; // force a fresh auto-pick against the new squad
       });
   
       return news;
     },
   };
   
   function clamp01(v) { return Math.max(0, Math.min(1, v)); }

   // Saves made before potentials existed have players with no `potential`
   // field, which renders as "undefined"/"NaN-NaN". Give each a sensible
   // ceiling from their rating and age (older players cap at their rating).
   function ensurePotentials(state) {
     state.clubs.forEach(club => club.squad.forEach(p => {
       if (p.potential == null || isNaN(p.potential)) {
         p.potential = Math.max(p.rating, Math.min(96, p.rating + growthRoom(p.age)));
       }
       if (p.wonderkid == null) p.wonderkid = false;
     }));
   }
   
   const Game = {
     state: null,
   
     save() {
       try {
         localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
         return true;
       } catch (e) {
         console.error("Save failed", e);
         return false;
       }
     },
     load() {
       try {
         const raw = localStorage.getItem(SAVE_KEY);
         if (!raw) return false;
         this.state = JSON.parse(raw);
         migrateSave(this.state);       // upgrade single-league saves to two leagues
         Stats.ensureAll(this.state);   // backfill stats/bonus on saves predating them
         ensurePotentials(this.state);  // backfill potential on saves predating it
         return true;
       } catch (e) {
         console.error("Load failed", e);
         return false;
       }
     },
     hasSave() {
       try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
     },
     clearSave() {
       try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
     },
     start(managerName, clubId) {
       this.state = newCareerState(managerName, clubId);
       Season.buildFixtures(this.state);
       Cup.initCareer(this.state);
       Vertu.initSeason(this.state);
       Market.weeklyUpdate(this.state);
       Coaching.weeklyMarket(this.state);
       this.save();
     },
     myClub() {
       return this.state.clubs.find(c => c.id === this.state.clubId);
     },
     myLeague() {
       const c = this.myClub();
       return c ? c.league : "PL";
     },
   };

   // Brings any older save up to the current world: four divisions at their
   // full sizes (PL 20, CH/L1/L2 24 each), the FA Cup + Carabao Cup, and career
   // stats. Missing clubs are injected fresh; newly-added clubs play out the
   // rest of the current season alongside the existing ones.
   function migrateSave(state) {
     const LEAGUE_TEMPLATES = { CH: RAW_CHAMPIONSHIP, L1: RAW_LEAGUEONE, L2: RAW_LEAGUETWO };
     state.clubs.forEach(c => { if (!c.league) c.league = "PL"; });

     let injected = false;
     const existing = new Set(state.clubs.map(c => c.id));
     Object.entries(LEAGUE_TEMPLATES).forEach(([lg, templates]) => {
       templates.forEach(template => {
         if (existing.has(template.id)) return; // top up whatever's missing to the full 24
         injected = true;
         const club = {
           ...template, squad: [], crestInitials: template.short,
           budget: Econ.startBudget(template.tier, lg),
           points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0,
           formation: "4-4-2", lineup: null,
         };
         ensureSquadDepth(club);
         club.squad.forEach(p => { p.club = club.id; });
         state.clubs.push(club);
         existing.add(template.id);
       });
     });

     const counts = LEAGUES.map(lg => (state.fixtures && !Array.isArray(state.fixtures) && state.fixtures[lg] || []).length);
     const expected = LEAGUES.map(lg => 2 * (state.clubs.filter(c => c.league === lg).length - 1));
     const fixturesOk = counts.every((c, i) => c === expected[i]);
     if (!fixturesOk || injected) {
       const oldPL = Array.isArray(state.fixtures) ? state.fixtures : (state.fixtures && state.fixtures.PL);
       Season.buildFixtures(state);
       // Keep the in-progress Premier League schedule if it still matches (20 clubs).
       if (oldPL && oldPL.length === state.fixtures.PL.length) state.fixtures.PL = oldPL;
     }

     delete state.feederPool;
     delete state.leagueOnePool;
     delete state.faTeams; // placeholders retired — the cups now use real clubs

     // (Re)initialise the cups. Old FA brackets referenced placeholder "fa_"
     // teams; and older saves have no Carabao Cup. Mid-season the cups sit out
     // the current campaign and start fresh next season.
     const oldFa = state.faCup && (state.faCup.participants || []).some(id => String(id).startsWith("fa_"));
     if (!state.faCup || !state.eflCup || oldFa || injected) {
       Cup.initSeason(state);
       if (state.week > 0) { state.faCup.skipped = true; state.eflCup.skipped = true; }
     }

     // Vertu Trophy, honours and Community Shield are newer than some saves.
     if (!state.vertu || injected) {
       Vertu.initSeason(state);
       if (state.week > 0) state.vertu.skipped = true;
     }
     if (!Array.isArray(state.honours)) state.honours = [];
     if (state.pendingShield === undefined) state.pendingShield = null;

     // Coaching staff + coaches market are newer than some saves.
     Coaching.ensureAll(state);
     if (!Array.isArray(state.coachMarket) || !state.coachMarket.length) Coaching.weeklyMarket(state);

     ensureCareers(state);
   }

   // Seed missing lifetime records on saves that predate career tracking.
   function ensureCareers(state) {
     state.clubs.forEach(club => club.squad.forEach(p => {
       if (!p.career) p.career = estimateCareer(p.rating, p.age, p.pos);
     }));
   }