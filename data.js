/* ============================================================================
   PLFC TOUCHLINE MANAGER
   data.js
   Part 1 - Core Data
============================================================================ */

// Positions used throughout the game
const POSITIONS = ["GK", "DF", "MF", "FW"];

// -------------------------------------------------------
// FORMATIONS
// -------------------------------------------------------

const FORMATIONS = {
    "4-4-2": {
        GK: 1,
        DF: 4,
        MF: 4,
        FW: 2
    },

    "4-3-3": {
        GK: 1,
        DF: 4,
        MF: 3,
        FW: 3
    },

    "4-2-3-1": {
        GK: 1,
        DF: 4,
        MF: 5,
        FW: 1
    },

    "3-5-2": {
        GK: 1,
        DF: 3,
        MF: 5,
        FW: 2
    },

    "5-3-2": {
        GK: 1,
        DF: 5,
        MF: 3,
        FW: 2
    }
};

// -------------------------------------------------------
// Pitch Layout Coordinates
// x%, y%
// -------------------------------------------------------

const FORMATION_LAYOUT = {

    "4-4-2": [
        [50,92],

        [18,74],
        [39,74],
        [61,74],
        [82,74],

        [18,50],
        [39,50],
        [61,50],
        [82,50],

        [35,22],
        [65,22]
    ],

    "4-3-3": [
        [50,92],

        [18,74],
        [39,74],
        [61,74],
        [82,74],

        [30,50],
        [50,42],
        [70,50],

        [20,18],
        [50,10],
        [80,18]
    ],

    "4-2-3-1": [
        [50,92],

        [18,74],
        [39,74],
        [61,74],
        [82,74],

        [38,56],
        [62,56],

        [22,34],
        [50,28],
        [78,34],

        [50,10]
    ],

    "3-5-2": [
        [50,92],

        [28,74],
        [50,74],
        [72,74],

        [12,50],
        [34,44],
        [50,38],
        [66,44],
        [88,50],

        [38,14],
        [62,14]
    ],

    "5-3-2": [
        [50,92],

        [10,74],
        [30,74],
        [50,74],
        [70,74],
        [90,74],

        [30,42],
        [50,34],
        [70,42],

        [38,12],
        [62,12]
    ]
};

// -------------------------------------------------------
// Premier League Clubs
// -------------------------------------------------------

const CLUBS = [

{
    id:"arsenal",
    name:"Arsenal",
    short:"ARS",
    crestInitials:"AFC",
    colors:["#EF0107","#FFFFFF"],
    tier:5,
    budget:180
},

{
    id:"astonvilla",
    name:"Aston Villa",
    short:"AVL",
    crestInitials:"AV",
    colors:["#670E36","#95BFE5"],
    tier:4,
    budget:95
},

{
    id:"bournemouth",
    name:"Bournemouth",
    short:"BOU",
    crestInitials:"BOU",
    colors:["#C8102E","#000000"],
    tier:3,
    budget:55
},

{
    id:"brentford",
    name:"Brentford",
    short:"BRE",
    crestInitials:"BRE",
    colors:["#D20032","#FFFFFF"],
    tier:3,
    budget:60
},

{
    id:"brighton",
    name:"Brighton",
    short:"BHA",
    crestInitials:"BHA",
    colors:["#0057B8","#FFFFFF"],
    tier:4,
    budget:80
},

{
    id:"burnley",
    name:"Burnley",
    short:"BUR",
    crestInitials:"BUR",
    colors:["#6C1D45","#99D6EA"],
    tier:2,
    budget:40
},

{
    id:"chelsea",
    name:"Chelsea",
    short:"CHE",
    crestInitials:"CFC",
    colors:["#034694","#FFFFFF"],
    tier:5,
    budget:170
},

{
    id:"crystalpalace",
    name:"Crystal Palace",
    short:"CRY",
    crestInitials:"CP",
    colors:["#1B458F","#C4122E"],
    tier:3,
    budget:55
},

{
    id:"everton",
    name:"Everton",
    short:"EVE",
    crestInitials:"EFC",
    colors:["#003399","#FFFFFF"],
    tier:3,
    budget:60
},

{
    id:"fulham",
    name:"Fulham",
    short:"FUL",
    crestInitials:"FFC",
    colors:["#FFFFFF","#000000"],
    tier:3,
    budget:50
},

{
    id:"leeds",
    name:"Leeds United",
    short:"LEE",
    crestInitials:"LU",
    colors:["#1D428A","#FFCD00"],
    tier:3,
    budget:65
},

{
    id:"liverpool",
    name:"Liverpool",
    short:"LIV",
    crestInitials:"LFC",
    colors:["#C8102E","#00B2A9"],
    tier:5,
    budget:185
},

{
    id:"mancity",
    name:"Manchester City",
    short:"MCI",
    crestInitials:"MC",
    colors:["#6CABDD","#1C2C5B"],
    tier:5,
    budget:220
},

{
    id:"manutd",
    name:"Manchester United",
    short:"MUN",
    crestInitials:"MU",
    colors:["#DA291C","#FBE122"],
    tier:5,
    budget:175
},

{
    id:"newcastle",
    name:"Newcastle United",
    short:"NEW",
    crestInitials:"NU",
    colors:["#000000","#FFFFFF"],
    tier:5,
    budget:140
},

{
    id:"nottingham",
    name:"Nottingham Forest",
    short:"NFO",
    crestInitials:"NFO",
    colors:["#DD0000","#FFFFFF"],
    tier:3,
    budget:55
},

{
    id:"sunderland",
    name:"Sunderland",
    short:"SUN",
    crestInitials:"SAFC",
    colors:["#E31837","#FFFFFF"],
    tier:2,
    budget:40
},

{
    id:"tottenham",
    name:"Tottenham",
    short:"TOT",
    crestInitials:"TH",
    colors:["#132257","#FFFFFF"],
    tier:4,
    budget:120
},

{
    id:"westham",
    name:"West Ham",
    short:"WHU",
    crestInitials:"WH",
    colors:["#7A263A","#1BB1E7"],
    tier:3,
    budget:70
},

{
    id:"wolves",
    name:"Wolverhampton",
    short:"WOL",
    crestInitials:"WOL",
    colors:["#FDB913","#231F20"],
    tier:3,
    budget:60
}

];

