/* =========================================================================
   PLFC TOUCHLINE MANAGER â€” SQUAD & TRANSFER MARKET
   Two real-style transfer windows (summer / winter), listings sourced from
   rival clubs' actual squads plus generated free agents and academy
   prospects, and sales that send your players to a real buying club.
   ========================================================================= */

// Matchweek ranges (0-indexed state.week) during which business can be done.
const TRANSFER_WINDOWS = [
  { name: "Summer", from: 0, to: 3 },     // pre-season through ~deadline day
  { name: "Winter", from: 20, to: 23 },   // January window
];

const TransferWindow = {
  current(week) {
    return TRANSFER_WINDOWS.find(w => week >= w.from && week <= w.to) || null;
  },
  isOpen(week) {
    return !!this.current(week);
  },
  nextOpenWeek(week) {
    const upcoming = TRANSFER_WINDOWS.find(w => w.from > week);
    return upcoming ? upcoming.from : TRANSFER_WINDOWS[0].from; // wraps to next season's summer window
  },
  status(state) {
    const week = state.week;
    const win = this.current(week);
    if (win) return { open: true, name: win.name, closesIn: win.to - week };
    const nextWeek = this.nextOpenWeek(week);
    const wraps = nextWeek <= week;
    return { open: false, opensIn: wraps ? null : nextWeek - week, wraps };
  },
};

