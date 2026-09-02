/* =========================================================================
   PLFC TOUCHLINE MANAGER — TEAM TACTICS
   Two dials the manager actually feels in the match engine: MENTALITY shifts the
   balance between attack and defence, PRESSING trades chances (both ways) and
   stamina for control. Set them before kickoff on the lineup screen and change
   them mid-match from the touchline. They apply to the managed club's side; the
   opponent plays it straight (AI tactical identities come later).
   ========================================================================= */

const Tactics = {
  MENTALITY: [
    { k: "very-defensive", label: "Very Defensive", short: "V.Def", att: 0.85, def: 1.12, desc: "Sit deep, soak pressure, hit on the break." },
    { k: "defensive",      label: "Defensive",      short: "Def",   att: 0.93, def: 1.06, desc: "Solid and cautious — safety first." },
    { k: "balanced",       label: "Balanced",       short: "Bal",   att: 1.0,  def: 1.0,  desc: "An even shape between the boxes." },
    { k: "attacking",      label: "Attacking",      short: "Att",   att: 1.08, def: 0.94, desc: "Commit bodies forward, take a few risks." },
    { k: "very-attacking", label: "Very Attacking", short: "V.Att", att: 1.15, def: 0.86, desc: "All-out attack — thrilling and dangerous." },
  ],
  PRESSING: [
    { k: "low",    label: "Low Press",    short: "Low",  chance: 0.9,  drain: 0.85, desc: "Conserve energy, keep your shape." },
    { k: "medium", label: "Medium Press", short: "Med",  chance: 1.0,  drain: 1.0,  desc: "A measured press." },
    { k: "high",   label: "High Press",   short: "High", chance: 1.14, drain: 1.28, desc: "Hunt the ball high — end-to-end, but tiring." },
  ],

  ensure(club) {
    if (!club.tactics) club.tactics = {};
    if (!this.MENTALITY.some(m => m.k === club.tactics.mentality)) club.tactics.mentality = "balanced";
    if (!this.PRESSING.some(p => p.k === club.tactics.pressing)) club.tactics.pressing = "medium";
  },
  ment(club) { return this.MENTALITY.find(m => m.k === (club.tactics && club.tactics.mentality)) || this.MENTALITY[2]; },
  press(club) { return this.PRESSING.find(p => p.k === (club.tactics && club.tactics.pressing)) || this.PRESSING[1]; },
  drainMult(club) { return club && club.tactics ? this.press(club).drain : 1; },
  summary(club) { return `${this.ment(club).label} · ${this.press(club).label}`; },
};
