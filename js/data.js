/* =========================================================================
   PLFC TOUCHLINE MANAGER — DATA
   Club & player data for the 2026/27 Premier League season.
   Rosters are approximate first-team groups as of mid-2026 and are meant
   for gameplay, not a live transfer database — names will drift out of
   date as real windows open. Swap CLUBS below to keep it current.
   ========================================================================= */

   let _pid = 1;
   function growthRoom(age) {
     if (age <= 20) return 10 + Math.round(Math.random() * 8);   // +10..18
     if (age <= 23) return 5 + Math.round(Math.random() * 5);    // +5..10
     if (age <= 26) return 1 + Math.round(Math.random() * 4);    // +1..5
     if (age <= 29) return Math.round(Math.random() * 2);        // +0..2
     return 0;
   }
   // Every player carries a lifetime record. Since we have no real historical
   // data, seed it from rating + age + position so a 30-year-old star looks
   // like one (hundreds of apps, plenty of output) and a teenager barely
   // features yet. In-game appearances then accumulate on top of this.
   function estimateCareer(rating, age, pos) {
     const seasons = Math.max(0, Math.min(17, age - 18));
     const appsPerSeason = Math.max(6, Math.min(40, 12 + (rating - 50) * 0.65));
     const apps = Math.round(seasons * appsPerSeason * (0.8 + Math.random() * 0.4));
     const q = Math.max(0.1, Math.min(1.2, (rating - 50) / 40));
     const gpg = ({ FW: 0.42, MF: 0.18, DF: 0.05, GK: 0 })[pos] || 0;
     const apg = ({ FW: 0.15, MF: 0.30, DF: 0.08, GK: 0 })[pos] || 0;
     const csg = ({ GK: 0.30, DF: 0.28, MF: 0, FW: 0 })[pos] || 0;
     const svg = ({ GK: 2.6, DF: 0, MF: 0, FW: 0 })[pos] || 0;
     return {
       apps,
       goals: Math.round(apps * gpg * q),
       assists: Math.round(apps * apg * q),
       cleanSheets: Math.round(apps * csg),
       saves: Math.round(apps * svg * (0.7 + q * 0.3)),
     };
   }

   function P(name, pos, age, rating, opts = {}) {
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
   
     let potential = Math.min(96, rating + growthRoom(age));
     let wonderkid = false;
     if (age <= 21 && Math.random() < 0.08) {
       potential = Math.min(97, potential + 7 + Math.round(Math.random() * 8));
       wonderkid = true;
     }
     if (opts.potential != null) potential = opts.potential;
     if (opts.wonderkid != null) wonderkid = opts.wonderkid;
   
     return {
       id, name, pos, age, rating,
       potential, wonderkid,
       nat: opts.nat || "ENG",
       value, wage,
       morale: 70 + Math.round(Math.random() * 15),
       fitness: 100,
       form: 0,
       club: null,
       stats: { goals: 0, assists: 0, cleanSheets: 0, saves: 0, apps: 0 },
       bonus: { goal: 0, assist: 0, keeper: 0, defense: 0 },
       career: estimateCareer(rating, age, pos),
     };
   }
   
   // Nationality-flavoured name pools, weighted roughly like a real Premier
   // League squad sheet, used for generated free agents, academy fillers and
   // transfer-market youth prospects.
   const NATION_POOLS = {
     ENG: { first: ["Jack","Tom","Harry","Luke","Sam","Josh","Connor","Liam","Ryan","Callum","Marcus","Lewis","Owen","Ethan","Mason","Jamie","Aaron","Kyle","Reece","Bradley","Theo","Charlie","Dylan","Ben","Will","Adam","Joe","Max","Nathan","Dan"],
               last:  ["Walker","Hughes","Foster","Bennett","Sutton","Marshall","Hayes","Pearce","Russell","Bishop","Carter","Wells","Holloway","Mercer","Doyle","Kerr","Fletcher","Lowe","Whitfield","Sharpe","Donnelly","Bartley","Quinn","Hartley","Stokes","Vine","Crouch","Dunne","Mabey","Sinclair"] },
     IRL: { first: ["Conor","Aidan","Sean","Cian","Darragh","Eoin","Liam","Cormac"], last: ["Brennan","Kelly","Doyle","Walsh","Byrne","McGrath","Hogan","Nolan"] },
     FRA: { first: ["Hugo","Mathis","Lucas","Théo","Enzo","Yanis","Noah","Rayan"], last: ["Moreau","Lemaire","Girard","Caron","Rousseau","Fontaine","Bertrand","Lemoine"] },
     BRA: { first: ["Gabriel","Lucas","Matheus","Bruno","Rafael","Caio","Wesley","Igor"], last: ["Souza","Oliveira","Pereira","Costa","Almeida","Barbosa","Ribeiro","Fernandes"] },
     ESP: { first: ["Marc","Pol","Iker","Álvaro","Hugo","Mateo","Nico","Sergio"], last: ["Serrano","Navarro","Cano","Vidal","Marín","Castro","Soler","Reyes"] },
     NED: { first: ["Daan","Sem","Luuk","Bram","Finn","Milan","Noud","Stijn"], last: ["Visser","Bakker","Janssen","Smit","De Boer","Mulder","Dekker","Hendriks"] },
     NGA: { first: ["Chidi","Emeka","Tunde","Femi","Segun","Uche","Bayo","Ifeanyi"], last: ["Okafor","Adeyemi","Okoro","Eze","Balogun","Nwosu","Olawale","Chukwu"] },
     ARG: { first: ["Joaquín","Santiago","Tomás","Agustín","Nicolás","Lautaro","Mateo","Bautista"], last: ["Acosta","Romero","Cabrera","Ferreyra","Aguirre","Ledesma","Quiroga","Sosa"] },
     GER: { first: ["Finn","Luca","Jonas","Elias","Niklas","Tim","Leon","Maximilian"], last: ["Wagner","Becker","Hoffmann","Schreiber","Krüger","Lang","Vogel","Brandt"] },
     POR: { first: ["Rui","Tiago","Gonçalo","Diogo","Bernardo","André","Vasco","Nuno"], last: ["Carvalho","Pinto","Teixeira","Cardoso","Lopes","Mendes","Faria","Esteves"] },
     NOR: { first: ["Erik","Magnus","Sander","Jonas","Kristian","Markus","Henrik","Oskar"], last: ["Haugen","Berg","Larsen","Solberg","Andersen","Strand","Nilsen","Kristiansen"] },
     SEN: { first: ["Mamadou","Ibrahima","Cheikh","Pape","Ousmane","Lamine","Abdou","Moussa"], last: ["Diallo","Ndiaye","Cissé","Faye","Diop","Sow","Toure","Mbaye"] },
     JPN: { first: ["Ren","Sota","Haruto","Yuto","Kaito","Riku","Sho","Hayato"], last: ["Saito","Suzuki","Takahashi","Kobayashi","Yamamoto","Watanabe","Nakamura","Ito"] },
     USA: { first: ["Tyler","Jackson","Cole","Bryce","Mason","Dylan","Cameron","Hunter"], last: ["Brooks","Reilly","Walsh","Pulisic","Anderson","Reyna","Carter","Howard"] },
     COL: { first: ["Santiago","Andrés","Camilo","Esteban","Mateo","Juan","Sebastián","Cristian"], last: ["Quintero","Salazar","Restrepo","Mosquera","Valencia","Cuesta","Hinestroza","Mina"] },
     HRV: { first: ["Luka","Marko","Ivan","Petar","Josip","Filip","Ante","Karlo"], last: ["Horvat","Kovačić","Babić","Vuković","Jurić","Maric","Pavić","Knežević"] },
     ITA: { first: ["Lorenzo","Marco","Andrea","Matteo","Francesco","Alessandro","Giovanni","Federico","Davide","Simone"], last: ["Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Colombo","Ricci","Marino","Greco"] },
     POL: { first: ["Kacper","Jakub","Szymon","Mateusz","Filip","Bartosz","Wojciech","Piotr","Kamil","Michał"], last: ["Nowak","Kowalski","Wiśniewski","Wójcik","Kowalczyk","Kamiński","Zieliński","Szymański","Woźniak","Mazur"] },
     TUR: { first: ["Emre","Mert","Burak","Yusuf","Arda","Kaan","Cenk","Ozan","Berkay","Efe"], last: ["Yılmaz","Kaya","Demir","Şahin","Çelik","Yıldız","Yıldırım","Öztürk","Aydın","Arslan"] },
     BEL: { first: ["Lars","Wout","Jonas","Senne","Milan","Lucas","Aaron","Vic","Simon","Arne"], last: ["Peeters","Janssens","Maes","Jacobs","Willems","Claes","Wouters","De Smet","Dupont","Michiels"] },
     AUT: { first: ["Lukas","David","Julian","Marcel","Florian","Stefan","Manuel","Fabian","Simon","Andreas"], last: ["Gruber","Bauer","Pichler","Steiner","Moser","Mayer","Berger","Hofer","Leitner","Wimmer"] },
     DEN: { first: ["Mikkel","Frederik","Mathias","Emil","Oliver","Magnus","Victor","Rasmus","Anton","Malte"], last: ["Nielsen","Jensen","Hansen","Pedersen","Andersen","Christensen","Larsen","Sørensen","Rasmussen","Madsen"] },
     GRE: { first: ["Giorgos","Dimitris","Kostas","Nikos","Panagiotis","Vasilis","Christos","Andreas","Thanasis","Stelios"], last: ["Papadopoulos","Nikolaou","Georgiou","Vasileiou","Pappas","Makris","Oikonomou","Ioannidis","Alexiou","Katsaros"] },
     SUI: { first: ["Noah","Luca","Leon","Nico","Elias","Dario","Sven","Loris","Jan","Fabio"], last: ["Meier","Schmid","Keller","Widmer","Zbinden","Brunner","Baumann","Frei","Kobel","Vargas"] },
     HUN: { first: ["Bence","Máté","Levente","Dániel","Ádám","Balázs","Gergő","Zsombor","Dávid","Márton"], last: ["Nagy","Kovács","Tóth","Szabó","Horváth","Varga","Kiss","Molnár","Németh","Farkas"] },
     SCO: { first: ["Callum","Ryan","Lewis","Jack","Kieran","Scott","Aiden","Finlay","Cameron","Kyle"], last: ["Campbell","Stewart","Robertson","Murray","MacLeod","Fraser","Gray","Docherty","Kennedy","Wallace"] },
   };
   const NATION_WEIGHTS = ["ENG","ENG","ENG","ENG","ENG","FRA","FRA","BRA","BRA","NED","POR","NGA","ARG","ESP","GER","IRL","SEN","HRV","NOR","JPN","USA","COL"];
   // Each footballing country's primary player nationality, for home-skewed squads.
   const COUNTRY_NAT = {
     ENG: "ENG", ESP: "ESP", GER: "GER", ITA: "ITA", FRA: "FRA", POR: "POR", NED: "NED",
     POL: "POL", TUR: "TUR", BEL: "BEL", AUT: "AUT", DEN: "DEN", GRE: "GRE", SCO: "SCO",
     SUI: "SUI", CRO: "HRV", HUN: "HUN",
   };

   function randomProspect() {
     const nat = NATION_WEIGHTS[Math.floor(Math.random() * NATION_WEIGHTS.length)];
     const pool = NATION_POOLS[nat];
     const first = pool.first[Math.floor(Math.random() * pool.first.length)];
     const last = pool.last[Math.floor(Math.random() * pool.last.length)];
     return { name: first + " " + last, nat };
   }

   // A prospect skewed toward the club's own country (~65% homegrown, the rest an
   // international mix) — so a German club fields German-sounding names, etc.
   function homeProspect(country) {
     const nat = COUNTRY_NAT[country];
     const pool = nat && NATION_POOLS[nat];
     if (pool && Math.random() < 0.65) {
       const first = pool.first[Math.floor(Math.random() * pool.first.length)];
       const last = pool.last[Math.floor(Math.random() * pool.last.length)];
       return { name: first + " " + last, nat };
     }
     return randomProspect();
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
   
   // ---- THE CHAMPIONSHIP (second tier) -------------------------------------
   // Real clubs, distinct from the 20 Premier League sides above. Squads are
   // left empty and generated per-career by ensureSquadDepth at tier-
   // appropriate (lower) ratings — the same mechanism promoted clubs use — so
   // the division feels a clear step below the Premier League.
   const RAW_CHAMPIONSHIP = [
     { id: "lei", name: "Leicester City", short: "LEI", nick: "The Foxes", city: "Leicester", stadium: "King Power Stadium", colors: ["#003090", "#FDBE11"], tier: 2, squad: [] },
     { id: "sou", name: "Southampton", short: "SOU", nick: "The Saints", city: "Southampton", stadium: "St Mary's Stadium", colors: ["#D71920", "#FFFFFF"], tier: 2, squad: [] },
     { id: "wba", name: "West Bromwich Albion", short: "WBA", nick: "The Baggies", city: "West Bromwich", stadium: "The Hawthorns", colors: ["#122F67", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nor", name: "Norwich City", short: "NOR", nick: "The Canaries", city: "Norwich", stadium: "Carrow Road", colors: ["#FFF200", "#00A650"], tier: 2, squad: [] },
     { id: "mid", name: "Middlesbrough", short: "MID", nick: "Boro", city: "Middlesbrough", stadium: "Riverside Stadium", colors: ["#E21E26", "#FFFFFF"], tier: 2, squad: [] },
     { id: "shu", name: "Sheffield United", short: "SHU", nick: "The Blades", city: "Sheffield", stadium: "Bramall Lane", colors: ["#EE2737", "#000000"], tier: 2, squad: [] },
     { id: "bur", name: "Burnley", short: "BUR", nick: "The Clarets", city: "Burnley", stadium: "Turf Moor", colors: ["#6C1D45", "#99D6EA"], tier: 2, squad: [] },
     { id: "wol", name: "Wolverhampton Wanderers", short: "WOL", nick: "Wolves", city: "Wolverhampton", stadium: "Molineux Stadium", colors: ["#FDB913", "#231F20"], tier: 2, squad: [] },
     { id: "wat", name: "Watford", short: "WAT", nick: "The Hornets", city: "Watford", stadium: "Vicarage Road", colors: ["#FBEE23", "#ED2127"], tier: 1, squad: [] },
     { id: "sto", name: "Stoke City", short: "STO", nick: "The Potters", city: "Stoke-on-Trent", stadium: "bet365 Stadium", colors: ["#E03A3E", "#FFFFFF"], tier: 1, squad: [] },
     { id: "pne", name: "Preston North End", short: "PNE", nick: "The Lilywhites", city: "Preston", stadium: "Deepdale", colors: ["#FFFFFF", "#0000FF"], tier: 1, squad: [] },
     { id: "bbr", name: "Blackburn Rovers", short: "BBR", nick: "Rovers", city: "Blackburn", stadium: "Ewood Park", colors: ["#009EE0", "#E4022C"], tier: 1, squad: [] },
     { id: "swa", name: "Swansea City", short: "SWA", nick: "The Swans", city: "Swansea", stadium: "Swansea.com Stadium", colors: ["#FFFFFF", "#000000"], tier: 1, squad: [] },
     { id: "car", name: "Cardiff City", short: "CAR", nick: "The Bluebirds", city: "Cardiff", stadium: "Cardiff City Stadium", colors: ["#0070B5", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mil", name: "Millwall", short: "MIL", nick: "The Lions", city: "London", stadium: "The Den", colors: ["#001C58", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bri", name: "Bristol City", short: "BRC", nick: "The Robins", city: "Bristol", stadium: "Ashton Gate", colors: ["#E21C38", "#FFFFFF"], tier: 1, squad: [] },
     { id: "qpr", name: "Queens Park Rangers", short: "QPR", nick: "The Hoops", city: "London", stadium: "Loftus Road", colors: ["#1D5BA4", "#FFFFFF"], tier: 1, squad: [] },
     { id: "shw", name: "Sheffield Wednesday", short: "SHW", nick: "The Owls", city: "Sheffield", stadium: "Hillsborough", colors: ["#1F50A1", "#FFFFFF"], tier: 1, squad: [] },
     { id: "der", name: "Derby County", short: "DER", nick: "The Rams", city: "Derby", stadium: "Pride Park Stadium", colors: ["#FFFFFF", "#000000"], tier: 1, squad: [] },
     { id: "ply", name: "Plymouth Argyle", short: "PLY", nick: "The Pilgrims", city: "Plymouth", stadium: "Home Park", colors: ["#007B5F", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bir", name: "Birmingham City", short: "BIR", nick: "The Blues", city: "Birmingham", stadium: "St Andrew's", colors: ["#0000FF", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lut", name: "Luton Town", short: "LUT", nick: "The Hatters", city: "Luton", stadium: "Kenilworth Road", colors: ["#F78F1E", "#FFFFFF"], tier: 2, squad: [] },
     { id: "wyc", name: "Wycombe Wanderers", short: "WYC", nick: "The Chairboys", city: "High Wycombe", stadium: "Adams Park", colors: ["#00B7EB", "#0A0A6E"], tier: 1, squad: [] },
     { id: "leo", name: "Leyton Orient", short: "LEY", nick: "The O's", city: "London", stadium: "Brisbane Road", colors: ["#D2122E", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // ---- EFL LEAGUE ONE (third tier) ----------------------------------------
   const RAW_LEAGUEONE = [
     { id: "bol", name: "Bolton Wanderers", short: "BOL", nick: "The Trotters", city: "Bolton", stadium: "Toughsheet Community Stadium", colors: ["#FFFFFF", "#001C58"], tier: 1, squad: [] },
     { id: "wig", name: "Wigan Athletic", short: "WIG", nick: "The Latics", city: "Wigan", stadium: "Brick Community Stadium", colors: ["#0070B5", "#FFFFFF"], tier: 1, squad: [] },
     { id: "brn", name: "Barnsley", short: "BRN", nick: "The Tykes", city: "Barnsley", stadium: "Oakwell", colors: ["#D2122E", "#FFFFFF"], tier: 1, squad: [] },
     { id: "por", name: "Portsmouth", short: "POR", nick: "Pompey", city: "Portsmouth", stadium: "Fratton Park", colors: ["#001C58", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cha", name: "Charlton Athletic", short: "CHA", nick: "The Addicks", city: "London", stadium: "The Valley", colors: ["#D2122E", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hud", name: "Huddersfield Town", short: "HUD", nick: "The Terriers", city: "Huddersfield", stadium: "John Smith's Stadium", colors: ["#0070B5", "#FFFFFF"], tier: 1, squad: [] },
     { id: "oxf", name: "Oxford United", short: "OXF", nick: "The U's", city: "Oxford", stadium: "Kassam Stadium", colors: ["#FFD700", "#001C58"], tier: 1, squad: [] },
     { id: "pet", name: "Peterborough United", short: "PET", nick: "Posh", city: "Peterborough", stadium: "Weston Homes Stadium", colors: ["#0070B5", "#FFFFFF"], tier: 1, squad: [] },
     { id: "lin", name: "Lincoln City", short: "LIN", nick: "The Imps", city: "Lincoln", stadium: "LNER Stadium", colors: ["#D2122E", "#FFFFFF"], tier: 1, squad: [] },
     { id: "brv", name: "Bristol Rovers", short: "BRV", nick: "The Gas", city: "Bristol", stadium: "Memorial Stadium", colors: ["#0070B5", "#FFFFFF"], tier: 1, squad: [] },
     { id: "wre", name: "Wrexham", short: "WRE", nick: "The Red Dragons", city: "Wrexham", stadium: "Racecourse Ground", colors: ["#D2122E", "#FFFFFF"], tier: 1, squad: [] },
     { id: "stk", name: "Stockport County", short: "STK", nick: "The Hatters", city: "Stockport", stadium: "Edgeley Park", colors: ["#0070B5", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bkp", name: "Blackpool", short: "BKP", nick: "The Seasiders", city: "Blackpool", stadium: "Bloomfield Road", colors: ["#F68712", "#FFFFFF"], tier: 1, squad: [] },
     { id: "rot", name: "Rotherham United", short: "ROT", nick: "The Millers", city: "Rotherham", stadium: "AESSEAL New York Stadium", colors: ["#D2122E", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cam", name: "Cambridge United", short: "CAM", nick: "The U's", city: "Cambridge", stadium: "Abbey Stadium", colors: ["#FFCC00", "#000000"], tier: 1, squad: [] },
     { id: "nor2", name: "Northampton Town", short: "NTH", nick: "The Cobblers", city: "Northampton", stadium: "Sixfields Stadium", colors: ["#7C2D8A", "#FFFFFF"], tier: 1, squad: [] },
     { id: "shr", name: "Shrewsbury Town", short: "SHR", nick: "The Shrews", city: "Shrewsbury", stadium: "Croud Meadow", colors: ["#0033A0", "#FFD700"], tier: 1, squad: [] },
     { id: "rea", name: "Reading", short: "REA", nick: "The Royals", city: "Reading", stadium: "Select Car Leasing Stadium", colors: ["#004494", "#FFFFFF"], tier: 1, squad: [] },
     { id: "exe", name: "Exeter City", short: "EXE", nick: "The Grecians", city: "Exeter", stadium: "St James Park", colors: ["#D2122E", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mns", name: "Mansfield Town", short: "MNS", nick: "The Stags", city: "Mansfield", stadium: "One Call Stadium", colors: ["#FFD700", "#00205B"], tier: 1, squad: [] },
     { id: "bua", name: "Burton Albion", short: "BUA", nick: "The Brewers", city: "Burton upon Trent", stadium: "Pirelli Stadium", colors: ["#FFDF00", "#000000"], tier: 1, squad: [] },
     { id: "pva", name: "Port Vale", short: "PVA", nick: "The Valiants", city: "Stoke-on-Trent", stadium: "Vale Park", colors: ["#FFFFFF", "#000000"], tier: 1, squad: [] },
     { id: "chl", name: "Cheltenham Town", short: "CHL", nick: "The Robins", city: "Cheltenham", stadium: "Whaddon Road", colors: ["#D2122E", "#FFFFFF"], tier: 1, squad: [] },
     { id: "crl", name: "Carlisle United", short: "CRL", nick: "The Cumbrians", city: "Carlisle", stadium: "Brunton Park", colors: ["#0033A0", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // ---- EFL LEAGUE TWO (fourth tier — no relegation below it) ---------------
   const RAW_LEAGUETWO = [
     { id: "nts", name: "Notts County", short: "NTS", nick: "The Magpies", city: "Nottingham", stadium: "Meadow Lane", colors: ["#000000", "#FFFFFF"], tier: 0, squad: [] },
     { id: "grm", name: "Grimsby Town", short: "GRM", nick: "The Mariners", city: "Grimsby", stadium: "Blundell Park", colors: ["#000000", "#FFFFFF"], tier: 0, squad: [] },
     { id: "brd", name: "Bradford City", short: "BRD", nick: "The Bantams", city: "Bradford", stadium: "Valley Parade", colors: ["#8A1538", "#F68712"], tier: 0, squad: [] },
     { id: "cht", name: "Chesterfield", short: "CHT", nick: "The Spireites", city: "Chesterfield", stadium: "SMH Group Stadium", colors: ["#0033A0", "#FFFFFF"], tier: 0, squad: [] },
     { id: "gil", name: "Gillingham", short: "GIL", nick: "The Gills", city: "Gillingham", stadium: "Priestfield Stadium", colors: ["#0033A0", "#FFFFFF"], tier: 0, squad: [] },
     { id: "mkd", name: "MK Dons", short: "MKD", nick: "The Dons", city: "Milton Keynes", stadium: "Stadium MK", colors: ["#FFFFFF", "#000000"], tier: 0, squad: [] },
     { id: "crw", name: "Crawley Town", short: "CRW", nick: "The Red Devils", city: "Crawley", stadium: "Broadfield Stadium", colors: ["#D2122E", "#FFFFFF"], tier: 0, squad: [] },
     { id: "sal", name: "Salford City", short: "SAL", nick: "The Ammies", city: "Salford", stadium: "Peninsula Stadium", colors: ["#D2122E", "#000000"], tier: 0, squad: [] },
     { id: "wal", name: "Walsall", short: "WAL", nick: "The Saddlers", city: "Walsall", stadium: "Poundland Bescot Stadium", colors: ["#D2122E", "#FFFFFF"], tier: 0, squad: [] },
     { id: "don", name: "Doncaster Rovers", short: "DON", nick: "Rovers", city: "Doncaster", stadium: "Eco-Power Stadium", colors: ["#D2122E", "#FFFFFF"], tier: 0, squad: [] },
     { id: "col", name: "Colchester United", short: "COL", nick: "The U's", city: "Colchester", stadium: "JobServe Community Stadium", colors: ["#0033A0", "#FFFFFF"], tier: 0, squad: [] },
     { id: "npt", name: "Newport County", short: "NPT", nick: "The Exiles", city: "Newport", stadium: "Rodney Parade", colors: ["#F68712", "#000000"], tier: 0, squad: [] },
     { id: "trn", name: "Tranmere Rovers", short: "TRN", nick: "The Whites", city: "Birkenhead", stadium: "Prenton Park", colors: ["#FFFFFF", "#0033A0"], tier: 0, squad: [] },
     { id: "cre", name: "Crewe Alexandra", short: "CRE", nick: "The Railwaymen", city: "Crewe", stadium: "Mornflake Stadium", colors: ["#D2122E", "#FFFFFF"], tier: 0, squad: [] },
     { id: "hgt", name: "Harrogate Town", short: "HGT", nick: "The Sulphurites", city: "Harrogate", stadium: "Wetherby Road", colors: ["#FFD700", "#000000"], tier: 0, squad: [] },
     { id: "bar2", name: "Barrow", short: "BAW", nick: "The Bluebirds", city: "Barrow-in-Furness", stadium: "Holker Street", colors: ["#0070B5", "#FFFFFF"], tier: 0, squad: [] },
     { id: "swn", name: "Swindon Town", short: "SWN", nick: "The Robins", city: "Swindon", stadium: "County Ground", colors: ["#D2122E", "#FFFFFF"], tier: 0, squad: [] },
     { id: "acc", name: "Accrington Stanley", short: "ACC", nick: "Stanley", city: "Accrington", stadium: "Wham Stadium", colors: ["#D2122E", "#000000"], tier: 0, squad: [] },
     { id: "mor", name: "Morecambe", short: "MOR", nick: "The Shrimps", city: "Morecambe", stadium: "Mazuma Stadium", colors: ["#D2122E", "#000000"], tier: 0, squad: [] },
     { id: "fle", name: "Fleetwood Town", short: "FLE", nick: "The Cod Army", city: "Fleetwood", stadium: "Highbury Stadium", colors: ["#D2122E", "#FFFFFF"], tier: 0, squad: [] },
     { id: "wim", name: "AFC Wimbledon", short: "WIM", nick: "The Dons", city: "London", stadium: "Plough Lane", colors: ["#003399", "#FFCC00"], tier: 0, squad: [] },
     { id: "brm", name: "Bromley", short: "BRM", nick: "The Ravens", city: "Bromley", stadium: "Hayes Lane", colors: ["#FFFFFF", "#000000"], tier: 0, squad: [] },
     { id: "stv", name: "Stevenage", short: "STV", nick: "Boro", city: "Stevenage", stadium: "Lamex Stadium", colors: ["#D2122E", "#FFFFFF"], tier: 0, squad: [] },
     { id: "sut", name: "Sutton United", short: "SUT", nick: "The U's", city: "Sutton", stadium: "Gander Green Lane", colors: ["#FFCC00", "#000000"], tier: 0, squad: [] },
   ];

   // ---- SPAIN: LA LIGA (20) --------------------------------------------------
   const RAW_LALIGA = [
     { id: "rma", name: "Real Madrid", short: "RMA", nick: "Los Blancos", city: "Madrid", stadium: "Santiago Bernabéu", colors: ["#FEBE10", "#00529F"], tier: 5, squad: [] },
     { id: "fcb", name: "FC Barcelona", short: "BAR", nick: "Blaugrana", city: "Barcelona", stadium: "Spotify Camp Nou", colors: ["#A50044", "#004D98"], tier: 5, squad: [] },
     { id: "atm", name: "Atlético Madrid", short: "ATM", nick: "Los Colchoneros", city: "Madrid", stadium: "Metropolitano", colors: ["#CB3524", "#FFFFFF"], tier: 5, squad: [] },
     { id: "ath", name: "Athletic Club", short: "ATH", nick: "Los Leones", city: "Bilbao", stadium: "San Mamés", colors: ["#EE2523", "#FFFFFF"], tier: 4, squad: [] },
     { id: "rso", name: "Real Sociedad", short: "RSO", nick: "La Real", city: "San Sebastián", stadium: "Reale Arena", colors: ["#0067B1", "#FFFFFF"], tier: 4, squad: [] },
     { id: "bet", name: "Real Betis", short: "BET", nick: "Los Verdiblancos", city: "Seville", stadium: "Benito Villamarín", colors: ["#00954C", "#FFFFFF"], tier: 4, squad: [] },
     { id: "vil", name: "Villarreal", short: "VIL", nick: "El Submarino Amarillo", city: "Villarreal", stadium: "Estadio de la Cerámica", colors: ["#FFE667", "#004C99"], tier: 4, squad: [] },
     { id: "sev", name: "Sevilla", short: "SEV", nick: "Los Nervionenses", city: "Seville", stadium: "Ramón Sánchez-Pizjuán", colors: ["#D8010F", "#FFFFFF"], tier: 4, squad: [] },
     { id: "vlc", name: "Valencia", short: "VLC", nick: "Los Che", city: "Valencia", stadium: "Mestalla", colors: ["#FF7C00", "#000000"], tier: 3, squad: [] },
     { id: "gir", name: "Girona", short: "GIR", nick: "Blanquivermells", city: "Girona", stadium: "Montilivi", colors: ["#CD1719", "#FFFFFF"], tier: 3, squad: [] },
     { id: "cel", name: "Celta Vigo", short: "CEL", nick: "Os Celestes", city: "Vigo", stadium: "Balaídos", colors: ["#8AC3EE", "#FFFFFF"], tier: 3, squad: [] },
     { id: "osa", name: "Osasuna", short: "OSA", nick: "Los Rojillos", city: "Pamplona", stadium: "El Sadar", colors: ["#0A346F", "#D91A21"], tier: 3, squad: [] },
     { id: "ray", name: "Rayo Vallecano", short: "RAY", nick: "Los Franjirrojos", city: "Madrid", stadium: "Vallecas", colors: ["#FFFFFF", "#E53027"], tier: 3, squad: [] },
     { id: "get", name: "Getafe", short: "GET", nick: "Los Azulones", city: "Getafe", stadium: "Coliseum", colors: ["#005999", "#FFFFFF"], tier: 3, squad: [] },
     { id: "mll", name: "Mallorca", short: "MLL", nick: "Los Bermellones", city: "Palma", stadium: "Son Moix", colors: ["#E20613", "#000000"], tier: 2, squad: [] },
     { id: "esn", name: "Espanyol", short: "ESP", nick: "Los Pericos", city: "Barcelona", stadium: "RCDE Stadium", colors: ["#007FC8", "#FFFFFF"], tier: 2, squad: [] },
     { id: "alv", name: "Alavés", short: "ALV", nick: "El Glorioso", city: "Vitoria-Gasteiz", stadium: "Mendizorroza", colors: ["#0761AF", "#FFFFFF"], tier: 2, squad: [] },
     { id: "elc", name: "Elche", short: "ELC", nick: "Los Franjiverdes", city: "Elche", stadium: "Martínez Valero", colors: ["#00913F", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lev", name: "Levante", short: "LEV", nick: "Los Granotas", city: "Valencia", stadium: "Ciutat de València", colors: ["#9E1C31", "#004B9F"], tier: 2, squad: [] },
     { id: "ovi", name: "Real Oviedo", short: "OVI", nick: "Los Carbayones", city: "Oviedo", stadium: "Carlos Tartiere", colors: ["#0033A0", "#FFFFFF"], tier: 2, squad: [] },
   ];

   // ---- SPAIN: SEGUNDA DIVISIÓN (22 — the lowest Spanish tier here) ----------
   const RAW_SEGUNDA = [
     { id: "dep", name: "Deportivo La Coruña", short: "DEP", nick: "Depor", city: "A Coruña", stadium: "Riazor", colors: ["#0067B1", "#FFFFFF"], tier: 2, squad: [] },
     { id: "rac", name: "Racing Santander", short: "RAC", nick: "Los Verdiblancos", city: "Santander", stadium: "El Sardinero", colors: ["#009B48", "#FFFFFF"], tier: 2, squad: [] },
     { id: "zar", name: "Real Zaragoza", short: "ZAR", nick: "Los Maños", city: "Zaragoza", stadium: "La Romareda", colors: ["#FFFFFF", "#004B9F"], tier: 2, squad: [] },
     { id: "spg", name: "Sporting Gijón", short: "SPG", nick: "Los Rojiblancos", city: "Gijón", stadium: "El Molinón", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "vld", name: "Real Valladolid", short: "VLD", nick: "Pucela", city: "Valladolid", stadium: "José Zorrilla", colors: ["#7A1E7A", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lpa", name: "Las Palmas", short: "LPA", nick: "Los Amarillos", city: "Las Palmas", stadium: "Gran Canaria", colors: ["#FFE400", "#0055A5"], tier: 2, squad: [] },
     { id: "leg", name: "Leganés", short: "LEG", nick: "Los Pepineros", city: "Leganés", stadium: "Butarque", colors: ["#005BAC", "#FFFFFF"], tier: 2, squad: [] },
     { id: "alm", name: "Almería", short: "ALM", nick: "Los Rojiblancos", city: "Almería", stadium: "Power Horse Stadium", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "gra", name: "Granada", short: "GRA", nick: "Los Nazaríes", city: "Granada", stadium: "Nuevo Los Cármenes", colors: ["#C4122E", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cad", name: "Cádiz", short: "CAD", nick: "El Submarino Amarillo", city: "Cádiz", stadium: "Nuevo Mirandilla", colors: ["#FFE400", "#0055A5"], tier: 1, squad: [] },
     { id: "eib", name: "Eibar", short: "EIB", nick: "Los Armeros", city: "Eibar", stadium: "Ipurua", colors: ["#0A2340", "#E30613"], tier: 1, squad: [] },
     { id: "mag", name: "Málaga", short: "MAG", nick: "Los Boquerones", city: "Málaga", stadium: "La Rosaleda", colors: ["#0088CE", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hue", name: "Huesca", short: "HUE", nick: "Los Oscenses", city: "Huesca", stadium: "El Alcoraz", colors: ["#0055A5", "#E30613"], tier: 1, squad: [] },
     { id: "alb", name: "Albacete", short: "ALB", nick: "Los Manchegos", city: "Albacete", stadium: "Carlos Belmonte", colors: ["#FFFFFF", "#0055A5"], tier: 1, squad: [] },
     { id: "bgs", name: "Burgos", short: "BGS", nick: "Los Blanquinegros", city: "Burgos", stadium: "El Plantío", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cor", name: "Córdoba", short: "COR", nick: "El Califa", city: "Córdoba", stadium: "El Arcángel", colors: ["#00913F", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cst", name: "Castellón", short: "CST", nick: "Los Orelluts", city: "Castellón", stadium: "Castalia", colors: ["#000000", "#FFA300"], tier: 1, squad: [] },
     { id: "mir", name: "Mirandés", short: "MIR", nick: "Los Jabatos", city: "Miranda de Ebro", stadium: "Anduva", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "fer", name: "Racing Ferrol", short: "FER", nick: "Los Departamentales", city: "Ferrol", stadium: "A Malata", colors: ["#00913F", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ctg", name: "Cartagena", short: "CTG", nick: "El Efesé", city: "Cartagena", stadium: "Cartagonova", colors: ["#000000", "#E30613"], tier: 1, squad: [] },
     { id: "ten", name: "Tenerife", short: "TEN", nick: "Los Chicharreros", city: "Santa Cruz", stadium: "Heliodoro Rodríguez", colors: ["#0055A5", "#FFFFFF"], tier: 1, squad: [] },
     { id: "and", name: "FC Andorra", short: "AND", nick: "Els Tricolors", city: "Andorra la Vella", stadium: "Estadi Nacional", colors: ["#E30613", "#FDD000"], tier: 1, squad: [] },
   ];

   // =========================================================================
   // FOREIGN LEAGUES (Phase 3 — straight double round-robin nations)
   // Metadata only; these clubs are strength-only unless you manage in their
   // country (see freshClubsCopy). IDs are nation-prefixed so they can never
   // collide with English/Spanish ids or each other. Two tiers per nation with
   // simple 3-up / 3-down promotion & relegation.
   // =========================================================================

   // ---- GERMANY ----
   const RAW_DE_BL1 = [
     { id: "ger_bay", name: "Bayern Munich", short: "BAY", city: "Munich", stadium: "Allianz Arena", colors: ["#DC052D", "#FFFFFF"], tier: 5, squad: [] },
     { id: "ger_lev", name: "Bayer Leverkusen", short: "LEV", city: "Leverkusen", stadium: "BayArena", colors: ["#E32219", "#000000"], tier: 5, squad: [] },
     { id: "ger_rbl", name: "RB Leipzig", short: "RBL", city: "Leipzig", stadium: "Red Bull Arena", colors: ["#DD0741", "#FFFFFF"], tier: 4, squad: [] },
     { id: "ger_bvb", name: "Borussia Dortmund", short: "BVB", city: "Dortmund", stadium: "Signal Iduna Park", colors: ["#FDE100", "#000000"], tier: 5, squad: [] },
     { id: "ger_sge", name: "Eintracht Frankfurt", short: "SGE", city: "Frankfurt", stadium: "Deutsche Bank Park", colors: ["#E1000F", "#000000"], tier: 4, squad: [] },
     { id: "ger_vfb", name: "VfB Stuttgart", short: "VFB", city: "Stuttgart", stadium: "MHPArena", colors: ["#FFFFFF", "#E32219"], tier: 4, squad: [] },
     { id: "ger_wob", name: "VfL Wolfsburg", short: "WOB", city: "Wolfsburg", stadium: "Volkswagen Arena", colors: ["#65B32E", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ger_scf", name: "SC Freiburg", short: "SCF", city: "Freiburg", stadium: "Europa-Park Stadion", colors: ["#000000", "#E2001A"], tier: 3, squad: [] },
     { id: "ger_svw", name: "Werder Bremen", short: "SVW", city: "Bremen", stadium: "Weserstadion", colors: ["#1D9053", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ger_fca", name: "FC Augsburg", short: "FCA", city: "Augsburg", stadium: "WWK Arena", colors: ["#BA3733", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ger_bmg", name: "Bor. Mönchengladbach", short: "BMG", city: "Mönchengladbach", stadium: "Borussia-Park", colors: ["#000000", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ger_fcu", name: "Union Berlin", short: "FCU", city: "Berlin", stadium: "An der Alten Försterei", colors: ["#EB1923", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ger_m05", name: "Mainz 05", short: "M05", city: "Mainz", stadium: "Mewa Arena", colors: ["#C3141E", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ger_tsg", name: "TSG Hoffenheim", short: "TSG", city: "Sinsheim", stadium: "PreZero Arena", colors: ["#1C63B7", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ger_hdh", name: "1. FC Heidenheim", short: "HDH", city: "Heidenheim", stadium: "Voith-Arena", colors: ["#E30613", "#003DA5"], tier: 2, squad: [] },
     { id: "ger_koe", name: "1. FC Köln", short: "KOE", city: "Cologne", stadium: "RheinEnergieStadion", colors: ["#ED1C24", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ger_hsv", name: "Hamburger SV", short: "HSV", city: "Hamburg", stadium: "Volksparkstadion", colors: ["#0A3F88", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ger_stp", name: "FC St. Pauli", short: "STP", city: "Hamburg", stadium: "Millerntor", colors: ["#61371F", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_DE_BL2 = [
     { id: "ger_s04", name: "Schalke 04", short: "S04", colors: ["#004D9D", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ger_bsc", name: "Hertha BSC", short: "BSC", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ger_f95", name: "Fortuna Düsseldorf", short: "F95", colors: ["#E2001A", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ger_h96", name: "Hannover 96", short: "H96", colors: ["#00966E", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ger_fck", name: "1. FC Kaiserslautern", short: "FCK", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ger_fcn", name: "1. FC Nürnberg", short: "FCN", colors: ["#8C1B1B", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ger_scp", name: "SC Paderborn", short: "SCP", colors: ["#003D8F", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_svd", name: "SV Darmstadt 98", short: "SVD", colors: ["#004E9E", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_ksc", name: "Karlsruher SC", short: "KSC", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_ksv", name: "Holstein Kiel", short: "KSV", colors: ["#005AAA", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_boc", name: "VfL Bochum", short: "BOC", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ger_sgf", name: "Greuther Fürth", short: "SGF", colors: ["#00966E", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_ebs", name: "Eintracht Braunschweig", short: "EBS", colors: ["#FFD700", "#0033A0"], tier: 1, squad: [] },
     { id: "ger_prm", name: "Preußen Münster", short: "PRM", colors: ["#007A33", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_elv", name: "SV Elversberg", short: "ELV", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ger_fcm", name: "1. FC Magdeburg", short: "FCM", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_dsc", name: "Arminia Bielefeld", short: "DSC", colors: ["#0069B4", "#000000"], tier: 1, squad: [] },
     { id: "ger_sgd", name: "Dynamo Dresden", short: "SGD", colors: ["#FFCC00", "#000000"], tier: 1, squad: [] },
   ];

   // ---- ITALY ----
   const RAW_IT_SA = [
     { id: "ita_int", name: "Inter", short: "INT", city: "Milan", stadium: "San Siro", colors: ["#0068A8", "#000000"], tier: 5, squad: [] },
     { id: "ita_mil", name: "AC Milan", short: "MIL", city: "Milan", stadium: "San Siro", colors: ["#FB090B", "#000000"], tier: 5, squad: [] },
     { id: "ita_juv", name: "Juventus", short: "JUV", city: "Turin", stadium: "Allianz Stadium", colors: ["#000000", "#FFFFFF"], tier: 5, squad: [] },
     { id: "ita_nap", name: "Napoli", short: "NAP", city: "Naples", stadium: "Diego Maradona", colors: ["#12A0D7", "#FFFFFF"], tier: 5, squad: [] },
     { id: "ita_rom", name: "AS Roma", short: "ROM", city: "Rome", stadium: "Stadio Olimpico", colors: ["#8E1F2F", "#F0BC42"], tier: 4, squad: [] },
     { id: "ita_laz", name: "Lazio", short: "LAZ", city: "Rome", stadium: "Stadio Olimpico", colors: ["#87D8F7", "#FFFFFF"], tier: 4, squad: [] },
     { id: "ita_ata", name: "Atalanta", short: "ATA", city: "Bergamo", stadium: "Gewiss Stadium", colors: ["#1E71B8", "#000000"], tier: 4, squad: [] },
     { id: "ita_fio", name: "Fiorentina", short: "FIO", city: "Florence", stadium: "Artemio Franchi", colors: ["#592C82", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ita_bol", name: "Bologna", short: "BOL", city: "Bologna", stadium: "Renato Dall'Ara", colors: ["#A21C26", "#1A2F48"], tier: 4, squad: [] },
     { id: "ita_tor", name: "Torino", short: "TOR", city: "Turin", stadium: "Olimpico Grande Torino", colors: ["#8A1E03", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ita_udi", name: "Udinese", short: "UDI", city: "Udine", stadium: "Bluenergy Stadium", colors: ["#000000", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ita_gen", name: "Genoa", short: "GEN", city: "Genoa", stadium: "Luigi Ferraris", colors: ["#A21C26", "#0A2340"], tier: 2, squad: [] },
     { id: "ita_com", name: "Como", short: "COM", city: "Como", stadium: "Giuseppe Sinigaglia", colors: ["#003DA5", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ita_cag", name: "Cagliari", short: "CAG", city: "Cagliari", stadium: "Unipol Domus", colors: ["#A50021", "#00286B"], tier: 2, squad: [] },
     { id: "ita_ver", name: "Hellas Verona", short: "VER", city: "Verona", stadium: "Marcantonio Bentegodi", colors: ["#FFD700", "#0A2340"], tier: 2, squad: [] },
     { id: "ita_lec", name: "Lecce", short: "LEC", city: "Lecce", stadium: "Via del Mare", colors: ["#FFD700", "#E30613"], tier: 2, squad: [] },
     { id: "ita_par", name: "Parma", short: "PAR", city: "Parma", stadium: "Ennio Tardini", colors: ["#FFD700", "#0A2340"], tier: 2, squad: [] },
     { id: "ita_pis", name: "Pisa", short: "PIS", city: "Pisa", stadium: "Arena Garibaldi", colors: ["#0A2340", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ita_cre", name: "Cremonese", short: "CRE", city: "Cremona", stadium: "Giovanni Zini", colors: ["#A21C26", "#808080"], tier: 1, squad: [] },
     { id: "ita_sas", name: "Sassuolo", short: "SAS", city: "Sassuolo", stadium: "Mapei Stadium", colors: ["#00A752", "#000000"], tier: 2, squad: [] },
   ];
   const RAW_IT_SB = [
     { id: "ita_pal", name: "Palermo", short: "PAL", colors: ["#E5A6C8", "#000000"], tier: 2, squad: [] },
     { id: "ita_sam", name: "Sampdoria", short: "SAM", colors: ["#1B5497", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ita_bari", name: "Bari", short: "BAR", colors: ["#E2001A", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_spe", name: "Spezia", short: "SPE", colors: ["#FFFFFF", "#000000"], tier: 1, squad: [] },
     { id: "ita_ces", name: "Cesena", short: "CES", colors: ["#A21C26", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_fro", name: "Frosinone", short: "FRO", colors: ["#FFD700", "#0A2340"], tier: 1, squad: [] },
     { id: "ita_mod", name: "Modena", short: "MOD", colors: ["#FFD700", "#0A2340"], tier: 1, squad: [] },
     { id: "ita_reg", name: "Reggiana", short: "REG", colors: ["#A21C26", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_cat", name: "Catanzaro", short: "CAT", colors: ["#FFD700", "#E30613"], tier: 1, squad: [] },
     { id: "ita_bre", name: "Brescia", short: "BRE", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_cos", name: "Cosenza", short: "COS", colors: ["#E30613", "#0A2340"], tier: 1, squad: [] },
     { id: "ita_sud", name: "Südtirol", short: "SUD", colors: ["#FFFFFF", "#E30613"], tier: 1, squad: [] },
     { id: "ita_sal", name: "Salernitana", short: "SAL", colors: ["#6C1D45", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_jst", name: "Juve Stabia", short: "JST", colors: ["#FFD700", "#0A2340"], tier: 1, squad: [] },
     { id: "ita_car", name: "Carrarese", short: "CAR", colors: ["#FFD700", "#0A2340"], tier: 1, squad: [] },
     { id: "ita_cit", name: "Cittadella", short: "CIT", colors: ["#6C1D45", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // ---- PORTUGAL ----
   const RAW_PT_PP = [
     { id: "por_slb", name: "Benfica", short: "SLB", city: "Lisbon", stadium: "Estádio da Luz", colors: ["#E30613", "#FFFFFF"], tier: 5, squad: [] },
     { id: "por_fcp", name: "Porto", short: "POR", city: "Porto", stadium: "Estádio do Dragão", colors: ["#003DA5", "#FFFFFF"], tier: 5, squad: [] },
     { id: "por_scp", name: "Sporting CP", short: "SCP", city: "Lisbon", stadium: "José Alvalade", colors: ["#008057", "#FFFFFF"], tier: 5, squad: [] },
     { id: "por_bra", name: "SC Braga", short: "BRA", city: "Braga", stadium: "Estádio Municipal de Braga", colors: ["#E30613", "#FFFFFF"], tier: 4, squad: [] },
     { id: "por_vsc", name: "Vitória SC", short: "VSC", city: "Guimarães", stadium: "D. Afonso Henriques", colors: ["#FFFFFF", "#000000"], tier: 3, squad: [] },
     { id: "por_mor", name: "Moreirense", short: "MOR", colors: ["#FFD700", "#0A2340"], tier: 2, squad: [] },
     { id: "por_fam", name: "Famalicão", short: "FAM", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "por_gil", name: "Gil Vicente", short: "GIL", colors: ["#E30613", "#0A2340"], tier: 2, squad: [] },
     { id: "por_est", name: "Estoril", short: "EST", colors: ["#FFD700", "#0A2340"], tier: 2, squad: [] },
     { id: "por_cpa", name: "Casa Pia", short: "CPA", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "por_rio", name: "Rio Ave", short: "RIO", colors: ["#00A650", "#E30613"], tier: 2, squad: [] },
     { id: "por_stc", name: "Santa Clara", short: "STC", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "por_aro", name: "Arouca", short: "ARO", colors: ["#FFD700", "#0A2340"], tier: 2, squad: [] },
     { id: "por_amd", name: "Estrela Amadora", short: "AMD", colors: ["#E30613", "#0A2340"], tier: 1, squad: [] },
     { id: "por_nac", name: "Nacional", short: "NAC", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "por_avs", name: "AVS", short: "AVS", colors: ["#0A2340", "#FFFFFF"], tier: 1, squad: [] },
     { id: "por_far", name: "Farense", short: "FAR", colors: ["#FFFFFF", "#000000"], tier: 1, squad: [] },
     { id: "por_boa", name: "Boavista", short: "BOA", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_PT_P2 = [
     { id: "por_ton", name: "Tondela", short: "TON", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "por_pen", name: "Penafiel", short: "PEN", colors: ["#E30613", "#0A2340"], tier: 1, squad: [] },
     { id: "por_cha", name: "Chaves", short: "CHA", colors: ["#E30613", "#0A2340"], tier: 1, squad: [] },
     { id: "por_mar", name: "Marítimo", short: "MAR", colors: ["#E30613", "#00A650"], tier: 1, squad: [] },
     { id: "por_lei", name: "Leixões", short: "LEI", colors: ["#E30613", "#0A2340"], tier: 1, squad: [] },
     { id: "por_avi", name: "Académico Viseu", short: "AVI", colors: ["#0A2340", "#FFD700"], tier: 1, squad: [] },
     { id: "por_udl", name: "União Leiria", short: "UDL", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "por_fei", name: "Feirense", short: "FEI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "por_pfe", name: "Paços de Ferreira", short: "PFE", colors: ["#FFD700", "#00A650"], tier: 2, squad: [] },
     { id: "por_trr", name: "Torreense", short: "TRR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "por_maf", name: "Mafra", short: "MAF", colors: ["#E30613", "#0A2340"], tier: 1, squad: [] },
     { id: "por_alv", name: "Alverca", short: "ALV", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "por_viz", name: "Vizela", short: "VIZ", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "por_ptm", name: "Portimonense", short: "PTM", colors: ["#000000", "#E30613"], tier: 1, squad: [] },
     { id: "por_oli", name: "Oliveirense", short: "OLI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "por_fel", name: "Felgueiras", short: "FEL", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
   ];

   // ---- NETHERLANDS ----
   const RAW_NL_ER = [
     { id: "ned_aja", name: "Ajax", short: "AJA", city: "Amsterdam", stadium: "Johan Cruijff ArenA", colors: ["#E30613", "#FFFFFF"], tier: 5, squad: [] },
     { id: "ned_psv", name: "PSV", short: "PSV", city: "Eindhoven", stadium: "Philips Stadion", colors: ["#E30613", "#FFFFFF"], tier: 5, squad: [] },
     { id: "ned_fey", name: "Feyenoord", short: "FEY", city: "Rotterdam", stadium: "De Kuip", colors: ["#E30613", "#000000"], tier: 5, squad: [] },
     { id: "ned_az", name: "AZ", short: "AZ", city: "Alkmaar", stadium: "AFAS Stadion", colors: ["#E30613", "#FFFFFF"], tier: 4, squad: [] },
     { id: "ned_twe", name: "FC Twente", short: "TWE", city: "Enschede", stadium: "De Grolsch Veste", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ned_utr", name: "FC Utrecht", short: "UTR", city: "Utrecht", stadium: "Stadion Galgenwaard", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ned_spr", name: "Sparta Rotterdam", short: "SPR", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ned_gae", name: "Go Ahead Eagles", short: "GAE", colors: ["#E30613", "#FFD700"], tier: 2, squad: [] },
     { id: "ned_hee", name: "sc Heerenveen", short: "HEE", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ned_nec", name: "NEC", short: "NEC", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "ned_for", name: "Fortuna Sittard", short: "FOR", colors: ["#FFD700", "#E30613"], tier: 2, squad: [] },
     { id: "ned_pec", name: "PEC Zwolle", short: "PEC", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ned_gro", name: "FC Groningen", short: "GRO", colors: ["#007A33", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ned_wil", name: "Willem II", short: "WIL", colors: ["#E30613", "#0A2340"], tier: 2, squad: [] },
     { id: "ned_her", name: "Heracles", short: "HER", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ned_nac", name: "NAC Breda", short: "NAC", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "ned_amc", name: "Almere City", short: "AMC", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ned_tel", name: "Telstar", short: "TEL", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
   ];
   const RAW_NL_EE = [
     { id: "ned_vol", name: "FC Volendam", short: "VOL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ned_ado", name: "ADO Den Haag", short: "ADO", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
     { id: "ned_rod", name: "Roda JC", short: "ROD", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "ned_dgr", name: "De Graafschap", short: "DGR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ned_vvv", name: "VVV-Venlo", short: "VVV", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "ned_cam", name: "SC Cambuur", short: "CAM", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "ned_mvv", name: "MVV Maastricht", short: "MVV", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ned_emm", name: "FC Emmen", short: "EMM", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ned_ein", name: "FC Eindhoven", short: "EIN", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ned_dor", name: "FC Dordrecht", short: "DOR", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ned_hel", name: "Helmond Sport", short: "HEL", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ned_oss", name: "TOP Oss", short: "OSS", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ned_dbo", name: "FC Den Bosch", short: "DBO", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ned_vit", name: "Vitesse", short: "VIT", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "ned_exc", name: "Excelsior", short: "EXC", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ned_rkc", name: "RKC Waalwijk", short: "RKC", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
   ];

   // ---- POLAND ----
   const RAW_PL_EK = [
     { id: "pol_lgw", name: "Legia Warsaw", short: "LGW", city: "Warsaw", stadium: "Stadion Wojska Polskiego", colors: ["#004B23", "#FFFFFF"], tier: 4, squad: [] },
     { id: "pol_lep", name: "Lech Poznań", short: "LEP", city: "Poznań", stadium: "Enea Stadion", colors: ["#005CA9", "#FFFFFF"], tier: 4, squad: [] },
     { id: "pol_rak", name: "Raków Częstochowa", short: "RAK", city: "Częstochowa", stadium: "Stadion Miejski", colors: ["#E30613", "#0A2340"], tier: 4, squad: [] },
     { id: "pol_jag", name: "Jagiellonia Białystok", short: "JAG", city: "Białystok", stadium: "Stadion Miejski", colors: ["#FFD700", "#E30613"], tier: 4, squad: [] },
     { id: "pol_pog", name: "Pogoń Szczecin", short: "POG", colors: ["#005CA9", "#800000"], tier: 3, squad: [] },
     { id: "pol_gor", name: "Górnik Zabrze", short: "GOR", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "pol_cra", name: "Cracovia", short: "CRA", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "pol_wis", name: "Wisła Płock", short: "WIS", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "pol_pia", name: "Piast Gliwice", short: "PIA", colors: ["#800000", "#005CA9"], tier: 3, squad: [] },
     { id: "pol_zag", name: "Zagłębie Lubin", short: "ZAG", colors: ["#FF6600", "#0A2340"], tier: 2, squad: [] },
     { id: "pol_wid", name: "Widzew Łódź", short: "WID", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "pol_rad", name: "Radomiak Radom", short: "RAD", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "pol_mot", name: "Motor Lublin", short: "MOT", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "pol_kor", name: "Korona Kielce", short: "KOR", colors: ["#FFD700", "#800000"], tier: 2, squad: [] },
     { id: "pol_gks", name: "GKS Katowice", short: "GKS", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "pol_lgd", name: "Lechia Gdańsk", short: "LGD", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "pol_ark", name: "Arka Gdynia", short: "ARK", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "pol_bbt", name: "Bruk-Bet Termalica", short: "BBT", colors: ["#E30613", "#0A2340"], tier: 2, squad: [] },
   ];
   const RAW_PL_IL = [
     { id: "pol_lks", name: "ŁKS Łódź", short: "LKS", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "pol_wkr", name: "Wisła Kraków", short: "WKR", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "pol_ruc", name: "Ruch Chorzów", short: "RUC", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "pol_mie", name: "Miedź Legnica", short: "MIE", colors: ["#00A650", "#E30613"], tier: 1, squad: [] },
     { id: "pol_tyc", name: "GKS Tychy", short: "TYC", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "pol_plw", name: "Polonia Warszawa", short: "PLW", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "pol_pod", name: "Podbeskidzie", short: "POD", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "pol_odr", name: "Odra Opole", short: "ODR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "pol_chr", name: "Chrobry Głogów", short: "CHR", colors: ["#FF6600", "#0A2340"], tier: 1, squad: [] },
     { id: "pol_gle", name: "Górnik Łęczna", short: "GLE", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "pol_zni", name: "Znicz Pruszków", short: "ZNI", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "pol_str", name: "Stal Rzeszów", short: "STR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "pol_kot", name: "Kotwica Kołobrzeg", short: "KOT", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "pol_pus", name: "Puszcza Niepołomice", short: "PUS", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "pol_zso", name: "Zagłębie Sosnowiec", short: "ZSO", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "pol_war", name: "Warta Poznań", short: "WAR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // ---- TURKEY ----
   const RAW_TR_SL = [
     { id: "tur_gal", name: "Galatasaray", short: "GAL", city: "Istanbul", stadium: "RAMS Park", colors: ["#E30613", "#FFD700"], tier: 5, squad: [] },
     { id: "tur_fen", name: "Fenerbahçe", short: "FEN", city: "Istanbul", stadium: "Şükrü Saracoğlu", colors: ["#FFED00", "#0A2340"], tier: 5, squad: [] },
     { id: "tur_bjk", name: "Beşiktaş", short: "BJK", city: "Istanbul", stadium: "Tüpraş Stadyumu", colors: ["#000000", "#FFFFFF"], tier: 4, squad: [] },
     { id: "tur_tra", name: "Trabzonspor", short: "TRA", city: "Trabzon", stadium: "Papara Park", colors: ["#6C1D45", "#87CEEB"], tier: 4, squad: [] },
     { id: "tur_ibb", name: "Başakşehir", short: "IBB", colors: ["#E67E22", "#0A2340"], tier: 3, squad: [] },
     { id: "tur_sms", name: "Samsunspor", short: "SMS", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "tur_eyp", name: "Eyüpspor", short: "EYP", colors: ["#4B006E", "#FFD700"], tier: 2, squad: [] },
     { id: "tur_kas", name: "Kasımpaşa", short: "KAS", colors: ["#0A2340", "#FFFFFF"], tier: 2, squad: [] },
     { id: "tur_kon", name: "Konyaspor", short: "KON", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "tur_ant", name: "Antalyaspor", short: "ANT", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "tur_kay", name: "Kayserispor", short: "KAY", colors: ["#FFD700", "#E30613"], tier: 2, squad: [] },
     { id: "tur_riz", name: "Rizespor", short: "RIZ", colors: ["#00A650", "#0A2340"], tier: 2, squad: [] },
     { id: "tur_gaz", name: "Gaziantep FK", short: "GAZ", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "tur_ala", name: "Alanyaspor", short: "ALA", colors: ["#FF6600", "#00A650"], tier: 2, squad: [] },
     { id: "tur_siv", name: "Sivasspor", short: "SIV", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "tur_goz", name: "Göztepe", short: "GOZ", colors: ["#E30613", "#FFD700"], tier: 2, squad: [] },
     { id: "tur_bod", name: "Bodrum FK", short: "BOD", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "tur_koc", name: "Kocaelispor", short: "KOC", colors: ["#00A650", "#000000"], tier: 1, squad: [] },
   ];
   const RAW_TR_T1 = [
     { id: "tur_ads", name: "Adana Demirspor", short: "ADS", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "tur_erz", name: "Erzurumspor", short: "ERZ", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "tur_ban", name: "Bandırmaspor", short: "BAN", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "tur_sak", name: "Sakaryaspor", short: "SAK", colors: ["#00A650", "#000000"], tier: 1, squad: [] },
     { id: "tur_bolu", name: "Boluspor", short: "BOL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "tur_mns", name: "Manisa FK", short: "MNS", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "tur_umr", name: "Ümraniyespor", short: "UMR", colors: ["#E30613", "#0A2340"], tier: 1, squad: [] },
     { id: "tur_kec", name: "Keçiörengücü", short: "KEC", colors: ["#800000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "tur_crm", name: "Çorum FK", short: "CRM", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "tur_snl", name: "Şanlıurfaspor", short: "SNL", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
     { id: "tur_ist", name: "İstanbulspor", short: "IST", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "tur_amed", name: "Amed SK", short: "AME", colors: ["#00A650", "#E30613"], tier: 1, squad: [] },
     { id: "tur_pnd", name: "Pendikspor", short: "PND", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "tur_igd", name: "Iğdır FK", short: "IGD", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "tur_hat", name: "Hatayspor", short: "HAT", colors: ["#800000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "tur_ank", name: "Ankaragücü", short: "ANK", colors: ["#0A2340", "#FFD700"], tier: 1, squad: [] },
   ];

   // =========================================================================
   // SPLIT-LEAGUE NATIONS (Phase 4 — championship/relegation split top flights)
   // =========================================================================

   // ---- BELGIUM (Pro League splits 8/8, points halved rounded UP) ----
   const RAW_BE_BPL = [
     { id: "bel_clb", name: "Club Brugge", short: "CLB", city: "Bruges", stadium: "Jan Breydel", colors: ["#005CA9", "#000000"], tier: 4, squad: [] },
     { id: "bel_usg", name: "Union SG", short: "USG", city: "Brussels", stadium: "Joseph Marien", colors: ["#FFD700", "#005CA9"], tier: 4, squad: [] },
     { id: "bel_and", name: "Anderlecht", short: "AND", city: "Brussels", stadium: "Lotto Park", colors: ["#4B2E83", "#FFFFFF"], tier: 4, squad: [] },
     { id: "bel_gnk", name: "Genk", short: "GNK", city: "Genk", stadium: "Cegeka Arena", colors: ["#005CA9", "#FFFFFF"], tier: 4, squad: [] },
     { id: "bel_ant", name: "Antwerp", short: "ANT", city: "Antwerp", stadium: "Bosuilstadion", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "bel_gnt", name: "Gent", short: "GNT", city: "Ghent", stadium: "Ghelamco Arena", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "bel_cer", name: "Cercle Brugge", short: "CER", city: "Bruges", stadium: "Jan Breydel", colors: ["#00A650", "#000000"], tier: 2, squad: [] },
     { id: "bel_std", name: "Standard Liège", short: "STD", city: "Liège", stadium: "Maurice Dufrasne", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "bel_cha", name: "Charleroi", short: "CHA", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bel_mec", name: "Mechelen", short: "MEC", colors: ["#FFD700", "#E30613"], tier: 2, squad: [] },
     { id: "bel_ohl", name: "OH Leuven", short: "OHL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bel_wes", name: "Westerlo", short: "WES", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "bel_stv", name: "Sint-Truiden", short: "STV", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "bel_kor", name: "Kortrijk", short: "KOR", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bel_den", name: "Dender", short: "DEN", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "bel_bee", name: "Beerschot", short: "BEE", colors: ["#4B2E83", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_BE_BCH = [
     { id: "bel_rwd", name: "RWDM", short: "RWD", colors: ["#000000", "#E30613"], tier: 2, squad: [] },
     { id: "bel_zwa", name: "Zulte Waregem", short: "ZWA", colors: ["#E30613", "#00A650"], tier: 2, squad: [] },
     { id: "bel_bev", name: "SK Beveren", short: "BEV", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "bel_lom", name: "Lommel", short: "LOM", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bel_pat", name: "Patro Eisden", short: "PAT", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "bel_lie", name: "Lierse", short: "LIE", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "bel_dei", name: "Deinze", short: "DEI", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bel_ser", name: "Seraing", short: "SER", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "bel_eup", name: "Eupen", short: "EUP", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "bel_fbo", name: "Francs Borains", short: "FBO", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bel_llo", name: "La Louvière", short: "LLO", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bel_olc", name: "Olympic Charleroi", short: "OLC", colors: ["#000000", "#E30613"], tier: 1, squad: [] },
     { id: "bel_lok", name: "Lokeren-Temse", short: "LOK", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "bel_nin", name: "Ninove", short: "NIN", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
   ];

   // ---- AUSTRIA (Bundesliga splits 6/6, points halved rounded DOWN) ----
   const RAW_AT_ABL = [
     { id: "aut_sal", name: "RB Salzburg", short: "SAL", city: "Salzburg", stadium: "Red Bull Arena", colors: ["#E2001A", "#FFFFFF"], tier: 5, squad: [] },
     { id: "aut_stu", name: "Sturm Graz", short: "STU", city: "Graz", stadium: "Merkur Arena", colors: ["#000000", "#FFFFFF"], tier: 4, squad: [] },
     { id: "aut_las", name: "LASK", short: "LAS", city: "Linz", stadium: "Raiffeisen Arena", colors: ["#000000", "#FFFFFF"], tier: 3, squad: [] },
     { id: "aut_rap", name: "Rapid Wien", short: "RAP", city: "Vienna", stadium: "Allianz Stadion", colors: ["#00A650", "#FFFFFF"], tier: 3, squad: [] },
     { id: "aut_auw", name: "Austria Wien", short: "AUW", city: "Vienna", stadium: "Generali Arena", colors: ["#4B2E83", "#FFFFFF"], tier: 3, squad: [] },
     { id: "aut_wac", name: "Wolfsberger AC", short: "WAC", colors: ["#FFFFFF", "#000000"], tier: 2, squad: [] },
     { id: "aut_har", name: "Hartberg", short: "HAR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "aut_klg", name: "Austria Klagenfurt", short: "KLG", colors: ["#4B2E83", "#FFFFFF"], tier: 2, squad: [] },
     { id: "aut_bwl", name: "Blau-Weiß Linz", short: "BWL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "aut_alt", name: "Altach", short: "ALT", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "aut_tir", name: "WSG Tirol", short: "TIR", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "aut_gak", name: "Grazer AK", short: "GAK", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_AT_A2L = [
     { id: "aut_stp", name: "SKN St. Pölten", short: "STP", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "aut_rie", name: "SV Ried", short: "RIE", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "aut_adm", name: "Admira Wacker", short: "ADM", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aut_vie", name: "First Vienna", short: "VIE", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "aut_kap", name: "Kapfenberg", short: "KAP", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aut_ams", name: "SKU Amstetten", short: "AMS", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "aut_laf", name: "SV Lafnitz", short: "LAF", colors: ["#00A650", "#000000"], tier: 1, squad: [] },
     { id: "aut_dor", name: "FC Dornbirn", short: "DOR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aut_bre", name: "SW Bregenz", short: "BRE", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aut_leo", name: "DSV Leoben", short: "LEO", colors: ["#005CA9", "#000000"], tier: 1, squad: [] },
     { id: "aut_hrn", name: "SV Horn", short: "HRN", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "aut_fac", name: "Floridsdorfer AC", short: "FAC", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aut_voi", name: "ASK Voitsberg", short: "VOI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aut_stf", name: "SV Stripfing", short: "STF", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aut_ste", name: "Vorwärts Steyr", short: "STE", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "aut_inn", name: "Wacker Innsbruck", short: "INN", colors: ["#005CA9", "#000000"], tier: 1, squad: [] },
   ];

   // ---- DENMARK (Superliga splits 6/6, points carried) ----
   const RAW_DK_DSL = [
     { id: "den_fck", name: "FC København", short: "FCK", city: "Copenhagen", stadium: "Parken", colors: ["#FFFFFF", "#005CA9"], tier: 4, squad: [] },
     { id: "den_fcm", name: "Midtjylland", short: "FCM", city: "Herning", stadium: "MCH Arena", colors: ["#000000", "#E30613"], tier: 4, squad: [] },
     { id: "den_bif", name: "Brøndby", short: "BIF", city: "Brøndby", stadium: "Brøndby Stadion", colors: ["#FFD700", "#005CA9"], tier: 4, squad: [] },
     { id: "den_fcn", name: "Nordsjælland", short: "FCN", city: "Farum", stadium: "Right to Dream Park", colors: ["#E30613", "#FFD700"], tier: 3, squad: [] },
     { id: "den_agf", name: "AGF Aarhus", short: "AGF", city: "Aarhus", stadium: "Ceres Park", colors: ["#FFFFFF", "#005CA9"], tier: 3, squad: [] },
     { id: "den_ran", name: "Randers", short: "RAN", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "den_sil", name: "Silkeborg", short: "SIL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "den_vib", name: "Viborg", short: "VIB", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "den_lyn", name: "Lyngby", short: "LYN", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "den_vej", name: "Vejle", short: "VEJ", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "den_sdj", name: "SønderjyskE", short: "SDJ", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "den_aab", name: "AaB", short: "AAB", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_DK_D1D = [
     { id: "den_hvi", name: "Hvidovre", short: "HVI", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "den_hob", name: "Hobro", short: "HOB", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "den_fre", name: "Fredericia", short: "FRE", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "den_kol", name: "Kolding", short: "KOL", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "den_hil", name: "Hillerød", short: "HIL", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "den_koe", name: "HB Køge", short: "KOE", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "den_esb", name: "Esbjerg", short: "ESB", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "den_odb", name: "OB Odense", short: "ODB", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "den_hor", name: "Horsens", short: "HOR", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "den_b93", name: "B.93", short: "B93", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "den_nyk", name: "Nykøbing", short: "NYK", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "den_ski", name: "Skive", short: "SKI", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
   ];

   // ---- GREECE (Super League splits 7/7, points carried) ----
   const RAW_GR_GSL = [
     { id: "gre_oly", name: "Olympiacos", short: "OLY", city: "Piraeus", stadium: "Karaiskakis", colors: ["#E30613", "#FFFFFF"], tier: 5, squad: [] },
     { id: "gre_pao", name: "PAOK", short: "PAO", city: "Thessaloniki", stadium: "Toumba", colors: ["#000000", "#FFFFFF"], tier: 4, squad: [] },
     { id: "gre_aek", name: "AEK Athens", short: "AEK", city: "Athens", stadium: "OPAP Arena", colors: ["#FFD700", "#000000"], tier: 4, squad: [] },
     { id: "gre_pan", name: "Panathinaikos", short: "PAN", city: "Athens", stadium: "Apostolos Nikolaidis", colors: ["#00A650", "#FFFFFF"], tier: 4, squad: [] },
     { id: "gre_ari", name: "Aris", short: "ARI", city: "Thessaloniki", stadium: "Kleanthis Vikelidis", colors: ["#FFD700", "#000000"], tier: 3, squad: [] },
     { id: "gre_pae", name: "Panetolikos", short: "PAE", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "gre_ofi", name: "OFI Crete", short: "OFI", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "gre_atr", name: "Atromitos", short: "ATR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "gre_vol", name: "Volos", short: "VOL", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "gre_lam", name: "Lamia", short: "LAM", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "gre_kal", name: "Kallithea", short: "KAL", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "gre_lev", name: "Levadiakos", short: "LEV", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "gre_pns", name: "Panserraikos", short: "PNS", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "gre_ast", name: "Asteras Tripolis", short: "AST", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
   ];
   const RAW_GR_GS2 = [
     { id: "gre_kif", name: "Kifisia", short: "KIF", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gre_ilp", name: "Ilioupoli", short: "ILP", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gre_cha", name: "Chania", short: "CHA", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "gre_niv", name: "Niki Volos", short: "NIV", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gre_mak", name: "Makedonikos", short: "MAK", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gre_kmp", name: "Kampaniakos", short: "KMP", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gre_lar", name: "AEL Larissa", short: "LAR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gre_pnc", name: "Panachaiki", short: "PNC", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "gre_erg", name: "Ergotelis", short: "ERG", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "gre_mrk", name: "Marko", short: "MRK", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gre_aig", name: "Aiginiakos", short: "AIG", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gre_dia", name: "Diagoras", short: "DIA", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "gre_kar", name: "Anagennisi Karditsa", short: "KAR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gre_ovl", name: "Olympiacos Volos", short: "OVL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // =========================================================================
   // N-TIMES ROUND-ROBIN NATIONS (Phase 5 — triple / quadruple leagues)
   // =========================================================================

   // ---- SCOTLAND (Premiership: triple round-robin then 6/6 split) ----
   const RAW_SC_SPL = [
     { id: "sco_cel", name: "Celtic", short: "CEL", city: "Glasgow", stadium: "Celtic Park", colors: ["#16984B", "#FFFFFF"], tier: 4, squad: [] },
     { id: "sco_ran", name: "Rangers", short: "RAN", city: "Glasgow", stadium: "Ibrox", colors: ["#1B458F", "#FFFFFF"], tier: 4, squad: [] },
     { id: "sco_abe", name: "Aberdeen", short: "ABE", city: "Aberdeen", stadium: "Pittodrie", colors: ["#E03A3E", "#FFFFFF"], tier: 3, squad: [] },
     { id: "sco_hea", name: "Hearts", short: "HEA", city: "Edinburgh", stadium: "Tynecastle", colors: ["#7A263A", "#FFFFFF"], tier: 3, squad: [] },
     { id: "sco_hib", name: "Hibernian", short: "HIB", city: "Edinburgh", stadium: "Easter Road", colors: ["#00752F", "#FFFFFF"], tier: 2, squad: [] },
     { id: "sco_dun", name: "Dundee United", short: "DUN", colors: ["#FF6600", "#000000"], tier: 2, squad: [] },
     { id: "sco_kil", name: "Kilmarnock", short: "KIL", colors: ["#003399", "#FFFFFF"], tier: 2, squad: [] },
     { id: "sco_stm", name: "St Mirren", short: "STM", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "sco_mot", name: "Motherwell", short: "MOT", colors: ["#FFC20E", "#8A1538"], tier: 2, squad: [] },
     { id: "sco_dee", name: "Dundee", short: "DEE", colors: ["#0A2340", "#E30613"], tier: 2, squad: [] },
     { id: "sco_ros", name: "Ross County", short: "ROS", colors: ["#000000", "#0A2340"], tier: 2, squad: [] },
     { id: "sco_stj", name: "St Johnstone", short: "STJ", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_SC_SC2 = [
     { id: "sco_fal", name: "Falkirk", short: "FAL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "sco_liv", name: "Livingston", short: "LIV", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "sco_par", name: "Partick Thistle", short: "PAR", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "sco_rai", name: "Raith Rovers", short: "RAI", colors: ["#0A2340", "#FFFFFF"], tier: 1, squad: [] },
     { id: "sco_dnf", name: "Dunfermline", short: "DNF", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "sco_ayr", name: "Ayr United", short: "AYR", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "sco_mor", name: "Greenock Morton", short: "MOR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "sco_qpk", name: "Queen's Park", short: "QPK", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "sco_air", name: "Airdrieonians", short: "AIR", colors: ["#FFFFFF", "#E30613"], tier: 1, squad: [] },
     { id: "sco_ham", name: "Hamilton", short: "HAM", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // ---- SWITZERLAND (Super League: triple round-robin then 6/6 split) ----
   // FC Vaduz (Liechtenstein) plays in the Swiss pyramid — folded in here.
   const RAW_CH_SSL = [
     { id: "sui_ybb", name: "Young Boys", short: "YBB", city: "Bern", stadium: "Wankdorf", colors: ["#FFD700", "#000000"], tier: 4, squad: [] },
     { id: "sui_bas", name: "Basel", short: "BAS", city: "Basel", stadium: "St. Jakob-Park", colors: ["#E30613", "#005CA9"], tier: 4, squad: [] },
     { id: "sui_ser", name: "Servette", short: "SER", city: "Geneva", stadium: "Stade de Genève", colors: ["#7A263A", "#FFFFFF"], tier: 3, squad: [] },
     { id: "sui_lug", name: "Lugano", short: "LUG", city: "Lugano", stadium: "Cornaredo", colors: ["#000000", "#FFFFFF"], tier: 3, squad: [] },
     { id: "sui_sga", name: "St. Gallen", short: "SGA", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "sui_zur", name: "Zürich", short: "ZUR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "sui_lau", name: "Lausanne", short: "LAU", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "sui_luz", name: "Luzern", short: "LUZ", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "sui_gra", name: "Grasshopper", short: "GRA", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "sui_sio", name: "Sion", short: "SIO", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "sui_yve", name: "Yverdon", short: "YVE", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "sui_win", name: "Winterthur", short: "WIN", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_CH_SCL = [
     { id: "sui_aar", name: "Aarau", short: "AAR", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "sui_thu", name: "Thun", short: "THU", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "sui_vad", name: "Vaduz", short: "VAD", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "sui_wil", name: "Wil", short: "WIL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "sui_xam", name: "Neuchâtel Xamax", short: "XAM", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "sui_sch", name: "Schaffhausen", short: "SCH", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "sui_bel", name: "Bellinzona", short: "BEL", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "sui_nyo", name: "Stade Nyonnais", short: "NYO", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "sui_car", name: "Étoile Carouge", short: "CAR", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "sui_rap", name: "Rapperswil-Jona", short: "RAP", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // ---- CROATIA (HNL: quadruple round-robin) ----
   const RAW_HR_HNL = [
     { id: "cro_din", name: "Dinamo Zagreb", short: "DIN", city: "Zagreb", stadium: "Maksimir", colors: ["#005CA9", "#FFFFFF"], tier: 4, squad: [] },
     { id: "cro_haj", name: "Hajduk Split", short: "HAJ", city: "Split", stadium: "Poljud", colors: ["#005CA9", "#FFFFFF"], tier: 4, squad: [] },
     { id: "cro_rij", name: "Rijeka", short: "RIJ", city: "Rijeka", stadium: "Rujevica", colors: ["#FFFFFF", "#005CA9"], tier: 3, squad: [] },
     { id: "cro_osi", name: "Osijek", short: "OSI", city: "Osijek", stadium: "Opus Arena", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "cro_sla", name: "Slaven Belupo", short: "SLA", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cro_lok", name: "Lokomotiva", short: "LOK", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "cro_gor", name: "Gorica", short: "GOR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cro_var", name: "Varaždin", short: "VAR", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "cro_ist", name: "Istra 1961", short: "IST", colors: ["#00A650", "#FFD700"], tier: 2, squad: [] },
     { id: "cro_sib", name: "Šibenik", short: "SIB", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_HR_HN2 = [
     { id: "cro_cib", name: "Cibalia", short: "CIB", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cro_dub", name: "Dubrava", short: "DUB", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cro_ses", name: "Sesvete", short: "SES", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cro_jar", name: "Jarun", short: "JAR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cro_bbr", name: "Bijelo Brdo", short: "BBR", colors: ["#FFFFFF", "#005CA9"], tier: 1, squad: [] },
     { id: "cro_ori", name: "Orijent", short: "ORI", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cro_rud", name: "Rudeš", short: "RUD", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cro_vuk", name: "Vukovar 1991", short: "VUK", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cro_zmi", name: "Zmijavci", short: "ZMI", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "cro_sol", name: "Solin", short: "SOL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cro_kus", name: "Kustošija", short: "KUS", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "cro_opa", name: "Opatija", short: "OPA", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // ---- HUNGARY (NB I: triple round-robin, no split) ----
   const RAW_HU_NB1 = [
     { id: "hun_fer", name: "Ferencváros", short: "FER", city: "Budapest", stadium: "Groupama Aréna", colors: ["#00A650", "#FFFFFF"], tier: 4, squad: [] },
     { id: "hun_pus", name: "Puskás Akadémia", short: "PUS", city: "Felcsút", stadium: "Pancho Aréna", colors: ["#005CA9", "#FFD700"], tier: 3, squad: [] },
     { id: "hun_pak", name: "Paks", short: "PAK", colors: ["#00A650", "#FFFFFF"], tier: 3, squad: [] },
     { id: "hun_feh", name: "Fehérvár", short: "FEH", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "hun_deb", name: "Debrecen", short: "DEB", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "hun_kis", name: "Kisvárda", short: "KIS", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "hun_ujp", name: "Újpest", short: "UJP", colors: ["#4B2E83", "#FFFFFF"], tier: 2, squad: [] },
     { id: "hun_mtk", name: "MTK Budapest", short: "MTK", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "hun_dio", name: "Diósgyőr", short: "DIO", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "hun_zal", name: "Zalaegerszeg", short: "ZAL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "hun_nyi", name: "Nyíregyháza", short: "NYI", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "hun_kec", name: "Kecskemét", short: "KEC", colors: ["#8A1538", "#FFD700"], tier: 2, squad: [] },
   ];
   const RAW_HU_NB2 = [
     { id: "hun_vas", name: "Vasas", short: "VAS", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "hun_hon", name: "Honvéd", short: "HON", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "hun_eto", name: "ETO Győr", short: "ETO", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hun_sze", name: "Szeged", short: "SZE", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hun_vac", name: "Vác", short: "VAC", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "hun_ajk", name: "Ajka", short: "AJK", colors: ["#8A1538", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hun_csa", name: "Csákvár", short: "CSA", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hun_bek", name: "Békéscsaba", short: "BEK", colors: ["#4B0082", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hun_bud", name: "Budafok", short: "BUD", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hun_hal", name: "Haladás", short: "HAL", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hun_koz", name: "Kozármisleny", short: "KOZ", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hun_sio", name: "Siófok", short: "SIO", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "hun_tis", name: "Tiszakécske", short: "TIS", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hun_mos", name: "Mosonmagyaróvár", short: "MOS", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "hun_sor", name: "Soroksár", short: "SOR", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "hun_kar", name: "Karcag", short: "KAR", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
   ];

   // =========================================================================
   // TOP-5 FULL PYRAMIDS — France (new, 4 tiers) + 3rd/4th tiers for Spain,
   // Germany, Italy so each of the big five nations has four divisions.
   // =========================================================================

   // ---- FRANCE (Ligue 1 / Ligue 2 / National / National 2) ----
   const RAW_FR_FL1 = [
     { id: "fra_psg", name: "Paris Saint-Germain", short: "PSG", city: "Paris", stadium: "Parc des Princes", colors: ["#004170", "#E30613"], tier: 5, squad: [] },
     { id: "fra_mar", name: "Marseille", short: "MAR", city: "Marseille", stadium: "Vélodrome", colors: ["#2FAEE0", "#FFFFFF"], tier: 4, squad: [] },
     { id: "fra_mon", name: "Monaco", short: "MON", city: "Monaco", stadium: "Louis II", colors: ["#E30613", "#FFFFFF"], tier: 4, squad: [] },
     { id: "fra_lil", name: "Lille", short: "LIL", city: "Lille", stadium: "Pierre-Mauroy", colors: ["#E30613", "#005CA9"], tier: 4, squad: [] },
     { id: "fra_lyo", name: "Lyon", short: "LYO", city: "Lyon", stadium: "Groupama Stadium", colors: ["#005CA9", "#E30613"], tier: 3, squad: [] },
     { id: "fra_nic", name: "Nice", short: "NIC", city: "Nice", stadium: "Allianz Riviera", colors: ["#E30613", "#000000"], tier: 3, squad: [] },
     { id: "fra_len", name: "Lens", short: "LEN", city: "Lens", stadium: "Bollaert-Delelis", colors: ["#FFD700", "#E30613"], tier: 3, squad: [] },
     { id: "fra_ren", name: "Rennes", short: "REN", city: "Rennes", stadium: "Roazhon Park", colors: ["#E30613", "#000000"], tier: 3, squad: [] },
     { id: "fra_str", name: "Strasbourg", short: "STR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fra_bre", name: "Brest", short: "BRE", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fra_tou", name: "Toulouse", short: "TOU", colors: ["#4B2E83", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fra_nan", name: "Nantes", short: "NAN", colors: ["#FFD700", "#00A650"], tier: 2, squad: [] },
     { id: "fra_lha", name: "Le Havre", short: "LHA", colors: ["#005CA9", "#87CEEB"], tier: 2, squad: [] },
     { id: "fra_rei", name: "Reims", short: "REI", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fra_aux", name: "Auxerre", short: "AUX", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fra_ang", name: "Angers", short: "ANG", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fra_set", name: "Saint-Étienne", short: "SET", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fra_mtp", name: "Montpellier", short: "MTP", colors: ["#005CA9", "#FF6600"], tier: 2, squad: [] },
   ];
   const RAW_FR_FL2 = [
     { id: "fra_met", name: "Metz", short: "MET", colors: ["#8A1538", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fra_lor", name: "Lorient", short: "LOR", colors: ["#FF6600", "#000000"], tier: 2, squad: [] },
     { id: "fra_bor", name: "Bordeaux", short: "BOR", colors: ["#00205B", "#E30613"], tier: 2, squad: [] },
     { id: "fra_gui", name: "Guingamp", short: "GUI", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "fra_bas", name: "Bastia", short: "BAS", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_gre", name: "Grenoble", short: "GRE", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_pfc", name: "Paris FC", short: "PFC", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fra_cae", name: "Caen", short: "CAE", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "fra_aja", name: "Ajaccio", short: "AJA", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_ami", name: "Amiens", short: "AMI", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_ann", name: "Annecy", short: "ANN", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_dun", name: "Dunkerque", short: "DUN", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "fra_lav", name: "Laval", short: "LAV", colors: ["#FF6600", "#000000"], tier: 1, squad: [] },
     { id: "fra_pau", name: "Pau", short: "PAU", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "fra_rod", name: "Rodez", short: "ROD", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "fra_tro", name: "Troyes", short: "TRO", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fra_cle", name: "Clermont", short: "CLE", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "fra_rst", name: "Red Star", short: "RST", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
   ];
   const RAW_FR_FN1 = [
     { id: "fra_lem", name: "Le Mans", short: "LEM", colors: ["#FFD700", "#E30613"], tier: 1, squad: [] },
     { id: "fra_ncy", name: "Nancy", short: "NCY", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_orl", name: "Orléans", short: "ORL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_cha", name: "Châteauroux", short: "CHA", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "fra_nim", name: "Nîmes", short: "NIM", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_soc", name: "Sochaux", short: "SOC", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "fra_bou", name: "Boulogne", short: "BOU", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "fra_dij", name: "Dijon", short: "DIJ", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_con", name: "Concarneau", short: "CON", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_qro", name: "Quevilly-Rouen", short: "QRO", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_mrt", name: "Martigues", short: "MRT", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "fra_bpe", name: "Bourg-Péronnas", short: "BPE", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "fra_vil", name: "Villefranche", short: "VIL", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_ver", name: "Versailles", short: "VER", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "fra_epi", name: "Épinal", short: "EPI", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_fle", name: "Fleury", short: "FLE", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
   ];
   const RAW_FR_FN2 = [
     { id: "fra_cho", name: "Cholet", short: "CHO", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_her", name: "Les Herbiers", short: "HER", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_sma", name: "Saint-Malo", short: "SMA", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "fra_hye", name: "Hyères", short: "HYE", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_rum", name: "Rumilly", short: "RUM", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "fra_puy", name: "Le Puy", short: "PUY", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_bel", name: "Belfort", short: "BEL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_was", name: "Wasquehal", short: "WAS", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "fra_blo", name: "Blois", short: "BLO", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "fra_sau", name: "Saumur", short: "SAU", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_poi", name: "Poissy", short: "POI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_p13", name: "Paris 13 Atletico", short: "P13", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "fra_sed", name: "Sedan", short: "SED", colors: ["#00A650", "#E30613"], tier: 1, squad: [] },
     { id: "fra_duc", name: "Lyon La Duchère", short: "DUC", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fra_gfc", name: "GOAL FC", short: "GFC", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "fra_mci", name: "Marignane", short: "MCI", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
   ];

   // ---- SPAIN tier 3-4 (Primera Federación / Segunda Federación) ----
   const RAW_ES_PRF = [
     { id: "esp_pon", name: "Ponferradina", short: "PON", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "esp_nas", name: "Nàstic Tarragona", short: "NAS", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "esp_mur", name: "Real Murcia", short: "MUR", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "esp_her", name: "Hércules", short: "HER", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_sab", name: "Sabadell", short: "SAB", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_mrb", name: "Marbella", short: "MRB", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_ceu", name: "AD Ceuta", short: "CEU", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_ibi", name: "UD Ibiza", short: "IBI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_ant", name: "Antequera", short: "ANT", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_tar", name: "Tarazona", short: "TAR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_san", name: "Sanluqueño", short: "SAN", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_ter", name: "Teruel", short: "TER", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_bar", name: "Barakaldo", short: "BAR", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "esp_are", name: "Arenteiro", short: "ARE", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_gui", name: "Guijuelo", short: "GUI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_yec", name: "Yeclano", short: "YEC", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "esp_lug", name: "Lugo", short: "LUG", colors: ["#FFFFFF", "#E30613"], tier: 1, squad: [] },
     { id: "esp_zam", name: "Zamora", short: "ZAM", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
   ];
   const RAW_ES_SGF = [
     { id: "esp_num", name: "Numancia", short: "NUM", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_ptv", name: "Pontevedra", short: "PTV", colors: ["#005CA9", "#000000"], tier: 1, squad: [] },
     { id: "esp_maj", name: "Rayo Majadahonda", short: "MAJ", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_ses", name: "Sestao River", short: "SES", colors: ["#000000", "#E30613"], tier: 1, squad: [] },
     { id: "esp_avi", name: "Real Avilés", short: "AVI", colors: ["#FFFFFF", "#005CA9"], tier: 1, squad: [] },
     { id: "esp_cac", name: "Cacereño", short: "CAC", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_tal", name: "Talavera", short: "TAL", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_mer", name: "Mérida", short: "MER", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "esp_cor", name: "Coria", short: "COR", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_utr", name: "Utrera", short: "UTR", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_est", name: "Estepona", short: "EST", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_lin", name: "Linares", short: "LIN", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "esp_ori", name: "Orihuela", short: "ORI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_agu", name: "Águilas", short: "AGU", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "esp_mel", name: "Melilla", short: "MEL", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "esp_lor", name: "Lorca", short: "LOR", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // ---- GERMANY tier 3-4 (3. Liga / Regionalliga) ----
   const RAW_DE_BL3 = [
     { id: "ger_m60", name: "1860 Munich", short: "M60", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ger_cot", name: "Energie Cottbus", short: "COT", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_rwe", name: "Rot-Weiss Essen", short: "RWE", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_wal", name: "Waldhof Mannheim", short: "WAL", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_saa", name: "1. FC Saarbrücken", short: "SAA", colors: ["#005CA9", "#000000"], tier: 1, squad: [] },
     { id: "ger_aue", name: "Erzgebirge Aue", short: "AUE", colors: ["#4B2E83", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_ing", name: "Ingolstadt", short: "ING", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ger_osn", name: "Osnabrück", short: "OSN", colors: ["#4B2E83", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_vik", name: "Viktoria Köln", short: "VIK", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_ver", name: "SC Verl", short: "VER", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_san", name: "Sandhausen", short: "SAN", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "ger_han", name: "Hansa Rostock", short: "HAN", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_hav", name: "TSV Havelse", short: "HAV", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_weh", name: "Wehen Wiesbaden", short: "WEH", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ger_dui", name: "MSV Duisburg", short: "DUI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_aac", name: "Alemannia Aachen", short: "AAC", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "ger_uhc", name: "Unterhaching", short: "UHC", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "ger_swf", name: "Schweinfurt", short: "SWF", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
   ];
   const RAW_DE_BL4 = [
     { id: "ger_off", name: "Kickers Offenbach", short: "OFF", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_hom", name: "FC Homburg", short: "HOM", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_stk", name: "Stuttgart Kickers", short: "STK", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "ger_ulm", name: "SSV Ulm", short: "ULM", colors: ["#FFFFFF", "#000000"], tier: 1, squad: [] },
     { id: "ger_bal", name: "TSG Balingen", short: "BAL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_bah", name: "Bahlinger SC", short: "BAH", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ger_fsv", name: "FSV Frankfurt", short: "FSV", colors: ["#000000", "#E30613"], tier: 1, squad: [] },
     { id: "ger_fre", name: "SGV Freiberg", short: "FRE", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_ste", name: "TSV Steinbach", short: "STE", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_kob", name: "Rot-Weiß Koblenz", short: "KOB", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_tri", name: "Eintracht Trier", short: "TRI", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "ger_wor", name: "Wormatia Worms", short: "WOR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_byr", name: "SpVgg Bayreuth", short: "BYR", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "ger_wue", name: "Würzburger Kickers", short: "WUE", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ger_asc", name: "Viktoria Aschaffenburg", short: "ASC", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "ger_aal", name: "VfR Aalen", short: "AAL", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // ---- ITALY tier 3-4 (Serie C / Serie D) ----
   const RAW_IT_SEC = [
     { id: "ita_vic", name: "Vicenza", short: "VIC", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ita_ter", name: "Ternana", short: "TER", colors: ["#00A650", "#E30613"], tier: 1, squad: [] },
     { id: "ita_cta", name: "Catania", short: "CTA", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "ita_ave", name: "Avellino", short: "AVE", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_ben", name: "Benevento", short: "BEN", colors: ["#FFD700", "#E30613"], tier: 1, squad: [] },
     { id: "ita_cro", name: "Crotone", short: "CRO", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "ita_pes", name: "Pescara", short: "PES", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_fog", name: "Foggia", short: "FOG", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ita_tra", name: "Trapani", short: "TRA", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "ita_cer", name: "Cerignola", short: "CER", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "ita_lat", name: "Latina", short: "LAT", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_cas", name: "Casertana", short: "CAS", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ita_pad", name: "Padova", short: "PAD", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_trs", name: "Triestina", short: "TRS", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_pvc", name: "Pro Vercelli", short: "PVC", colors: ["#FFFFFF", "#000000"], tier: 1, squad: [] },
     { id: "ita_alb", name: "AlbinoLeffe", short: "ALB", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "ita_nov", name: "Novara", short: "NOV", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_per", name: "Pergolettese", short: "PER", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
   ];
   const RAW_IT_SED = [
     { id: "ita_noc", name: "Nocerina", short: "NOC", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ita_csr", name: "Casarano", short: "CSR", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "ita_chi", name: "Chieri", short: "CHI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_sgi", name: "Sangiuliano", short: "SGI", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_fan", name: "Fanfulla", short: "FAN", colors: ["#FFFFFF", "#005CA9"], tier: 1, squad: [] },
     { id: "ita_leg", name: "Legnano", short: "LEG", colors: ["#4B2E83", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_vae", name: "Varese", short: "VAE", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_snr", name: "Sanremese", short: "SNR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_cal", name: "Caldiero", short: "CAL", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
     { id: "ita_fzu", name: "Fiorenzuola", short: "FZU", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ita_rav", name: "Ravenna", short: "RAV", colors: ["#FFD700", "#E30613"], tier: 1, squad: [] },
     { id: "ita_for", name: "Forlì", short: "FOR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_imo", name: "Imolese", short: "IMO", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "ita_luc", name: "Lucchese", short: "LUC", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ita_ppa", name: "Pro Patria", short: "PPA", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ita_cle", name: "Real Calepina", short: "CLE", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
   ];

   // Attach league tag, club reference & ids onto every club / player.
   const CLUBS = [
     ...RAW_CLUBS.map(c => {
       c.league = "PL";
       c.squad.forEach(p => { p.club = c.id; });
       c.crestInitials = c.short;
       return c;
     }),
     ...RAW_CHAMPIONSHIP.map(c => { c.league = "CH"; c.crestInitials = c.short; return c; }),
     ...RAW_LEAGUEONE.map(c => { c.league = "L1"; c.crestInitials = c.short; return c; }),
     ...RAW_LEAGUETWO.map(c => { c.league = "L2"; c.crestInitials = c.short; return c; }),
     ...RAW_LALIGA.map(c => { c.league = "LL"; c.crestInitials = c.short; return c; }),
     ...RAW_SEGUNDA.map(c => { c.league = "SG"; c.crestInitials = c.short; return c; }),
     ...RAW_DE_BL1.map(c => { c.league = "BL1"; c.crestInitials = c.short; return c; }),
     ...RAW_DE_BL2.map(c => { c.league = "BL2"; c.crestInitials = c.short; return c; }),
     ...RAW_IT_SA.map(c => { c.league = "SA"; c.crestInitials = c.short; return c; }),
     ...RAW_IT_SB.map(c => { c.league = "SB"; c.crestInitials = c.short; return c; }),
     ...RAW_PT_PP.map(c => { c.league = "PP"; c.crestInitials = c.short; return c; }),
     ...RAW_PT_P2.map(c => { c.league = "P2"; c.crestInitials = c.short; return c; }),
     ...RAW_NL_ER.map(c => { c.league = "ER"; c.crestInitials = c.short; return c; }),
     ...RAW_NL_EE.map(c => { c.league = "EE"; c.crestInitials = c.short; return c; }),
     ...RAW_PL_EK.map(c => { c.league = "EK"; c.crestInitials = c.short; return c; }),
     ...RAW_PL_IL.map(c => { c.league = "IL"; c.crestInitials = c.short; return c; }),
     ...RAW_TR_SL.map(c => { c.league = "SL"; c.crestInitials = c.short; return c; }),
     ...RAW_TR_T1.map(c => { c.league = "T1"; c.crestInitials = c.short; return c; }),
     ...RAW_BE_BPL.map(c => { c.league = "BPL"; c.crestInitials = c.short; return c; }),
     ...RAW_BE_BCH.map(c => { c.league = "BCH"; c.crestInitials = c.short; return c; }),
     ...RAW_AT_ABL.map(c => { c.league = "ABL"; c.crestInitials = c.short; return c; }),
     ...RAW_AT_A2L.map(c => { c.league = "A2L"; c.crestInitials = c.short; return c; }),
     ...RAW_DK_DSL.map(c => { c.league = "DSL"; c.crestInitials = c.short; return c; }),
     ...RAW_DK_D1D.map(c => { c.league = "D1D"; c.crestInitials = c.short; return c; }),
     ...RAW_GR_GSL.map(c => { c.league = "GSL"; c.crestInitials = c.short; return c; }),
     ...RAW_GR_GS2.map(c => { c.league = "GS2"; c.crestInitials = c.short; return c; }),
     ...RAW_SC_SPL.map(c => { c.league = "SPL"; c.crestInitials = c.short; return c; }),
     ...RAW_SC_SC2.map(c => { c.league = "SC2"; c.crestInitials = c.short; return c; }),
     ...RAW_CH_SSL.map(c => { c.league = "SSL"; c.crestInitials = c.short; return c; }),
     ...RAW_CH_SCL.map(c => { c.league = "SCL"; c.crestInitials = c.short; return c; }),
     ...RAW_HR_HNL.map(c => { c.league = "HNL"; c.crestInitials = c.short; return c; }),
     ...RAW_HR_HN2.map(c => { c.league = "HN2"; c.crestInitials = c.short; return c; }),
     ...RAW_HU_NB1.map(c => { c.league = "NB1"; c.crestInitials = c.short; return c; }),
     ...RAW_HU_NB2.map(c => { c.league = "NB2"; c.crestInitials = c.short; return c; }),
     ...RAW_FR_FL1.map(c => { c.league = "FL1"; c.crestInitials = c.short; return c; }),
     ...RAW_FR_FL2.map(c => { c.league = "FL2"; c.crestInitials = c.short; return c; }),
     ...RAW_FR_FN1.map(c => { c.league = "FN1"; c.crestInitials = c.short; return c; }),
     ...RAW_FR_FN2.map(c => { c.league = "FN2"; c.crestInitials = c.short; return c; }),
     ...RAW_ES_PRF.map(c => { c.league = "PRF"; c.crestInitials = c.short; return c; }),
     ...RAW_ES_SGF.map(c => { c.league = "SGF"; c.crestInitials = c.short; return c; }),
     ...RAW_DE_BL3.map(c => { c.league = "BL3"; c.crestInitials = c.short; return c; }),
     ...RAW_DE_BL4.map(c => { c.league = "BL4"; c.crestInitials = c.short; return c; }),
     ...RAW_IT_SEC.map(c => { c.league = "SEC"; c.crestInitials = c.short; return c; }),
     ...RAW_IT_SED.map(c => { c.league = "SED"; c.crestInitials = c.short; return c; }),
   ];

   function clubById(id) { return CLUBS.find(c => c.id === id); }

   // ---- League registry: the single source of truth for the world ----------
   // Every league in the game is one entry here, listed top-to-bottom within
   // each country (that order IS the promotion/relegation chain). Adding a
   // country to the world is a matter of appending its leagues here (plus club
   // metadata and, later, its cups) — every derived map below fans out for
   // free. `econ` is the per-division money multiplier (lower leagues are far
   // poorer). Only the country you manage in carries real player squads; every
   // other country's clubs are strength-only (see state.js / match.js).
   const LEAGUE_REGISTRY = [
     { code: "PL", name: "Premier League",   short: "Prem",    country: "ENG", econ: 1 },
     { code: "CH", name: "Championship",     short: "Champ",   country: "ENG", econ: 1 },
     { code: "L1", name: "League One",       short: "Lg 1",    country: "ENG", econ: 0.4 },
     { code: "L2", name: "League Two",       short: "Lg 2",    country: "ENG", econ: 0.18 },
     { code: "LL", name: "La Liga",          short: "La Liga", country: "ESP", econ: 1 },
     { code: "SG", name: "Segunda División", short: "Segunda", country: "ESP", econ: 0.6 },
     { code: "PRF", name: "Primera Federación", short: "Primera Fed", country: "ESP", econ: 0.35 },
     { code: "SGF", name: "Segunda Federación", short: "Segunda Fed", country: "ESP", econ: 0.15 },
     { code: "BL1", name: "Bundesliga",        short: "Bundesliga", country: "GER", econ: 1 },
     { code: "BL2", name: "2. Bundesliga",     short: "2.Bundesliga", country: "GER", econ: 0.55 },
     { code: "BL3", name: "3. Liga",           short: "3. Liga",    country: "GER", econ: 0.35 },
     { code: "BL4", name: "Regionalliga",      short: "Regionalliga", country: "GER", econ: 0.15 },
     { code: "SA",  name: "Serie A",           short: "Serie A",    country: "ITA", econ: 1 },
     { code: "SB",  name: "Serie B",           short: "Serie B",    country: "ITA", econ: 0.55 },
     { code: "SEC", name: "Serie C",           short: "Serie C",    country: "ITA", econ: 0.35 },
     { code: "SED", name: "Serie D",           short: "Serie D",    country: "ITA", econ: 0.15 },
     { code: "FL1", name: "Ligue 1",           short: "Ligue 1",    country: "FRA", econ: 1 },
     { code: "FL2", name: "Ligue 2",           short: "Ligue 2",    country: "FRA", econ: 0.5 },
     { code: "FN1", name: "National",          short: "National",   country: "FRA", econ: 0.3 },
     { code: "FN2", name: "National 2",        short: "National 2", country: "FRA", econ: 0.15 },
     { code: "PP",  name: "Primeira Liga",     short: "Primeira",   country: "POR", econ: 0.8 },
     { code: "P2",  name: "Liga Portugal 2",   short: "Liga 2",     country: "POR", econ: 0.4 },
     { code: "ER",  name: "Eredivisie",        short: "Eredivisie", country: "NED", econ: 0.8 },
     { code: "EE",  name: "Eerste Divisie",    short: "Eerste",     country: "NED", econ: 0.4 },
     { code: "EK",  name: "Ekstraklasa",       short: "Ekstraklasa",country: "POL", econ: 0.55 },
     { code: "IL",  name: "I liga",            short: "I liga",     country: "POL", econ: 0.28 },
     { code: "SL",  name: "Süper Lig",         short: "Süper Lig",  country: "TUR", econ: 0.7 },
     { code: "T1",  name: "1. Lig",            short: "1. Lig",     country: "TUR", econ: 0.35 },
     // Championship/relegation-split nations (Phase 4).
     { code: "BPL", name: "Belgian Pro League", short: "Pro League", country: "BEL", econ: 0.6,  format: { split: { groups: [8, 8], legs: 1, points: "halveUp" } } },
     { code: "BCH", name: "Challenger Pro League", short: "Challenger", country: "BEL", econ: 0.3 },
     { code: "ABL", name: "Austrian Bundesliga", short: "A-Bundesliga", country: "AUT", econ: 0.55, format: { split: { groups: [6, 6], legs: 1, points: "halveDown" } } },
     { code: "A2L", name: "2. Liga",            short: "2. Liga",    country: "AUT", econ: 0.28 },
     { code: "DSL", name: "Superliga",          short: "Superliga",  country: "DEN", econ: 0.6,  format: { split: { groups: [6, 6], legs: 1, points: "carry" } } },
     { code: "D1D", name: "1. Division",        short: "1. Division", country: "DEN", econ: 0.3 },
     { code: "GSL", name: "Super League",       short: "Super League", country: "GRE", econ: 0.5, format: { split: { groups: [7, 7], legs: 1, points: "carry" } } },
     { code: "GS2", name: "Super League 2",     short: "Super Lg 2", country: "GRE", econ: 0.25 },
     // N-times round-robin nations (Phase 5).
     { code: "SPL", name: "Scottish Premiership", short: "Premiership", country: "SCO", econ: 0.6, format: { rounds: 3, split: { groups: [6, 6], legs: 1, points: "carry" } } },
     { code: "SC2", name: "Scottish Championship", short: "Championship", country: "SCO", econ: 0.3, format: { rounds: 4 } },
     { code: "SSL", name: "Swiss Super League",  short: "Super League", country: "SUI", econ: 0.6, format: { rounds: 3, split: { groups: [6, 6], legs: 1, points: "carry" } } },
     { code: "SCL", name: "Challenge League",    short: "Challenge", country: "SUI", econ: 0.3, format: { rounds: 4 } },
     { code: "HNL", name: "SuperSport HNL",      short: "HNL",       country: "CRO", econ: 0.4, format: { rounds: 4 } },
     { code: "HN2", name: "Prva NL",             short: "Prva NL",   country: "CRO", econ: 0.2 },
     { code: "NB1", name: "Nemzeti Bajnokság I", short: "NB I",      country: "HUN", econ: 0.4, format: { rounds: 3 } },
     { code: "NB2", name: "Nemzeti Bajnokság II", short: "NB II",    country: "HUN", econ: 0.2 },
   ];
   const COUNTRY_NAMES = {
     ENG: "England", ESP: "Spain", GER: "Germany", ITA: "Italy", FRA: "France",
     POR: "Portugal", NED: "Netherlands", POL: "Poland", TUR: "Turkey",
     BEL: "Belgium", AUT: "Austria", DEN: "Denmark", GRE: "Greece",
     SCO: "Scotland", SUI: "Switzerland", CRO: "Croatia", HUN: "Hungary",
   };

   const LEAGUES        = LEAGUE_REGISTRY.map(l => l.code);
   const LEAGUE_NAMES   = Object.fromEntries(LEAGUE_REGISTRY.map(l => [l.code, l.name]));
   const LEAGUE_SHORT   = Object.fromEntries(LEAGUE_REGISTRY.map(l => [l.code, l.short]));
   const LEAGUE_ECON    = Object.fromEntries(LEAGUE_REGISTRY.map(l => [l.code, l.econ]));
   const LEAGUE_COUNTRY = Object.fromEntries(LEAGUE_REGISTRY.map(l => [l.code, l.country]));
   // Optional per-league format (championship/relegation split etc.); most
   // leagues have none (a plain double round-robin).
   const LEAGUE_FORMAT = Object.fromEntries(LEAGUE_REGISTRY.filter(l => l.format).map(l => [l.code, l.format]));
   function leagueFormat(league) { return LEAGUE_FORMAT[league] || null; }
   // Countries in registry order; each country's chain is its leagues top-down.
   const COUNTRIES = [...new Set(LEAGUE_REGISTRY.map(l => l.country))];
   const LEAGUE_CHAINS = COUNTRIES.reduce((acc, co) => {
     acc[co] = LEAGUE_REGISTRY.filter(l => l.country === co).map(l => l.code);
     return acc;
   }, {});
   function chainFor(league) { return LEAGUE_CHAINS[LEAGUE_COUNTRY[league]] || LEAGUE_CHAINS[COUNTRIES[0]]; }

   // Baseline XI strength for a strength-only (foreign) club at a given
   // reputation tier — anchored to the same scale Dynamics gravitates rivals
   // toward, with a touch of jitter so a division isn't perfectly uniform.
   function baseStrengthForTier(tier) {
     const base = { 5: 84, 4: 79, 3: 74, 2: 69, 1: 64, 0: 59 }[tier] ?? 66;
     return Math.max(45, Math.min(90, base + Math.floor(Math.random() * 5) - 2));
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