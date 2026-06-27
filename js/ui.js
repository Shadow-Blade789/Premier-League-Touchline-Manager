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
  
    crestHTML(club, size = "") {
      const [c1, c2] = club.colors;
      const initials = (club.crestInitials || club.short || club.name.slice(0, 3)).toUpperCase();
      const textColor = isLight(c1) ? "#0a0e14" : "#f4f7f2";
      return `<div class="crest ${size}" style="background:linear-gradient(160deg, ${c1} 55%, ${c2} 55%); color:${textColor};">${initials}</div>`;
    },
  
    renderClubGrid(selectedId) {
      const grid = document.getElementById("clubGrid");
      grid.innerHTML = CLUBS.map(c => `
        <button class="club-tile ${c.id === selectedId ? "selected" : ""}" data-club="${c.id}" type="button">
          ${this.crestHTML(c, "sm")}
          <span>
            <span class="name">${c.name}</span>
            <span class="tag">${"★".repeat(c.tier)}${"☆".repeat(5 - c.tier)} reputation</span>
          </span>
        </button>
      `).join("");
    },
  
    renderTopbar(state) {
      const club = Game.myClub();
      document.getElementById("topbarCrest").outerHTML = this.crestHTML(club, "sm").replace('class="crest sm"', 'class="crest sm" id="topbarCrest"');
      document.getElementById("topbarClub").textContent = club.name;
      document.getElementById("topbarManager").textContent = state.managerName + (state.titles ? "  ·  " + state.titles + "x Champion" : "");
      document.getElementById("topbarSeason").textContent = state.season + "/" + String(state.season + 1).slice(2);
      document.getElementById("topbarWeek").textContent = Math.min(state.week + 1, state.fixtures.length) + " / " + state.fixtures.length;
      document.getElementById("topbarBudget").textContent = this.money(club.budget);
    },
  
    renderHub(state) {
      const club = Game.myClub();
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
        Formation: <strong>${club.formation}</strong><br>
        Squad size: <strong>${club.squad.length}</strong><br>
        XI average rating: <strong>${MatchEngine.overallRating(starters).toFixed(0)}</strong><br>
        Budget: <strong>${this.money(club.budget)}</strong>
      `;
      const table = Season.table(state);
      const row = table.find(r => r.id === club.id);
      const zone = Season.zoneFor(row.pos);
      document.getElementById("hubPosition").innerHTML = `
        Position <strong>${row.pos}</strong> of 20<br>
        ${row.points} pts (${row.won}W ${row.drawn}D ${row.lost}L)<br>
        ${zone ? `<span class="eyebrow">${zoneLabel(zone)}</span>` : ""}
      `;
      const hist = document.getElementById("hubHistory");
      if (state.history.length) {
        hist.innerHTML = state.history.slice().reverse().slice(0, 5).map(h =>
          `${h.season}/${String(h.season + 1).slice(2)} — ${h.champion ? "🏆 Champions" : "Finished " + ordinal(h.position)}`
        ).join("<br>");
      }
    },
  
    renderPlayerRow(p, opts = {}) {
      const actionHTML = opts.action || "";
      return `
        <div class="player-row">
          <div class="pos-chip ${p.pos}">${p.pos}</div>
          <div>
            <div class="name">${p.name}</div>
            <div class="sub">${opts.subLabel || (p.club ? clubShortLookup(p.club) : "Free agent")}</div>
          </div>
          <div class="mono">${p.age}</div>
          <div class="rating-pill">${p.rating}</div>
          <div class="mono">${opts.priceLabel ?? this.money(p.value)}</div>
          ${actionHTML}
        </div>
      `;
    },
  
    renderSquad(state) {
      const club = Game.myClub();
      const sorted = club.squad.slice().sort((a, b) => POSITIONS.indexOf(a.pos) - POSITIONS.indexOf(b.pos) || b.rating - a.rating);
      document.getElementById("squadList").innerHTML = sorted.map(p => this.renderPlayerRow(p, {
        subLabel: this.wage(p.wage),
        action: `<button class="small danger" data-sell="${p.id}">Sell</button>`,
      })).join("");
    },
  
    renderMarket(state) {
      const club = Game.myClub();
      document.getElementById("marketBudgetLabel").textContent = "Budget: " + this.money(club.budget);
      const list = document.getElementById("marketList");
      if (!state.market.length) {
        list.innerHTML = `<p class="muted">No players available — try rerolling the market.</p>`;
        return;
      }
      list.innerHTML = state.market.map(l => this.renderPlayerRow(l.player, {
        subLabel: "Available now",
        priceLabel: this.money(l.price),
        action: `<button class="small primary" data-buy="${l.listingId}" ${club.budget < l.price ? "disabled" : ""}>Sign</button>`,
      })).join("");
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
  
    renderTable(state) {
      const rows = Season.table(state);
      document.getElementById("ladderBody").innerHTML = rows.map(r => {
        const zone = Season.zoneFor(r.pos);
        return `<tr class="${r.id === state.clubId ? "me" : ""} ${zone ? "zone-" + zone : ""}">
          <td>${r.pos}</td>
          <td class="club-cell">${this.crestHTML(r, "sm")} ${r.name}</td>
          <td>${r.played}</td><td>${r.won}</td><td>${r.drawn}</td><td>${r.lost}</td>
          <td>${r.gf}</td><td>${r.ga}</td><td>${r.gd > 0 ? "+" : ""}${r.gd}</td>
          <td><strong>${r.points}</strong></td>
        </tr>`;
      }).join("");
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
    return { champion: "Champions", ucl: "Champions League", uel: "Europa League", ecl: "Conference League", relegation: "Relegation zone" }[zone] || "";
  }
  function ordinal(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function clubShortLookup(id) {
    const c = (Game.state ? Game.state.clubs : CLUBS).find(c => c.id === id);
    return c ? c.short : id;
  }