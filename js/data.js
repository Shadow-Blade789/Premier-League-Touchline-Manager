/* =========================================================================
   PLFC TOUCHLINE MANAGER — DATA
   Club & player data for the 2026/27 Premier League season.
   Rosters are approximate first-team groups as of mid-2026 and are meant
   for gameplay, not a live transfer database — names will drift out of
   date as real windows open. Swap CLUBS below to keep it current.
   ========================================================================= */

   let _pid = 1;
   function P(name, pos, age, rating) {
     const id = "p" + (_pid++);
     const rf = Math.max(0, rating - 55);
     const ageMult =
       age < 21 ? 1.35 :
       age < 24 ? 1.2 :
       age < 29 ? 1.0 :
       age < 32 ? 0.7 :
       age < 35 ? 0.45 : 0.25;
     const value = Math.max(0.3, Math.round(Math.pow(rf, 1.7) * ageMult * 0.16 * 10) / 10);
     const wage = Math.max(3, Math.round(Math.pow(rf, 1.45) * 2.6 + 4));
     return {
       id, name, pos, age, rating,
       value, wage,
       morale: 70 + Math.round(Math.random() * 15),
       fitness: 100,
       form: 0,
       club: null,
     };
   }
   
   // Position groups: GK, DF, MF, FW
   const RAW_CLUBS = [
     { id: "ars", name: "Arsenal", short: "ARS", nick: "The Gunners", city: "London", stadium: "Emirates Stadium", colors: ["#EF0107", "#FFFFFF"], tier: 5,
       squad: [
         P("David Raya", "GK", 31, 86), P("Karl Hein", "GK", 24, 67),
         P("William Saliba", "DF", 25, 88), P("Gabriel Magalhães", "DF", 28, 86), P("Jurrien Timber", "DF", 25, 84), P("Ben White", "DF", 28, 83), P("Riccardo Calafiori", "DF", 24, 82), P("Myles Lewis-Skelly", "DF", 20, 78),
         P("Declan Rice", "MF", 27, 88), P("Martin Ødegaard", "MF", 27, 87), P("Mikel Merino", "MF", 30, 80), P("Eberechi Eze", "MF", 28, 84), P("Christian Nørgaard", "MF", 31, 76),
         P("Bukayo Saka", "FW", 24, 89), P("Gabriel Martinelli", "FW", 25, 82), P("Kai Havertz", "FW", 27, 83), P("Viktor Gyökeres", "FW", 28, 86), P("Leandro Trossard", "FW", 31, 80),
       ]},
     { id: "mci", name: "Manchester City", short: "MCI", nick: "Citizens", city: "Manchester", stadium: "Etihad Stadium", colors: ["#6CABDD", "#1C2C5B"], tier: 5,
       squad: [
         P("Ederson", "GK", 32, 85), P("Stefan Ortega", "GK", 33, 76),
         P("Rúben Dias", "DF", 29, 87), P("John Stones", "DF", 32, 81), P("Joško Gvardiol", "DF", 24, 85), P("Nathan Aké", "DF", 31, 79), P("Abdukodir Khusanov", "DF", 22, 78),
         P("Rodri", "MF", 30, 89), P("İlkay Gündoğan", "MF", 35, 80), P("Bernardo Silva", "MF", 31, 86), P("Phil Foden", "MF", 26, 87), P("Mateo Kovačić", "MF", 32, 77),
         P("Erling Haaland", "FW", 26, 91), P("Jérémy Doku", "FW", 24, 84), P("Savinho", "FW", 22, 81), P("Omar Marmoush", "FW", 27, 82), P("Oscar Bobb", "FW", 22, 77),
       ]},
     { id: "mun", name: "Manchester United", short: "MUN", nick: "Red Devils", city: "Manchester", stadium: "Old Trafford", colors: ["#DA291C", "#FBE122"], tier: 5,
       squad: [
         P("André Onana", "GK", 30, 79), P("Altay Bayındır", "GK", 28, 73),
         P("Lisandro Martínez", "DF", 28, 83), P("Matthijs de Ligt", "DF", 27, 83), P("Noussair Mazraoui", "DF", 28, 78), P("Diogo Dalot", "DF", 27, 79), P("Luke Shaw", "DF", 30, 78),
         P("Bruno Fernandes", "MF", 32, 86), P("Manuel Ugarte", "MF", 25, 79), P("Kobbie Mainoo", "MF", 21, 80), P("Casemiro", "MF", 34, 75),
         P("Bryan Mbeumo", "FW", 26, 84), P("Matheus Cunha", "FW", 27, 83), P("Rasmus Højlund", "FW", 23, 78), P("Alejandro Garnacho", "FW", 22, 80), P("Mason Mount", "FW", 27, 76), P("Amad Diallo", "FW", 24, 79),
       ]},
     { id: "avl", name: "Aston Villa", short: "AVL", nick: "The Villans", city: "Birmingham", stadium: "Villa Park", colors: ["#95BFE5", "#670E36"], tier: 4,
       squad: [
         P("Emiliano Martínez", "GK", 33, 84),
         P("Ezri Konsa", "DF", 28, 81), P("Pau Torres", "DF", 28, 80), P("Lucas Digne", "DF", 32, 77), P("Matty Cash", "DF", 28, 76),
         P("Boubacar Kamara", "MF", 25, 81), P("John McGinn", "MF", 31, 80), P("Youri Tielemans", "MF", 29, 79), P("Amadou Onana", "MF", 24, 80),
         P("Ollie Watkins", "FW", 29, 85), P("Morgan Rogers", "FW", 23, 82), P("Donyell Malen", "FW", 27, 77), P("Jhon Durán", "FW", 22, 78),
       ]},
     { id: "liv", name: "Liverpool", short: "LIV", nick: "The Reds", city: "Liverpool", stadium: "Anfield", colors: ["#C8102E", "#F6EB61"], tier: 5,
       squad: [
         P("Alisson", "GK", 33, 86), P("Giorgi Mamardashvili", "GK", 25, 78),
         P("Virgil van Dijk", "DF", 34, 84), P("Ibrahima Konaté", "DF", 27, 83), P("Jeremie Frimpong", "DF", 25, 81), P("Andy Robertson", "DF", 32, 78), P("Milos Kerkez", "DF", 22, 79),
         P("Ryan Gravenberch", "MF", 24, 84), P("Alexis Mac Allister", "MF", 27, 84), P("Dominik Szoboszlai", "MF", 25, 83), P("Wataru Endo", "MF", 33, 74),
         P("Mohamed Salah", "FW", 34, 88), P("Florian Wirtz", "FW", 23, 87), P("Hugo Ekitiké", "FW", 24, 83), P("Cody Gakpo", "FW", 27, 81), P("Alexander Isak", "FW", 27, 87),
       ]},
     { id: "bou", name: "Bournemouth", short: "BOU", nick: "The Cherries", city: "Bournemouth", stadium: "Dean Court", colors: ["#DA291C", "#000000"], tier: 3,
       squad: [
         P("Đorđe Petrović", "GK", 26, 78),
         P("Marcos Senesi", "DF", 28, 78), P("James Hill", "DF", 24, 73), P("Adam Smith", "DF", 35, 70), P("Julián Araujo", "DF", 24, 75),
         P("Ryan Christie", "MF", 31, 76), P("Alex Scott", "MF", 22, 76), P("Tyler Adams", "MF", 27, 75), P("David Brooks", "MF", 28, 73),
         P("Antoine Semenyo", "FW", 26, 80), P("Evanilson", "FW", 26, 78), P("Justin Kluivert", "FW", 27, 78),
       ]},
     { id: "sun", name: "Sunderland", short: "SUN", nick: "The Black Cats", city: "Sunderland", stadium: "Stadium of Light", colors: ["#EB172B", "#FFFFFF"], tier: 2,
       squad: [
         P("Anthony Patterson", "GK", 24, 75),
         P("Dan Ballard", "DF", 26, 75), P("Trai Hume", "DF", 23, 75), P("Dennis Cirkin", "DF", 24, 73), P("Reinildo Mandava", "DF", 32, 73),
         P("Dan Neil", "MF", 24, 75), P("Chris Rigg", "MF", 19, 77), P("Patrick Roberts", "MF", 29, 73), P("Granit Xhaka", "MF", 33, 78),
         P("Wilson Isidor", "FW", 25, 75), P("Eliezer Mayenda", "FW", 21, 73), P("Romaine Mundle", "FW", 23, 71),
       ]},
     { id: "bha", name: "Brighton & Hove Albion", short: "BHA", nick: "The Seagulls", city: "Brighton", stadium: "Falmer Stadium", colors: ["#0057B8", "#FFFFFF"], tier: 3,
       squad: [
         P("Bart Verbruggen", "GK", 23, 79),
         P("Lewis Dunk", "DF", 34, 78), P("Jan Paul van Hecke", "DF", 25, 78), P("Tariq Lamptey", "DF", 25, 75), P("Pervis Estupiñán", "DF", 28, 78),
         P("Carlos Baleba", "MF", 22, 82), P("Mats Wieffer", "MF", 26, 78), P("Yankuba Minteh", "MF", 21, 78), P("Kaoru Mitoma", "MF", 28, 80),
         P("Danny Welbeck", "FW", 35, 76), P("Stefanos Tzimas", "FW", 20, 73), P("Ferdi Kadıoğlu", "FW", 26, 76),
       ]},
     { id: "new", name: "Newcastle United", short: "NEW", nick: "The Magpies", city: "Newcastle upon Tyne", stadium: "St James' Park", colors: ["#241F20", "#FFFFFF"], tier: 4,
       squad: [
         P("Nick Pope", "GK", 34, 82),
         P("Sven Botman", "DF", 26, 81), P("Fabian Schär", "DF", 34, 78), P("Dan Burn", "DF", 34, 77), P("Lewis Hall", "DF", 22, 78),
         P("Bruno Guimarães", "MF", 28, 86), P("Joelinton", "MF", 29, 81), P("Sandro Tonali", "MF", 26, 83),
         P("Yoane Wissa", "FW", 29, 80), P("Nick Woltemade", "FW", 24, 80), P("Anthony Gordon", "FW", 25, 82), P("Jacob Murphy", "FW", 31, 75),
       ]},
     { id: "che", name: "Chelsea", short: "CHE", nick: "The Blues", city: "London", stadium: "Stamford Bridge", colors: ["#034694", "#FFFFFF"], tier: 5,
       squad: [
         P("Robert Sánchez", "GK", 28, 79), P("Filip Jörgensen", "GK", 24, 75),
         P("Levi Colwill", "DF", 23, 81), P("Wesley Fofana", "DF", 25, 78), P("Marc Cucurella", "DF", 28, 80), P("Reece James", "DF", 27, 81), P("Trevoh Chalobah", "DF", 27, 77),
         P("Moisés Caicedo", "MF", 24, 85), P("Enzo Fernández", "MF", 25, 84), P("Romeo Lavia", "MF", 22, 78),
         P("Cole Palmer", "FW", 24, 87), P("João Pedro", "FW", 24, 81), P("Nicolas Jackson", "FW", 25, 79), P("Pedro Neto", "FW", 26, 80), P("Liam Delap", "FW", 23, 78),
       ]},
     { id: "nfo", name: "Nottingham Forest", short: "NFO", nick: "The Tricky Trees", city: "Nottingham", stadium: "The City Ground", colors: ["#DD0000", "#FFFFFF"], tier: 3,
       squad: [
         P("Matz Sels", "GK", 33, 80),
         P("Murillo", "DF", 23, 80), P("Nikola Milenković", "DF", 28, 80), P("Neco Williams", "DF", 24, 76), P("Ola Aina", "DF", 29, 77),
         P("Morgan Gibbs-White", "MF", 25, 82), P("Elliot Anderson", "MF", 24, 78), P("Ibrahim Sangaré", "MF", 28, 77),
         P("Chris Wood", "FW", 35, 79), P("Callum Hudson-Odoi", "FW", 25, 76), P("Taiwo Awoniyi", "FW", 28, 77),
       ]},
     { id: "tot", name: "Tottenham Hotspur", short: "TOT", nick: "Spurs", city: "London", stadium: "Tottenham Hotspur Stadium", colors: ["#FFFFFF", "#132257"], tier: 5,
       squad: [
         P("Guglielmo Vicario", "GK", 29, 81),
         P("Cristian Romero", "DF", 27, 84), P("Micky van de Ven", "DF", 24, 82), P("Destiny Udogie", "DF", 23, 80), P("Djed Spence", "DF", 25, 73),
         P("Yves Bissouma", "MF", 29, 79), P("Rodrigo Bentancur", "MF", 28, 79), P("Pape Matar Sarr", "MF", 23, 79), P("James Maddison", "MF", 29, 81),
         P("Dominic Solanke", "FW", 28, 79), P("Brennan Johnson", "FW", 24, 78), P("Mathys Tel", "FW", 21, 76), P("Richarlison", "FW", 29, 76),
       ]},
     { id: "eve", name: "Everton", short: "EVE", nick: "The Toffees", city: "Liverpool", stadium: "Hill Dickinson Stadium", colors: ["#003399", "#FFFFFF"], tier: 3,
       squad: [
         P("Jordan Pickford", "GK", 32, 83),
         P("Jarrad Branthwaite", "DF", 24, 81), P("James Tarkowski", "DF", 33, 77), P("Vitaliy Mykolenko", "DF", 27, 76), P("Nathan Patterson", "DF", 24, 73),
         P("Idrissa Gueye", "MF", 36, 73), P("James Garner", "MF", 25, 75), P("Abdoulaye Doucouré", "MF", 33, 75),
         P("Dominic Calvert-Lewin", "FW", 29, 73), P("Iliman Ndiaye", "FW", 25, 79), P("Beto", "FW", 27, 75),
       ]},
     { id: "cry", name: "Crystal Palace", short: "CRY", nick: "The Eagles", city: "London", stadium: "Selhurst Park", colors: ["#1B458F", "#C4122E"], tier: 3,
       squad: [
         P("Dean Henderson", "GK", 29, 80),
         P("Marc Guéhi", "DF", 25, 81), P("Maxence Lacroix", "DF", 25, 79), P("Tyrick Mitchell", "DF", 26, 78), P("Daniel Muñoz", "DF", 30, 77),
         P("Adam Wharton", "MF", 22, 81), P("Will Hughes", "MF", 30, 75), P("Cheick Doucouré", "MF", 26, 76),
         P("Jean-Philippe Mateta", "FW", 28, 79), P("Ismaila Sarr", "FW", 27, 77), P("Yeremy Pino", "FW", 23, 75),
       ]},
     { id: "ful", name: "Fulham", short: "FUL", nick: "The Cottagers", city: "London", stadium: "Craven Cottage", colors: ["#FFFFFF", "#000000"], tier: 3,
       squad: [
         P("Bernd Leno", "GK", 34, 80),
         P("Calvin Bassey", "DF", 25, 76), P("Joachim Andersen", "DF", 29, 79), P("Antonee Robinson", "DF", 28, 78), P("Kenny Tete", "DF", 30, 74),
         P("Sander Berge", "MF", 27, 76), P("Emile Smith Rowe", "MF", 25, 76), P("Harrison Reed", "MF", 30, 72),
         P("Rodrigo Muniz", "FW", 25, 76), P("Alex Iwobi", "FW", 29, 79), P("Raúl Jiménez", "FW", 35, 73),
       ]},
     { id: "bre", name: "Brentford", short: "BRE", nick: "The Bees", city: "London", stadium: "Gtech Community Stadium", colors: ["#E30613", "#FFFFFF"], tier: 3,
       squad: [
         P("Mark Flekken", "GK", 32, 76),
         P("Nathan Collins", "DF", 24, 79), P("Ethan Pinnock", "DF", 32, 76), P("Rico Henry", "DF", 28, 76), P("Aaron Hickey", "DF", 23, 75),
         P("Jordan Henderson", "MF", 36, 77), P("Mathias Jensen", "MF", 30, 76), P("Vitaly Janelt", "MF", 27, 74),
         P("Kevin Schade", "FW", 24, 78), P("Igor Thiago", "FW", 24, 76), P("Fábio Carvalho", "FW", 23, 74),
       ]},
     { id: "lee", name: "Leeds United", short: "LEE", nick: "The Whites", city: "Leeds", stadium: "Elland Road", colors: ["#FFFFFF", "#1D428A"], tier: 2,
       squad: [
         P("Lucas Perri", "GK", 27, 78),
         P("Pascal Struijk", "DF", 26, 76), P("Joe Rodon", "DF", 28, 76), P("Ethan Ampadu", "DF", 25, 78), P("Jayden Bogle", "DF", 25, 74),
         P("Ilia Gruev", "MF", 25, 75), P("Brenden Aaronson", "MF", 25, 75), P("Largie Ramazani", "MF", 25, 73),
         P("Joel Piroe", "FW", 26, 76), P("Lukas Nmecha", "FW", 27, 73), P("Daniel James", "FW", 28, 74),
       ]},
     { id: "cov", name: "Coventry City", short: "COV", nick: "The Sky Blues", city: "Coventry", stadium: "Coventry Building Society Arena", colors: ["#78D0F2", "#000000"], tier: 1,
       squad: [
         P("Bradley Collins", "GK", 31, 72),
         P("Bobby Thomas", "DF", 24, 71), P("Joel Latibeaudiere", "DF", 25, 71), P("Jake Bidwell", "DF", 33, 68), P("Jay Dasilva", "DF", 28, 69),
         P("Ben Sheaf", "MF", 26, 71), P("Josh Eccles", "MF", 25, 70), P("Tatsuhiro Sakamoto", "MF", 28, 72),
         P("Haji Wright", "FW", 28, 74), P("Ellis Simms", "FW", 24, 71), P("Jack Rudoni", "FW", 24, 70),
       ]},
     { id: "ips", name: "Ipswich Town", short: "IPS", nick: "The Tractor Boys", city: "Ipswich", stadium: "Portman Road", colors: ["#1D4290", "#FFFFFF"], tier: 1,
       squad: [
         P("Arijanet Muric", "GK", 27, 73),
         P("Jacob Greaves", "DF", 25, 73), P("Cameron Burgess", "DF", 30, 70), P("Leif Davis", "DF", 26, 74), P("Axel Tuanzebe", "DF", 28, 69),
         P("Sam Morsy", "MF", 34, 72), P("Jens Cajuste", "MF", 26, 71), P("Massimo Luongo", "MF", 33, 68),
         P("George Hirst", "FW", 26, 72), P("Omari Hutchinson", "FW", 22, 76), P("Kayden Jackson", "FW", 31, 67),
       ]},
     { id: "hul", name: "Hull City", short: "HUL", nick: "The Tigers", city: "Hull", stadium: "MKM Stadium", colors: ["#F18A01", "#000000"], tier: 1,
       squad: [
         P("Ivor Pandur", "GK", 24, 71),
         P("Sean McLoughlin", "DF", 28, 70), P("Alfie Jones", "DF", 26, 69), P("Lewie Coyle", "DF", 29, 70), P("Liam Millar", "DF", 26, 69),
         P("Jean Michael Seri", "MF", 34, 73), P("Regan Slater", "MF", 25, 70), P("Ozan Tufan", "MF", 31, 71),
         P("Mason Burstow", "FW", 22, 70), P("Abu Kamara", "FW", 22, 71), P("Anwar El Ghazi", "FW", 30, 69),
       ]},
   ];
   
   // Attach club reference & ids onto players
   const CLUBS = RAW_CLUBS.map(c => {
     c.squad.forEach(p => { p.club = c.id; });
     c.crestInitials = c.short;
     return c;
   });
   
   function clubById(id) { return CLUBS.find(c => c.id === id); }
   
   // A rotating pool of real lower-league club names used as future promoted
   // sides once the initial 2026/27 promotions have been played out.
   const FEEDER_CLUBS_POOL = [
     "Leicester City", "Southampton", "Norwich City", "Middlesbrough",
     "West Bromwich Albion", "Stoke City", "Sheffield United", "Watford",
     "West Ham United", "Burnley", "Wolverhampton Wanderers", "Preston North End",
     "Blackburn Rovers", "Swansea City", "Cardiff City", "Millwall",
   ];
   
   // Free-agent / fringe-player name pool for the rolling transfer market.
   const FIRST_NAMES = ["Jack","Tom","Harry","Luke","Sam","Josh","Connor","Liam","Ryan","Callum","Marcus","Lewis","Owen","Ethan","Mason","Jamie","Aaron","Kyle","Reece","Bradley","Theo","Charlie","Dylan","Ben","Will","Adam","Joe","Max","Nathan","Dan"];
   const LAST_NAMES = ["Walker","Hughes","Foster","Bennett","Sutton","Marshall","Hayes","Pearce","Russell","Bishop","Carter","Wells","Holloway","Mercer","Doyle","Kerr","Fletcher","Lowe","Whitfield","Sharpe","Donnelly","Bartley","Quinn","Hartley","Stokes","Vine","Crouch","Dunne","Mabey","Sinclair"];
   
   function randomName() {
     const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
     const l = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
     return f + " " + l;
   }
   
   const POSITIONS = ["GK", "DF", "MF", "FW"];
   
   // Formation definitions: required counts per outfield role group.
   const FORMATIONS = {
     "4-4-2": { GK: 1, DF: 4, MF: 4, FW: 2 },
     "4-3-3": { GK: 1, DF: 4, MF: 3, FW: 3 },
     "4-2-3-1": { GK: 1, DF: 4, MF: 5, FW: 1 },
     "3-5-2": { GK: 1, DF: 3, MF: 5, FW: 2 },
     "5-3-2": { GK: 1, DF: 5, MF: 3, FW: 2 },
     "4-5-1": { GK: 1, DF: 4, MF: 5, FW: 1 },
   };
   
   // Pitch coordinate presets (percent of pitch width/height) for each formation,
   // used to lay starters out visually on the tactics board.
   const FORMATION_LAYOUT = {
     "4-4-2": [
       [50,92],
       [18,72],[38,75],[62,75],[82,72],
       [16,48],[38,52],[62,52],[84,48],
       [38,22],[62,22],
     ],
     "4-3-3": [
       [50,92],
       [18,72],[38,75],[62,75],[82,72],
       [30,50],[50,55],[70,50],
       [22,22],[50,18],[78,22],
     ],
     "4-2-3-1": [
       [50,92],
       [18,72],[38,75],[62,75],[82,72],
       [38,58],[62,58],
       [22,32],[50,28],[78,32],
       [50,14],
     ],
     "3-5-2": [
       [50,92],
       [28,74],[50,78],[72,74],
       [12,50],[34,52],[50,56],[66,52],[88,50],
       [38,22],[62,22],
     ],
     "5-3-2": [
       [50,92],
       [10,68],[28,74],[50,78],[72,74],[90,68],
       [32,48],[50,52],[68,48],
       [38,22],[62,22],
     ],
     "4-5-1": [
       [50,92],
       [18,72],[38,75],[62,75],[82,72],
       [12,48],[32,52],[50,56],[68,52],[88,48],
       [50,18],
     ],
   };