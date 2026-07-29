/* =========================================================================
   PLFC TOUCHLINE MANAGER — RECRUITMENT / SCOUTING
   Send talent scouts out to look for a TYPE of player (a position + a profile:
   young prospect, proven quality, or budget bargain). A few matchweeks later
   the scout returns a shortlist of real, signable targets. Better scouts come
   back faster, with more names, of higher quality — AND with a signing discount
   (their relationships get the deal done cheaper). Reports sit in the Scouting
   panel until you sign them (window permitting) or dismiss them; you never have
   to touch it if you don't want to. Only the user's club scouts.
   ========================================================================= */

const SCOUT_CAP = 3;
let _scoutId = 1, _repId = 1, _scListId = 1;

function makeScout(rating) {
  const { name } = randomProspect();
  return { id: "sct" + (_scoutId++), name, rating: Math.max(40, Math.min(96, Math.round(rating))), busyUntil: null, assignment: null };
}

// A generated find whose ceiling scales with the scout's quality — this is
// where a great scout unearths a gem an average one never would.
function scoutProspect(pos, profile, rating) {
  const { name, nat } = randomProspect();
  let age, rtg, pot;
  if (profile === "prospect") {
    age = 16 + Math.floor(Math.random() * 5);            // 16–20
    rtg = clamp(50 + Math.floor(Math.random() * 10), 46, 66);
    pot = clamp(rating - 6 + Math.floor(Math.random() * 20), 64, 96);
  } else if (profile === "bargain") {
    age = 26 + Math.floor(Math.random() * 7);            // 26–32
    rtg = clamp(58 + Math.floor(Math.random() * 10), 55, 74);
    pot = rtg;
  } else {                                                // proven quality
    age = 23 + Math.floor(Math.random() * 7);            // 23–29
    rtg = clamp(rating - 8 + Math.floor(Math.random() * 14), 66, 90);
    pot = Math.max(rtg, rtg + (age < 24 ? Math.floor(Math.random() * 4) : 0));
  }
  const p = P(name, pos, age, rtg, { nat, potential: pot });
  p.club = null;
  return p;
}

