/* =========================================================================
   PLFC TOUCHLINE MANAGER — UI RENDERING
   Pure(ish) render functions. State mutation + event wiring lives in main.js.
   ========================================================================= */

   const UI = {
    money(m) {
      return "£" + m.toFixed(1).replace(/\.0$/, "") + "m";
    },
    wage(w) {
      return "£" + w + "k/wk";
    },
    // Compact wage figure (used for totals like the wage budget): rolls up to
    // £m once it passes a thousand £k/week.
    wageFull(k) {
      k = Math.round(k || 0);
      return k >= 1000 || k <= -1000 ? "£" + (k / 1000).toFixed(1).replace(/\.0$/, "") + "m" : "£" + k + "k";
    },
    // Scouting reveals only a 5-wide band around a player's true potential.
    potentialRange(pot) {
      const lo = Math.floor(pot / 5) * 5;
      return `${lo}-${lo + 5}`;
    },
  
    crestHTML(club, size = "") {
      const [c1, c2] = club.colors;
      const initials = (club.crestInitials || club.short || club.name.slice(0, 3)).toUpperCase();
      const textColor = isLight(c1) ? "#0a0e14" : "#f4f7f2";
      return `<div class="crest ${size}" style="background:linear-gradient(160deg, ${c1} 55%, ${c2} 55%); color:${textColor};">${initials}</div>`;
    },
  
    // League-centric club picker. You browse by LEAGUE (grouped under a light
    // nation label for scanning), or type to search a club/league by name
    // across the whole world. Nations without their own league (e.g.
    // Liechtenstein) simply have no entry — their clubs live in the league they
    // actually play in. Scales to every UEFA nation as leagues are added.
    renderClubGrid(selectedId, selectedLeague, search) {
      search = (search || "").trim().toLowerCase();
      selectedLeague = selectedLeague || LEAGUES[0];

      // League navigation: one group per nation, each league a selectable chip.
      const bar = document.getElementById("leagueBar");
      if (bar) {
        bar.innerHTML = COUNTRIES.map(co => `
          <div class="league-nav-group">
            <div class="league-nav-nation">${COUNTRY_NAMES[co] || co}</div>
            <div class="league-nav-chips">
              ${LEAGUE_CHAINS[co].map(lg =>
                `<button class="league-chip ${lg === selectedLeague && !search ? "active" : ""}" data-league="${lg}" type="button">${LEAGUE_NAMES[lg]}</button>`
              ).join("")}
            </div>
          </div>
        `).join("");
      }

      const grid = document.getElementById("clubGrid");
      const tile = c => `
        <button class="club-tile ${c.id === selectedId ? "selected" : ""}" data-club="${c.id}" type="button">
          ${this.crestHTML(c, "sm")}
          <span>
            <span class="name">${c.name}</span>
            <span class="tag">${LEAGUE_SHORT[c.league] || LEAGUE_NAMES[c.league]} · ${"★".repeat(c.tier)}${"☆".repeat(5 - c.tier)}</span>
          </span>
        </button>
      `;

      if (search) {
        // Flat search across every league by club OR league name.
        const matches = CLUBS.filter(c =>
          c.name.toLowerCase().includes(search) || (LEAGUE_NAMES[c.league] || "").toLowerCase().includes(search)
        );
        grid.innerHTML = matches.length
          ? `<div class="club-group-head">${matches.length} result${matches.length === 1 ? "" : "s"} for “${search}”</div>` + matches.slice(0, 80).map(tile).join("")
          : `<div class="club-group-head">No clubs match “${search}”</div>`;
        return;
      }

      const lg = selectedLeague;
      grid.innerHTML =
        `<div class="club-group-head">${LEAGUE_NAMES[lg]} · ${COUNTRY_NAMES[LEAGUE_COUNTRY[lg]] || LEAGUE_COUNTRY[lg]}</div>` +
        CLUBS.filter(c => c.league === lg).map(tile).join("");
    },
  
    renderTopbar(state) {
      const club = Game.myClub();
      document.getElementById("topbarCrest").outerHTML = this.crestHTML(club, "sm").replace('class="crest sm"', 'class="crest sm" id="topbarCrest"');
      document.getElementById("topbarClub").textContent = club.name;
      document.getElementById("topbarManager").textContent =
        state.managerName + "  ·  " + LEAGUE_NAMES[club.league] + (state.titles ? "  ·  " + state.titles + "x Champion" : "");
      const total = Season.totalWeeks(state);
      document.getElementById("topbarSeason").textContent = state.season + "/" + String(state.season + 1).slice(2);
      document.getElementById("topbarWeek").textContent = Math.min(state.week + 1, total) + " / " + total;
      document.getElementById("topbarBudget").textContent = this.money(club.budget);
      const wageEl = document.getElementById("topbarWage");
      if (wageEl && typeof club.wageBudget === "number") {
        wageEl.textContent = this.wageFull(Contracts.wageRoom(club)) + " free";
        wageEl.title = `Wage bill ${this.wageFull(Contracts.wageBill(club))}/wk of ${this.wageFull(club.wageBudget)}/wk budget`;
      }
    },
  
    renderHub(state) {
      const club = Game.myClub();
      document.getElementById("hubWindowBanner").innerHTML = this.windowBanner(state);
      const match = Season.userMatchThisRound(state);
      const nf = document.getElementById("nextFixtureText");
      if (!match) {
        nf.textContent = "Season complete — head to the table.";
      } else {
        const opp = state.clubs.find(c => c.id === (match.home === club.id ? match.away : match.home));
        const venue = match.home === club.id ? "vs" : "@";
        nf.innerHTML = `MW${state.week + 1} ${this.crestHTML(club, "sm")} <strong>${club.short}</strong> ${venue} <strong>${opp.short}</strong> ${this.crestHTML(opp, "sm")}`;
      }
      const starters = Lineup.starters(club);
      document.getElementById("hubSnapshot").innerHTML = `
        Division: <strong>${LEAGUE_NAMES[club.league]}</strong><br>
        Formation: <strong>${club.formation}</strong><br>
        Squad size: <strong>${club.squad.length}</strong><br>
        XI average rating: <strong>${MatchEngine.overallRating(starters).toFixed(0)}</strong><br>
        Budget: <strong>${this.money(club.budget)}</strong>
      `;
      const league = club.league;
      const table = Season.table(state, league);
      const row = table.find(r => r.id === club.id);
      const zone = Season.zoneFor(row.pos, league, table.length);
      document.getElementById("hubPosition").innerHTML = `
        <span class="eyebrow">${LEAGUE_NAMES[league]}</span><br>
        Position <strong>${row.pos}</strong> of ${table.length}<br>
        ${row.points} pts (${row.won}W ${row.drawn}D ${row.lost}L)<br>
        ${zone ? `<span class="eyebrow">${zoneLabel(zone)}</span>` : ""}
      `;
      const hist = document.getElementById("hubHistory");
      if (state.history.length) {
        hist.innerHTML = state.history.slice().reverse().slice(0, 6).map(h => {
          const lg = h.league ? LEAGUE_SHORT[h.league] + " " : "";
          let outcome = "Finished " + ordinal(h.position);
          if (h.champion) outcome = "🏆 " + (h.league === "CH" ? "Champions (promoted)" : "Champions");
          else if (h.promoted) outcome = "🔼 Promoted (" + ordinal(h.position) + ")";
          else if (h.relegated) outcome = "🔽 Relegated (" + ordinal(h.position) + ")";
          return `${h.season}/${String(h.season + 1).slice(2)} — ${lg}— ${outcome}`;
        }).join("<br>");
      }
      const objEl = document.getElementById("hubObjectiveBody");
      if (objEl) {
        const obj = state.objective;
        if (obj) {
          const onTrack = row.pos <= obj.targetPos;
          objEl.innerHTML = `<div class="objective-head">
              <strong style="font-size:1.05rem;">${obj.headline}</strong>
              <span class="obj-status ${onTrack ? "good" : "bad"}">${onTrack ? "On track" : "Below target"}</span>
            </div>
            <div style="font-size:0.84rem; margin-top:0.35rem;">${obj.blurb}</div>
            <div class="muted" style="font-size:0.76rem; margin-top:0.3rem;">Currently ${ordinal(row.pos)} of ${table.length} · target ${ordinal(obj.targetPos)} or better</div>`;
        } else {
          objEl.textContent = "The board haven't set a target yet.";
        }
      }
      this.renderHubStats(state, App.hubStatScope, club.league);
      const setTitle = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
      const cupPanel = document.getElementById("hubCupPanel");
      const carabaoPanel = document.getElementById("hubCarabaoPanel");
      const vertuPanel = document.getElementById("hubVertuPanel");
      const showCup = el => el && el.classList.remove("hidden");
      const hideCup = el => el && el.classList.add("hidden");
      const country = Game.myCountry();
      if (country === "ESP") {
        showCup(cupPanel); showCup(carabaoPanel);
        setTitle("hubCupTitle", "Copa del Rey");
        setTitle("hubCarabaoTitle", "Supercopa de España");
        this.renderCupPanel(state, Cup.CUPS.copa, "hubCupBody");
        this.renderSupercopaPanel(state);
        hideCup(vertuPanel);
      } else if (country === "ENG") {
        showCup(cupPanel); showCup(carabaoPanel);
        setTitle("hubCupTitle", "FA Cup");
        setTitle("hubCarabaoTitle", "Carabao Cup");
        this.renderCupPanel(state, Cup.CUPS.fa, "hubCupBody");
        this.renderCupPanel(state, Cup.CUPS.efl, "hubCarabaoBody");
        showCup(vertuPanel);
        this.renderVertuPanel(state);
      } else {
        // Every other nation: its single generic national cup.
        const natCupCfg = Object.values(Cup.CUPS).find(c => c.generic && c.country === country);
        if (natCupCfg && Cup.isActive(state[natCupCfg.stateKey])) {
          showCup(cupPanel);
          setTitle("hubCupTitle", natCupCfg.name);
          this.renderCupPanel(state, natCupCfg, "hubCupBody");
        } else hideCup(cupPanel);
        hideCup(carabaoPanel); hideCup(vertuPanel);
      }
      this.renderEuroPanel(state);
    },

    // Hub European panel — your Champions/Europa/Conference League campaign, or a
    // note on how to qualify plus the reigning holders.
    renderEuroPanel(state) {
      const body = document.getElementById("hubEuroBody");
      const titleEl = document.getElementById("hubEuroTitle");
      if (!body) return;
      const e = state.euro;
      const holdersHTML = champs => champs
        ? Object.keys(Euro.COMPS).filter(k => champs[k]).map(k =>
            `${Euro.COMPS[k].short}: <strong>${Cup.clubShort(state, champs[k])}</strong>`).join(" · ")
        : "";
      if (e && e.qual && !e.qual.resolved) {
        if (titleEl) titleEl.textContent = "Champions League Qualifying";
        const q = e.qual;
        const oppId = q.opponents[q.round];
        const remaining = q.total - q.round;
        body.innerHTML = `<div class="cup-status in">${q.roundNames[q.round]}${oppId ? ` — vs <strong>${Cup.clubShort(state, oppId)}</strong>` : ""}</div>` +
          `<div class="muted" style="font-size:0.8rem;margin-top:0.4rem;">Win ${remaining} more tie${remaining > 1 ? "s" : ""} to reach the league phase — played at the start of the season. Lose and you drop into the Europa League.</div>`;
        return;
      }
      if (!e || !e.userComp) {
        if (titleEl) titleEl.textContent = "European Football";
        const holders = holdersHTML(e && e.champions);
        body.innerHTML = `<span class="muted">Not in Europe this season. Qualification follows the UEFA access list by association rank — the top nations send up to four clubs straight to the Champions League league phase, while lower-ranked champions must come through the Champions Path qualifiers.</span>` +
          (holders ? `<div class="eyebrow" style="margin-top:0.7rem;margin-bottom:0.2rem;">Reigning champions</div><div>${holders}</div>` : "");
        return;
      }
      const eu = e.user;
      const meta = Euro.COMPS[e.userComp];
      if (titleEl) titleEl.textContent = meta.name;
      let head;
      if (eu.winner === state.clubId) head = `<div class="cup-status win">🏆 ${meta.short} Winners — Champions of Europe!</div>`;
      else if (eu.winner) head = `<div class="cup-status">Won by <strong>${Cup.clubName(state, eu.winner)}</strong>.</div>`;
      else if (eu.userOut) head = `<div class="cup-status out">Out in the ${eu.userExitStage}.</div>`;
      else if (eu.stage === "league") {
        const pos = Euro.ordinalPos(state, eu);
        const played = eu.fixtures.filter(f => f.played).length;
        const fate = pos <= 8 ? "Round of 16 places" : pos <= 24 ? "playoff places" : "elimination zone";
        head = `<div class="cup-status in">League Phase — <strong>${ordinal(pos)}</strong> of 36 (${played}/8 played), in the ${fate}.</div>`;
      } else {
        // Knockout: find the user's current, unresolved tie.
        let line = "In the knockouts.";
        const ko = eu.ko && eu.ko.stages;
        if (ko) {
          for (const key of eu.ko.order) {
            const st = ko[key]; if (!st) continue;
            const t = st.ties.find(t => (t.hi === state.clubId || t.lo === state.clubId) && !t.winner);
            if (t) {
              const oppId = t.hi === state.clubId ? t.lo : t.hi;
              line = `${Euro.stageName(key)} — vs <strong>${Cup.clubShort(state, oppId)}</strong>`;
              break;
            }
          }
        }
        head = `<div class="cup-status in">${line}</div>`;
      }
      // League-phase fixture list (compact) while it's on.
      let rows = "";
      if (eu.stage === "league") {
        rows = `<div class="eyebrow" style="margin-top:0.6rem;margin-bottom:0.3rem;">Your matchdays</div><ol class="stat-list">` +
          eu.fixtures.map(f => {
            const home = f.home === state.clubId;
            const oppId = home ? f.away : f.home;
            const score = f.played ? `${f.hg}–${f.ag}` : `MW${f.week + 1}`;
            return `<li class="stat-row${f.played ? "" : " me"}"><span class="nm">${home ? "vs" : "@"} ${Cup.clubShort(state, oppId)}</span><span class="vl mono">${score}</span></li>`;
          }).join("") + `</ol>`;
      }
      const qualNote = e.qualNote
        ? `<div class="muted" style="font-size:0.78rem;margin-bottom:0.5rem;border-left:2px solid var(--amber);padding-left:0.5rem;">🎟️ ${e.qualNote}</div>`
        : "";
      body.innerHTML = qualNote + head + rows;
    },

    // Hub Supercopa panel — the season-opening final four for Spanish saves.
    renderSupercopaPanel(state) {
      const body = document.getElementById("hubCarabaoBody");
      if (!body) return;
      const short = id => Cup.clubShort(state, id);
      const ps = state.pendingSupercopa;
      const holders = (state.honours || []).some(h => h.type === "supercopa");
      if (ps) {
        body.innerHTML =
          `<div class="cup-status in">Season curtain-raiser — a final four (MW1).</div>` +
          `<div class="eyebrow" style="margin-top:0.6rem;margin-bottom:0.3rem;">Semi-finals</div>` +
          `<ul class="stat-list">
             <li class="stat-row"><span class="nm">${short(ps.llWinner)} <span class="muted">v</span> ${short(ps.copaRunnerUp)}</span></li>
             <li class="stat-row"><span class="nm">${short(ps.copaWinner)} <span class="muted">v</span> ${short(ps.llRunnerUp)}</span></li>
           </ul>`;
      } else {
        body.innerHTML = `<span class="muted">A final-four curtain-raiser contested by the winners &amp; runners-up of La Liga and the Copa del Rey. It opens each new season.${holders ? " You've lifted it before. 🏆" : ""}</span>`;
      }
    },

    // Hub Vertu Trophy panel — a group mini-table + knockout progress for
    // League One / Two clubs, or a note for everyone else.
    renderVertuPanel(state) {
      const body = document.getElementById("hubVertuBody");
      if (!body) return;
      const v = state.vertu;
      if (!v || v.skipped) { body.innerHTML = `<span class="muted">The Vertu Trophy begins next season.</span>`; return; }
      if (v.userGroup < 0) {
        body.innerHTML = `<span class="muted">A League One &amp; League Two competition — your club isn't eligible.${v.winner ? " Holders: <strong>" + Vertu.clubName(state, v.winner) + "</strong>." : ""}</span>`;
        return;
      }
      let head;
      if (v.winner === state.clubId) head = `<div class="cup-status win">🏆 Vertu Trophy Winners!</div>`;
      else if (v.winner) head = `<div class="cup-status">Won by <strong>${Vertu.clubName(state, v.winner)}</strong>.</div>`;
      else if (v.userOut) head = `<div class="cup-status out">${v.userExitStage === "group" ? "Eliminated in the group stage." : "Knocked out in the " + v.userExitStage + "."}</div>`;
      else if (v.stage === "group") head = `<div class="cup-status in">Group stage — win the group to reach the knockouts.</div>`;
      else {
        const rd = Vertu.currentKoRound(state);
        const tie = Vertu.userKoTie(state);
        let opp = "";
        if (tie && !tie.played) { const oid = tie.home === state.clubId ? tie.away : tie.home; opp = ` — vs <strong>${Vertu.clubShort(state, oid)}</strong>`; }
        head = `<div class="cup-status in">Qualified! <strong>${rd ? rd.name : ""}</strong> (MW${rd ? rd.week + 1 : "?"})${opp}</div>`;
      }
      const rows = Vertu.userGroupTable(state).map(r =>
        `<li class="stat-row${r.id === state.clubId ? " me" : ""}"><span class="rk mono">${r.rank}</span><span class="nm">${Vertu.clubName(state, r.id)}</span><span class="vl mono">${r.pts}</span></li>`
      ).join("");
      body.innerHTML = head + `<div class="eyebrow" style="margin-top:0.6rem;margin-bottom:0.3rem;">Your group (Pts)</div><ol class="stat-list">${rows}</ol>`;
    },

    // The manager's trophy cabinet (modal content).
    renderTrophyCabinet(state) {
      const body = document.getElementById("trophyCabinetBody");
      const honours = state.honours || [];
      const seasonLabel = y => `${y}/${String(y + 1).slice(2)}`;
      const defs = [
        { type: "PL", label: "Premier League Champions", icon: "🏆" },
        { type: "CH", label: "Championship Winners", icon: "🏆" },
        { type: "L1", label: "League One Winners", icon: "🏆" },
        { type: "L2", label: "League Two Winners", icon: "🏆" },
        { type: "LL", label: "La Liga Champions", icon: "🏆" },
        { type: "SG", label: "Segunda División Winners", icon: "🏆" },
        { type: "ucl", label: "UEFA Champions League", icon: "⭐" },
        { type: "uel", label: "UEFA Europa League", icon: "⭐" },
        { type: "uecl", label: "UEFA Conference League", icon: "⭐" },
        { type: "facup", label: "FA Cup", icon: "🏆" },
        { type: "carabao", label: "Carabao Cup", icon: "🏆" },
        { type: "vertu", label: "Vertu Trophy", icon: "🏆" },
        { type: "copa", label: "Copa del Rey", icon: "🏆" },
        { type: "shield", label: "Community Shield", icon: "🛡️" },
        { type: "supercopa", label: "Supercopa de España", icon: "🛡️" },
      ];
      // League titles + national cups for every other nation, plus the generic super cup.
      LEAGUE_REGISTRY.forEach(l => { if (!defs.some(d => d.type === l.code)) defs.push({ type: l.code, label: l.name + " Winners", icon: "🏆" }); });
      Object.values(Cup.CUPS).filter(c => c.generic).forEach(c => defs.push({ type: c.stateKey, label: c.name, icon: "🏆" }));
      defs.push({ type: "supercup", label: "Super Cup", icon: "🛡️" });
      const lines = defs.map(d => {
        const seasons = honours.filter(h => h.type === d.type).map(h => h.season).sort((a, b) => a - b);
        if (!seasons.length) return "";
        return `<div class="trophy-line">
          <span class="tr-icon">${d.icon}</span>
          <span class="tr-name">${d.label} <span class="tr-count">×${seasons.length}</span></span>
          <span class="tr-seasons">${seasons.map(seasonLabel).join(", ")}</span>
        </div>`;
      }).filter(Boolean).join("");
      body.innerHTML = lines || `<p class="muted">No trophies yet — go and win something!</p>`;
    },

    // Hub cup panel: the user's run + the round-by-round schedule, so it's
    // clear which cup game is played on which matchweek. Works for either cup.
    renderCupPanel(state, cfg, bodyId) {
      const body = document.getElementById(bodyId);
      if (!body) return;
      const fc = state[cfg.stateKey];
      if (!fc || fc.skipped) { body.innerHTML = `<span class="muted">The ${cfg.name} begins next season.</span>`; return; }
      const clubId = state.clubId;
      const rounds = Cup.roundsOf(cfg, fc);

      let head;
      if (fc.winner === clubId) {
        head = `<div class="cup-status win">🏆 ${cfg.name} Winners!</div>`;
      } else if (fc.winner) {
        head = `<div class="cup-status">Won by <strong>${Cup.clubName(state, fc.winner)}</strong>${fc.userExitRound != null ? " — you went out in the " + rounds[fc.userExitRound].name : ""}.</div>`;
      } else if (fc.userOut) {
        head = `<div class="cup-status out">Knocked out in the ${rounds[fc.userExitRound].name}.</div>`;
      } else if (Cup.userHasBye(fc)) {
        const entry = rounds[fc.userEntryRound];
        head = `<div class="cup-status in">Seeded — bye to the <strong>${entry.name}</strong> (MW${entry.week + 1}).</div>`;
      } else {
        const rd = rounds[fc.roundIndex];
        const tie = Cup.userTie(state, fc);
        let oppLine = "";
        if (tie && !tie.played) {
          const oppId = tie.home === clubId ? tie.away : tie.home;
          const venue = tie.home === clubId ? "vs" : "@";
          oppLine = ` — ${venue} <strong>${Cup.clubShort(state, oppId)}</strong>`;
        }
        head = `<div class="cup-status in">Still in — <strong>${rd ? rd.name : ""}</strong> (MW${rd ? rd.week + 1 : "?"})${oppLine}</div>`;
      }

      const entryRound = fc.userEntryRound || 0;
      const activeRound = Math.max(fc.roundIndex, entryRound);
      const rowsHtml = rounds.map((r, i) => {
        let mark = "—", cls = "upcoming";
        if (fc.winner === clubId) { mark = "✓"; cls = "won"; }
        else if (fc.userOut) {
          if (i < fc.userExitRound) { mark = "✓"; cls = "won"; }
          else if (i === fc.userExitRound) { mark = "✗"; cls = "out"; }
        } else if (i < entryRound) {
          mark = "»"; cls = "upcoming"; // seeded past this round (bye)
        } else if (i < fc.roundIndex) {
          mark = "✓"; cls = "won";
        } else if (i === activeRound) {
          mark = "•"; cls = "current";
        }
        const here = r.week === state.week && !fc.userOut && fc.winner == null && i === activeRound ? " here" : "";
        return `<li class="cup-round ${cls}${here}"><span class="cr-mark">${mark}</span><span class="cr-name">${r.name}</span><span class="cr-wk mono">MW${r.week + 1}</span></li>`;
      }).join("");
      body.innerHTML = head + `<ol class="cup-rounds">${rowsHtml}</ol>`;
    },
  
    renderPlayerRow(p, opts = {}) {
      const actionHTML = opts.action || "";
      return `
        <div class="player-row ${opts.rowClass || ""}">
          <div class="pos-chip ${p.pos}">${p.pos}</div>
          <div>
            <div class="name">${p.wonderkid ? "⭐ " : ""}${p.name} <span class="nat-tag">${p.nat || "ENG"}</span>${opts.badge || ""}</div>
            <div class="sub">${opts.subLabel || (p.club ? clubShortLookup(p.club) : "Free agent")}</div>
            ${opts.careerLabel ? `<div class="career-sub mono">${opts.careerLabel}</div>` : ""}
          </div>
          <div class="mono">${p.age}</div>
          <div class="rating-pill">${p.rating}</div>
          <div class="mono pot-cell" title="Potential">${opts.potentialLabel ?? "—"}</div>
          <div class="mono">${opts.priceLabel ?? this.money(p.value)}</div>
          ${actionHTML}
        </div>
      `;
    },
  
    windowBanner(state) {
      const status = TransferWindow.status(state);
      if (status.open) {
        return `<div class="window-banner open"><strong>${status.name} transfer window OPEN</strong> — closes in ${status.closesIn === 0 ? "this matchweek" : status.closesIn + " matchweek" + (status.closesIn === 1 ? "" : "s")}.</div>`;
      }
      const when = status.wraps ? "next season" : "in " + status.opensIn + " matchweek" + (status.opensIn === 1 ? "" : "s");
      return `<div class="window-banner closed"><strong>Transfer window closed</strong> — reopens ${when}.</div>`;
    },
  
    renderSquad(state) {
      const club = Game.myClub();
      const open = TransferWindow.isOpen(state.week);
      document.getElementById("squadWindowBanner").innerHTML = this.windowBanner(state);
      const sorted = club.squad.slice().sort((a, b) => POSITIONS.indexOf(a.pos) - POSITIONS.indexOf(b.pos) || b.rating - a.rating);
      document.getElementById("squadList").innerHTML = sorted.map(p => {
        const offers = p.offers || [];
        const badge = offers.length
          ? `<button class="offers-badge" data-offers="${p.id}" type="button">💰 ${offers.length} offer${offers.length > 1 ? "s" : ""} ▾</button>`
          : "";
        const listBtn = `<button class="small ${p.transferListed ? "" : "ghost"}" data-list="${p.id}">${p.transferListed ? "Listed ✓" : "List"}</button>`;
        const renewBtn = `<button class="small ghost" data-renew="${p.id}">Renew</button>`;
        const yrs = p.contractLeft == null ? null : p.contractLeft;
        const expiring = yrs != null && yrs <= 1;
        const contractLabel = yrs == null ? "" : ` · ${yrs}yr${yrs === 1 ? "" : "s"} left${expiring ? " ⚠" : ""}`;
        const row = this.renderPlayerRow(p, {
          subLabel: this.wage(Contracts.effWage(p)) + contractLabel,
          careerLabel: Stats.careerSquadLine(p),
          potentialLabel: String(p.potential),
          badge: this.fitnessBadge(p) + badge,
          rowClass: (p.transferListed ? "listed" : "") + (p.injuryWeeks ? " injured-row" : "") + (expiring ? " expiring-row" : ""),
          action: renewBtn + listBtn,
        });
        const panel = offers.length ? `<div class="offers-panel hidden" id="offers-${p.id}">${this.offersHTML(p, open)}</div>` : "";
        return `<div class="squad-entry">${row}${panel}</div>`;
      }).join("");
    },

    offersHTML(p, open) {
      const rows = (p.offers || []).map((o, i) => `
        <div class="offer-row">
          <span class="offer-club">${o.clubName}</span>
          <span class="offer-fee mono">${this.money(o.fee)}</span>
          <button class="small primary" data-accept="${p.id}" data-idx="${i}" ${open ? "" : "disabled"}>Accept</button>
          <button class="small ghost" data-decline="${p.id}" data-idx="${i}">Decline</button>
        </div>`).join("");
      const note = open ? "" : `<p class="muted" style="font-size:0.74rem;margin:0.3rem 0 0;">Bids can only be accepted while the window is open.</p>`;
      return rows + note;
    },
  
    renderMarket(state) {
      const club = Game.myClub();
      document.getElementById("marketWindowBanner").innerHTML = this.windowBanner(state);
      document.getElementById("marketBudgetLabel").textContent =
        "Budget: " + this.money(club.budget) + " · Wage room: " + this.wageFull(Contracts.wageRoom(club)) + "/wk";
      this.renderFreeAgents(state); // always available, window or not
      const open = TransferWindow.isOpen(state.week);
      document.getElementById("btnReroll").disabled = !open;
      const list = document.getElementById("marketList");
      if (!open) {
        list.innerHTML = `<p class="muted">The market is closed until the next transfer window opens.</p>`;
        return;
      }
      if (!state.market.length) {
        list.innerHTML = `<p class="muted">No players available — try rerolling the market.</p>`;
        return;
      }
      list.innerHTML = state.market.map(l => this.renderPlayerRow(l.player, {
        // Career record (apps + the position's headline stat) plus who's selling.
        subLabel: `${Stats.signingLine(l.player)} · ${l.origin ? "from " + l.originName : l.originName}`,
        priceLabel: this.money(l.price),
        potentialLabel: this.potentialRange(l.player.potential), // scouted: 5-wide range
        action: `<button class="small primary" data-buy="${l.listingId}" ${club.budget < l.price ? "disabled" : ""}>Sign</button>`,
      })).join("");
    },

    // The free-agent pool — separate from the transfer market and signable at any
    // point in the season (window open or not).
    renderFreeAgents(state) {
      const club = Game.myClub();
      const list = document.getElementById("freeAgentList");
      if (!list) return;
      const fas = (state.freeAgents || []).slice().sort((a, b) => b.player.rating - a.player.rating);
      if (!fas.length) {
        list.innerHTML = `<p class="muted">No free agents on the market right now — check back next matchweek.</p>`;
        return;
      }
      list.innerHTML = fas.map(l => this.renderPlayerRow(l.player, {
        subLabel: `${Stats.signingLine(l.player)} · Free agent`,
        priceLabel: this.money(l.price),
        potentialLabel: this.potentialRange(l.player.potential),
        action: `<button class="small primary" data-signfree="${l.listingId}" ${club.budget < l.price ? "disabled" : ""}>Sign</button>`,
      })).join("");
    },

    // ---- contract negotiation modal ------------------------------------------
    renderContractModal(state) {
      const ctx = App.contractCtx;
      if (!ctx) return;
      const p = ctx.player, club = Game.myClub();
      const isRenew = ctx.kind === "renew";
      const wr = Contracts.wageRange(p);
      const ideal = Contracts.idealLength(p.age);
      const off = App.contractOffer;
      const header = `<div class="contract-player">
          <div class="pos-chip ${p.pos}">${p.pos}</div>
          <div><div class="name">${p.name} <span class="nat-tag">${p.nat || "ENG"}</span></div>
            <div class="sub">${p.age} yrs · asks around <strong>${this.wage(wr.demand)}</strong> on a <strong>~${ideal}-yr</strong> deal</div></div>
          <div class="rating-pill">${p.rating}</div>
        </div>`;
      document.getElementById("contractTitle").textContent = isRenew ? "Contract Renewal" : "Contract Offer";
      const body = document.getElementById("contractBody");

      if (Contracts.isLocked(state, p.id)) {
        body.innerHTML = header +
          `<p class="contract-locked">You've had ${Contracts.MAX_ATTEMPTS} offers turned down — ${p.name} won't reopen talks until the next transfer window.</p>
           <div class="contract-actions"><span></span><button class="ghost" id="btnContractCloseInline" onclick="App.closeContract()">Close</button></div>`;
        return;
      }

      const roomBase = Contracts.wageRoom(club) + (isRenew ? Contracts.effWage(p) : 0);
      const feeLine = isRenew
        ? `Renewal — no transfer fee`
        : `Transfer fee <strong>${this.money(ctx.fee)}</strong> · budget ${this.money(club.budget)}`;
      const left = Contracts.attemptsLeft(state, p.id);
      const wageMax = Math.max(wr.max, Math.round(wr.demand * 2));
      body.innerHTML = header +
        `<p class="muted contract-fee">${feeLine} · Wage room <strong>${this.wageFull(roomBase)}/wk</strong></p>
         <div class="contract-slider">
           <label>Contract length <span id="cLenVal" class="slider-val">${off.years} year${off.years === 1 ? "" : "s"}</span></label>
           <input type="range" id="cLen" min="1" max="10" step="1" value="${off.years}">
           <div class="slider-scale"><span>1 yr</span><span>10 yr</span></div>
         </div>
         <div class="contract-slider">
           <label>Weekly wage <span id="cWageVal" class="slider-val">${this.wage(off.wage)}</span></label>
           <input type="range" id="cWage" min="${wr.min}" max="${wageMax}" step="1" value="${off.wage}">
           <div class="slider-scale"><span>${this.wage(wr.min)}</span><span>${this.wage(wageMax)}</span></div>
         </div>
         <p class="muted" id="cRoomLeft"></p>
         ${App.contractFeedback ? `<p class="contract-feedback">${App.contractFeedback}</p>` : ""}
         <div class="contract-actions">
           <span class="muted">${left} attempt${left === 1 ? "" : "s"} left</span>
           <button class="primary" id="btnContractOffer">${isRenew ? "Offer Renewal" : "Make Offer"}</button>
         </div>`;
      this.updateContractComputed(state);
    },

    // Live recompute of "room after this deal" + whether the offer is affordable.
    updateContractComputed(state) {
      const ctx = App.contractCtx;
      if (!ctx) return;
      const p = ctx.player, club = Game.myClub(), off = App.contractOffer;
      const isRenew = ctx.kind === "renew";
      const roomBase = Contracts.wageRoom(club) + (isRenew ? Contracts.effWage(p) : 0);
      const roomLeft = roomBase - off.wage;
      const el = document.getElementById("cRoomLeft");
      if (el) el.innerHTML = `Wage room after this deal: <strong class="${roomLeft < 0 ? "neg" : "pos"}">${this.wageFull(roomLeft)}/wk</strong>`;
      const btn = document.getElementById("btnContractOffer");
      if (btn) {
        let bad = off.wage > roomBase;
        if (!isRenew && club.budget < ctx.fee) bad = true;
        if (!isRenew && club.squad.length >= 32) bad = true;
        btn.disabled = bad;
      }
    },

    renderCoaches(state) {
      const club = Game.myClub();
      const posLabels = { GK: "Goalkeeping", DF: "Defence", MF: "Midfield", FW: "Attack" };
      document.getElementById("coachStaff").innerHTML = POSITIONS.map(pos => {
        const c = club.coaches[pos];
        return `<div class="coach-row">
          <div class="pos-chip ${pos}">${pos}</div>
          <div><div class="name">${c.name}</div><div class="sub">${posLabels[pos]} coach · ${Coaching.ratingLabel(c.rating)}</div></div>
          <div class="rating-pill">${c.rating}</div>
          <div class="mono muted">×${Coaching.growthMultiplier(club, pos).toFixed(2)} growth</div>
        </div>`;
      }).join("");

      const list = document.getElementById("coachMarketList");
      const mk = state.coachMarket || [];
      if (!mk.length) { list.innerHTML = `<p class="muted">No staff available — check back next matchweek.</p>`; return; }
      const a = club.academy || {};
      list.innerHTML = mk.map(c => {
        const role = c.role || c.pos;
        const price = Coaching.cost(c.rating, role);
        const scoutTeam = (club.scouting && club.scouting.scouts) || [];
        const bestScout = scoutTeam.reduce((m, s) => Math.max(m, s.rating), 0);
        const cur = role === "scout" ? (a.scout ? a.scout.rating : 0)
          : role === "youthcoach" ? (a.coach ? a.coach.rating : 0)
          : role === "talentscout" ? (scoutTeam.length < Scouting.CAP ? 0 : bestScout)
          : role === "physio" ? (club.physio ? club.physio.rating : 0)
          : (club.coaches[role] ? club.coaches[role].rating : 0);
        const tag = role === "talentscout"
          ? (scoutTeam.length < Scouting.CAP ? " · adds to team" : " · swaps weakest")
          : c.rating > cur ? " · upgrade" : c.rating < cur ? " · downgrade" : "";
        const chipClass = Coaching.isBackroom(role) ? "youth" : role;
        const chipText = role === "scout" ? "SCT" : role === "youthcoach" ? "YTH" : role === "talentscout" ? "TAL" : role === "physio" ? "MED" : role;
        return `<div class="coach-row market">
          <div class="pos-chip ${chipClass}">${chipText}</div>
          <div><div class="name">${c.name}</div><div class="sub">${Coaching.ROLE_LABEL[role]} · ${Coaching.ratingLabel(c.rating)}${tag}</div></div>
          <div class="rating-pill">${c.rating}</div>
          <div class="mono">${this.money(price)}</div>
          <button class="small primary" data-hirecoach="${c.id}" ${club.budget < price ? "disabled" : ""}>Hire</button>
        </div>`;
      }).join("");
    },

    // The Youth Academy panel: staff, graduating players (with actions) and the
    // developing prospect list.
    renderAcademy(state) {
      const club = Game.myClub();
      const a = club.academy || {};
      const staffRow = (label, s, desc) => `<div class="coach-row">
        <div class="pos-chip youth">${label === "Youth Scout" ? "SCT" : "YTH"}</div>
        <div><div class="name">${s ? s.name : "—"}</div><div class="sub">${label} · ${s ? Coaching.ratingLabel(s.rating) : "none"}</div></div>
        <div class="rating-pill">${s ? s.rating : "—"}</div>
        <div class="mono muted">${desc}</div>
      </div>`;
      document.getElementById("academyStaff").innerHTML =
        staffRow("Youth Scout", a.scout, "4 intakes/season · sets potential") +
        staffRow("Youth Coach", a.coach, "develops prospects weekly");

      const grads = a.pending || [];
      const roomFree = club.squad.length < 32;
      document.getElementById("academyGraduates").innerHTML = grads.length
        ? grads.map(g => `<div class="coach-row grad">
            <div class="pos-chip ${g.pos}">${g.pos}</div>
            <div><div class="name">${g.name} <span class="nat-tag">${g.nat || "ENG"}</span></div>
              <div class="sub">Graduate ${g.rating} ovr · potential ${g.potential} · decide in ${Math.max(0, g.deadline - state.week)} wk · squad ${club.squad.length}/32</div></div>
            <button class="small primary" data-promote="${g.id}" ${roomFree ? "" : "disabled"}>Promote</button>
            <button class="small danger" data-release="${g.id}">Release</button>
          </div>`).join("")
        : `<p class="muted" style="font-size:0.82rem;">No players graduating right now.</p>`;

      const prospects = (a.prospects || []).slice().sort((x, y) => y.potential - x.potential);
      document.getElementById("academyProspects").innerHTML = prospects.length
        ? prospects.map(p => {
          const yrs = 18 - p.age;
          return `<div class="coach-row">
            <div class="pos-chip ${p.pos}">${p.pos}</div>
            <div><div class="name">${p.name} <span class="nat-tag">${p.nat || "ENG"}</span></div>
              <div class="sub">Age ${p.age} · ${p.rating} ovr → ${p.potential} pot · graduates in ${yrs} yr${yrs === 1 ? "" : "s"}</div></div>
            <div class="rating-pill">${p.rating}</div>
            <button class="small danger" data-release="${p.id}">Release</button>
          </div>`;
        }).join("")
        : `<p class="muted" style="font-size:0.82rem;">No prospects yet — your scout is working on it.</p>`;
    },

    // The Scouting panel: your scout team (with assignment controls) and the
    // reports they've brought back (each candidate signable, window permitting).
    renderScouting(state) {
      const club = Game.myClub();
      const sc = club.scouting || { scouts: [], reports: [] };
      const posOpts = POSITIONS.map(p => `<option value="${p}">${posLabel(p)}</option>`).join("");
      const profOpts = Scouting.PROFILES.map(p => `<option value="${p.key}">${p.label}</option>`).join("");

      document.getElementById("scoutTeam").innerHTML = (sc.scouts || []).map(s => {
        const busy = s.busyUntil != null && s.assignment;
        const status = busy
          ? `<div class="sub">Out scouting <strong>${posLabel(s.assignment.pos)}</strong> · ${Scouting.profileLabel(s.assignment.profile)} · back in ${Math.max(0, s.busyUntil - state.week)} wk</div>`
          : `<div class="sub">${Coaching.ratingLabel(s.rating)} · ${Scouting.duration(s.rating)}-wk trips · ${Math.round(Scouting.discount(s.rating) * 100)}% signing discount</div>`;
        const control = busy
          ? `<button class="small ghost" data-scoutrecall="${s.id}">Recall</button>`
          : `<div class="scout-assign">
               <select data-scoutpos>${posOpts}</select>
               <select data-scoutprofile>${profOpts}</select>
               <button class="small primary" data-scoutsend="${s.id}">Scout ▸</button>
             </div>`;
        return `<div class="coach-row scout-row">
          <div class="pos-chip youth">TAL</div>
          <div><div class="name">${s.name}</div>${status}</div>
          <div class="rating-pill">${s.rating}</div>
          ${control}
        </div>`;
      }).join("") || `<p class="muted" style="font-size:0.82rem;">No scouts on your books — hire a Talent Scout from the Staff Market.</p>`;

      const windowOpen = TransferWindow.isOpen(state.week);
      const reps = sc.reports || [];
      document.getElementById("scoutReports").innerHTML = reps.length
        ? reps.map(r => {
          const rows = r.candidates.map(c => {
            const off = c.fullPrice && c.fullPrice > c.price ? ` <span class="strike mono">${this.money(c.fullPrice)}</span>` : "";
            const priceLabel = `${this.money(c.price)}${off}`;
            const affordable = club.budget >= c.price && club.squad.length < 32;
            const btn = windowOpen
              ? `<button class="small primary" data-scoutsign="${r.id}|${c.listingId}" ${affordable ? "" : "disabled"}>Sign</button>`
              : `<button class="small" disabled title="Opens in the transfer window">Sign</button>`;
            return this.renderPlayerRow(c.player, {
              subLabel: `${Stats.signingLine(c.player)} · ${c.origin ? "from " + c.originName : c.originName}`,
              priceLabel,
              potentialLabel: this.potentialRange(c.player.potential),
              action: btn,
            });
          }).join("");
          return `<div class="scout-report">
            <div class="scout-report-head">
              <span><strong>${posLabel(r.pos)}</strong> · ${Scouting.profileLabel(r.profile)} <span class="muted">— ${r.scoutName}${r.discount > 0 ? ` · ${Math.round(r.discount * 100)}% off` : ""}</span></span>
              <button class="small ghost" data-scoutdismiss="${r.id}">Dismiss</button>
            </div>
            ${rows}
          </div>`;
        }).join("")
        : `<p class="muted" style="font-size:0.82rem;">No reports yet — send a scout out and check back in a few matchweeks.${windowOpen ? "" : " You can scout any time; sign when the window opens."}</p>`;
    },

    // The Medical & Fitness panel: the physio and the current treatment room.
    renderMedical(state) {
      const club = Game.myClub();
      const ph = club.physio;
      const bonus = Fitness.physioBonus(club);
      const cut = Math.round(clamp((Fitness.physioRating(club) - 50) / 120, 0, 0.42) * 100);
      document.getElementById("medicalStaff").innerHTML = `<div class="coach-row">
        <div class="pos-chip youth">MED</div>
        <div><div class="name">${ph ? ph.name : "—"}</div>
          <div class="sub">Physio · ${ph ? Coaching.ratingLabel(ph.rating) : "none"} · −${cut}% injury risk</div></div>
        <div class="rating-pill">${ph ? ph.rating : "—"}</div>
        <div class="mono muted">+${bonus.toFixed(0)} recovery</div>
      </div>`;

      const injured = Fitness.injuredList(club);
      document.getElementById("medicalInjured").innerHTML = injured.length
        ? injured.map(p => `<div class="coach-row grad">
            <div class="pos-chip ${p.pos}">${p.pos}</div>
            <div><div class="name">${p.name} <span class="nat-tag">${p.nat || "ENG"}</span></div>
              <div class="sub">Out injured · back in ${p.injuryWeeks} week${p.injuryWeeks === 1 ? "" : "s"}</div></div>
            <div class="rating-pill">${p.rating}</div>
          </div>`).join("")
        : `<p class="muted" style="font-size:0.82rem;">No injuries — your squad is fully fit.</p>`;
    },

    // A compact fitness/injury chip for squad rows, plus a suspension flag.
    fitnessBadge(p) {
      const susp = p.suspendedMatches > 0 ? `<span class="fit-tag injured" title="Suspended">🟥 ${p.suspendedMatches}</span>` : "";
      return `<span class="fit-tag ${Fitness.level(p)}" title="Match fitness">${Fitness.label(p)}</span>${susp}`;
    },

    // Pitch-token colour from match fitness: green (fresh) → amber → bright red
    // (spent), so you can read the squad's freshness at a glance.
    fitnessColor(p) {
      if (!p) return "#4a5568";
      if (p.injuryWeeks) return "#7a4b52";
      const f = Math.max(0, Math.min(100, p.fitness ?? 100));
      const hue = Math.round(1.28 * f);          // 0 = red, ~128 = green
      const light = Math.round(46 + f * 0.08);   // a touch brighter when fresh
      return `hsl(${hue}, 85%, ${light}%)`;
    },

    formationOptions(current) {
      return Object.keys(FORMATIONS).map(f => `<option value="${f}" ${f === current ? "selected" : ""}>${f}</option>`).join("");
    },
  
    renderPitch(club) {
      const layout = FORMATION_LAYOUT[club.formation];
      const ids = Lineup.starterIds(club.lineup);
      const pitch = document.getElementById("pitch");
      pitch.querySelectorAll(".token").forEach(t => t.remove());
      ids.forEach((id, i) => {
        const p = club.squad.find(pl => pl.id === id);
        const [x, y] = layout[i] || [50, 50];
        const token = document.createElement("div");
        token.className = "token";
        token.style.left = x + "%";
        token.style.top = y + "%";
        const initials = p ? p.name.split(" ").slice(-1)[0] : "—";
        const fitTitle = p ? `${p.name} · ${Math.round(p.fitness ?? 100)}% fit` : "";
        token.innerHTML = `<div class="dot" title="${fitTitle}" style="background:${this.fitnessColor(p)};">${p ? p.rating : ""}</div><div class="lbl">${initials}</div>`;
        pitch.appendChild(token);
      });
    },
  
    renderLineupSlots(club) {
      const lineup = club.lineup;
      const usedElsewhere = pos => {
        const all = [];
        POSITIONS.forEach(p => lineup.slots[p].forEach(id => { if (id) all.push(id); }));
        return all;
      };
      const container = document.getElementById("lineupSlots");
      let html = "";
      POSITIONS.forEach(pos => {
        if (!lineup.slots[pos].length) return;
        html += `<div class="slot-group"><span class="eyebrow">${posLabel(pos)}</span>`;
        lineup.slots[pos].forEach((id, idx) => {
          const used = usedElsewhere(pos);
          const eligible = club.squad.filter(p => p.pos === pos && !p.injuryWeeks && !p.suspendedMatches && (!used.includes(p.id) || p.id === id)).sort((a, b) => b.rating - a.rating);
          html += `<div class="slot-row">
            <select data-pos="${pos}" data-idx="${idx}">
              <option value="">— Empty —</option>
              ${eligible.map(p => `<option value="${p.id}" ${p.id === id ? "selected" : ""}>${p.name} (${p.rating}) · ${Math.round(p.fitness ?? 100)}%</option>`).join("")}
            </select>
          </div>`;
        });
        html += `</div>`;
      });
      container.innerHTML = html;
    },
  
    renderBench(club) {
      const bench = club.lineup.bench.map(id => club.squad.find(p => p.id === id)).filter(Boolean);
      document.getElementById("benchList").innerHTML = bench.length
        ? bench.map(p => `<span class="bench-chip">${p.pos} · ${p.name} (${p.rating})</span>`).join("")
        : `<span class="muted">No bench players.</span>`;
    },
  
    renderLineup(state) {
      const club = Game.myClub();
      if (!club.lineup) Lineup.autoPick(club);
      // An injured or suspended player can't stay in the XI — pull them out so
      // the manager sees the empty slot to fill.
      (club.squad || []).forEach(p => { if (p.injuryWeeks || p.suspendedMatches) Fitness.dropFromLineup(club, p.id); });
      document.getElementById("formationSelect").innerHTML = this.formationOptions(club.formation);
      this.renderPitch(club);
      this.renderLineupSlots(club);
      this.renderBench(club);
      document.getElementById("lineupError").textContent = "";
    },
  
    renderTable(state, league) {
      league = league || Game.myLeague();
      document.getElementById("tableTitle").textContent = LEAGUE_NAMES[league] + " Table";
      // Build the division toggle from the user's own pyramid, whichever nation
      // that is (a delegated click handler on the container keeps working).
      const myLeagues = chainFor(Game.myLeague());
      const toggle = document.querySelector("#screen-table .scope-toggle");
      if (toggle) {
        toggle.innerHTML = myLeagues.map(lg =>
          `<button class="scope-btn table-league-btn ${lg === league ? "active" : ""}" data-league="${lg}" type="button">${LEAGUE_SHORT[lg] || LEAGUE_NAMES[lg]}</button>`
        ).join("");
      }
      const rows = Season.table(state, league);
      let prevGroup = null;
      document.getElementById("ladderBody").innerHTML = rows.map(r => {
        const zone = Season.zoneFor(r.pos, league, rows.length);
        // Draw a divider where a championship/relegation split group changes.
        const splitLine = (r.splitGroup != null && prevGroup != null && r.splitGroup !== prevGroup) ? " split-line" : "";
        prevGroup = r.splitGroup;
        return `<tr class="${r.id === state.clubId ? "me" : ""} ${zone ? "zone-" + zone : ""}${splitLine}">
          <td>${r.pos}</td>
          <td class="club-cell">${this.crestHTML(r, "sm")} ${r.name}</td>
          <td>${r.played}</td><td>${r.won}</td><td>${r.drawn}</td><td>${r.lost}</td>
          <td>${r.gf}</td><td>${r.ga}</td><td>${r.gd > 0 ? "+" : ""}${r.gd}</td>
          <td><strong>${r.points}</strong></td>
        </tr>`;
      }).join("");
      document.getElementById("tableLegend").innerHTML = this.legendHTML(league);
    },

    legendHTML(league) {
      if (league === "CH" || league === "L1") {
        return `
          <span><i style="background:#4ad991;"></i>Automatic promotion</span>
          <span><i style="background:#5ec2ff;"></i>Play-offs</span>
          <span><i style="background:var(--alert-red);"></i>Relegation</span>`;
      }
      if (league === "L2") {
        return `
          <span><i style="background:#4ad991;"></i>Automatic promotion</span>
          <span><i style="background:#5ec2ff;"></i>Play-offs</span>
          <span><i style="background:var(--alert-red);"></i>Sacking zone (no relegation)</span>`;
      }
      if (league === "SG") {
        return `
          <span><i style="background:#4ad991;"></i>Automatic promotion</span>
          <span><i style="background:var(--alert-red);"></i>Sacking zone (no relegation)</span>`;
      }
      // Top flight — European places depend on the association's UEFA rank.
      const co = LEAGUE_COUNTRY[league];
      const rank = (Euro.ASSOC_RANK.indexOf(co) + 1) || 0;
      const has = { ucl: false, uclq: false, uel: false, ecl: false };
      for (let p = 1; p <= 6; p++) {
        const e = Euro.entryFor(co, p);
        if (!e) continue;
        if (e.comp === "ucl") { if (e.path === "direct" && p > 1) has.ucl = true; else if (e.path !== "direct") has.uclq = true; }
        else if (e.comp === "uel") has.uel = true;
        else if (e.comp === "uecl") has.ecl = true;
      }
      let items = `<span><i style="background:var(--amber);"></i>Champions</span>`;
      if (has.ucl) items += `<span><i style="background:#5ec2ff;"></i>Champions League</span>`;
      if (has.uclq) items += `<span><i style="background:transparent;border:1px dashed #5ec2ff;"></i>Champions League qualifying</span>`;
      if (has.uel) items += `<span><i style="background:#ff9f5e;"></i>Europa League</span>`;
      if (has.ecl) items += `<span><i style="background:#b58cff;"></i>Conference League</span>`;
      items += `<span><i style="background:var(--alert-red);"></i>Relegation</span>`;
      return (rank ? `<span class="eyebrow" style="width:100%;flex-basis:100%;color:var(--muted);margin-bottom:0.2rem;">UEFA association rank #${rank}</span>` : "") + items;
    },
  
    // ---------- Season stats: leaderboards & awards ----------
    statRowHTML(e, isMine) {
      return `<li class="stat-row ${isMine ? "me" : ""}">
        <span class="rk mono">${e.rank}</span>
        <span class="nm">${e.name} <span class="cl mono">${e.clubShort}</span></span>
        <span class="vl mono">${e.value}</span>
      </li>`;
    },

    // League column: top 5, with the user's best appended below a divider when
    // none of their players made the cut.
    statColumnHTML(def, board) {
      if (!board.top.length) {
        return `<div class="stat-col">${this.statColHeadHTML(def)}<p class="stat-empty muted">No ${def.label.toLowerCase()} yet.</p></div>`;
      }
      const rows = board.top.map(e => this.statRowHTML(e, e.mine)).join("");
      const appended = board.yourBest
        ? `<li class="stat-row me appended" title="Your best in this category">
             <span class="rk mono">${board.yourBest.rank}</span>
             <span class="nm">${board.yourBest.name} <span class="cl mono">${board.yourBest.clubShort}</span></span>
             <span class="vl mono">${board.yourBest.value}</span>
           </li>`
        : "";
      return `<div class="stat-col">${this.statColHeadHTML(def)}<ol class="stat-list">${rows}${appended}</ol></div>`;
    },

    // My-Squad column: the user's own players ranked, tagged with league rank.
    teamColumnHTML(def, entries) {
      if (!entries.length) {
        return `<div class="stat-col">${this.statColHeadHTML(def)}<p class="stat-empty muted">No ${def.label.toLowerCase()} yet.</p></div>`;
      }
      const rows = entries.map(e => this.statRowHTML(e, false)).join("");
      return `<div class="stat-col">${this.statColHeadHTML(def)}<ol class="stat-list">${rows}</ol></div>`;
    },

    statColHeadHTML(def) {
      return `<div class="stat-col-head"><span class="ic">${def.icon}</span> ${def.award} <span class="muted">· ${def.label}</span></div>`;
    },

    renderHubStats(state, scope, league) {
      league = league || Game.myLeague();
      const cols = STAT_DEFS.map(def => {
        if (scope === "team") return this.teamColumnHTML(def, Stats.teamLeaders(state, def.key, 5, def.pos, league));
        return this.statColumnHTML(def, Stats.leaderboard(state, def.key, 5, def.pos, league));
      }).join("");
      const wrap = document.getElementById("hubStatColumns");
      wrap.innerHTML = cols;
      document.querySelectorAll(".scope-btn").forEach(b => b.classList.toggle("active", b.dataset.scope === scope));
    },

    awardCardHTML(a) {
      const w = a.winner;
      const mine = !!(w && w.mine);
      const winLine = w
        ? `<div class="aw-winner">${w.name} <span class="cl mono">${w.clubShort}</span></div><div class="aw-value mono">${w.value} ${a.def.short}</div>`
        : `<div class="aw-winner muted">Not awarded</div>`;
      return `<div class="award-card ${mine ? "mine" : ""}">
        <div class="aw-icon">${a.def.icon}</div>
        <div class="aw-name">${a.def.award}</div>
        <div class="aw-cat eyebrow">${a.def.label}</div>
        ${winLine}
        ${mine ? `<div class="aw-flag">Your player</div>` : ""}
      </div>`;
    },

    awardsGridHTML(awards) {
      return `<div class="award-grid">${awards.map(a => this.awardCardHTML(a)).join("")}</div>`;
    },

    seasonStatBoardsHTML(awards) {
      return `<div class="stat-columns">${awards.map(a => this.statColumnHTML(a.def, { top: a.top, yourBest: a.yourBest })).join("")}</div>`;
    },

    bonusCalloutHTML(granted) {
      if (!granted || !granted.length) return "";
      const labels = { goal: "goals", assist: "assists", keeper: "keeping", defense: "defending" };
      const items = granted.map(g => {
        const tags = Object.entries(g.def.bonus)
          .map(([k, v]) => `+${Math.round(v * g.scale * 100)}% ${labels[k]}`)
          .join(", ");
        const verb = g.rank === 1 ? `wins the ${g.def.award}` : `makes the ${g.def.award} top five (#${g.rank})`;
        return `<li>${g.def.icon} <strong>${g.name}</strong> ${verb} — <span class="amber">${tags}</span> next season.</li>`;
      }).join("");
      return `<div class="bonus-callout"><div class="eyebrow">Form bonuses earned</div><ul>${items}</ul></div>`;
    },

    toast(msg) {
      const el = document.createElement("div");
      el.className = "toast";
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2400);
    },
  };
  
  function isLight(hex) {
    const c = hex.replace("#", "");
    const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 165;
  }
  function posLabel(pos) { return { GK: "Goalkeeper", DF: "Defenders", MF: "Midfielders", FW: "Forwards" }[pos]; }
  function zoneLabel(zone) {
    return {
      champion: "Champions", ucl: "Champions League", uclq: "Champions League qualifying",
      uel: "Europa League", ecl: "Conference League",
      relegation: "Relegation zone", promotion: "Automatic promotion", playoff: "Play-off place",
      sacking: "Sacking zone",
    }[zone] || "";
  }
  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function clubShortLookup(id) {
    const c = (Game.state ? Game.state.clubs : CLUBS).find(c => c.id === id);
    return c ? c.short : id;
  }