/* =========================================================================
   PLFC TOUCHLINE MANAGER â€” SQUAD & TRANSFER MARKET
   ========================================================================= */

   const Market = {
    reroll(state) {
      const count = 10 + Math.floor(Math.random() * 5);
      const listings = [];
      for (let i = 0; i < count; i++) {
        const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
        const age = 17 + Math.floor(Math.random() * 18);
        // Skew towards squad-filler quality with the occasional gem.
        const roll = Math.random();
        const rating = roll < 0.08 ? 80 + Math.floor(Math.random() * 10)
                     : roll < 0.35 ? 70 + Math.floor(Math.random() * 10)
                     : 58 + Math.floor(Math.random() * 14);
        const player = P(randomName(), pos, age, rating);
        player.club = null;
        const markup = 0.95 + Math.random() * 0.5;
        listings.push({
          listingId: "m" + i + "_" + player.id,
          player,
          price: Math.max(0.4, Math.round(player.value * markup * 10) / 10),
        });
      }
      state.market = listings;
    },
  
    buy(state, listingId) {
      const club = Game.myClub();
      const idx = state.market.findIndex(l => l.listingId === listingId);
      if (idx === -1) return { ok: false, reason: "That player is no longer available." };
      const listing = state.market[idx];
      if (club.budget < listing.price) return { ok: false, reason: "Not enough budget for this deal." };
      if (club.squad.length >= 30) return { ok: false, reason: "Your squad is full (30 players max)." };
      club.budget = Math.round((club.budget - listing.price) * 10) / 10;
      const player = { ...listing.player, club: club.id };
      club.squad.push(player);
      state.market.splice(idx, 1);
      return { ok: true };
    },
  
    sell(state, playerId) {
      const club = Game.myClub();
      const player = club.squad.find(p => p.id === playerId);
      if (!player) return { ok: false, reason: "Player not found in your squad." };
      const sameGK = club.squad.filter(p => p.pos === "GK").length;
      if (player.pos === "GK" && sameGK <= 1) return { ok: false, reason: "You can't sell your only goalkeeper." };
      if (club.squad.length <= 14) return { ok: false, reason: "Your squad is too thin to sell anyone else." };
      const fee = Math.max(0.2, Math.round(player.value * 0.9 * 10) / 10);
      club.budget = Math.round((club.budget + fee) * 10) / 10;
      club.squad = club.squad.filter(p => p.id !== playerId);
      if (club.lineup) {
        POSITIONS.forEach(pos => { club.lineup.slots[pos] = club.lineup.slots[pos].map(id => id === playerId ? null : id); });
        club.lineup.bench = club.lineup.bench.filter(id => id !== playerId);
      }
      return { ok: true, fee };
    },
  };