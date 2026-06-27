/* =========================================================================
   PLFC TOUCHLINE MANAGER — LINEUP
   Formation handling and best-XI auto-pick.
   ========================================================================= */

   const Lineup = {
    emptyLineup(formationKey) {
      const req = FORMATIONS[formationKey];
      return {
        formation: formationKey,
        slots: { GK: new Array(req.GK).fill(null), DF: new Array(req.DF).fill(null), MF: new Array(req.MF).fill(null), FW: new Array(req.FW).fill(null) },
        bench: [],
      };
    },
  
    autoPick(club, formationKey) {
      formationKey = formationKey || club.formation || "4-4-2";
      const req = FORMATIONS[formationKey];
      const lineup = this.emptyLineup(formationKey);
      const used = new Set();
  
      POSITIONS.forEach(pos => {
        const pool = club.squad.filter(p => p.pos === pos).sort((a, b) => b.rating - a.rating);
        for (let i = 0; i < req[pos]; i++) {
          const pick = pool[i];
          if (pick) { lineup.slots[pos][i] = pick.id; used.add(pick.id); }
        }
      });
  
      // Bench: best remaining players, up to 7, at least one spare keeper if possible.
      const rest = club.squad.filter(p => !used.has(p.id)).sort((a, b) => b.rating - a.rating);
      lineup.bench = rest.slice(0, 7).map(p => p.id);
  
      club.formation = formationKey;
      club.lineup = lineup;
      return lineup;
    },
  
    starterIds(lineup) {
      return [...lineup.slots.GK, ...lineup.slots.DF, ...lineup.slots.MF, ...lineup.slots.FW].filter(Boolean);
    },
  
    starters(club) {
      const lineup = club.lineup || this.autoPick(club);
      const ids = this.starterIds(lineup);
      return ids.map(id => club.squad.find(p => p.id === id)).filter(Boolean);
    },
  
    isComplete(lineup) {
      return Object.values(lineup.slots).every(arr => arr.every(id => id !== null));
    },
  
    // Assign a player to a slot, swapping out anyone already there (back to bench).
    assign(club, pos, index, playerId) {
      const lineup = club.lineup;
      const prev = lineup.slots[pos][index];
      // Remove the incoming player from wherever else it currently sits.
      POSITIONS.forEach(p => {
        lineup.slots[p] = lineup.slots[p].map(id => (id === playerId ? null : id));
      });
      lineup.bench = lineup.bench.filter(id => id !== playerId);
      lineup.slots[pos][index] = playerId;
      if (prev && prev !== playerId && !lineup.bench.includes(prev)) lineup.bench.push(prev);
    },
  
    removeFromBench(club, playerId) {
      club.lineup.bench = club.lineup.bench.filter(id => id !== playerId);
    },
  
    addToBench(club, playerId) {
      if (!club.lineup.bench.includes(playerId)) club.lineup.bench.push(playerId);
    },
  };