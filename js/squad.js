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
      this.aiTransfers(state, 8 + Math.floor(Math.random() * 8)); // opening flurry
      this.generateOffers(state);
      return { transition: "opened", name: TransferWindow.current(state.week).name };
    }
    if (!openNow && openBefore) {
      state.market = [];
      this.clearOffers(state); // outstanding bids lapse when the window shuts
      return { transition: "closed" };
    }
    if (openNow) {
      // Partial churn: ~30% of listings get poached elsewhere, replaced fresh.
      const keep = state.market.filter(() => Math.random() > 0.3);
      const need = Math.max(10, state.market.length) - keep.length;
      state.market = keep.concat(this.buildListings(state, need));
      this.aiTransfers(state, 3 + Math.floor(Math.random() * 4)); // ongoing rival business
      this.generateOffers(state); // rivals bid for your players
    }
    return { transition: "none" };
  },

  // ---- offers for the user's players -----------------------------------------
  // While a window is open, rival clubs bid for your squad — far more often for
  // anyone you've transfer-listed. Each bid is within ±25% of market value.
  generateOffers(state) {
    const club = state.clubs.find(c => c.id === state.clubId);
    if (!club) return;
    const rivals = state.clubs.filter(c => c.id !== state.clubId);
    club.squad.forEach(p => {
      p.offers = p.offers || [];
      const cap = p.transferListed ? 5 : 2;
      if (p.offers.length >= cap) return;
      const desire = clamp((p.rating - 60) / 50, 0, 0.25); // better players draw interest anyway
      const chance = clamp((p.transferListed ? 0.65 : 0.06) + desire, 0, 0.92);
      if (Math.random() > chance) return;
      const fee = Math.max(0.2, Math.round(p.value * (0.75 + Math.random() * 0.5) * 10) / 10); // ±25%
      const weights = rivals.map(c => { const exp = 54 + c.tier * 6; return 1 / (1 + Math.abs(p.rating - exp)); });
      // Find an interested club that can actually afford the fee (a few tries).
      let buyer = null;
      for (let t = 0; t < 6 && !buyer; t++) { const c = weightedPick(rivals, weights); if (c && c.budget >= fee && c.id !== (p.offers[0] && p.offers[0].clubId)) buyer = c; }
      if (!buyer) return;
      p.offers.push({ clubId: buyer.id, clubShort: buyer.short, clubName: buyer.name, fee, week: state.week });
    });
  },

  clearOffers(state) {
    const club = state.clubs.find(c => c.id === state.clubId);
    if (club) club.squad.forEach(p => { p.offers = []; });
  },

  toggleTransferList(state, playerId) {
    const club = Game.myClub();
    const player = club.squad.find(p => p.id === playerId);
    if (!player) return { ok: false };
    player.transferListed = !player.transferListed;
    return { ok: true, listed: player.transferListed, name: player.name };
  },

  declineOffer(state, playerId, offerIdx) {
    const player = Game.myClub().squad.find(p => p.id === playerId);
    if (player && player.offers) player.offers.splice(offerIdx, 1);
    return { ok: true };
  },

  // Accept a specific offer — this is now the only way to sell a player.
  acceptOffer(state, playerId, offerIdx) {
    if (!TransferWindow.isOpen(state.week)) return { ok: false, reason: "The transfer window is closed." };
    const club = Game.myClub();
    const player = club.squad.find(p => p.id === playerId);
    if (!player || !player.offers || !player.offers[offerIdx]) return { ok: false, reason: "That offer is no longer on the table." };
    const offer = player.offers[offerIdx];
    if (player.pos === "GK" && club.squad.filter(p => p.pos === "GK").length <= 1) return { ok: false, reason: "You can't sell your only goalkeeper." };
    if (club.squad.length <= 14) return { ok: false, reason: "Your squad is too thin to sell anyone else." };
    const buyer = state.clubs.find(c => c.id === offer.clubId);
    if (!buyer) return { ok: false, reason: "The buying club has withdrawn." };

    club.budget = Math.round((club.budget + offer.fee) * 10) / 10;
    club.squad = club.squad.filter(p => p.id !== playerId);
    if (club.lineup) {
      POSITIONS.forEach(pos => { club.lineup.slots[pos] = club.lineup.slots[pos].map(id => id === playerId ? null : id); });
      club.lineup.bench = club.lineup.bench.filter(id => id !== playerId);
    }
    Stats.ensure(player);
    buyer.squad.push({ ...player, club: buyer.id, transferListed: false, offers: [], stats: { ...player.stats }, bonus: { ...player.bonus }, career: { ...player.career } });
    buyer.lineup = null;
    return { ok: true, fee: offer.fee, buyerName: offer.clubName };
  },

  // ---- AI-to-AI transfer activity -------------------------------------------
  // While a window is open, rival clubs trade players among themselves so
  // squads churn realistically (money changes hands too). Never touches the
  // user's club — their business stays manual.
  aiTransfers(state, moves) {
    const others = () => state.clubs.filter(c => c.id !== state.clubId);
    for (let i = 0; i < moves; i++) {
      const sellers = others().filter(c => c.squad.length > 16);
      if (!sellers.length) break;
      const seller = sellers[Math.floor(Math.random() * sellers.length)];

      // Mostly fringe/squad players are sold; occasionally a marquee name.
      const sorted = seller.squad.slice().sort((a, b) => a.rating - b.rating);
      const player = Math.random() < 0.12
        ? sorted[sorted.length - 1]
        : sorted[Math.floor(Math.random() * Math.max(1, Math.round(sorted.length * 0.5)))];
      if (!player) continue;
      if (player.pos === "GK" && seller.squad.filter(p => p.pos === "GK").length <= 1) continue;

      // A buyer whose level fits the player, with room and money for the deal.
      const candidates = others().filter(c => c.id !== seller.id && c.squad.length < 32);
      const weights = candidates.map(c => {
        const expected = 54 + c.tier * 6;
        return 1 / (1 + Math.abs(player.rating - expected));
      });
      const buyer = weightedPick(candidates, weights);
      if (!buyer) continue;

      const fee = Math.max(0.2, Math.round(player.value * (0.75 + buyer.tier * 0.06) * 10) / 10);
      if (buyer.budget < fee) continue;

      buyer.budget = Math.round((buyer.budget - fee) * 10) / 10;
      seller.budget = Math.round((seller.budget + fee) * 10) / 10;
      seller.squad = seller.squad.filter(p => p.id !== player.id);
      this.guardMinimum(seller);
      Stats.ensure(player);
      buyer.squad.push({ ...player, club: buyer.id, stats: { ...player.stats }, bonus: { ...player.bonus }, career: { ...player.career } });
      seller.lineup = null; buyer.lineup = null;
      // Drop any user-market listing referencing a player who's just moved.
      state.market = (state.market || []).filter(l => l.player.id !== player.id);
    }
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
    Stats.ensure(listing.player);
    const player = { ...listing.player, club: club.id, transferListed: false, offers: [], stats: { ...listing.player.stats }, bonus: { ...listing.player.bonus }, career: { ...listing.player.career } };
    club.squad.push(player);
    club.lineup = null;
    return { ok: true, name: listing.player.name, origin: listing.originName };
  },
};

// Weighted random pick from a parallel list of items and weights.
function weightedPick(items, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  if (!items.length || total <= 0) return items[0] || null;
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}