/* =========================================================================
   PLFC TOUCHLINE MANAGER — APP CONTROLLER
   Boot sequence, navigation, event wiring, and the live-match player.
   ========================================================================= */

   const App = {
    selectedClubId: null,
    hubStatScope: "league", // "league" | "team" toggle on the hub stats panel

    init() {
      UI.renderClubGrid(null);
      this.wireStartScreen();
      this.wireTabs();
      this.wireHub();
      this.wireSquad();
      this.wireMarket();
      this.wireLineup();
      this.wireMatch();
  
      if (Game.hasSave() && Game.load()) {
        const club = Game.myClub();
        document.getElementById("continuePanel").classList.remove("hidden");
        document.getElementById("continueSummary").textContent =
          `${Game.state.managerName} — ${club.name} — Season ${Game.state.season}/${String(Game.state.season + 1).slice(2)}, Matchweek ${Math.min(Game.state.week + 1, Game.state.fixtures.length)}`;
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
      // If navigating away while a match has ended but user hasn't clicked
      // Continue, commit the result now so it isn't lost.
      const matchScreen = document.getElementById("screen-match");
      if (!matchScreen.classList.contains("hidden") && MatchPlayer.matchEnded && !MatchPlayer.committed) {
        MatchPlayer.commit();
      }
  
      ["hub", "squad", "market", "lineup", "table"].forEach(t => {
        document.getElementById("screen-" + t).classList.toggle("hidden", t !== name);
        const tabBtn = document.getElementById("tab" + t[0].toUpperCase() + t.slice(1));
        if (tabBtn) tabBtn.classList.toggle("active", t === name);
      });
      matchScreen.classList.add("hidden");
      document.getElementById("screen-seasonend").classList.add("hidden");
      this.refreshChrome();
      if (name === "hub") UI.renderHub(Game.state);
      if (name === "squad") UI.renderSquad(Game.state);
      if (name === "market") UI.renderMarket(Game.state);
      if (name === "lineup") UI.renderLineup(Game.state);
      if (name === "table") UI.renderTable(Game.state);
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
  
      Season.simulateOtherMatchesThisRound(state);
  
      const home = state.clubs.find(c => c.id === fixture.home);
      const away = state.clubs.find(c => c.id === fixture.away);
  
      // Always force a fresh auto-pick for AI opponents so they field a valid
      // full XI. Stale lineups from transfers, aging, or promotion can have
      // null slots that badly distort the simulation.
      const ai = home.id === club.id ? away : home;
      Lineup.autoPick(ai, ai.formation || "4-4-2");
  
      const full = MatchEngine.simulateFull(home, away);
  
      MatchPlayer.load(home, away, full);
      document.getElementById("screen-lineup").classList.add("hidden");
      document.getElementById("screen-hub").classList.add("hidden");
      document.getElementById("screen-match").classList.remove("hidden");
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
  
    finishMatch() {
      // The result was already committed by MatchPlayer.commit() when the match
      // ended (endMatch). All we need to do here is navigate.
      if (MatchPlayer.seasonOver) {
        this.renderSeasonEnd(MatchPlayer.seasonResult);
      } else {
        const t = MatchPlayer.windowTransition;
        this.showTab("hub");
        if (t && t.transition === "opened") UI.toast(`🔁 ${t.name} transfer window is now open!`);
        else if (t && t.transition === "closed") UI.toast("🔒 Transfer window has closed.");
      }
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
  
      if (result.userRelegated) {
        screen.innerHTML = `
          <div class="relegation-screen">
            <p class="eyebrow">Season ${state.season}/${String(state.season + 1).slice(2)} complete</p>
            <div class="big">Relegated</div>
            <p>${club.name} finish ${ordinal(result.myFinalPos)} and drop out of the Premier League. Your top-flight career ends here.</p>
            <button class="primary" id="btnSeasonNewCareer">Start New Career</button>
          </div>
          ${result.awards ? `<div class="panel"><h3>Final Season Awards</h3>${UI.awardsGridHTML(result.awards)}${UI.seasonStatBoardsHTML(result.awards)}</div>` : ""}
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
  
      const isChampion = result.champion.id === club.id;
      const zone = Season.zoneFor(result.myFinalPos);
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
        newsHTML += `<p class="muted" style="font-size:0.78rem;">${news.totalRetired} players retired across the league this off-season.</p></div>`;
      }
      const awardsHTML = result.awards
        ? `<div class="panel" style="text-align:left; margin-top:1.2rem;">
             <h3>Season Awards</h3>
             ${UI.awardsGridHTML(result.awards)}
             ${UI.bonusCalloutHTML(result.bonusesGranted)}
             <h4 style="margin-top:1.2rem;">Final Leaderboards</h4>
             ${UI.seasonStatBoardsHTML(result.awards)}
           </div>`
        : "";
      screen.innerHTML = `
        <div class="trophy-screen">
          <p class="eyebrow">Season ${state.season - 1}/${String(state.season).slice(2)} complete</p>
          <div class="big">${isChampion ? "🏆 Champions!" : "Season Complete"}</div>
          <p>${club.name} finished <strong>${ordinal(result.myFinalPos)}</strong>${zone ? " — " + zoneLabel(zone) : ""}.</p>
          <p class="muted">Champions: ${result.champion.name} · New budget: ${UI.money(club.budget)}</p>
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
  const MatchPlayer = {
    home: null, away: null, timeline: [], idx: 0, speed: 1, timer: null, running: false,
    finalHg: 0, finalAg: 0,
    // Post-match state (populated by commit()):
    committed: false, matchEnded: false,
    seasonOver: false, seasonResult: null, windowTransition: null,
  
    load(home, away, full) {
      this.home = home; this.away = away;
      this.timeline = full.timeline; this.idx = 0;
      this.finalHg = full.hg; this.finalAg = full.ag;
      // Stat attribution inputs, applied once at commit().
      this.hStarters = full.hStarters; this.aStarters = full.aStarters;
      this.homeScorers = full.homeScorers; this.awayScorers = full.awayScorers;
      this.speed = 1; this.running = false;
      this.committed = false; this.matchEnded = false;
      this.seasonOver = false; this.seasonResult = null; this.windowTransition = null;
      clearInterval(this.timer);
  
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
  
    // Called the moment the last event is revealed. Commits the result to
    // game state immediately — so navigating away via a tab never loses it.
    endMatch() {
      clearInterval(this.timer);
      this.running = false;
      this.matchEnded = true;
      document.getElementById("matchStatus").textContent = "Full Time";
      document.getElementById("btnMatchStart").disabled = true;
      document.getElementById("btnMatchPause").disabled = true;
      document.getElementById("btnMatchContinue").classList.remove("hidden");
      this.commit();
    },
  
    // Idempotent: safe to call multiple times (e.g. from showTab guard).
    commit() {
      if (this.committed || !this.matchEnded) return;
      this.committed = true;
      const state = Game.state;
      Season.recordResult(state, this.home.id, this.away.id, this.finalHg, this.finalAg);
      // Credit goals to the exact scorers shown in the commentary; apps, clean
      // sheets, saves and assists round out the stat sheet for this fixture.
      Stats.recordUserMatch(this.hStarters, this.aStarters, this.finalHg, this.finalAg, this.homeScorers, this.awayScorers);
      this.windowTransition = Season.advanceWeek(state);
      Game.save();
      if (Season.isSeasonOver(state)) {
        this.seasonOver = true;
        this.seasonResult = Season.endOfSeason(state);
        Game.save();
      }
    },
  };
  
  document.addEventListener("DOMContentLoaded", () => App.init());