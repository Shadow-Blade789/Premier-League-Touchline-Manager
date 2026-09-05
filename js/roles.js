/* =========================================================================
   PLFC TOUCHLINE MANAGER — PLAYER ROLES & INSTRUCTIONS
   Tap a player on the pitch to set how they play: a Positioning dial (which
   drives the pitch-coverage highlight), an On-the-ball style (short/safe vs
   direct/attacking passing), a Movement style (runs in behind vs dribbling),
   and three switches — Shoot on Sight, Press Hard, Hard Tackling. Everything is
   plain-English and optional; a player with nothing set just plays their natural
   game. Effects aggregate into the live match, so instructions genuinely change
   what happens without any number-juggling.
   `p.instr` is only stored when it differs from default (kept tiny; user club only).
   ========================================================================= */

const PlayerRoles = {
  DEFAULT: { pos: "balanced", ball: "balanced", move: "balanced", shoot: false, press: false, aggro: false },

  // Three "style" dials — each a simple 3-way choice.
  DIALS: [
    { key: "pos", label: "Positioning", opts: [
      { k: "back", label: "Stay Back", desc: "Holds position and defends first." },
      { k: "balanced", label: "Balanced", desc: "Sticks to their normal position." },
      { k: "forward", label: "Get Forward", desc: "Pushes higher to join attacks — leaves a little space behind." },
    ] },
    { key: "ball", label: "On the Ball", opts: [
      { k: "safe", label: "Keep It Simple", desc: "Short, safe passing — keeps the ball, lower risk." },
      { k: "balanced", label: "Balanced", desc: "Mixes it up as the game demands." },
      { k: "direct", label: "Play Direct", desc: "Longer, forward passes — more attacking, more turnovers." },
    ] },
    { key: "move", label: "Movement", opts: [
      { k: "behind", label: "Run in Behind", desc: "Makes runs beyond the defence for through-balls." },
      { k: "balanced", label: "Balanced", desc: "Picks their moments." },
      { k: "dribble", label: "Take Players On", desc: "Backs themselves to beat a defender — flair, but can lose it." },
    ] },
  ],
  // On/off switches.
  TOGGLES: [
    { key: "shoot", label: "Shoot on Sight", icon: "🎯", desc: "Backs themselves from distance — more long-range efforts (and the odd screamer)." },
    { key: "press", label: "Press Hard", icon: "🔥", desc: "Hounds the ball high up the pitch — wins it back sooner, but tires quicker." },
    { key: "aggro", label: "Hard Tackling", icon: "🦵", desc: "Flies into challenges, unafraid to foul — wins more balls, risks cards." },
  ],

  of(p) { return { ...this.DEFAULT, ...((p && p.instr) || {}) }; },
  _isDefault(i) { return i.pos === "balanced" && i.ball === "balanced" && i.move === "balanced" && !i.shoot && !i.press && !i.aggro; },
  isSet(p) { return !this._isDefault(this.of(p)); },
  set(p, key, val) {
    const i = this.of(p); i[key] = val;
    if (this._isDefault(i)) { delete p.instr; } else { p.instr = i; }
  },

  // Coverage zone on a vertical pitch (percent; y≈90 = own goal, attacking upward),
  // shown as a highlighted patch so you can SEE where a player will operate.
  BASE: {
    GK: [50, 90, 30, 12], CB: [50, 75, 46, 15], LB: [19, 73, 26, 22], RB: [81, 73, 26, 22],
    CDM: [50, 62, 46, 18], CM: [50, 50, 48, 26], CAM: [50, 37, 42, 22],
    LW: [19, 31, 26, 30], RW: [81, 31, 26, 30], ST: [50, 22, 36, 24],
  },
  coverage(dpos, instr) {
    const b = this.BASE[dpos] || this.BASE.CM;
    let cx = b[0], cy = b[1], w = b[2], h = b[3];
    if (instr.pos === "forward") { cy -= 13; h += 8; }
    else if (instr.pos === "back") { cy += 9; h += 5; }
    if (instr.move === "behind") { cy -= 6; h += 4; }
    if (instr.press) { cy -= 4; w += 8; h += 4; }
    if (instr.move === "dribble" || instr.ball === "direct") { w += 5; }
    return { cx: clamp(cx, 11, 89), cy: clamp(cy, 8, 92), w: clamp(w, 18, 66), h: clamp(h, 10, 54) };
  },

  // Plain-English one-liner of what a player will do (for the summary + tooltips).
  summary(p) {
    const i = this.of(p), bits = [];
    if (i.pos === "forward") bits.push("gets forward"); else if (i.pos === "back") bits.push("holds position");
    if (i.ball === "safe") bits.push("keeps it simple"); else if (i.ball === "direct") bits.push("plays direct");
    if (i.move === "behind") bits.push("runs in behind"); else if (i.move === "dribble") bits.push("takes players on");
    if (i.shoot) bits.push("shoots on sight");
    if (i.press) bits.push("presses hard");
    if (i.aggro) bits.push("tackles aggressively");
    if (!bits.length) return "Plays their natural game.";
    return bits.join(", ").replace(/^./, c => c.toUpperCase()) + ".";
  },

  // Per-side aggregate the match engine reads (built from the on-pitch XI). Only
  // players with instructions contribute; sums are clamped so a whole team of
  // instructions nudges rather than breaks the balance.
  sideEffect(onArr) {
    let att = 0, def = 0, cf = 0, ca = 0, poss = 0, press = 0, drain = 0, foul = 0;
    const shootIds = new Set(), aggroIds = new Set();
    for (const p of onArr || []) {
      const i = p.instr; if (!i) continue; const I = { ...this.DEFAULT, ...i };
      if (I.pos === "forward") { att += 0.014; def -= 0.012; }
      else if (I.pos === "back") { att -= 0.010; def += 0.013; }
      if (I.ball === "safe") { poss += 2.0; cf -= 0.02; ca -= 0.02; }
      else if (I.ball === "direct") { poss -= 2.2; cf += 0.03; ca += 0.015; }
      if (I.move === "behind") { att += 0.006; cf += 0.025; }
      else if (I.move === "dribble") { cf += 0.02; ca += 0.01; }
      if (I.press) { press += 0.02; drain += 0.03; }
      if (I.aggro) { def += 0.006; foul += 1; aggroIds.add(p.id); }
      if (I.shoot) { shootIds.add(p.id); }
    }
    const cl = (v, m) => clamp(v, -m, m);
    return {
      att: cl(att, 0.07), def: cl(def, 0.07), cf: cl(cf, 0.14), ca: cl(ca, 0.11),
      poss: cl(poss, 14), press: clamp(press, 0, 0.14), drain: clamp(drain, 0, 0.18),
      foul, shootIds, aggroIds, any: shootIds.size + aggroIds.size + Math.abs(att) + Math.abs(cf) + Math.abs(poss) > 0,
    };
  },
};