const Market = {
  // ---- listing construction -------------------------------------------------
  listingFromExisting(player, originClub) {
    const bigSaleRoll = player.rating >= 80 ? Math.random() : 1; // stars rarely listed
    const markup = bigSaleRoll < 0.15 ? 1.8 + Math.random() * 0.8 : 0.95 + Math.random() * 0.45;
    return {
      listingId: "x" + player.id,
      player,
      origin: originClub.id,
      originName: originClub.short,
      price: Math.max(0.4, Math.round(player.value * markup * 10) / 10),
    };
  },
  listingFromProspect() {
    const isYouth = Math.random() < 0.55;
    const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
    const { name, nat } = randomProspect();
    let age, rating;
    if (isYouth) {
      age = 16 + Math.floor(Math.random() * 5); // 16-20
      const roll = Math.random();
      rating = roll < 0.06 ? 68 + Math.floor(Math.random() * 10)  // rare teenage gem
             : roll < 0.30 ? 58 + Math.floor(Math.random() * 10)
             : 48 + Math.floor(Math.random() * 12);
    } else {
      age = 21 + Math.floor(Math.random() * 14);
      const roll = Math.random();
      rating = roll < 0.06 ? 78 + Math.floor(Math.random() * 10)
             : roll < 0.35 ? 66 + Math.floor(Math.random() * 10)
             : 55 + Math.floor(Math.random() * 13);
    }
    const player = P(name, pos, age, rating, { nat });
    player.club = null;
    const markup = 0.9 + Math.random() * 0.4;
    return {
      listingId: "f" + player.id,
      player,
      origin: null,
      originName: isYouth ? "Academy free agent" : "Free agent",
      price: Math.max(0.3, Math.round(player.value * markup * 10) / 10),
    };
  },

  // Pool of plausibly-sellable players across every rival club: weighted
  // toward fringe/lower-rated players, with a rare star "shock listing".
  sellablePoolAcrossLeague(state) {
    const pool = [];
    state.clubs.forEach(club => {
      if (club.id === state.clubId) return;
      const sorted = club.squad.slice().sort((a, b) => a.rating - b.rating);
      const fringeCount = Math.max(2, Math.round(sorted.length * 0.45));
      sorted.slice(0, fringeCount).forEach(p => pool.push({ player: p, club }));
      // Small chance any given club puts a star up for a big-money move.
      if (Math.random() < 0.12 && sorted.length) {
        const star = sorted[sorted.length - 1];
        if (!pool.find(e => e.player.id === star.id)) pool.push({ player: star, club });
      }
    });
    return pool;
  },

  buildListings(state, count) {
    const listings = [];
    const realPool = this.sellablePoolAcrossLeague(state);
    const realCount = Math.round(count * 0.6);
    for (let i = 0; i < realCount && realPool.length; i++) {
      const idx = Math.floor(Math.random() * realPool.length);
      const { player, club } = realPool.splice(idx, 1)[0];
      listings.push(this.listingFromExisting(player, club));
    }
    while (listings.length < count) listings.push(this.listingFromProspect());
    return listings;
  },

  // Full reroll â€” only meaningful while a window is open. Used by the
  // manual "Reroll Market" button and when a window first opens.
  reroll(state) {
    if (!TransferWindow.isOpen(state.week)) { state.market = []; return; }
    const count = 10 + Math.floor(Math.random() * 6);
    state.market = this.buildListings(state, count);
  },

  // Called every matchweek. Opens/closes the market as windows start and
  // end, and lightly churns listings while a window stays open (some
  // players get snapped up by other clubs, new ones appear).
  weeklyUpdate(state) {
    const openNow = TransferWindow.isOpen(state.week);
    const openBefore = state.windowWasOpen;
    state.windowWasOpen = openNow;

    if (openNow && !openBefore) {
      this.reroll(state);
      return { transition: "opened", name: TransferWindow.current(state.week).name };
    }
    if (!openNow && openBefore) {
      state.market = [];
      return { transition: "closed" };
    }
    if (openNow) {
      // Partial churn: ~30% of listings get poached elsewhere, replaced fresh.
      const keep = state.market.filter(() => Math.random() > 0.3);
      const need = Math.max(10, state.market.length) - keep.length;
      state.market = keep.concat(this.buildListings(state, need));
    }
    return { transition: "none" };
  },

  guardMinimum(club) {
    const have = { GK: 0, DF: 0, MF: 0, FW: 0 };
    club.squad.forEach(p => have[p.pos]++);
    const floor = { GK: 1, DF: 3, MF: 2, FW: 1 };
    POSITIONS.forEach(pos => {
      while (have[pos] < floor[pos]) {
        const { name, nat } = randomProspect();
        const age = 18 + Math.floor(Math.random() * 5);
        const p = P(name, pos, age, 55 + Math.floor(Math.random() * 8), { nat });
        p.club = club.id;
        club.squad.push(p);
        have[pos]++;
      }
    });
  },

  // ---- buy / sell ------------------------------------------------------------
  buy(state, listingId) {
    if (!TransferWindow.isOpen(state.week)) return { ok: false, reason: "The transfer window is closed." };
    const club = Game.myClub();
    const idx = state.market.findIndex(l => l.listingId === listingId);
    if (idx === -1) return { ok: false, reason: "That player is no longer available." };
    const listing = state.market[idx];
    if (club.budget < listing.price) return { ok: false, reason: "Not enough budget for this deal." };
    if (club.squad.length >= 32) return { ok: false, reason: "Your squad is full (32 players max)." };

    club.budget = Math.round((club.budget - listing.price) * 10) / 10;
    state.market.splice(idx, 1);

    if (listing.origin) {
      const originClub = state.clubs.find(c => c.id === listing.origin);
      if (originClub) {
        originClub.squad = originClub.squad.filter(p => p.id !== listing.player.id);
        this.guardMinimum(originClub);
        originClub.lineup = null;
      }
      // Remove any other listing referencing the same now-departed player.
      state.market = state.market.filter(l => l.player.id !== listing.player.id);
    }
    const player = { ...listing.player, club: club.id };
    club.squad.push(player);
    club.lineup = null;
    return { ok: true, name: listing.player.name, origin: listing.originName };
  },

  sell(state, playerId) {
    if (!TransferWindow.isOpen(state.week)) return { ok: false, reason: "The transfer window is closed." };
    const club = Game.myClub();
    const player = club.squad.find(p => p.id === playerId);
    if (!player) return { ok: false, reason: "Player not found in your squad." };
    const sameGK = club.squad.filter(p => p.pos === "GK").length;
    if (player.pos === "GK" && sameGK <= 1) return { ok: false, reason: "You can't sell your only goalkeeper." };
    if (club.squad.length <= 14) return { ok: false, reason: "Your squad is too thin to sell anyone else." };

    // Pick a plausible buying club: weight by how close the player's rating
    // sits to that club's level (tier-based), so stars go to big clubs and
    // squad players go to mid/lower-table sides.
    const candidates = state.clubs.filter(c => c.id !== club.id);
    const weights = candidates.map(c => {
      const expected = 58 + c.tier * 7;
      return 1 / (1 + Math.abs(player.rating - expected));
    });
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    let buyer = candidates[candidates.length - 1];
    for (let i = 0; i < candidates.length; i++) { r -= weights[i]; if (r <= 0) { buyer = candidates[i]; break; } }

    const feeMultiplier = 0.75 + buyer.tier * 0.06;
    const fee = Math.max(0.2, Math.round(player.value * feeMultiplier * 10) / 10);
    club.budget = Math.round((club.budget + fee) * 10) / 10;
    club.squad = club.squad.filter(p => p.id !== playerId);
    if (club.lineup) {
      POSITIONS.forEach(pos => { club.lineup.slots[pos] = club.lineup.slots[pos].map(id => id === playerId ? null : id); });
      club.lineup.bench = club.lineup.bench.filter(id => id !== playerId);
    }
    buyer.squad.push({ ...player, club: buyer.id });
    buyer.lineup = null;

    return { ok: true, fee, buyerName: buyer.name };
  },
};