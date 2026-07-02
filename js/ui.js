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
  
    renderClubGrid(selectedId) {
      const grid = document.getElementById("clubGrid");
      const tile = c => `
        <button class="club-tile ${c.id === selectedId ? "selected" : ""}" data-club="${c.id}" type="button">
          ${this.crestHTML(c, "sm")}
          <span>
            <span class="name">${c.name}</span>
            <span class="tag">${"★".repeat(c.tier)}${"☆".repeat(5 - c.tier)} reputation</span>
          </span>
        </button>
      `;
      grid.innerHTML = LEAGUES.map(lg => `
        <div class="club-group-head">${LEAGUE_NAMES[lg]}</div>
        ${CLUBS.filter(c => c.league === lg).map(tile).join("")}
      `).join("");
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
      this.renderHubStats(state, App.hubStatScope, club.league);
      this.renderCupPanel(state, Cup.CUPS.fa, "hubCupBody");
      this.renderCupPanel(state, Cup.CUPS.efl, "hubCarabaoBody");
      this.renderVertuPanel(state);
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
        { type: "facup", label: "FA Cup", icon: "🏆" },
        { type: "carabao", label: "Carabao Cup", icon: "🏆" },
        { type: "vertu", label: "Vertu Trophy", icon: "🏆" },
        { type: "shield", label: "Community Shield", icon: "🛡️" },
      ];
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
      const rounds = cfg.rounds;

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
        const row = this.renderPlayerRow(p, {
          subLabel: this.wage(p.wage),
          careerLabel: Stats.careerSquadLine(p),
          potentialLabel: String(p.potential),
          badge,
          rowClass: p.transferListed ? "listed" : "",
          action: listBtn,
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
      document.getElementById("marketBudgetLabel").textContent = "Budget: " + this.money(club.budget);
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
        const cur = role === "scout" ? (a.scout ? a.scout.rating : 0)
          : role === "youthcoach" ? (a.coach ? a.coach.rating : 0)
          : (club.coaches[role] ? club.coaches[role].rating : 0);
        const tag = c.rating > cur ? " · upgrade" : c.rating < cur ? " · downgrade" : "";
        const chipClass = Coaching.isYouth(role) ? "youth" : role;
        const chipText = role === "scout" ? "SCT" : role === "youthcoach" ? "YTH" : role;
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

    formationOptions(current) {
      return Object.keys(FORMATIONS).map(f => `<option value="${f}" ${f === current ? "selected" : ""}>${f}</option>`).join("");
    },
  
    renderPitch(club) {
      const layout = FORMATION_LAYOUT[club.formation];
      const ids = Lineup.starterIds(club.lineup);
      const pitch = document.getElementById("pitch");
      pitch.querySelectorAll(".token").forEach(t => t.remove());
      const [c1] = club.colors;
      ids.forEach((id, i) => {
        const p = club.squad.find(pl => pl.id === id);
        const [x, y] = layout[i] || [50, 50];
        const token = document.createElement("div");
        token.className = "token";
        token.style.left = x + "%";
        token.style.top = y + "%";
        const initials = p ? p.name.split(" ").slice(-1)[0] : "—";
        token.innerHTML = `<div class="dot" style="background:${p ? c1 : "#555"};">${p ? p.rating : ""}</div><div class="lbl">${initials}</div>`;
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
          const eligible = club.squad.filter(p => p.pos === pos && (!used.includes(p.id) || p.id === id)).sort((a, b) => b.rating - a.rating);
          html += `<div class="slot-row">
            <select data-pos="${pos}" data-idx="${idx}">
              <option value="">— Empty —</option>
              ${eligible.map(p => `<option value="${p.id}" ${p.id === id ? "selected" : ""}>${p.name} (${p.rating})</option>`).join("")}
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
      document.getElementById("formationSelect").innerHTML = this.formationOptions(club.formation);
      this.renderPitch(club);
      this.renderLineupSlots(club);
      this.renderBench(club);
      document.getElementById("lineupError").textContent = "";
    },
  
    renderTable(state, league) {
      league = league || Game.myLeague();
      document.getElementById("tableTitle").textContent = LEAGUE_NAMES[league] + " Table";
      document.querySelectorAll(".table-league-btn").forEach(b => b.classList.toggle("active", b.dataset.league === league));
      const rows = Season.table(state, league);
      document.getElementById("ladderBody").innerHTML = rows.map(r => {
        const zone = Season.zoneFor(r.pos, league, rows.length);
        return `<tr class="${r.id === state.clubId ? "me" : ""} ${zone ? "zone-" + zone : ""}">
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
      return `
        <span><i style="background:var(--amber);"></i>Champions</span>
        <span><i style="background:#5ec2ff;"></i>Champions League</span>
        <span><i style="background:#ff9f5e;"></i>Europa League</span>
        <span><i style="background:#b58cff;"></i>Conference League</span>
        <span><i style="background:var(--alert-red);"></i>Relegation</span>`;
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
      champion: "Champions", ucl: "Champions League", uel: "Europa League", ecl: "Conference League",
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