/* =========================================================================
   PLFC TOUCHLINE MANAGER — COACHING STAFF
   Every club fields a position coach for each unit (GK, DF, MF, FW). Coach
   quality is the PRIMARY driver of how fast a club's players develop toward
   (or hold off decline from) their potential — season results only nudge it,
   though a dramatic overachievement still pays off big. The user upgrades
   their staff from a coaches market that refreshes on its own every matchweek
   (no manual reroll — you wait for next week's names).
   ========================================================================= */

let _coachId = 1;

function makeCoach(pos, rating) {
  const { name } = randomProspect();
  return { id: "co" + (_coachId++), name, pos, rating: Math.max(40, Math.min(95, Math.round(rating))) };
}

const Coaching = {
  DEFAULT_RATING: 52,

  // AI/starting coach quality scales with club reputation tier.
  tierCoachRating(tier) { return 48 + tier * 7 + Math.floor(Math.random() * 5); },

  initClubCoaches(club) {
    club.coaches = {};
    POSITIONS.forEach(pos => { club.coaches[pos] = makeCoach(pos, this.tierCoachRating(club.tier)); });
  },
  ensureAll(state) { state.clubs.forEach(c => { if (!c.coaches) this.initClubCoaches(c); }); },

  ratingFor(club, pos) {
    const c = club && club.coaches && club.coaches[pos];
    return c ? c.rating : this.DEFAULT_RATING;
  },

  // Development multiplier applied to a player's growth: a weak coach (~45)
  // barely develops anyone; an elite coach (~90+) nearly doubles growth.
  growthMultiplier(club, pos) {
    return clamp((this.ratingFor(club, pos) - 40) / 35, 0.3, 2.0);
  },

  // A short descriptor for the UI.
  ratingLabel(rating) {
    if (rating >= 85) return "World-class";
    if (rating >= 75) return "Excellent";
    if (rating >= 66) return "Very good";
    if (rating >= 57) return "Solid";
    if (rating >= 50) return "Average";
    return "Basic";
  },

  cost(rating) {
    return Math.max(0.3, Math.round(Math.pow(Math.max(0, rating - 45), 1.45) * 0.05 * 10) / 10);
  },

  // Fresh candidates each matchweek — there's no reroll button.
  weeklyMarket(state) {
    const list = [];
    const n = 6 + Math.floor(Math.random() * 4); // 6–9 coaches
    for (let i = 0; i < n; i++) {
      const pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
      const roll = Math.random();
      const rating = roll < 0.08 ? 82 + Math.floor(Math.random() * 12)   // rare elite
                   : roll < 0.4 ? 64 + Math.floor(Math.random() * 16)
                   : 48 + Math.floor(Math.random() * 16);
      list.push(makeCoach(pos, rating));
    }
    list.sort((a, b) => POSITIONS.indexOf(a.pos) - POSITIONS.indexOf(b.pos) || b.rating - a.rating);
    state.coachMarket = list;
  },

  hire(state, coachId) {
    const club = Game.myClub();
    const idx = (state.coachMarket || []).findIndex(c => c.id === coachId);
    if (idx === -1) return { ok: false, reason: "That coach is no longer available." };
    const coach = state.coachMarket[idx];
    const price = this.cost(coach.rating);
    if (club.budget < price) return { ok: false, reason: "Not enough budget to hire this coach." };
    club.budget = Math.round((club.budget - price) * 10) / 10;
    club.coaches[coach.pos] = coach;
    state.coachMarket.splice(idx, 1);
    return { ok: true, name: coach.name, pos: coach.pos, price };
  },
};