// -------------------------------------------------------

let PLAYER_ID = 1;

function nextPlayerID() {
    return PLAYER_ID++;
}

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function rand(min,max){
    return Math.floor(Math.random()*(max-min+1))+min;
}

function clamp(value,min,max){
    return Math.max(min,Math.min(max,value));
}

/* ============================================================================
   PLFC TOUCHLINE MANAGER
   data.js
   Part 2 - Real Stats → Simulation Ratings
============================================================================ */

/**
 * Real 2026-style performance dataset (simplified from user table)
 * Used to generate match engine strength values.
 */

const CLUB_STATS = {
  arsenal:        { gf: 67, ga: 51, poss: 56.4, yc: 51, rc: 0 },
  astonvilla:     { gf: 53, ga: 40, poss: 53.7, yc: 58, rc: 1 },
  bournemouth:    { gf: 57, ga: 35, poss: 50.1, yc: 88, rc: 2 },
  brentford:      { gf: 53, ga: 33, poss: 47.5, yc: 69, rc: 1 },
  brighton:       { gf: 51, ga: 33, poss: 53.9, yc: 86, rc: 0 },
  burnley:        { gf: 35, ga: 27, poss: 42.5, yc: 66, rc: 3 },
  chelsea:        { gf: 57, ga: 39, poss: 57.7, yc: 98, rc: 8 },
  crystalpalace:  { gf: 40, ga: 23, poss: 45.9, yc: 76, rc: 2 },
  everton:        { gf: 45, ga: 34, poss: 43.8, yc: 74, rc: 4 },
  fulham:         { gf: 43, ga: 26, poss: 51.7, yc: 75, rc: 1 },
  leeds:          { gf: 48, ga: 24, poss: 45.7, yc: 64, rc: 1 },
  liverpool:      { gf: 61, ga: 44, poss: 59.3, yc: 57, rc: 1 },
  mancity:        { gf: 74, ga: 57, poss: 60.7, yc: 67, rc: 0 },
  manutd:         { gf: 66, ga: 46, poss: 51.9, yc: 64, rc: 3 },
  newcastle:      { gf: 53, ga: 32, poss: 52.5, yc: 67, rc: 3 },
  nottingham:     { gf: 47, ga: 34, poss: 46.8, yc: 60, rc: 1 },
  sunderland:     { gf: 38, ga: 25, poss: 44.9, yc: 82, rc: 3 },
  tottenham:      { gf: 47, ga: 36, poss: 50.4, yc: 101, rc: 4 },
  westham:        { gf: 44, ga: 31, poss: 42.6, yc: 69, rc: 3 },
  wolves:         { gf: 26, ga: 18, poss: 42.8, yc: 80, rc: 3 }
};

/**
 * Convert real stats → gameplay ratings (0–100 scale)
 */
function deriveTeamRatings(clubId) {
    const s = CLUB_STATS[clubId];

    // attack strength (scaled from goals scored)
    const attack = clamp((s.gf / 75) * 100, 40, 95);

    // defense strength (inverse of goals conceded)
    const defense = clamp(100 - (s.ga / 60) * 100, 35, 92);

    // possession style affects control in match engine
    const possession = s.poss;

    // discipline affects randomness (cards = chaos)
    const discipline = clamp(100 - (s.yc / 120) * 100, 40, 95);

    return {
        attack: attack,
        defense: defense,
        possession: possession,
        discipline: discipline
    };
}

/**
 * Attach derived ratings to CLUBS at runtime
 */
function enrichClubsWithStats() {
    CLUBS.forEach(c => {
        const stats = deriveTeamRatings(c.id);
        c.stats = stats;

        // baseline squad strength influences players if needed later
        c.strength =
            (stats.attack * 0.45 +
             stats.defense * 0.40 +
             stats.possession * 0.15);
    });
}

/**
 * Call immediately so everything else can use ratings
 */
enrichClubsWithStats();

/**
 * Debug helper
 */
function getClubStrength(id) {
    const c = CLUBS.find(x => x.id === id);
    return c ? c.strength : 50;
}
