/* =========================================================================
   PLFC TOUCHLINE MANAGER — CONTRACTS & WAGE BUDGET
   A light contract layer for the user's club. Every signing is negotiated:
   pick a length (1–10 yrs) and a weekly wage on two sliders, make an offer,
   and the player accepts or rejects on the spot. Five rejected attempts and
   the target is off-limits until the next transfer window. Wages are paid
   from a separate WEEKLY WAGE BUDGET (e.g. £150k/wk) — sign a £30k/wk player
   and you have £120k/wk left — so quality costs wage room, not just fees.
   Contracts run down a year each season; let one expire and the player walks
   for free, so keep your key men renewed. Only the managed club is tracked.
   ========================================================================= */

const Contracts = {
  MAX_ATTEMPTS: 5,

  // A player's wage demand = the wage they already carry (shown on the squad
  // sheet), so what they ask to sign is consistent with what they earn. They
  // won't take a pay cut, so this is the floor for an acceptable offer.
  wageDemand(p) { return Math.max(3, Math.round(p.wage || 3)); },

  // Preferred contract length by age — the young want long security, veterans
  // only short deals.
  idealLength(age) {
    return age <= 22 ? 5 : age <= 26 ? 4 : age <= 29 ? 3 : age <= 32 ? 2 : 1;
  },

  // Slider bounds for a wage offer (£k/wk), centred on the demand.
  wageRange(p) {
    const d = this.wageDemand(p);
    return { min: Math.max(1, Math.round(d * 0.5)), max: Math.round(d * 2), demand: d };
  },

  // ---- wage budget ----------------------------------------------------------
  wageBill(club) { return club.squad.reduce((s, p) => s + (p.wage || 0), 0); },
  wageRoom(club) { return (club.wageBudget || 0) - this.wageBill(club); },

  // ---- negotiation bookkeeping ----------------------------------------------
  neg(state, id) {
    if (!state.negotiations) state.negotiations = {};
    if (!state.negotiations[id]) state.negotiations[id] = { attempts: 0, locked: false };
    return state.negotiations[id];
  },
  attemptsLeft(state, id) { return this.MAX_ATTEMPTS - this.neg(state, id).attempts; },
  isLocked(state, id) { return !!this.neg(state, id).locked; },
  recordReject(state, id) {
    const n = this.neg(state, id);
    n.attempts++;
    if (n.attempts >= this.MAX_ATTEMPTS) n.locked = true;
    return n;
  },
  clearNeg(state, id) { if (state.negotiations) delete state.negotiations[id]; },
  clearLocks(state) { state.negotiations = {}; }, // fresh slate each window / season

  // ---- the decision ---------------------------------------------------------
  // Deterministic so a fair offer reliably works: the player accepts a wage at
  // or above their demand on a length near what they want. Off-ideal lengths
  // are refused outright (too long / too short), and a longer-than-ideal deal
  // nudges the required wage up a little.
  evaluate(p, wage, years) {
    const ideal = this.idealLength(p.age);
    if (years > ideal + 2) return { accepted: false, reason: "tooLong", ideal };
    if (years < Math.max(1, ideal - 2)) return { accepted: false, reason: "tooShort", ideal };
    const demand = this.wageDemand(p);
    const reqWage = Math.round(demand * (1 + Math.max(0, years - ideal) * 0.06));
    if (wage < reqWage) return { accepted: false, reason: "wage", reqWage, demand };
    return { accepted: true, reqWage, demand };
  },

  // ---- contract lifecycle ---------------------------------------------------
  ensurePlayer(p) {
    if (typeof p.wage !== "number") p.wage = this.wageDemand(p);
    if (typeof p.contractLeft !== "number") p.contractLeft = 2 + Math.floor(Math.random() * 4); // 2–5 seasons
    if (typeof p.contractYears !== "number") p.contractYears = p.contractLeft;
  },

  ensure(state) {
    if (!state.negotiations) state.negotiations = {};
    const club = state.clubs.find(c => c.id === state.clubId);
    if (!club) return;
    club.squad.forEach(p => this.ensurePlayer(p));
    if (typeof club.wageBudget !== "number") {
      // Start with the current wage bill plus ~25% headroom to do business.
      const bill = this.wageBill(club);
      club.wageBudget = Math.max(60, Math.round(bill * 1.25 / 5) * 5);
    }
  },

  // Give a signed player their agreed terms (used by every signing path).
  applyContract(player, wage, years) {
    player.wage = Math.round(wage);
    player.contractYears = years;
    player.contractLeft = years;
  },

  // Season tick for the user's club: run every contract down a year; anyone who
  // hits zero leaves on a free. Returns the departures for the season-end news.
  seasonRollover(state) {
    const club = state.clubs.find(c => c.id === state.clubId);
    this.clearLocks(state);
    if (!club) return [];
    const gone = [];
    club.squad = club.squad.filter(p => {
      this.ensurePlayer(p);
      p.contractLeft -= 1;
      if (p.contractLeft <= 0) { gone.push({ name: p.name, pos: p.pos, rating: p.rating, age: p.age }); return false; }
      return true;
    });
    if (gone.length) { Market.guardMinimum(club); club.lineup = null; }
    return gone;
  },

  // The board resizes the wage budget when the club changes division, and never
  // lets it sit below the current bill.
  adjustBudgetForMovement(state, promoted, relegated) {
    const club = state.clubs.find(c => c.id === state.clubId);
    if (!club) return;
    if (typeof club.wageBudget !== "number") { this.ensure(state); return; }
    if (promoted) club.wageBudget = Math.round(club.wageBudget * 1.4 / 5) * 5;
    else if (relegated) club.wageBudget = Math.round(club.wageBudget * 0.75 / 5) * 5;
    const floor = Math.round(this.wageBill(club) * 1.1 / 5) * 5;
    if (club.wageBudget < floor) club.wageBudget = floor;
  },
};