const Scouting = {
  CAP: 3, // most talent scouts you can hold at once
  PROFILES: [
    { key: "star",     label: "Proven quality", hint: "ready-made first-teamers" },
    { key: "prospect", label: "Young prospect", hint: "high-ceiling teenagers" },
    { key: "bargain",  label: "Budget bargain", hint: "value-for-money signings" },
  ],
  profileLabel(key) { const p = this.PROFILES.find(x => x.key === key); return p ? p.label : key; },

  // Assignment length, number of names, and the signing discount all improve
  // with the scout's rating.
  duration(rating) { return rating >= 80 ? 2 : rating >= 62 ? 3 : 4; },
  yieldCount(rating) { return rating >= 80 ? 4 : rating >= 62 ? 3 : 2; },
  discount(rating) { return clamp((rating - 50) / 200, 0, 0.22); }, // up to ~22% off

  init(club) {
    club.scouting = { scouts: [makeScout(Coaching.tierCoachRating(club.tier))], reports: [] };
  },
  ensure(state) {
    const club = state.clubs.find(c => c.id === state.clubId);
    if (!club) return;
    if (!club.scouting) this.init(club);
    club.scouting.scouts = club.scouting.scouts || [];
    club.scouting.reports = club.scouting.reports || [];
  },

  // ---- assignments ----------------------------------------------------------
  assign(state, scoutId, pos, profile) {
    this.ensure(state);
    const club = Game.myClub();
    const sc = club.scouting.scouts.find(s => s.id === scoutId);
    if (!sc) return { ok: false, reason: "That scout is no longer on your books." };
    if (sc.busyUntil != null) return { ok: false, reason: "That scout is already out on assignment." };
    if (!POSITIONS.includes(pos)) return { ok: false, reason: "Pick a position to scout." };
    if (!this.PROFILES.find(p => p.key === profile)) profile = "star";
    sc.assignment = { pos, profile };
    sc.busyUntil = state.week + this.duration(sc.rating);
    return { ok: true, name: sc.name, pos, profile, weeks: sc.busyUntil - state.week };
  },

  // Pull a scout back early — the assignment is scrapped, no report.
  recall(state, scoutId) {
    const club = Game.myClub();
    const sc = club.scouting && club.scouting.scouts.find(s => s.id === scoutId);
    if (!sc || sc.busyUntil == null) return { ok: false };
    sc.busyUntil = null; sc.assignment = null;
    return { ok: true, name: sc.name };
  },

  // ---- weekly tick: scouts return with reports ------------------------------
  weekly(state) {
    const club = state.clubs.find(c => c.id === state.clubId);
    state.scoutNews = [];
    if (!club || !club.scouting) return;
    const s = club.scouting;
    s.scouts = s.scouts || []; s.reports = s.reports || [];
    s.scouts.forEach(sc => {
      if (sc.busyUntil != null && state.week >= sc.busyUntil && sc.assignment) {
        const briefPos = sc.assignment.pos;
        const rep = this.buildReport(state, sc);
        sc.busyUntil = null; sc.assignment = null;
        if (rep) {
          s.reports.unshift(rep);
          state.scoutNews.push(`🔎 ${sc.name} returns with ${rep.candidates.length} ${rep.pos} target${rep.candidates.length === 1 ? "" : "s"} (${this.profileLabel(rep.profile)})`);
        } else {
          state.scoutNews.push(`🔎 ${sc.name} came back empty-handed — no ${briefPos} fitting the brief`);
        }
      }
    });
    if (s.reports.length > 6) s.reports.length = 6; // hold the six most recent
  },

  buildReport(state, scout) {
    const { pos, profile } = scout.assignment;
    const candidates = this.buildCandidates(state, pos, profile, scout.rating);
    if (!candidates.length) return null;
    return {
      id: "rep" + (_repId++), scoutId: scout.id, scoutName: scout.name,
      pos, profile, rating: scout.rating, discount: this.discount(scout.rating),
      week: state.week, candidates,
    };
  },

  // Build a shortlist mixing real rival players with a generated find or two;
  // a stronger scout's noise is smaller, so the genuinely best fits rise up.
  buildCandidates(state, pos, profile, rating) {
    const n = this.yieldCount(rating);
    const disc = this.discount(rating);

    const fit = p => {
      if (profile === "prospect") return (p.age <= 21 ? 1 : 0.2) * (p.potential - p.rating + 8) + (p.wonderkid ? 20 : 0) - Math.max(0, p.age - 21) * 3;
      if (profile === "bargain") return p.rating - p.value * 0.9;
      return p.rating + (p.age < 30 ? 4 : 0); // star: proven quality
    };
    const noise = () => Math.random() * (40 - rating * 0.35); // shrinks as rating rises

    // Real, sellable rival players of this position (skip a club's only keeper).
    const real = [];
    state.clubs.forEach(club => {
      if (club.id === state.clubId || club.strengthOnly) return;
      const keepers = club.squad.filter(p => p.pos === "GK").length;
      club.squad.forEach(p => {
        if (p.pos !== pos) return;
        if (pos === "GK" && keepers <= 1) return;
        real.push({ player: p, club });
      });
    });
    real.sort((a, b) => (fit(b.player) + noise()) - (fit(a.player) + noise()));

    const wantReal = Math.min(real.length, Math.max(1, Math.round(n * 0.6)));
    const out = [];
    for (let i = 0; i < wantReal; i++) {
      const { player, club } = real[i];
      const base = Market.listingFromExisting(player, club);
      out.push(this.decorate(base, disc));
    }
    // Fill the rest with generated finds (ceiling scaled by the scout).
    while (out.length < n) {
      const p = scoutProspect(pos, profile, rating);
      const markup = 0.9 + Math.random() * 0.35;
      out.push(this.decorate({
        listingId: null, player: p, origin: null,
        originName: p.age <= 20 ? "Unattached prospect" : "Free agent",
        price: Math.max(0.3, Math.round(p.value * markup * 10) / 10),
      }, disc));
    }
    return out;
  },

  // Turn a market-style listing into a scouted candidate with its own id and
  // the discount baked into the fee (original fee kept for the UI).
  decorate(listing, disc) {
    const full = listing.price;
    const price = Math.max(0.2, Math.round(full * (1 - disc) * 10) / 10);
    return { ...listing, listingId: "sc" + (_scListId++), scouted: true, fullPrice: full, price };
  },

  // ---- signing a scouted target ---------------------------------------------
  sign(state, reportId, listingId) {
    if (!TransferWindow.isOpen(state.week)) return { ok: false, reason: "The transfer window is closed — the target will keep." };
    const club = Game.myClub();
    const rep = (club.scouting.reports || []).find(r => r.id === reportId);
    if (!rep) return { ok: false, reason: "That report has expired." };
    const ci = rep.candidates.findIndex(c => c.listingId === listingId);
    if (ci === -1) return { ok: false, reason: "That target is no longer listed." };
    const cand = rep.candidates[ci];
    if (club.squad.length >= 32) return { ok: false, reason: "Your squad is full (32 players max)." };
    if (club.budget < cand.price) return { ok: false, reason: "Not enough budget for this deal." };
    if (Contracts.wageRoom(club) < (cand.player.wage || 0)) return { ok: false, reason: "Not enough room in your wage budget." };

    // A real target may have moved on since the report landed.
    if (cand.origin) {
      const originClub = state.clubs.find(c => c.id === cand.origin);
      const stillThere = originClub && originClub.squad.find(p => p.id === cand.player.id);
      if (!stillThere) {
        rep.candidates.splice(ci, 1);
        if (!rep.candidates.length) this.dropReport(club, reportId);
        return { ok: false, reason: `${cand.player.name} has already moved on.` };
      }
      originClub.squad = originClub.squad.filter(p => p.id !== cand.player.id);
      Market.guardMinimum(originClub);
      originClub.lineup = null;
      // Remove them from the open market too, if listed there.
      state.market = (state.market || []).filter(l => l.player.id !== cand.player.id);
    }

    club.budget = Math.round((club.budget - cand.price) * 10) / 10;
    Stats.ensure(cand.player);
    const player = { ...cand.player, club: club.id, transferListed: false, offers: [], stats: { ...cand.player.stats }, bonus: { ...cand.player.bonus }, career: { ...cand.player.career } };
    Contracts.applyContract(player, cand.player.wage || Contracts.wageDemand(cand.player), Contracts.idealLength(cand.player.age));
    club.squad.push(player);
    club.lineup = null;

    rep.candidates.splice(ci, 1);
    if (!rep.candidates.length) this.dropReport(club, reportId);
    return { ok: true, name: cand.player.name, price: cand.price, origin: cand.originName };
  },

  dismiss(state, reportId) {
    const club = Game.myClub();
    return this.dropReport(club, reportId) ? { ok: true } : { ok: false };
  },
  dropReport(club, reportId) {
    const reps = club.scouting.reports || [];
    const i = reps.findIndex(r => r.id === reportId);
    if (i === -1) return false;
    reps.splice(i, 1);
    return true;
  },

  // New season: scrap outstanding reports and recall anyone still out, so you
  // start each campaign with a clean slate (scouts themselves stay on staff).
  seasonRollover(state) {
    const club = state.clubs.find(c => c.id === state.clubId);
    if (!club || !club.scouting) return;
    club.scouting.reports = [];
    (club.scouting.scouts || []).forEach(sc => { sc.busyUntil = null; sc.assignment = null; });
  },
};
