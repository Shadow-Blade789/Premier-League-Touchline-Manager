/* =========================================================================
   PLFC TOUCHLINE MANAGER — APP CONTROLLER
   Boot sequence, navigation, event wiring, and the live-match player.
   ========================================================================= */

   const App = {
    selectedClubId: null,
    hubStatScope: "league", // "league" | "team" toggle on the hub stats panel
    tableLeague: null,      // which division the Table tab is showing
    weekQueue: [],          // the user's remaining live matches this week (league, then cup)
    currentItem: null,      // the match currently being played
    weekInProgress: false,  // a matchweek sequence is mid-flight
    windowTransition: null,

    init() {
      UI.renderClubGrid(null);
      this.wireStartScreen();
      this.wireTabs();
      this.wireHub();
      this.wireSquad();
      this.wireMarket();
      this.wireLineup();
      this.wireMatch();
      this.wireTable();

      if (Game.hasSave() && Game.load()) {
        const club = Game.myClub();
        document.getElementById("continuePanel").classList.remove("hidden");
        document.getElementById("continueSummary").textContent =
          `${Game.state.managerName} — ${club.name} (${LEAGUE_NAMES[club.league]}) — Season ${Game.state.season}/${String(Game.state.season + 1).slice(2)}, Matchweek ${Math.min(Game.state.week + 1, Season.totalWeeks(Game.state))}`;
      } else {
        Game.state = null;
      }
    },
  
    // ---------------- Start screen ----------------
    wireStartScreen() {
      document.getElementById("clubGrid").addEventListener("click", e => {
        const tile = e.target.closest(".club-tile");
        if (!tile) return;
        this.selectedClubId = tile.dataset.club;
        UI.renderClubGrid(this.selectedClubId);
        this.validateStart();
      });
      document.getElementById("managerNameInput").addEventListener("input", () => this.validateStart());
  
      document.getElementById("btnBeginCareer").addEventListener("click", () => {
        const name = document.getElementById("managerNameInput").value.trim();
        if (!name || !this.selectedClubId) return;
        if (Game.hasSave() && !confirm("Starting a new career will overwrite your existing save. Continue?")) return;
        Game.start(name, this.selectedClubId);
        this.enterCareer();
      });
  
      document.getElementById("btnContinue").addEventListener("click", () => this.enterCareer());
  
      document.getElementById("btnDeleteSave").addEventListener("click", () => {
        if (!confirm("Delete your saved career? This can't be undone.")) return;
        Game.clearSave();
        Game.state = null;
        document.getElementById("continuePanel").classList.add("hidden");
      });
    },
  
    validateStart() {
      const name = document.getElementById("managerNameInput").value.trim();
      document.getElementById("btnBeginCareer").disabled = !(name && this.selectedClubId);
    },
  
    enterCareer() {
      document.getElementById("screen-start").classList.add("hidden");
      document.getElementById("topbar").classList.remove("hidden");
      document.getElementById("tabs").classList.remove("hidden");
      this.showTab("hub");
    },
  
    // ---------------- Tabs / screens ----------------
    wireTabs() {
      document.getElementById("tabs").addEventListener("click", e => {
        const btn = e.target.closest("button[data-tab]");
        if (!btn) return;
        this.showTab(btn.dataset.tab);
      });
    },
  
    showTab(name) {
      // If navigating away mid-matchweek, wrap up the whole week (record the
      // remaining precomputed results and advance) so nothing is lost.
      if (this.weekInProgress) {
        if (this.wrapUpWeek()) return; // jumped to the season-end screen
      }
  
      ["hub", "squad", "market", "lineup", "table"].forEach(t => {
        document.getElementById("screen-" + t).classList.toggle("hidden", t !== name);
        const tabBtn = document.getElementById("tab" + t[0].toUpperCase() + t.slice(1));
        if (tabBtn) tabBtn.classList.toggle("active", t === name);
      });
      document.getElementById("screen-match").classList.add("hidden");
      document.getElementById("screen-seasonend").classList.add("hidden");
      this.refreshChrome();
      if (name === "hub") UI.renderHub(Game.state);
      if (name === "squad") UI.renderSquad(Game.state);
      if (name === "market") UI.renderMarket(Game.state);
      if (name === "lineup") UI.renderLineup(Game.state);
      if (name === "table") {
        // Default the Table tab to the user's own division each visit.
        this.tableLeague = Game.myLeague();
        UI.renderTable(Game.state, this.tableLeague);
      }
    },

    // ---------------- Table ----------------
    wireTable() {
      document.querySelector("#screen-table .scope-toggle").addEventListener("click", e => {
        const btn = e.target.closest("button[data-league]");
        if (!btn) return;
        this.tableLeague = btn.dataset.league;
        UI.renderTable(Game.state, this.tableLeague);
      });
    },
  
    refreshChrome() {
      if (Game.state) UI.renderTopbar(Game.state);
    },
  
    // ---------------- Hub ----------------
    wireHub() {
      // "Set Lineup & Play" on the hub navigates to the Lineup tab so the
      // manager can review/adjust before kicking off.
      document.getElementById("btnGoToLineup").addEventListener("click", () => this.showTab("lineup"));
      // League / My Squad toggle on the season-stats panel.
      document.querySelector("#hubStatsPanel .scope-toggle").addEventListener("click", e => {
        const btn = e.target.closest("button[data-scope]");
        if (!btn) return;
        this.hubStatScope = btn.dataset.scope;
        UI.renderHubStats(Game.state, this.hubStatScope);
      });
    },
  
    // ---------------- Squad ----------------
    wireSquad() {
      document.getElementById("squadList").addEventListener("click", e => {
        const btn = e.target.closest("button[data-sell]");
        if (!btn) return;
        const res = Market.sell(Game.state, btn.dataset.sell);
        if (!res.ok) { UI.toast(res.reason); return; }
        UI.toast(`Sold to ${res.buyerName} for ${UI.money(res.fee)}`);
        Game.save();
        UI.renderSquad(Game.state);
        this.refreshChrome();
      });
    },
  
    // ---------------- Market ----------------
    wireMarket() {
      document.getElementById("btnReroll").addEventListener("click", () => {
        Market.reroll(Game.state);
        Game.save();
        UI.renderMarket(Game.state);
      });
      document.getElementById("marketList").addEventListener("click", e => {
        const btn = e.target.closest("button[data-buy]");
        if (!btn) return;
        const res = Market.buy(Game.state, btn.dataset.buy);
        if (!res.ok) { UI.toast(res.reason); return; }
        UI.toast(`Signed ${res.name} (from ${res.origin})`);
        Game.save();
        UI.renderMarket(Game.state);
        this.refreshChrome();
      });
    },
  
    // ---------------- Lineup ----------------
    wireLineup() {
      document.getElementById("formationSelect").addEventListener("change", e => {
        const club = Game.myClub();
        Lineup.autoPick(club, e.target.value);
        Game.save();
        UI.renderLineup(Game.state);
      });
      document.getElementById("btnAutoPick").addEventListener("click", () => {
        const club = Game.myClub();
        Lineup.autoPick(club, club.formation);
        Game.save();
        UI.renderLineup(Game.state);
      });
      document.getElementById("lineupSlots").addEventListener("change", e => {
        const sel = e.target.closest("select[data-pos]");
        if (!sel) return;
        const club = Game.myClub();
        const pos = sel.dataset.pos, idx = Number(sel.dataset.idx);
        if (sel.value) {
          Lineup.assign(club, pos, idx, sel.value);
        } else {
          const prev = club.lineup.slots[pos][idx];
          club.lineup.slots[pos][idx] = null;
          if (prev) Lineup.addToBench(club, prev);
        }
        Game.save();
        UI.renderPitch(club);
        UI.renderLineupSlots(club);
        UI.renderBench(club);
      });
      document.getElementById("btnPlayMatch").addEventListener("click", () => this.startMatch());
    },
  
    startMatch() {
      const club = Game.myClub();
      if (!club.lineup || !Lineup.isComplete(club.lineup)) {
        // Auto-pick first so the error message is a last resort, not the first
        // thing the manager sees if they haven't touched lineup yet.
        Lineup.autoPick(club, club.formation || "4-4-2");
      }
      if (!Lineup.isComplete(club.lineup)) {
        document.getElementById("lineupError").textContent = "Fill every starting slot before kicking off.";
        return;
      }
      const state = Game.state;
      const fixture = Season.userMatchThisRound(state);
      if (!fixture) { UI.toast("No fixture this week."); return; }

      // Resolve every other match in both leagues for the week.
      Season.simulateOtherMatchesThisRound(state);

      // Build the user's live-match queue: the league game first, then an FA
      // Cup tie if one falls on this matchweek and they're still in.
      this.weekQueue = [];
      const home = state.clubs.find(c => c.id === fixture.home);
      const away = state.clubs.find(c => c.id === fixture.away);
      // AI opponents get a fresh auto-pick so they field a valid full XI.
      const ai = home.id === club.id ? away : home;
      Lineup.autoPick(ai, ai.formation || "4-4-2");
      const leagueFull = MatchEngine.simulateFull(home, away);
      this.weekQueue.push({
        type: "league", home, away, full: leagueFull, recorded: false,
        label: LEAGUE_NAMES[Game.myLeague()] + " · Matchweek " + (state.week + 1),
      });

      // A cup round can fall on this week (FA Cup and/or Carabao Cup).
      Object.values(Cup.CUPS).forEach(cfg => {
        const fc = state[cfg.stateKey];
        if (!Cup.isActive(fc) || fc.winner || !Cup.roundForWeek(cfg, state.week)) return;
        Cup.drawRound(state, fc);
        Cup.simulateOtherTies(state, fc);
        const tie = Cup.userTie(state, fc);
        if (tie && !tie.played) {
          const roundDef = Cup.currentRoundDef(cfg, fc);
          const chome = Cup.clubByAnyId(state, tie.home);
          const caway = Cup.clubByAnyId(state, tie.away);
          const cai = chome.id === club.id ? caway : chome;
          Lineup.autoPick(cai, cai.formation || "4-4-2");
          const cupFull = MatchEngine.simulateFull(chome, caway);
          this.weekQueue.push({
            type: "cup", cupKey: cfg.key, home: chome, away: caway, full: cupFull, tie, recorded: false,
            label: cfg.name + " · " + roundDef.name,
          });
        } else {
          Cup.completeRoundIfDone(state, fc); // user not involved — resolve now
        }
      });

      this.weekInProgress = true;
      document.getElementById("screen-lineup").classList.add("hidden");
      document.getElementById("screen-hub").classList.add("hidden");
      this.playNextInQueue();
    },

    // Load the next queued match into the player, or wrap up the week.
    playNextInQueue() {
      if (!this.weekQueue.length) { this.finalizeWeek(); return; }
      this.currentItem = this.weekQueue.shift();
      MatchPlayer.load(this.currentItem.home, this.currentItem.away, this.currentItem.full, {
        label: this.currentItem.label, type: this.currentItem.type,
      });
      document.getElementById("screen-match").classList.remove("hidden");
    },

    // Called by MatchPlayer the instant a live match reaches full time.
    onLiveMatchEnded() {
      this.recordItem(this.currentItem);
    },

    // Apply a match's precomputed outcome to game state (idempotent).
    recordItem(item) {
      if (!item || item.recorded) return;
      item.recorded = true;
      const state = Game.state;
      if (item.type === "league") {
        Season.recordResult(state, item.home.id, item.away.id, item.full.hg, item.full.ag);
        Stats.recordUserMatch(item.full.hStarters, item.full.aStarters, item.full.hg, item.full.ag, item.full.homeScorers, item.full.awayScorers);
      } else if (item.type === "cup") {
        const cfg = Cup.CUPS[item.cupKey];
        const fc = state[cfg.stateKey];
        Cup.recordUserTie(state, fc, item.full.hg, item.full.ag);
        Cup.completeRoundIfDone(state, fc);
        if (item.tie.pens) {
          document.getElementById("matchStatus").textContent = "AET · " + Cup.clubShort(state, item.tie.winner) + " win on pens";
        }
      }
      Game.save();
    },
  
    // ---------------- Match controls ----------------
    wireMatch() {
      document.getElementById("btnMatchStart").addEventListener("click", () => MatchPlayer.start());
      document.getElementById("btnMatchPause").addEventListener("click", () => MatchPlayer.pause());
      document.getElementById("btnMatchSkip").addEventListener("click", () => MatchPlayer.skip());
      document.querySelectorAll(".speed-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".speed-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          MatchPlayer.setSpeed(Number(btn.dataset.speed));
        });
      });
      document.getElementById("btnMatchContinue").addEventListener("click", () => this.finishMatch());
    },
  
    // "Continue" after a live match — record it (if not already) and move on
    // to the next queued match, or finalise the week.
    finishMatch() {
      this.recordItem(this.currentItem);
      this.playNextInQueue();
    },

    // No more live matches this week: advance the week and route onward.
    finalizeWeek() {
      this.weekInProgress = false;
      this.currentItem = null;
      const state = Game.state;
      this.windowTransition = Season.advanceWeek(state);
      Game.save();
      if (Season.isSeasonOver(state)) {
        const result = Season.endOfSeason(state);
        Game.save();
        this.renderSeasonEnd(result);
      } else {
        const t = this.windowTransition;
        this.showTab("hub");
        if (t && t.transition === "opened") UI.toast(`🔁 ${t.name} transfer window is now open!`);
        else if (t && t.transition === "closed") UI.toast("🔒 Transfer window has closed.");
      }
    },

    // Mid-week bail-out (e.g. user taps a tab): record every remaining match
    // from its precomputed result, advance the week. Returns true if it routed
    // to the season-end screen.
    wrapUpWeek() {
      MatchPlayer.stop();
      this.recordItem(this.currentItem);
      while (this.weekQueue.length) this.recordItem(this.weekQueue.shift());
      this.weekInProgress = false;
      this.currentItem = null;
      const state = Game.state;
      this.windowTransition = Season.advanceWeek(state);
      Game.save();
      if (Season.isSeasonOver(state)) {
        const result = Season.endOfSeason(state);
        Game.save();
        this.renderSeasonEnd(result);
        return true;
      }
      return false;
    },
  
    // ---------------- Season end ----------------
    renderSeasonEnd(result) {
      const state = Game.state;
      const club = Game.myClub();
      ["hub", "squad", "market", "lineup", "table"].forEach(t => document.getElementById("screen-" + t).classList.add("hidden"));
      document.getElementById("tabs").classList.add("hidden");
      document.getElementById("screen-match").classList.add("hidden");
      const screen = document.getElementById("screen-seasonend");
      screen.classList.remove("hidden");
  
      const fromLeagueName = LEAGUE_NAMES[result.userLeague];

      if (result.userSacked) {
        // Bottom three of League Two — sacked. Career ends here.
        screen.innerHTML = `
          <div class="relegation-screen">
            <p class="eyebrow">Season ${state.season}/${String(state.season + 1).slice(2)} complete</p>
            <div class="big">Sacked</div>
            <p>${club.name} finish ${ordinal(result.myFinalPos)} in League Two — bottom of the Football League. The board have dismissed you and your career ends here.</p>
            <button class="primary" id="btnSeasonNewCareer">Start New Career</button>
          </div>
          ${result.awards ? `<div class="panel"><h3>Final ${fromLeagueName} Awards</h3>${UI.awardsGridHTML(result.awards)}${UI.seasonStatBoardsHTML(result.awards)}</div>` : ""}
        `;
        document.getElementById("btnSeasonNewCareer").addEventListener("click", () => {
          Game.clearSave();
          Game.state = null;
          this.selectedClubId = null;
          document.getElementById("topbar").classList.add("hidden");
          document.getElementById("continuePanel").classList.add("hidden");
          document.getElementById("managerNameInput").value = "";
          UI.renderClubGrid(null);
          screen.classList.add("hidden");
          document.getElementById("screen-start").classList.remove("hidden");
        });
        return;
      }

      // Headline + subtitle for the season's outcome.
      const toLeagueName = LEAGUE_NAMES[result.toLeague];
      let headline = "Season Complete", headClass = "";
      if (result.isChampion && result.userLeague !== "PL") headline = `🏆 ${fromLeagueName} Winners!`;
      else if (result.isChampion) headline = "🏆 Champions!";
      else if (result.userPromoted) headline = "🔼 Promoted!";
      else if (result.userRelegated) { headline = "🔽 Relegated"; headClass = "relegated"; }

      let movementLine = "";
      if (result.userPromoted) movementLine = `<p class="promo-line">${club.name} go up to the <strong>${toLeagueName}</strong> next season.</p>`;
      else if (result.userRelegated) movementLine = `<p class="releg-line">${club.name} drop to the <strong>${toLeagueName}</strong> next season — the career continues.</p>`;

      // Play-off outcome (League One / Two only).
      let playoffLine = "";
      if (result.userPlayoff === "won") playoffLine = `<p class="promo-line">🎉 Won the play-off final!</p>`;
      else if (result.userPlayoff === "lostFinal") playoffLine = `<p class="muted">Lost the play-off final — so near, yet so far.</p>`;
      else if (result.userPlayoff === "lostSemi") playoffLine = `<p class="muted">Knocked out in the play-off semi-final.</p>`;

      const cupLine = cup => cup
        ? `<p class="${cup.userWon ? "promo-line" : "muted"}">${cup.name}: ${cup.userWon ? "🏆 " + club.name + " — Winners!" : cup.winner + " · your run: " + cup.userResult}</p>`
        : "";

      const size = (result.tables && result.tables[result.userLeague]) ? result.tables[result.userLeague].length : 20;
      const zone = Season.zoneFor(result.myFinalPos, result.userLeague, size);
      const news = result.ageingNews;
      let newsHTML = "";
      if (news && (news.retirements.length || news.breakouts.length)) {
        newsHTML = `<div class="panel" style="text-align:left; margin-top:1.2rem;"><h3>Off-season news — ${club.name}</h3>`;
        if (news.retirements.length) {
          newsHTML += `<p class="muted">Retired: ${news.retirements.map(r => `${r.name} (${r.age})`).join(", ")}</p>`;
        }
        if (news.breakouts.length) {
          newsHTML += `<p>Breakout development: ${news.breakouts.map(b => `${b.name} ${b.from}→${b.to}`).join(", ")}</p>`;
        }
        newsHTML += `<p class="muted" style="font-size:0.78rem;">${news.totalRetired} players retired across both leagues this off-season.</p></div>`;
      }
      const awardsHTML = result.awards
        ? `<div class="panel" style="text-align:left; margin-top:1.2rem;">
             <h3>${fromLeagueName} Awards</h3>
             ${UI.awardsGridHTML(result.awards)}
             ${UI.bonusCalloutHTML(result.bonusesGranted)}
             <h4 style="margin-top:1.2rem;">Final ${fromLeagueName} Leaderboards</h4>
             ${UI.seasonStatBoardsHTML(result.awards)}
           </div>`
        : "";
      screen.innerHTML = `
        <div class="trophy-screen">
          <p class="eyebrow">${fromLeagueName} · Season ${state.season - 1}/${String(state.season).slice(2)} complete</p>
          <div class="big ${headClass}">${headline}</div>
          <p>${club.name} finished <strong>${ordinal(result.myFinalPos)}</strong> in the ${fromLeagueName}${zone ? " — " + zoneLabel(zone) : ""}.</p>
          ${movementLine}
          ${playoffLine}
          ${cupLine(result.faCup)}
          ${cupLine(result.eflCup)}
          <p class="muted">${fromLeagueName} champions: ${result.champion.name} · New budget: ${UI.money(club.budget)}</p>
          <button class="primary" id="btnSeasonContinue">Continue to Next Season</button>
          ${awardsHTML}
          ${newsHTML}
        </div>
      `;
      document.getElementById("btnSeasonContinue").addEventListener("click", () => {
        document.getElementById("tabs").classList.remove("hidden");
        this.showTab("hub");
      });
    },
  };
  
  // =========================================================================
  // LIVE MATCH PLAYER
  // =========================================================================
  // Pure visualiser — reveals a precomputed timeline. Recording the outcome
  // and advancing the week is App's job (App.onLiveMatchEnded / finalizeWeek).
  const MatchPlayer = {
    home: null, away: null, timeline: [], idx: 0, speed: 1, timer: null, running: false,

    load(home, away, full, meta) {
      this.home = home; this.away = away;
      this.timeline = full.timeline; this.idx = 0;
      this.speed = 1; this.running = false;
      clearInterval(this.timer);

      const comp = document.getElementById("matchCompetition");
      comp.textContent = (meta && meta.label) || "";
      comp.className = "match-competition" + (meta && meta.type === "cup" ? " cup" : "");

      document.getElementById("matchHomeCrest").outerHTML = UI.crestHTML(home).replace('class="crest "', 'class="crest" id="matchHomeCrest"');
      document.getElementById("matchAwayCrest").outerHTML = UI.crestHTML(away).replace('class="crest "', 'class="crest" id="matchAwayCrest"');
      document.getElementById("matchHomeName").textContent = home.short;
      document.getElementById("matchAwayName").textContent = away.short;
      document.getElementById("matchScore").textContent = "0 – 0";
      document.getElementById("matchClock").textContent = "0'";
      document.getElementById("matchStatus").textContent = "Ready";
      document.getElementById("commentaryFeed").innerHTML = "";
      document.getElementById("momHome").style.width = "50%";
      document.getElementById("momAway").style.width = "50%";
      document.getElementById("btnMatchStart").disabled = false;
      document.getElementById("btnMatchPause").disabled = true;
      document.getElementById("btnMatchContinue").classList.add("hidden");
      document.querySelectorAll(".speed-btn").forEach(b => b.classList.toggle("active", b.dataset.speed === "1"));
    },
  
    start() {
      if (this.idx >= this.timeline.length) return;
      this.running = true;
      document.getElementById("btnMatchStart").disabled = true;
      document.getElementById("btnMatchPause").disabled = false;
      document.getElementById("matchStatus").textContent = "Live";
      this.scheduleTick();
    },
  
    scheduleTick() {
      clearInterval(this.timer);
      const baseDelay = 650;
      this.timer = setInterval(() => this.tick(), baseDelay / this.speed);
    },
  
    setSpeed(n) {
      this.speed = n;
      if (this.running) this.scheduleTick();
    },
  
    pause() {
      this.running = false;
      clearInterval(this.timer);
      document.getElementById("btnMatchStart").disabled = false;
      document.getElementById("btnMatchPause").disabled = true;
      document.getElementById("matchStatus").textContent = "Paused";
    },
  
    tick() {
      if (this.idx >= this.timeline.length) { this.endMatch(); return; }
      const evt = this.timeline[this.idx++];
      this.reveal(evt);
      if (this.idx >= this.timeline.length) this.endMatch();
    },
  
    reveal(evt) {
      document.getElementById("matchScore").textContent = `${evt.hg} – ${evt.ag}`;
      document.getElementById("matchClock").textContent = evt.minute + (evt.stoppage ? "+" : "") + "'";
      if (typeof evt.mom === "number") {
        document.getElementById("momHome").style.width = evt.mom + "%";
        document.getElementById("momAway").style.width = (100 - evt.mom) + "%";
      }
      const feed = document.getElementById("commentaryFeed");
      const item = document.createElement("div");
      item.className = "feed-item " + evt.type;
      item.innerHTML = `<div class="min mono">${evt.minute}${evt.stoppage ? "+" : ""}'</div><div>${evt.text}</div>`;
      feed.appendChild(item);
    },
  
    skip() {
      clearInterval(this.timer);
      this.running = false;
      while (this.idx < this.timeline.length) {
        this.reveal(this.timeline[this.idx++]);
      }
      this.endMatch();
    },
  
    stop() {
      clearInterval(this.timer);
      this.running = false;
    },

    // Called the moment the last event is revealed. Hands off to App to record
    // the result; App decides whether another match or the week-end follows.
    endMatch() {
      clearInterval(this.timer);
      this.running = false;
      document.getElementById("matchStatus").textContent = "Full Time";
      document.getElementById("btnMatchStart").disabled = true;
      document.getElementById("btnMatchPause").disabled = true;
      document.getElementById("btnMatchContinue").classList.remove("hidden");
      App.onLiveMatchEnded();
    },
  };
  
  document.addEventListener("DOMContentLoaded", () => App.init());