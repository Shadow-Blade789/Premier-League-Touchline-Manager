/* =========================================================================
   PLFC TOUCHLINE MANAGER — CLUB FORTUNES (dynamic league hierarchy)
   Between seasons, clubs' reputations rise and fall with their results, and
   their squads and coaching drift toward that reputation. So a fallen giant
   sheds quality and slides to mid-table while an overachieving minnow builds
   into a genuine force. On top of that, if the user pulls far clear of the
   field, the strongest clubs (and rising runners-up) chase the user's level so
   there's always a title race — but only when the gap is large, so a well-run
   super-club can still win, just not at a canter. Never touches the user's own
   squad; that's theirs to build.
   ========================================================================= */

const Dynamics = {
  // The XI strength a club gravitates toward at each reputation tier.
  targetByTier: { 5: 84, 4: 80, 3: 75, 2: 70, 1: 65, 0: 60 },

  // Where a club's reputation "wants" to be given where it just finished.
  targetTierFor(league, pos) {
    if (league === "PL") return pos <= 4 ? 5 : pos <= 10 ? 4 : 3;
    if (league === "CH") return pos <= 6 ? 3 : 2;
    if (league === "L1") return pos <= 6 ? 2 : 1;
    return pos <= 6 ? 1 : 0; // League Two
  },

  apply(state, tables) {
    // 1. Reputation drifts one step toward the level this season's finish
    //    suggests (gradual, so a single result doesn't reinvent a club).
    LEAGUES.forEach(lg => (tables[lg] || []).forEach(row => {
      const club = state.clubs.find(c => c.id === row.id);
      if (!club) return;
      const target = this.targetTierFor(lg, row.pos);
      if (club.tier < target) club.tier++;
      else if (club.tier > target) club.tier--;
      club.tier = clamp(club.tier, 0, 5);
    }));

    // 2. Rival coaching and squads track reputation. Only a FEW clubs — the
    //    strongest in the user's own division — chase a runaway leader, and
    //    only when the user is clearly ahead of the natural top level, so the
    //    rest of the league stays beatable rather than everyone levelling up.
    const my = Game.myClub();
    const userStr = my ? Stats.clubStrength(my) : 80;
    const myLeague = my ? my.league : "PL";
    const challengers = new Set(
      state.clubs
        .filter(c => c.id !== state.clubId && c.league === myLeague)
        .sort((a, b) => Stats.clubStrength(b) - Stats.clubStrength(a))
        .slice(0, 4) // a genuine title-race pack, not the whole division
        .map(c => c.id)
    );
    state.clubs.forEach(club => {
      if (club.id === state.clubId) return;
      this.driftCoaches(club);
      let target = this.targetByTier[club.tier] || 65;
      // Catch-up only for the chasing pack, and only against a dominant user.
      if (challengers.has(club.id) && userStr > target + 3) {
        target = Math.max(target, userStr - (2 + Math.floor(Math.random() * 4))); // 2–5 below you
      }
      this.driftSquad(club, target);
    });
  },

  driftCoaches(club) {
    if (!club.coaches) return;
    const target = 48 + club.tier * 7;
    POSITIONS.forEach(pos => {
      const c = club.coaches[pos];
      if (!c) return;
      c.rating = clamp(Math.round(c.rating + clamp(target - c.rating, -2, 2)), 40, 92);
    });
  },

  // Nudge a club's core (its best 14) toward the target XI strength, at most a
  // couple of points a season — rising clubs strengthen, fading ones weaken.
  driftSquad(club, target) {
    const cur = Stats.clubStrength(club);
    const step = clamp(target - cur, -2, 2);
    if (Math.abs(step) < 0.5) return;
    club.squad.slice().sort((a, b) => b.rating - a.rating).slice(0, 14).forEach(p => {
      p.rating = clamp(Math.round(p.rating + step), 42, 93);
      if (p.potential < p.rating) p.potential = p.rating;
    });
  },
};
