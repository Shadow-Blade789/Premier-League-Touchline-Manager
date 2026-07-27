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
     SWE: { first: ["Oscar","William","Lucas","Elias","Hugo","Axel","Viktor","Isak","Filip","Gustav"], last: ["Andersson","Johansson","Karlsson","Nilsson","Eriksson","Larsson","Olsson","Persson","Svensson","Gustafsson"] },
     CZE: { first: ["Jan","Tomáš","Jakub","Lukáš","Martin","Adam","Ondřej","Petr","David","Matěj"], last: ["Novák","Svoboda","Novotný","Dvořák","Černý","Procházka","Kučera","Veselý","Horák","Němec"] },
     SRB: { first: ["Nikola","Luka","Stefan","Marko","Aleksa","Filip","Miloš","Petar","Nemanja","Uroš"], last: ["Jovanović","Petrović","Nikolić","Marković","Đorđević","Stojanović","Ilić","Pavlović","Kovačević","Popović"] },
     UKR: { first: ["Andriy","Oleksandr","Dmytro","Serhiy","Bohdan","Artem","Maksym","Vladyslav","Yuriy","Denys"], last: ["Shevchenko","Kovalenko","Bondarenko","Tkachenko","Kravchenko","Melnyk","Boyko","Kovalchuk","Lysenko","Marchenko"] },
     ROU: { first: ["Andrei","Alexandru","Ionuț","Gabriel","Florin","Cristian","Ștefan","Denis","Rareș","Vlad"], last: ["Popa","Ionescu","Popescu","Dumitru","Stan","Gheorghe","Matei","Constantin","Marin","Dinu"] },
     SVK: { first: ["Martin","Tomáš","Lukáš","Jakub","Adam","Matúš","Filip","Peter","Michal","Dávid"], last: ["Horváth","Kováč","Varga","Tóth","Baláž","Novák","Molnár","Szabó","Lukáč","Marček"] },
   };
   const NATION_WEIGHTS = ["ENG","ENG","ENG","ENG","ENG","FRA","FRA","BRA","BRA","NED","POR","NGA","ARG","ESP","GER","IRL","SEN","HRV","NOR","JPN","USA","COL"];
   // Each footballing country's primary player nationality, for home-skewed squads.
   const COUNTRY_NAT = {
     ENG: "ENG", ESP: "ESP", GER: "GER", ITA: "ITA", FRA: "FRA", POR: "POR", NED: "NED",
     POL: "POL", TUR: "TUR", BEL: "BEL", AUT: "AUT", DEN: "DEN", GRE: "GRE", SCO: "SCO",
     SUI: "SUI", CRO: "HRV", HUN: "HUN",
     CZE: "CZE", SRB: "SRB", UKR: "UKR", SWE: "SWE", NOR: "NOR", ROU: "ROU", CYP: "GRE", SVK: "SVK",
     // Batch-3 nations reuse the nearest existing name pool (others fall back to a global mix).
     SVN: "HRV", BIH: "HRV", MKD: "SRB", MNE: "SRB", BUL: "SRB", MDA: "ROU", BLR: "UKR",
     AZE: "TUR", IRL: "IRL", NIR: "IRL", WAL: "ENG", GIB: "ESP", AND: "ESP", SMR: "ITA",
     FRO: "DEN", MLT: "ITA",
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

   // =========================================================================
   // FURTHER UEFA NATIONS (batch 2) — top flight + second tier each.
   // =========================================================================
   const RAW_CZ_CZ1 = [
     { id: "cze_sla", name: "Slavia Praha", short: "SLA", colors: ["#E30613", "#FFFFFF"], tier: 4, squad: [] },
     { id: "cze_spa", name: "Sparta Praha", short: "SPA", colors: ["#8A1538", "#FFD700"], tier: 4, squad: [] },
     { id: "cze_plz", name: "Viktoria Plzeň", short: "PLZ", colors: ["#005CA9", "#E30613"], tier: 3, squad: [] },
     { id: "cze_ban", name: "Baník Ostrava", short: "BAN", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "cze_olo", name: "Sigma Olomouc", short: "OLO", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cze_slo", name: "Slovácko", short: "SLO", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cze_jab", name: "Jablonec", short: "JAB", colors: ["#00A650", "#FFD700"], tier: 2, squad: [] },
     { id: "cze_boh", name: "Bohemians 1905", short: "BOH", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cze_mbo", name: "Mladá Boleslav", short: "MBO", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cze_tep", name: "Teplice", short: "TEP", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "cze_hra", name: "Hradec Králové", short: "HRA", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cze_kar", name: "Karviná", short: "KAR", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cze_duk", name: "Dukla Praha", short: "DUK", colors: ["#8A1538", "#FFD700"], tier: 2, squad: [] },
     { id: "cze_par", name: "Pardubice", short: "PAR", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cze_zli", name: "Zlín", short: "ZLI", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "cze_lib", name: "Liberec", short: "LIB", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_CZ_CZ2 = [
     { id: "cze_vla", name: "Vlašim", short: "VLA", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cze_chr", name: "Chrudim", short: "CHR", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "cze_pri", name: "Příbram", short: "PRI", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "cze_tab", name: "Táborsko", short: "TAB", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cze_pro", name: "Prostějov", short: "PRO", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cze_vys", name: "Vyškov", short: "VYS", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "cze_ust", name: "Ústí nad Labem", short: "UST", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cze_kro", name: "Kroměříž", short: "KRO", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cze_opa", name: "Opava", short: "OPA", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "cze_lis", name: "Líšeň", short: "LIS", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cze_brn", name: "Zbrojovka Brno", short: "BRN", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "cze_jih", name: "Jihlava", short: "JIH", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cze_tri", name: "Třinec", short: "TRI", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cze_zno", name: "Znojmo", short: "ZNO", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
   ];

   const RAW_SR_SR1 = [
     { id: "srb_czv", name: "Crvena zvezda", short: "CZV", colors: ["#E30613", "#FFFFFF"], tier: 4, squad: [] },
     { id: "srb_par", name: "Partizan", short: "PAR", colors: ["#000000", "#FFFFFF"], tier: 4, squad: [] },
     { id: "srb_voj", name: "Vojvodina", short: "VOJ", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "srb_tsc", name: "TSC Bačka Topola", short: "TSC", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "srb_cuk", name: "Čukarički", short: "CUK", colors: ["#005CA9", "#000000"], tier: 2, squad: [] },
     { id: "srb_rni", name: "Radnički Niš", short: "RNI", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "srb_nap", name: "Napredak", short: "NAP", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "srb_spa", name: "Spartak Subotica", short: "SPA", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "srb_mla", name: "Mladost", short: "MLA", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "srb_imt", name: "IMT", short: "IMT", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "srb_npa", name: "Novi Pazar", short: "NPA", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "srb_zel", name: "Železničar", short: "ZEL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "srb_rad", name: "Radnik", short: "RAD", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "srb_jav", name: "Javor", short: "JAV", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "srb_ofk", name: "OFK Beograd", short: "OFK", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "srb_tek", name: "Tekstilac", short: "TEK", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_SR_SR2 = [
     { id: "srb_gra", name: "Grafičar", short: "GRA", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "srb_zem", name: "Zemun", short: "ZEM", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "srb_kol", name: "Kolubara", short: "KOL", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "srb_dub", name: "Dubočica", short: "DUB", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "srb_tra", name: "Trajal", short: "TRA", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "srb_slo", name: "Sloboda Užice", short: "SLO", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "srb_r23", name: "Radnički 1923", short: "R23", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "srb_jed", name: "Jedinstvo", short: "JED", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "srb_loz", name: "Loznica", short: "LOZ", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "srb_sin", name: "Sinđelić", short: "SIN", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "srb_bud", name: "Budućnost", short: "BUD", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "srb_zpa", name: "Železničar Pančevo", short: "ZPA", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "srb_gat", name: "Mladost GAT", short: "GAT", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "srb_sme", name: "Smederevo", short: "SME", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
   ];

   const RAW_UA_UA1 = [
     { id: "ukr_sha", name: "Shakhtar Donetsk", short: "SHA", colors: ["#FF6600", "#000000"], tier: 4, squad: [] },
     { id: "ukr_dyn", name: "Dynamo Kyiv", short: "DYN", colors: ["#005CA9", "#FFFFFF"], tier: 4, squad: [] },
     { id: "ukr_zor", name: "Zorya Luhansk", short: "ZOR", colors: ["#000000", "#E30613"], tier: 3, squad: [] },
     { id: "ukr_dn1", name: "Dnipro-1", short: "DN1", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ukr_vor", name: "Vorskla", short: "VOR", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ukr_kry", name: "Kryvbas", short: "KRY", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "ukr_ole", name: "Oleksandriya", short: "OLE", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "ukr_kol", name: "Kolos Kovalivka", short: "KOL", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ukr_ruk", name: "Rukh Lviv", short: "RUK", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "ukr_pol", name: "Polissya", short: "POL", colors: ["#00A650", "#FFD700"], tier: 2, squad: [] },
     { id: "ukr_ver", name: "Veres Rivne", short: "VER", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "ukr_obo", name: "Obolon", short: "OBO", colors: ["#005CA9", "#00A650"], tier: 2, squad: [] },
     { id: "ukr_lnz", name: "LNZ Cherkasy", short: "LNZ", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ukr_cho", name: "Chornomorets", short: "CHO", colors: ["#005CA9", "#000000"], tier: 2, squad: [] },
     { id: "ukr_krp", name: "Karpaty", short: "KRP", colors: ["#00A650", "#E30613"], tier: 2, squad: [] },
     { id: "ukr_liv", name: "Livyi Bereh", short: "LIV", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_UA_UA2 = [
     { id: "ukr_met", name: "Metalist Kharkiv", short: "MET", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "ukr_ahr", name: "Ahrobiznes", short: "AHR", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ukr_fen", name: "Feniks", short: "FEN", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "ukr_buk", name: "Bukovyna", short: "BUK", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
     { id: "ukr_nyt", name: "Nyva Ternopil", short: "NYT", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "ukr_pry", name: "Prykarpattia", short: "PRY", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "ukr_cha", name: "Chaika", short: "CHA", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ukr_mzp", name: "Metalurh", short: "MZP", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ukr_kra", name: "Kramatorsk", short: "KRA", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ukr_yar", name: "Yarud", short: "YAR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ukr_vik", name: "Viktoriya", short: "VIK", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "ukr_nyv", name: "Nyva Vinnytsia", short: "NYV", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "ukr_che", name: "Cherkasy", short: "CHE", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ukr_ep1", name: "Epitsentr", short: "EP1", colors: ["#FF6600", "#FFFFFF"], tier: 1, squad: [] },
   ];

   const RAW_SE_SE1 = [
     { id: "swe_mal", name: "Malmö FF", short: "MAL", colors: ["#0072CE", "#FFFFFF"], tier: 4, squad: [] },
     { id: "swe_aik", name: "AIK", short: "AIK", colors: ["#000000", "#FFD700"], tier: 3, squad: [] },
     { id: "swe_dju", name: "Djurgården", short: "DJU", colors: ["#005CA9", "#E30613"], tier: 3, squad: [] },
     { id: "swe_ham", name: "Hammarby", short: "HAM", colors: ["#00A650", "#FFFFFF"], tier: 3, squad: [] },
     { id: "swe_gbg", name: "IFK Göteborg", short: "GBG", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "swe_elf", name: "IF Elfsborg", short: "ELF", colors: ["#FFD700", "#000000"], tier: 3, squad: [] },
     { id: "swe_hac", name: "BK Häcken", short: "HAC", colors: ["#FFD700", "#000000"], tier: 3, squad: [] },
     { id: "swe_nor", name: "IFK Norrköping", short: "NOR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "swe_mja", name: "Mjällby", short: "MJA", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "swe_kal", name: "Kalmar", short: "KAL", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "swe_hal", name: "Halmstad", short: "HAL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "swe_gai", name: "GAIS", short: "GAI", colors: ["#00A650", "#000000"], tier: 2, squad: [] },
     { id: "swe_sir", name: "Sirius", short: "SIR", colors: ["#005CA9", "#000000"], tier: 2, squad: [] },
     { id: "swe_var", name: "Värnamo", short: "VAR", colors: ["#FFFFFF", "#E30613"], tier: 2, squad: [] },
     { id: "swe_bro", name: "Brommapojkarna", short: "BRO", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "swe_deg", name: "Degerfors", short: "DEG", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_SE_SE2 = [
     { id: "swe_org", name: "Örgryte", short: "ORG", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "swe_hbg", name: "Helsingborg", short: "HBG", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "swe_ost", name: "Östers", short: "OST", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "swe_lan", name: "Landskrona", short: "LAN", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "swe_tre", name: "Trelleborg", short: "TRE", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "swe_uts", name: "Utsikten", short: "UTS", colors: ["#00A650", "#000000"], tier: 1, squad: [] },
     { id: "swe_sun", name: "Sundsvall", short: "SUN", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "swe_ore", name: "Örebro", short: "ORE", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "swe_san", name: "Sandvikens", short: "SAN", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "swe_sko", name: "Skövde", short: "SKO", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "swe_odd", name: "Oddevold", short: "ODD", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "swe_kri", name: "Kristianstad", short: "KRI", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "swe_sol", name: "Sölvesborg", short: "SOL", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "swe_gef", name: "Gefle", short: "GEF", colors: ["#FFFFFF", "#00A650"], tier: 1, squad: [] },
   ];

   const RAW_NO_NO1 = [
     { id: "nor_bod", name: "Bodø/Glimt", short: "BOD", colors: ["#FFD700", "#000000"], tier: 4, squad: [] },
     { id: "nor_mol", name: "Molde", short: "MOL", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "nor_bra", name: "Brann", short: "BRA", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "nor_ros", name: "Rosenborg", short: "ROS", colors: ["#FFFFFF", "#000000"], tier: 3, squad: [] },
     { id: "nor_vik", name: "Viking", short: "VIK", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "nor_lil", name: "Lillestrøm", short: "LIL", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "nor_tro", name: "Tromsø", short: "TRO", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nor_sar", name: "Sarpsborg 08", short: "SAR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nor_str", name: "Strømsgodset", short: "STR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nor_fre", name: "Fredrikstad", short: "FRE", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nor_ham", name: "HamKam", short: "HAM", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nor_hau", name: "Haugesund", short: "HAU", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nor_kfu", name: "KFUM Oslo", short: "KFU", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "nor_kri", name: "Kristiansund", short: "KRI", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nor_san", name: "Sandefjord", short: "SAN", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "nor_bry", name: "Bryne", short: "BRY", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_NO_NO2 = [
     { id: "nor_val", name: "Vålerenga", short: "VAL", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "nor_sta", name: "Start", short: "STA", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "nor_mjo", name: "Mjøndalen", short: "MJO", colors: ["#8A1538", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nor_ran", name: "Ranheim", short: "RAN", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nor_rau", name: "Raufoss", short: "RAU", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nor_sog", name: "Sogndal", short: "SOG", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nor_asa", name: "Åsane", short: "ASA", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "nor_ege", name: "Egersund", short: "EGE", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "nor_lev", name: "Levanger", short: "LEV", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nor_sta2", name: "Stabæk", short: "STB", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nor_mos", name: "Moss", short: "MOS", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nor_lyn", name: "Lyn", short: "LYN", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "nor_ske", name: "Skeid", short: "SKE", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nor_kon", name: "Kongsvinger", short: "KON", colors: ["#8A1538", "#FFFFFF"], tier: 1, squad: [] },
   ];

   const RAW_RO_RO1 = [
     { id: "rou_fcs", name: "FCSB", short: "FCS", colors: ["#E30613", "#005CA9"], tier: 4, squad: [] },
     { id: "rou_cfr", name: "CFR Cluj", short: "CFR", colors: ["#8A1538", "#FFFFFF"], tier: 3, squad: [] },
     { id: "rou_ucr", name: "U. Craiova", short: "UCR", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "rou_rap", name: "Rapid București", short: "RAP", colors: ["#8A1538", "#FFFFFF"], tier: 3, squad: [] },
     { id: "rou_far", name: "Farul Constanța", short: "FAR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "rou_sep", name: "Sepsi", short: "SEP", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "rou_ucl", name: "U. Cluj", short: "UCL", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "rou_pet", name: "Petrolul", short: "PET", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "rou_uta", name: "UTA Arad", short: "UTA", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "rou_din", name: "Dinamo București", short: "DIN", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "rou_bot", name: "Botoșani", short: "BOT", colors: ["#E30613", "#FFD700"], tier: 2, squad: [] },
     { id: "rou_ote", name: "Oțelul Galați", short: "OTE", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "rou_her", name: "Hermannstadt", short: "HER", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "rou_buz", name: "Gloria Buzău", short: "BUZ", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "rou_slo", name: "Unirea Slobozia", short: "SLO", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "rou_ias", name: "Poli Iași", short: "IAS", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_RO_RO2 = [
     { id: "rou_ste", name: "Steaua București", short: "STE", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "rou_cor", name: "Corvinul", short: "COR", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "rou_cam", name: "Câmpulung", short: "CAM", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "rou_met", name: "Metaloglobus", short: "MET", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "rou_chi", name: "Concordia Chiajna", short: "CHI", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "rou_dum", name: "Dumbrăvița", short: "DUM", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "rou_res", name: "Reșița", short: "RES", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "rou_sla", name: "Slatina", short: "SLA", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "rou_tar", name: "Chindia Târgoviște", short: "TAR", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "rou_vol", name: "Voluntari", short: "VOL", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "rou_bac", name: "Bacău", short: "BAC", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "rou_tun", name: "Tunari", short: "TUN", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "rou_sel", name: "Șelimbăr", short: "SEL", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "rou_bih", name: "Bihor Oradea", short: "BIH", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
   ];

   const RAW_CY_CY1 = [
     { id: "cyp_apo", name: "APOEL", short: "APO", colors: ["#FFD700", "#005CA9"], tier: 3, squad: [] },
     { id: "cyp_omo", name: "Omonia", short: "OMO", colors: ["#00A650", "#FFFFFF"], tier: 3, squad: [] },
     { id: "cyp_aek", name: "AEK Larnaca", short: "AEK", colors: ["#FFD700", "#005CA9"], tier: 3, squad: [] },
     { id: "cyp_ari", name: "Aris Limassol", short: "ARI", colors: ["#005CA9", "#FFD700"], tier: 3, squad: [] },
     { id: "cyp_apl", name: "Apollon", short: "APL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cyp_paf", name: "Pafos", short: "PAF", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "cyp_ael", name: "AEL Limassol", short: "AEL", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "cyp_ano", name: "Anorthosis", short: "ANO", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cyp_eth", name: "Ethnikos Achna", short: "ETH", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "cyp_nsa", name: "Nea Salamina", short: "NSA", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cyp_kar", name: "Karmiotissa", short: "KAR", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cyp_dox", name: "Doxa", short: "DOX", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "cyp_akr", name: "Akritas", short: "AKR", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "cyp_oth", name: "Othellos", short: "OTH", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_CY_CY2 = [
     { id: "cyp_par", name: "Enosis Paralimni", short: "PAR", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "cyp_oly", name: "Olympiakos Nic.", short: "OLY", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cyp_dig", name: "Digenis", short: "DIG", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cyp_asi", name: "ASIL", short: "ASI", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "cyp_xyl", name: "PO Xylotymbou", short: "XYL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cyp_oni", name: "Onisilos", short: "ONI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cyp_ana", name: "Ayia Napa", short: "ANA", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "cyp_ara", name: "Omonia Aradippou", short: "ARA", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cyp_ena", name: "ENAD", short: "ENA", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "cyp_ach", name: "Achyronas", short: "ACH", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cyp_cha", name: "Chalkanoras", short: "CHA", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "cyp_erm", name: "Ermis", short: "ERM", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "cyp_pae", name: "PAEEK", short: "PAE", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "cyp_yps", name: "Ypsonas", short: "YPS", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
   ];

   const RAW_SK_SK1 = [
     { id: "svk_slo", name: "Slovan Bratislava", short: "SLO", colors: ["#005CA9", "#FFFFFF"], tier: 4, squad: [] },
     { id: "svk_trn", name: "Spartak Trnava", short: "TRN", colors: ["#000000", "#E30613"], tier: 3, squad: [] },
     { id: "svk_zil", name: "Žilina", short: "ZIL", colors: ["#00A650", "#FFD700"], tier: 3, squad: [] },
     { id: "svk_dac", name: "Dunajská Streda", short: "DAC", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "svk_mic", name: "Michalovce", short: "MIC", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "svk_ruz", name: "Ružomberok", short: "RUZ", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "svk_kos", name: "Košice", short: "KOS", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "svk_tre", name: "Trenčín", short: "TRE", colors: ["#E30613", "#00A650"], tier: 2, squad: [] },
     { id: "svk_pod", name: "Podbrezová", short: "POD", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "svk_ska", name: "Skalica", short: "SKA", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "svk_zmo", name: "Zlaté Moravce", short: "ZMO", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "svk_kom", name: "Komárno", short: "KOM", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_SK_SK2 = [
     { id: "svk_pet", name: "Petržalka", short: "PET", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svk_bby", name: "Banská Bystrica", short: "BBY", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svk_pre", name: "Prešov", short: "PRE", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svk_puc", name: "Púchov", short: "PUC", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svk_lmi", name: "Liptovský Mikuláš", short: "LMI", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "svk_dub", name: "Dubnica", short: "DUB", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svk_sam", name: "Šamorín", short: "SAM", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "svk_tat", name: "Tatran", short: "TAT", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svk_nit", name: "Nitra", short: "NIT", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svk_bar", name: "Bardejov", short: "BAR", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "svk_hum", name: "Humenné", short: "HUM", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "svk_bol", name: "Boleráz", short: "BOL", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svk_mal", name: "Malženice", short: "MAL", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svk_zvo", name: "Zvolen", short: "ZVO", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
   ];

   // =========================================================================
   // ALL REMAINING UEFA NATIONS (batch 3). Top flight + a small 2nd tier each
   // (San Marino single tier). Metadata only — strength-only unless managed.
   // =========================================================================
   const mk = (arr) => arr; // identity, for readability

   // --- SLOVENIA (PrvaLiga, quad) ---
   const RAW_SVN1 = [
     { id: "svn_oli", name: "Olimpija Ljubljana", short: "OLI", colors: ["#00A650", "#FFFFFF"], tier: 3, squad: [] },
     { id: "svn_mar", name: "Maribor", short: "MAR", colors: ["#4B2E83", "#FFD700"], tier: 3, squad: [] },
     { id: "svn_cel", name: "Celje", short: "CEL", colors: ["#005CA9", "#FFD700"], tier: 3, squad: [] },
     { id: "svn_mur", name: "Mura", short: "MUR", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "svn_kop", name: "Koper", short: "KOP", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "svn_bra", name: "Bravo", short: "BRA", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "svn_dom", name: "Domžale", short: "DOM", colors: ["#FFD700", "#00A650"], tier: 2, squad: [] },
     { id: "svn_rad", name: "Radomlje", short: "RAD", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "svn_naf", name: "Nafta", short: "NAF", colors: ["#000000", "#FFD700"], tier: 2, squad: [] },
     { id: "svn_pri", name: "Primorje", short: "PRI", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_SVN2 = [
     { id: "svn_tri", name: "Triglav", short: "TRI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svn_rog", name: "Rogaška", short: "ROG", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svn_bel", name: "Beltinci", short: "BEL", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svn_ili", name: "Ilirija", short: "ILI", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "svn_krk", name: "Krka", short: "KRK", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svn_bil", name: "Bilje", short: "BIL", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "svn_bri", name: "Brinje", short: "BRI", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "svn_dob", name: "Dob", short: "DOB", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "svn_fuz", name: "Fužinar", short: "FUZ", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "svn_jad", name: "Jadran", short: "JAD", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- ISRAEL (Ligat ha'Al, split 7/7) ---
   const RAW_ISR1 = [
     { id: "isr_mtl", name: "Maccabi Tel Aviv", short: "MTL", colors: ["#FFD700", "#005CA9"], tier: 4, squad: [] },
     { id: "isr_mha", name: "Maccabi Haifa", short: "MHA", colors: ["#00A650", "#FFFFFF"], tier: 4, squad: [] },
     { id: "isr_hbs", name: "Hapoel Beer Sheva", short: "HBS", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "isr_htl", name: "Hapoel Tel Aviv", short: "HTL", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "isr_bei", name: "Beitar Jerusalem", short: "BEI", colors: ["#FFD700", "#000000"], tier: 3, squad: [] },
     { id: "isr_net", name: "Maccabi Netanya", short: "NET", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "isr_hha", name: "Hapoel Haifa", short: "HHA", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "isr_sak", name: "Bnei Sakhnin", short: "SAK", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "isr_ash", name: "Ashdod", short: "ASH", colors: ["#FFD700", "#E30613"], tier: 2, squad: [] },
     { id: "isr_had", name: "Hapoel Hadera", short: "HAD", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "isr_rei", name: "Bnei Reineh", short: "REI", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "isr_hpt", name: "Hapoel Petah Tikva", short: "HPT", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "isr_ksh", name: "Ironi Kiryat Shmona", short: "KSH", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "isr_hje", name: "Hapoel Jerusalem", short: "HJE", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
   ];
   const RAW_ISR2 = [
     { id: "isr_ris", name: "Hapoel Rishon", short: "RIS", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "isr_nof", name: "Hapoel Nof HaGalil", short: "NOF", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "isr_kfs", name: "Hapoel Kfar Saba", short: "KFS", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "isr_her", name: "Maccabi Herzliya", short: "HER", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "isr_rga", name: "Hapoel Ramat Gan", short: "RGA", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "isr_umm", name: "Hapoel Umm al-Fahm", short: "UMM", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "isr_nes", name: "Sektzia Nes Tziona", short: "NES", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "isr_sha", name: "Hapoel Kfar Shalem", short: "SHA", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "isr_jaf", name: "Maccabi Jaffa", short: "JAF", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "isr_afu", name: "Hapoel Afula", short: "AFU", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- FINLAND (Veikkausliiga, split 6/6) ---
   const RAW_FIN1 = [
     { id: "fin_hjk", name: "HJK", short: "HJK", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "fin_kup", name: "KuPS", short: "KUP", colors: ["#FFD700", "#000000"], tier: 3, squad: [] },
     { id: "fin_int", name: "Inter Turku", short: "INT", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fin_ilv", name: "Ilves", short: "ILV", colors: ["#00A650", "#FFD700"], tier: 2, squad: [] },
     { id: "fin_sjk", name: "SJK", short: "SJK", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fin_hak", name: "Haka", short: "HAK", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fin_vps", name: "VPS", short: "VPS", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "fin_hon", name: "Honka", short: "HON", colors: ["#E30613", "#FFD700"], tier: 2, squad: [] },
     { id: "fin_ktp", name: "KTP", short: "KTP", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fin_lah", name: "Lahti", short: "LAH", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fin_oul", name: "AC Oulu", short: "OUL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fin_ifk", name: "IFK Mariehamn", short: "IFK", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_FIN2 = [
     { id: "fin_gni", name: "Gnistan", short: "GNI", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fin_eif", name: "EIF", short: "EIF", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fin_jar", name: "Jaro", short: "JAR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fin_tps", name: "TPS", short: "TPS", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fin_jip", name: "Jippo", short: "JIP", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
     { id: "fin_mp", name: "MP", short: "MP", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "fin_kap", name: "KäPa", short: "KAP", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fin_pk3", name: "PK-35", short: "PK3", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "fin_sal", name: "SalPa", short: "SAL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fin_kok", name: "Kokkola", short: "KOK", colors: ["#000000", "#E30613"], tier: 1, squad: [] },
   ];

   // --- BULGARIA (Parva Liga, split 8/8) ---
   const RAW_BUL1 = [
     { id: "bul_lud", name: "Ludogorets", short: "LUD", colors: ["#00A650", "#FFFFFF"], tier: 4, squad: [] },
     { id: "bul_csk", name: "CSKA Sofia", short: "CSK", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "bul_lev", name: "Levski Sofia", short: "LEV", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "bul_lpl", name: "Lokomotiv Plovdiv", short: "LPL", colors: ["#000000", "#E30613"], tier: 2, squad: [] },
     { id: "bul_bpl", name: "Botev Plovdiv", short: "BPL", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "bul_sla", name: "Slavia Sofia", short: "SLA", colors: ["#FFFFFF", "#E30613"], tier: 2, squad: [] },
     { id: "bul_ard", name: "Arda", short: "ARD", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bul_cmo", name: "Cherno More", short: "CMO", colors: ["#000000", "#005CA9"], tier: 2, squad: [] },
     { id: "bul_ber", name: "Beroe", short: "BER", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bul_kru", name: "Krumovgrad", short: "KRU", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "bul_spv", name: "Spartak Varna", short: "SPV", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bul_sep", name: "Septemvri Sofia", short: "SEP", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bul_heb", name: "Hebar", short: "HEB", colors: ["#00A650", "#FFD700"], tier: 2, squad: [] },
     { id: "bul_c48", name: "CSKA 1948", short: "C48", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "bul_bvr", name: "Botev Vratsa", short: "BVR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bul_lso", name: "Lokomotiv Sofia", short: "LSO", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
   ];
   const RAW_BUL2 = [
     { id: "bul_mon", name: "Montana", short: "MON", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bul_dob", name: "Dobrudzha", short: "DOB", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bul_eta", name: "Etar", short: "ETA", colors: ["#4B2E83", "#FFD700"], tier: 1, squad: [] },
     { id: "bul_bal", name: "Chernomorets Balchik", short: "BAL", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bul_mar", name: "Marek", short: "MAR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bul_fra", name: "Fratria", short: "FRA", colors: ["#005CA9", "#000000"], tier: 1, squad: [] },
     { id: "bul_bela", name: "Belasitsa", short: "BLS", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bul_yan", name: "Yantra", short: "YAN", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bul_lit", name: "Litex", short: "LIT", colors: ["#FF6600", "#000000"], tier: 1, squad: [] },
     { id: "bul_pir", name: "Pirin", short: "PIR", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bul_ple", name: "Spartak Pleven", short: "PLE", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bul_soz", name: "Sozopol", short: "SOZ", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
   ];

   // --- BOSNIA (Premier League) ---
   const RAW_BIH1 = [
     { id: "bih_zri", name: "Zrinjski", short: "ZRI", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "bih_bor", name: "Borac Banja Luka", short: "BOR", colors: ["#E30613", "#005CA9"], tier: 3, squad: [] },
     { id: "bih_sar", name: "Sarajevo", short: "SAR", colors: ["#8A1538", "#FFFFFF"], tier: 3, squad: [] },
     { id: "bih_zel", name: "Željezničar", short: "ZEL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bih_vel", name: "Velež", short: "VEL", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bih_sbr", name: "Široki Brijeg", short: "SBR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bih_tuz", name: "Tuzla City", short: "TUZ", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "bih_zvi", name: "Zvijezda 09", short: "ZVI", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "bih_slo", name: "Sloga Doboj", short: "SLO", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bih_igm", name: "Igman", short: "IGM", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bih_pos", name: "Posušje", short: "POS", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "bih_rad", name: "Radnik", short: "RAD", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
   ];
   const RAW_BIH2 = [
     { id: "bih_cel", name: "Čelik", short: "CEL", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "bih_gos", name: "GOŠK", short: "GOS", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bih_leo", name: "Leotar", short: "LEO", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bih_rud", name: "Rudar Prijedor", short: "RUD", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "bih_zgr", name: "Zvijezda Gradačac", short: "ZGR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bih_fam", name: "Famos", short: "FAM", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bih_jed", name: "Jedinstvo", short: "JED", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bih_tos", name: "TOŠK", short: "TOS", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "bih_mdk", name: "Mladost DK", short: "MDK", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "bih_slt", name: "Sloboda Tuzla", short: "SLT", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- ICELAND (Besta deild, split 6/6) ---
   const RAW_ISL1 = [
     { id: "isl_bre", name: "Breiðablik", short: "BRE", colors: ["#00A650", "#FFFFFF"], tier: 3, squad: [] },
     { id: "isl_vik", name: "Víkingur R", short: "VIK", colors: ["#E30613", "#000000"], tier: 3, squad: [] },
     { id: "isl_kr", name: "KR", short: "KR", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "isl_val", name: "Valur", short: "VAL", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "isl_fh", name: "FH", short: "FH", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "isl_stj", name: "Stjarnan", short: "STJ", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "isl_fra", name: "Fram", short: "FRA", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "isl_ia", name: "ÍA", short: "IA", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "isl_ka", name: "KA", short: "KA", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "isl_aft", name: "Afturelding", short: "AFT", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "isl_ves", name: "Vestri", short: "VES", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "isl_fjo", name: "Fjölnir", short: "FJO", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
   ];
   const RAW_ISL2 = [
     { id: "isl_thr", name: "Þróttur", short: "THR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "isl_kef", name: "Keflavík", short: "KEF", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "isl_gri", name: "Grindavík", short: "GRI", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "isl_hk", name: "HK", short: "HK", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "isl_lei", name: "Leiknir", short: "LEI", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "isl_nja", name: "Njarðvík", short: "NJA", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "isl_fyl", name: "Fylkir", short: "FYL", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "isl_sel", name: "Selfoss", short: "SEL", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "isl_thor", name: "Þór", short: "THO", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "isl_gro", name: "Grótta", short: "GRO", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
   ];

   // --- REPUBLIC OF IRELAND (Premier Division, quad) ---
   const RAW_IRL1 = [
     { id: "irl_sha", name: "Shamrock Rovers", short: "SHA", colors: ["#00A650", "#FFFFFF"], tier: 3, squad: [] },
     { id: "irl_she", name: "Shelbourne", short: "SHE", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "irl_der", name: "Derry City", short: "DER", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "irl_stp", name: "St Patrick's", short: "STP", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "irl_boh", name: "Bohemians", short: "BOH", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "irl_gal", name: "Galway United", short: "GAL", colors: ["#8A1538", "#FFFFFF"], tier: 2, squad: [] },
     { id: "irl_wat", name: "Waterford", short: "WAT", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "irl_dro", name: "Drogheda", short: "DRO", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "irl_sli", name: "Sligo Rovers", short: "SLI", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "irl_cor", name: "Cork City", short: "COR", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_IRL2 = [
     { id: "irl_cob", name: "Cobh Ramblers", short: "COB", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "irl_bra", name: "Bray Wanderers", short: "BRA", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "irl_ath", name: "Athlone Town", short: "ATH", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "irl_ucd", name: "UCD", short: "UCD", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "irl_fin", name: "Finn Harps", short: "FIN", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "irl_lon", name: "Longford Town", short: "LON", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "irl_ker", name: "Kerry", short: "KER", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
     { id: "irl_tre", name: "Treaty United", short: "TRE", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "irl_wex", name: "Wexford", short: "WEX", colors: ["#4B2E83", "#FFD700"], tier: 1, squad: [] },
     { id: "irl_dun", name: "Dundalk", short: "DUN", colors: ["#FFFFFF", "#000000"], tier: 1, squad: [] },
   ];

   // --- ALBANIA (Kategoria Superiore, quad) ---
   const RAW_ALB1 = [
     { id: "alb_tir", name: "Tirana", short: "TIR", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "alb_prt", name: "Partizani", short: "PRT", colors: ["#E30613", "#FFFFFF"], tier: 3, squad: [] },
     { id: "alb_egn", name: "Egnatia", short: "EGN", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "alb_vll", name: "Vllaznia", short: "VLL", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "alb_din", name: "Dinamo City", short: "DIN", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "alb_elb", name: "Elbasani", short: "ELB", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "alb_ske", name: "Skënderbeu", short: "SKE", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "alb_lac", name: "Laçi", short: "LAC", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "alb_teu", name: "Teuta", short: "TEU", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "alb_erz", name: "Erzeni", short: "ERZ", colors: ["#E30613", "#FFD700"], tier: 2, squad: [] },
   ];
   const RAW_ALB2 = [
     { id: "alb_byl", name: "Bylis", short: "BYL", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "alb_fla", name: "Flamurtari", short: "FLA", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "alb_kas", name: "Kastrioti", short: "KAS", colors: ["#8A1538", "#FFFFFF"], tier: 1, squad: [] },
     { id: "alb_apo", name: "Apolonia", short: "APO", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "alb_bes", name: "Besa", short: "BES", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "alb_luf", name: "Luftëtari", short: "LUF", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "alb_pog", name: "Pogradeci", short: "POG", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "alb_tur", name: "Turbina", short: "TUR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "alb_tom", name: "Tomori", short: "TOM", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "alb_kor", name: "Korabi", short: "KOR", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
   ];

   // --- NORTH MACEDONIA (Prva Liga) ---
   const RAW_MKD1 = [
     { id: "mkd_shk", name: "Shkëndija", short: "SHK", colors: ["#E30613", "#000000"], tier: 3, squad: [] },
     { id: "mkd_str", name: "Struga", short: "STR", colors: ["#000000", "#FFD700"], tier: 3, squad: [] },
     { id: "mkd_var", name: "Vardar", short: "VAR", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "mkd_rab", name: "Rabotnički", short: "RAB", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mkd_sil", name: "Sileks", short: "SIL", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "mkd_mgp", name: "Makedonija GP", short: "MGP", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mkd_bre", name: "Bregalnica", short: "BRE", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mkd_tik", name: "Tikvesh", short: "TIK", colors: ["#8A1538", "#FFD700"], tier: 2, squad: [] },
     { id: "mkd_vos", name: "Voska Sport", short: "VOS", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mkd_gos", name: "Gostivar", short: "GOS", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mkd_sku", name: "Shkupi", short: "SKU", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "mkd_bor", name: "Borec", short: "BOR", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_MKD2 = [
     { id: "mkd_pob", name: "Pobeda", short: "POB", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "mkd_pel", name: "Pelister", short: "PEL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mkd_bela", name: "Belasica", short: "BLS", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mkd_det", name: "Detonit", short: "DET", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "mkd_ohr", name: "Ohrid", short: "OHR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mkd_kar", name: "Karaorman", short: "KAR", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mkd_eur", name: "Euromilk", short: "EUR", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "mkd_sas", name: "Sasa", short: "SAS", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mkd_nov", name: "Novaci", short: "NOV", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mkd_neg", name: "Vardar Negotino", short: "NEG", colors: ["#8A1538", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- MOLDOVA (Super Liga) ---
   const RAW_MDA1 = [
     { id: "mda_she", name: "Sheriff Tiraspol", short: "SHE", colors: ["#FFD700", "#000000"], tier: 3, squad: [] },
     { id: "mda_zim", name: "Zimbru", short: "ZIM", colors: ["#00A650", "#FFD700"], tier: 2, squad: [] },
     { id: "mda_mil", name: "Milsami", short: "MIL", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mda_pet", name: "Petrocub", short: "PET", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "mda_din", name: "Dinamo-Auto", short: "DIN", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mda_bal", name: "Bălți", short: "BAL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mda_sfg", name: "Sfîntul Gheorghe", short: "SFG", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mda_flo", name: "Florești", short: "FLO", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_MDA2 = [
     { id: "mda_dac", name: "Dacia Buiucani", short: "DAC", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mda_spa", name: "Spartanii", short: "SPA", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "mda_csf", name: "CSF Bălți", short: "CSF", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mda_vic", name: "Victoria", short: "VIC", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mda_cod", name: "Codru", short: "COD", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mda_rea", name: "Real-Succes", short: "REA", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "mda_ung", name: "Ungheni", short: "UNG", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mda_cah", name: "Cahul", short: "CAH", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mda_spt", name: "Spartac", short: "SPT", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "mda_bar", name: "Bardar", short: "BAR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- BELARUS (Vysshaya Liga) ---
   const RAW_BLR1 = [
     { id: "blr_dmi", name: "Dinamo Minsk", short: "DMI", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "blr_bat", name: "BATE Borisov", short: "BAT", colors: ["#FFD700", "#005CA9"], tier: 3, squad: [] },
     { id: "blr_sha", name: "Shakhtyor Soligorsk", short: "SHA", colors: ["#E30613", "#000000"], tier: 3, squad: [] },
     { id: "blr_nem", name: "Neman Grodno", short: "NEM", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "blr_dne", name: "Dnepr Mogilev", short: "DNE", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "blr_tor", name: "Torpedo Zhodino", short: "TOR", colors: ["#000000", "#FFD700"], tier: 2, squad: [] },
     { id: "blr_isl", name: "Isloch", short: "ISL", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "blr_sla", name: "Slavia Mozyr", short: "SLA", colors: ["#FFFFFF", "#005CA9"], tier: 2, squad: [] },
     { id: "blr_gom", name: "Gomel", short: "GOM", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "blr_naf", name: "Naftan", short: "NAF", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "blr_vit", name: "Vitebsk", short: "VIT", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "blr_slu", name: "Slutsk", short: "SLU", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "blr_mol", name: "Molodechno", short: "MOL", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "blr_ars", name: "Arsenal Dzerzhinsk", short: "ARS", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "blr_mlv", name: "ML Vitebsk", short: "MLV", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "blr_smo", name: "Smorgon", short: "SMO", colors: ["#00A650", "#FFD700"], tier: 2, squad: [] },
   ];
   const RAW_BLR2 = [
     { id: "blr_bre", name: "Dinamo Brest", short: "BRE", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "blr_vol", name: "Volna Pinsk", short: "VOL", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "blr_lid", name: "Lida", short: "LID", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "blr_bum", name: "Bumprom", short: "BUM", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "blr_ost", name: "Ostrovets", short: "OST", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "blr_bab", name: "Baranovichi", short: "BAB", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "blr_ors", name: "Orsha", short: "ORS", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "blr_ruk", name: "Rukh Brest", short: "RUK", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "blr_bel", name: "Belshina", short: "BEL", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "blr_zvb", name: "Zvezda-BGU", short: "ZVB", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
   ];

   // --- AZERBAIJAN (Premier League, quad) ---
   const RAW_AZE1 = [
     { id: "aze_qar", name: "Qarabağ", short: "QAR", colors: ["#000000", "#FFFFFF"], tier: 3, squad: [] },
     { id: "aze_nef", name: "Neftçi", short: "NEF", colors: ["#000000", "#FFFFFF"], tier: 3, squad: [] },
     { id: "aze_zir", name: "Zira", short: "ZIR", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "aze_sab", name: "Sabah", short: "SAB", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "aze_ara", name: "Araz", short: "ARA", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "aze_sum", name: "Sumqayıt", short: "SUM", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "aze_kep", name: "Kəpəz", short: "KEP", colors: ["#8A1538", "#FFD700"], tier: 2, squad: [] },
     { id: "aze_tur", name: "Turan Tovuz", short: "TUR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "aze_seb", name: "Səbail", short: "SEB", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "aze_sam", name: "Şamaxı", short: "SAM", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_AZE2 = [
     { id: "aze_dif", name: "Difai", short: "DIF", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aze_krv", name: "Karvan", short: "KRV", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aze_moi", name: "MOIK", short: "MOI", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aze_goy", name: "Göyəzən", short: "GOY", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "aze_mil", name: "Mil-Muğan", short: "MIL", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aze_ceb", name: "Cəbrayıl", short: "CEB", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "aze_sek", name: "Şəki", short: "SEK", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "aze_ags", name: "Ağsu", short: "AGS", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "aze_yen", name: "Yeni Çağ", short: "YEN", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "aze_kur", name: "Kür-Araz", short: "KUR", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
   ];

   // --- KAZAKHSTAN (Premier League) ---
   const RAW_KAZ1 = [
     { id: "kaz_ast", name: "Astana", short: "AST", colors: ["#FFD700", "#005CA9"], tier: 3, squad: [] },
     { id: "kaz_kai", name: "Kairat", short: "KAI", colors: ["#FFD700", "#000000"], tier: 3, squad: [] },
     { id: "kaz_tob", name: "Tobol", short: "TOB", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kaz_akt", name: "Aktobe", short: "AKT", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kaz_ord", name: "Ordabasy", short: "ORD", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "kaz_kyz", name: "Kyzylzhar", short: "KYZ", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kaz_zhe", name: "Zhenis", short: "ZHE", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kaz_trn", name: "Turan", short: "TRN", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kaz_aty", name: "Atyrau", short: "ATY", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kaz_eli", name: "Elimai", short: "ELI", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "kaz_okz", name: "Okzhetpes", short: "OKZ", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "kaz_jet", name: "Jetisu", short: "JET", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kaz_kas", name: "Kaspiy", short: "KAS", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kaz_uly", name: "Ulytau", short: "ULY", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
   ];
   const RAW_KAZ2 = [
     { id: "kaz_kzh", name: "Kairat-Zhastar", short: "KZH", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "kaz_eki", name: "Ekibastuz", short: "EKI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kaz_aks", name: "Aksu", short: "AKS", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kaz_mak", name: "Maktaaral", short: "MAK", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
     { id: "kaz_kht", name: "Khan Tengri", short: "KHT", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kaz_bai", name: "Baikonur", short: "BAI", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "kaz_kyr", name: "Kyran", short: "KYR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kaz_yas", name: "Yassy", short: "YAS", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kaz_ont", name: "Akademiya Ontustik", short: "ONT", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kaz_cs2", name: "Caspiy-2", short: "CS2", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
   ];

   // --- GEORGIA (Erovnuli Liga, quad) ---
   const RAW_GEO1 = [
     { id: "geo_dtb", name: "Dinamo Tbilisi", short: "DTB", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "geo_dba", name: "Dinamo Batumi", short: "DBA", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "geo_tor", name: "Torpedo Kutaisi", short: "TOR", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "geo_ibe", name: "Iberia 1999", short: "IBE", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "geo_sab", name: "Saburtalo", short: "SAB", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "geo_dil", name: "Dila", short: "DIL", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "geo_gag", name: "Gagra", short: "GAG", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "geo_kol", name: "Kolkheti Poti", short: "KOL", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "geo_sam", name: "Samgurali", short: "SAM", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "geo_tel", name: "Telavi", short: "TEL", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_GEO2 = [
     { id: "geo_spa", name: "Spaeri", short: "SPA", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "geo_k13", name: "Kolkheti-1913", short: "K13", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "geo_gar", name: "Gareji", short: "GAR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "geo_sio", name: "Sioni", short: "SIO", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "geo_mer", name: "Merani", short: "MER", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "geo_nor", name: "Norchi Dinamoeli", short: "NOR", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "geo_loc", name: "Locomotive Tbilisi", short: "LOC", colors: ["#00A650", "#E30613"], tier: 1, squad: [] },
     { id: "geo_chi", name: "Chikhura", short: "CHI", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "geo_gur", name: "Guria", short: "GUR", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "geo_bet", name: "Betlemi", short: "BET", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- ARMENIA (Premier League, quad) ---
   const RAW_ARM1 = [
     { id: "arm_ara", name: "Ararat-Armenia", short: "ARA", colors: ["#E30613", "#005CA9"], tier: 3, squad: [] },
     { id: "arm_pyu", name: "Pyunik", short: "PYU", colors: ["#E30613", "#FFD700"], tier: 3, squad: [] },
     { id: "arm_noa", name: "Noah", short: "NOA", colors: ["#000000", "#FFD700"], tier: 2, squad: [] },
     { id: "arm_ura", name: "Urartu", short: "URA", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "arm_ala", name: "Alashkert", short: "ALA", colors: ["#8A1538", "#FFFFFF"], tier: 2, squad: [] },
     { id: "arm_ary", name: "Ararat Yerevan", short: "ARY", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "arm_van", name: "Van", short: "VAN", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "arm_wes", name: "West Armenia", short: "WES", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "arm_shi", name: "Shirak", short: "SHI", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "arm_bkm", name: "BKMA", short: "BKM", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_ARM2 = [
     { id: "arm_syu", name: "Syunik", short: "SYU", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "arm_ler", name: "Lernayin Artsakh", short: "LER", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "arm_kot", name: "Kotayk", short: "KOT", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "arm_sev", name: "Sevan", short: "SEV", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "arm_d20", name: "Dinamo-2000", short: "D20", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "arm_ar2", name: "Ararat-2", short: "AR2", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "arm_py2", name: "Pyunik-2", short: "PY2", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "arm_no2", name: "Noah-2", short: "NO2", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "arm_va2", name: "Van-2", short: "VA2", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "arm_jse", name: "Junior Sevan", short: "JSE", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- LATVIA (Virslīga, quad) ---
   const RAW_LVA1 = [
     { id: "lva_rig", name: "Riga FC", short: "RIG", colors: ["#000000", "#E30613"], tier: 3, squad: [] },
     { id: "lva_rfs", name: "RFS", short: "RFS", colors: ["#8A1538", "#FFFFFF"], tier: 3, squad: [] },
     { id: "lva_aud", name: "Auda", short: "AUD", colors: ["#00A650", "#000000"], tier: 2, squad: [] },
     { id: "lva_val", name: "Valmiera", short: "VAL", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "lva_lie", name: "Liepāja", short: "LIE", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lva_dau", name: "Daugavpils", short: "DAU", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lva_sno", name: "Super Nova", short: "SNO", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "lva_met", name: "Metta", short: "MET", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "lva_tuk", name: "Tukums", short: "TUK", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lva_jel", name: "Jelgava", short: "JEL", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_LVA2 = [
     { id: "lva_gro", name: "Grobiņa", short: "GRO", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "lva_rez", name: "Rēzekne", short: "REZ", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "lva_alb", name: "Alberts", short: "ALB", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "lva_lee", name: "Leevon", short: "LEE", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "lva_smi", name: "Smiltene", short: "SMI", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "lva_sal", name: "Salaspils", short: "SAL", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "lva_drig", name: "Dinamo Rīga", short: "DRI", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "lva_ogr", name: "Ogre", short: "OGR", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
     { id: "lva_sta", name: "Staicele", short: "STA", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "lva_jur", name: "Jūrmala", short: "JUR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- LITHUANIA (A Lyga, quad) ---
   const RAW_LTU1 = [
     { id: "ltu_zal", name: "Žalgiris", short: "ZAL", colors: ["#00A650", "#FFFFFF"], tier: 3, squad: [] },
     { id: "ltu_kza", name: "Kauno Žalgiris", short: "KZA", colors: ["#00A650", "#FFD700"], tier: 2, squad: [] },
     { id: "ltu_pan", name: "Panevėžys", short: "PAN", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ltu_sud", name: "Sūduva", short: "SUD", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
     { id: "ltu_heg", name: "Hegelmann", short: "HEG", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ltu_ban", name: "Banga", short: "BAN", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "ltu_dai", name: "Dainava", short: "DAI", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ltu_rit", name: "Riteriai", short: "RIT", colors: ["#000000", "#FFD700"], tier: 2, squad: [] },
     { id: "ltu_dzi", name: "Džiugas", short: "DZI", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "ltu_tra", name: "TransINVEST", short: "TRA", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_LTU2 = [
     { id: "ltu_nep", name: "Neptūnas", short: "NEP", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ltu_jon", name: "Jonava", short: "JON", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ltu_sia", name: "Šiauliai", short: "SIA", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "ltu_da2", name: "Dainava-2", short: "DA2", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "ltu_mar", name: "Marijampolė", short: "MAR", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "ltu_trk", name: "Trakai", short: "TRK", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "ltu_nev", name: "Nevėžis", short: "NEV", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ltu_gar", name: "Garliava", short: "GAR", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "ltu_sil", name: "Šilas", short: "SIL", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
     { id: "ltu_min", name: "Minija", short: "MIN", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- KOSOVO (Superliga, quad) ---
   const RAW_KVX1 = [
     { id: "kvx_bal", name: "Ballkani", short: "BAL", colors: ["#E30613", "#000000"], tier: 3, squad: [] },
     { id: "kvx_dri", name: "Drita", short: "DRI", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kvx_pri", name: "Prishtina", short: "PRI", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "kvx_mal", name: "Malisheva", short: "MAL", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kvx_lla", name: "Llapi", short: "LLA", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kvx_duk", name: "Dukagjini", short: "DUK", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kvx_gji", name: "Gjilani", short: "GJI", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "kvx_fer", name: "Ferizaj", short: "FER", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kvx_vel", name: "Vëllaznimi", short: "VEL", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "kvx_tre", name: "Trepça 89", short: "TRE", colors: ["#000000", "#E30613"], tier: 2, squad: [] },
   ];
   const RAW_KVX2 = [
     { id: "kvx_ram", name: "Ramiz Sadiku", short: "RAM", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kvx_fus", name: "Fushë Kosova", short: "FUS", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kvx_rah", name: "Rahoveci", short: "RAH", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kvx_ulp", name: "Ulpiana", short: "ULP", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "kvx_kek", name: "Kek", short: "KEK", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "kvx_fnk", name: "Feronikeli", short: "FNK", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kvx_lir", name: "Liria", short: "LIR", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "kvx_bes", name: "Besa Pejë", short: "BES", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kvx_arb", name: "Arbëria", short: "ARB", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "kvx_fla", name: "Flamurtari Pristina", short: "FLA", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
   ];

   // --- MONTENEGRO (Prva CFL, quad) ---
   const RAW_MNE1 = [
     { id: "mne_bud", name: "Budućnost", short: "BUD", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "mne_sut", name: "Sutjeska", short: "SUT", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "mne_dec", name: "Dečić", short: "DEC", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "mne_tiv", name: "Arsenal Tivat", short: "TIV", colors: ["#E30613", "#005CA9"], tier: 2, squad: [] },
     { id: "mne_jez", name: "Jezero", short: "JEZ", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mne_pet", name: "Petrovac", short: "PET", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mne_mla", name: "Mladost", short: "MLA", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mne_rud", name: "Rudar", short: "RUD", colors: ["#000000", "#FFD700"], tier: 2, squad: [] },
     { id: "mne_otr", name: "Otrant", short: "OTR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mne_mor", name: "Mornar", short: "MOR", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
   ];
   const RAW_MNE2 = [
     { id: "mne_bok", name: "Bokelj", short: "BOK", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mne_isk", name: "Iskra", short: "ISK", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mne_zet", name: "Zeta", short: "ZET", colors: ["#FFD700", "#00A650"], tier: 1, squad: [] },
     { id: "mne_pod", name: "Podgorica", short: "POD", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "mne_ber", name: "Berane", short: "BER", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mne_iga", name: "Igalo", short: "IGA", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "mne_cet", name: "Cetinje", short: "CET", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "mne_grb", name: "Grbalj", short: "GRB", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mne_kom", name: "Kom", short: "KOM", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mne_lov", name: "Lovćen", short: "LOV", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
   ];

   // --- ESTONIA (Meistriliiga, quad) ---
   const RAW_EST1 = [
     { id: "est_flo", name: "Flora", short: "FLO", colors: ["#00A650", "#FFFFFF"], tier: 3, squad: [] },
     { id: "est_lev", name: "Levadia", short: "LEV", colors: ["#005CA9", "#000000"], tier: 3, squad: [] },
     { id: "est_pai", name: "Paide", short: "PAI", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "est_kal", name: "Kalju", short: "KAL", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "est_tkl", name: "Tallinna Kalev", short: "TKL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "est_vap", name: "Vaprus", short: "VAP", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "est_trn", name: "Trans Narva", short: "TRN", colors: ["#E30613", "#FFD700"], tier: 2, squad: [] },
     { id: "est_tam", name: "Tammeka", short: "TAM", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "est_har", name: "Harju", short: "HAR", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "est_kur", name: "Kuressaare", short: "KUR", colors: ["#FFD700", "#005CA9"], tier: 2, squad: [] },
   ];
   const RAW_EST2 = [
     { id: "est_tul", name: "Tulevik", short: "TUL", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "est_elv", name: "Elva", short: "ELV", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "est_amb", name: "Ambla", short: "AMB", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "est_laa", name: "Läänemaa", short: "LAA", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "est_nom", name: "Nõmme United", short: "NOM", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "est_wel", name: "Welco", short: "WEL", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "est_maa", name: "Maardu", short: "MAA", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "est_leg", name: "Legion", short: "LEG", colors: ["#8A1538", "#FFFFFF"], tier: 1, squad: [] },
     { id: "est_tar", name: "Tartu", short: "TAR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "est_kl2", name: "Kalev II", short: "KL2", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
   ];

   // --- LUXEMBOURG (National Division) ---
   const RAW_LUX1 = [
     { id: "lux_dud", name: "F91 Dudelange", short: "DUD", colors: ["#E30613", "#FFD700"], tier: 3, squad: [] },
     { id: "lux_swi", name: "Swift Hesperange", short: "SWI", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "lux_rac", name: "Racing Union", short: "RAC", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lux_dif", name: "Differdange", short: "DIF", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "lux_pro", name: "Progrès Niederkorn", short: "PRO", colors: ["#000000", "#FFD700"], tier: 2, squad: [] },
     { id: "lux_una", name: "UNA Strassen", short: "UNA", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lux_hos", name: "Hostert", short: "HOS", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lux_wil", name: "Wiltz", short: "WIL", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "lux_ros", name: "Rosport", short: "ROS", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "lux_mon", name: "Mondorf", short: "MON", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lux_kae", name: "Käerjéng", short: "KAE", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lux_mdc", name: "Mondercange", short: "MDC", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lux_etz", name: "Etzella", short: "ETZ", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "lux_rum", name: "Rumelange", short: "RUM", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "lux_pet", name: "Titus Pétange", short: "PET", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "lux_bet", name: "Bettembourg", short: "BET", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_LUX2 = [
     { id: "lux_keh", name: "Kehlen", short: "KEH", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "lux_muh", name: "Mühlenbach", short: "MUH", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "lux_san", name: "Sandweiler", short: "SAN", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "lux_erp", name: "Erpeldange", short: "ERP", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "lux_hob", name: "Hobscheid", short: "HOB", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "lux_gre", name: "Grevenmacher", short: "GRE", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "lux_ber", name: "Berdorf", short: "BER", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "lux_wor", name: "Wormeldange", short: "WOR", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "lux_sch", name: "Schifflange", short: "SCH", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "lux_can", name: "Canach", short: "CAN", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- NORTHERN IRELAND (NIFL Premiership, triple + split 6/6) ---
   const RAW_NIR1 = [
     { id: "nir_lin", name: "Linfield", short: "LIN", colors: ["#005CA9", "#E30613"], tier: 3, squad: [] },
     { id: "nir_lar", name: "Larne", short: "LAR", colors: ["#E30613", "#000000"], tier: 3, squad: [] },
     { id: "nir_gle", name: "Glentoran", short: "GLE", colors: ["#00A650", "#E30613"], tier: 2, squad: [] },
     { id: "nir_cli", name: "Cliftonville", short: "CLI", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nir_cru", name: "Crusaders", short: "CRU", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "nir_col", name: "Coleraine", short: "COL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nir_gla", name: "Glenavon", short: "GLA", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "nir_dun", name: "Dungannon", short: "DUN", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nir_car", name: "Carrick", short: "CAR", colors: ["#000000", "#FFD700"], tier: 2, squad: [] },
     { id: "nir_bal", name: "Ballymena", short: "BAL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nir_lou", name: "Loughgall", short: "LOU", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "nir_por", name: "Portadown", short: "POR", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_NIR2 = [
     { id: "nir_ann", name: "Annagh United", short: "ANN", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nir_new", name: "Newry City", short: "NEW", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nir_bcl", name: "Ballyclare", short: "BCL", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "nir_ins", name: "Institute", short: "INS", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "nir_dde", name: "Dundela", short: "DDE", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "nir_hw", name: "H&W Welders", short: "HW", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "nir_ban", name: "Bangor", short: "BAN", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nir_ard", name: "Ards", short: "ARD", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "nir_pst", name: "Portstewart", short: "PST", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nir_lim", name: "Limavady", short: "LIM", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nir_kno", name: "Knockbreda", short: "KNO", colors: ["#8A1538", "#FFFFFF"], tier: 1, squad: [] },
     { id: "nir_der", name: "Dergview", short: "DER", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
   ];

   // --- MALTA (Premier League) ---
   const RAW_MLT1 = [
     { id: "mlt_ham", name: "Ħamrun Spartans", short: "HAM", colors: ["#E30613", "#000000"], tier: 3, squad: [] },
     { id: "mlt_bir", name: "Birkirkara", short: "BIR", colors: ["#E30613", "#FFD700"], tier: 2, squad: [] },
     { id: "mlt_flo", name: "Floriana", short: "FLO", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mlt_sli", name: "Sliema Wanderers", short: "SLI", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mlt_val", name: "Valletta", short: "VAL", colors: ["#FFFFFF", "#000000"], tier: 2, squad: [] },
     { id: "mlt_bal", name: "Balzan", short: "BAL", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "mlt_gzi", name: "Gżira United", short: "GZI", colors: ["#8A1538", "#FFD700"], tier: 2, squad: [] },
     { id: "mlt_hib", name: "Hibernians", short: "HIB", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mlt_mar", name: "Marsaxlokk", short: "MAR", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "mlt_nax", name: "Naxxar Lions", short: "NAX", colors: ["#E30613", "#FFD700"], tier: 2, squad: [] },
     { id: "mlt_mos", name: "Mosta", short: "MOS", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "mlt_zab", name: "Żabbar St Patrick", short: "ZAB", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
   ];
   const RAW_MLT2 = [
     { id: "mlt_zej", name: "Żejtun Corinthians", short: "ZEJ", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mlt_pie", name: "Pietà Hotspurs", short: "PIE", colors: ["#000000", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mlt_sta", name: "St Andrews", short: "STA", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "mlt_zeb", name: "Żebbuġ Rangers", short: "ZEB", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mlt_mel", name: "Melita", short: "MEL", colors: ["#8A1538", "#FFD700"], tier: 1, squad: [] },
     { id: "mlt_slu", name: "Santa Lucia", short: "SLU", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "mlt_swi", name: "Swieqi United", short: "SWI", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mlt_att", name: "Attard", short: "ATT", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "mlt_xew", name: "Xewkija Tigers", short: "XEW", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "mlt_vic", name: "Victoria Hotspurs", short: "VIC", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- FAROE ISLANDS (Betri deildin, triple) ---
   const RAW_FRO1 = [
     { id: "fro_ki", name: "KÍ Klaksvík", short: "KI", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "fro_vik", name: "Víkingur", short: "VIK", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "fro_hb", name: "HB Tórshavn", short: "HB", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fro_b36", name: "B36", short: "B36", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fro_nsi", name: "NSÍ", short: "NSI", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fro_ska", name: "Skála", short: "SKA", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "fro_ebs", name: "EB/Streymur", short: "EBS", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fro_tb", name: "TB", short: "TB", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fro_07v", name: "07 Vestur", short: "07V", colors: ["#00A650", "#FFFFFF"], tier: 2, squad: [] },
     { id: "fro_ab", name: "AB", short: "AB", colors: ["#005CA9", "#000000"], tier: 2, squad: [] },
   ];
   const RAW_FRO2 = [
     { id: "fro_b68", name: "B68", short: "B68", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "fro_if", name: "ÍF", short: "IF", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "fro_fsv", name: "FS Vágar", short: "FSV", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fro_und", name: "Undrið", short: "UND", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fro_giz", name: "Giza", short: "GIZ", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fro_roy", name: "Royn", short: "ROY", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "fro_vb", name: "VB", short: "VB", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "fro_sum", name: "Sumba", short: "SUM", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "fro_mb", name: "MB", short: "MB", colors: ["#000000", "#E30613"], tier: 1, squad: [] },
     { id: "fro_lif", name: "Leikní", short: "LIF", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- WALES (Cymru Premier, split 6/6) ---
   const RAW_WAL1 = [
     { id: "wal_tns", name: "The New Saints", short: "TNS", colors: ["#005CA9", "#FFFFFF"], tier: 3, squad: [] },
     { id: "wal_cqn", name: "Connah's Quay", short: "CQN", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "wal_bal", name: "Bala Town", short: "BAL", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "wal_pen", name: "Penybont", short: "PEN", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "wal_hav", name: "Haverfordwest", short: "HAV", colors: ["#005CA9", "#000000"], tier: 2, squad: [] },
     { id: "wal_abe", name: "Aberystwyth", short: "ABE", colors: ["#00A650", "#000000"], tier: 2, squad: [] },
     { id: "wal_cae", name: "Caernarfon", short: "CAE", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "wal_new", name: "Newtown", short: "NEW", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "wal_bar", name: "Barry Town", short: "BAR", colors: ["#FFD700", "#000000"], tier: 2, squad: [] },
     { id: "wal_fli", name: "Flint Town", short: "FLI", colors: ["#005CA9", "#FFD700"], tier: 2, squad: [] },
     { id: "wal_bri", name: "Briton Ferry", short: "BRI", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "wal_met", name: "Cardiff Met", short: "MET", colors: ["#000000", "#FFD700"], tier: 2, squad: [] },
   ];
   const RAW_WAL2 = [
     { id: "wal_col", name: "Colwyn Bay", short: "COL", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "wal_lla", name: "Llanelli", short: "LLA", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "wal_tre", name: "Trefelin", short: "TRE", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "wal_rut", name: "Ruthin Town", short: "RUT", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "wal_hol", name: "Holywell Town", short: "HOL", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "wal_gui", name: "Guilsfield", short: "GUI", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "wal_air", name: "Airbus UK", short: "AIR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "wal_pre", name: "Prestatyn", short: "PRE", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "wal_buc", name: "Buckley", short: "BUC", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "wal_lld", name: "Llandudno", short: "LLD", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "wal_prh", name: "Penrhyncoch", short: "PRH", colors: ["#00A650", "#000000"], tier: 1, squad: [] },
     { id: "wal_cam", name: "Cambrian", short: "CAM", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- GIBRALTAR (Gibraltar Football League) ---
   const RAW_GIB1 = [
     { id: "gib_lin", name: "Lincoln Red Imps", short: "LIN", colors: ["#E30613", "#000000"], tier: 2, squad: [] },
     { id: "gib_bru", name: "Bruno's Magpies", short: "BRU", colors: ["#000000", "#FFFFFF"], tier: 2, squad: [] },
     { id: "gib_stj", name: "St Joseph's", short: "STJ", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "gib_eur", name: "Europa", short: "EUR", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "gib_lio", name: "Lions Gibraltar", short: "LIO", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "gib_mon", name: "Mons Calpe", short: "MON", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gib_m62", name: "Manchester 62", short: "M62", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gib_gla", name: "Glacis United", short: "GLA", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gib_epo", name: "Europa Point", short: "EPO", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "gib_col", name: "College 1975", short: "COL", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
   ];
   const RAW_GIB2 = [
     { id: "gib_lyn", name: "Lynx", short: "LYN", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "gib_boc", name: "Boca Gibraltar", short: "BOC", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "gib_gut", name: "Gibraltar United", short: "GUT", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gib_oly", name: "Olympic", short: "OLY", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "gib_ang", name: "Angels", short: "ANG", colors: ["#FFFFFF", "#005CA9"], tier: 1, squad: [] },
     { id: "gib_can", name: "Cannons", short: "CAN", colors: ["#000000", "#E30613"], tier: 1, squad: [] },
     { id: "gib_leo", name: "Leo", short: "LEO", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "gib_roc", name: "Rock", short: "ROC", colors: ["#8A1538", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- ANDORRA (Primera Divisió, triple) ---
   const RAW_AND1 = [
     { id: "and_int", name: "Inter Escaldes", short: "INT", colors: ["#005CA9", "#000000"], tier: 2, squad: [] },
     { id: "and_atl", name: "Atlètic Escaldes", short: "ATL", colors: ["#E30613", "#FFFFFF"], tier: 2, squad: [] },
     { id: "and_sju", name: "Sant Julià", short: "SJU", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "and_sco", name: "Santa Coloma", short: "SCO", colors: ["#005CA9", "#E30613"], tier: 2, squad: [] },
     { id: "and_uec", name: "UE Santa Coloma", short: "UEC", colors: ["#E30613", "#FFD700"], tier: 2, squad: [] },
     { id: "and_enc", name: "Encamp", short: "ENC", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "and_ord", name: "Ordino", short: "ORD", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
     { id: "and_pen", name: "Penya Encarnada", short: "PEN", colors: ["#8A1538", "#FFFFFF"], tier: 1, squad: [] },
     { id: "and_car", name: "Carroi", short: "CAR", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "and_ran", name: "Ranger's", short: "RAN", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
   ];
   const RAW_AND2 = [
     { id: "and_lus", name: "Lusitans", short: "LUS", colors: ["#00A650", "#E30613"], tier: 1, squad: [] },
     { id: "and_esp", name: "Esperança", short: "ESP", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "and_ext", name: "Extremenya", short: "EXT", colors: ["#00A650", "#FFFFFF"], tier: 1, squad: [] },
     { id: "and_jen", name: "Jenlai", short: "JEN", colors: ["#E30613", "#FFD700"], tier: 1, squad: [] },
     { id: "and_pra", name: "Prada", short: "PRA", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "and_bet", name: "Betzalel", short: "BET", colors: ["#000000", "#FFD700"], tier: 1, squad: [] },
     { id: "and_man", name: "Manlleu", short: "MAN", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "and_pas", name: "Pas de la Casa", short: "PAS", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
   ];

   // --- SAN MARINO (Campionato Sammarinese — single amateur tier) ---
   const RAW_SMR1 = [
     { id: "smr_trf", name: "Tre Fiori", short: "TRF", colors: ["#FFD700", "#00A650"], tier: 2, squad: [] },
     { id: "smr_trp", name: "Tre Penne", short: "TRP", colors: ["#005CA9", "#FFFFFF"], tier: 2, squad: [] },
     { id: "smr_laf", name: "La Fiorita", short: "LAF", colors: ["#00A650", "#FFD700"], tier: 2, squad: [] },
     { id: "smr_vir", name: "Virtus", short: "VIR", colors: ["#E30613", "#000000"], tier: 1, squad: [] },
     { id: "smr_fol", name: "Folgore", short: "FOL", colors: ["#FFD700", "#E30613"], tier: 1, squad: [] },
     { id: "smr_cos", name: "Cosmos", short: "COS", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
     { id: "smr_dom", name: "Domagnano", short: "DOM", colors: ["#FFD700", "#005CA9"], tier: 1, squad: [] },
     { id: "smr_fio", name: "Fiorentino", short: "FIO", colors: ["#4B2E83", "#FFFFFF"], tier: 1, squad: [] },
     { id: "smr_lib", name: "Libertas", short: "LIB", colors: ["#FFD700", "#000000"], tier: 1, squad: [] },
     { id: "smr_mur", name: "Murata", short: "MUR", colors: ["#005CA9", "#E30613"], tier: 1, squad: [] },
     { id: "smr_pen", name: "Pennarossa", short: "PEN", colors: ["#E30613", "#FFFFFF"], tier: 1, squad: [] },
     { id: "smr_sgi", name: "San Giovanni", short: "SGI", colors: ["#E30613", "#005CA9"], tier: 1, squad: [] },
     { id: "smr_cai", name: "Cailungo", short: "CAI", colors: ["#00A650", "#FFD700"], tier: 1, squad: [] },
     { id: "smr_fae", name: "Faetano", short: "FAE", colors: ["#005CA9", "#FFD700"], tier: 1, squad: [] },
     { id: "smr_juv", name: "Juvenes-Dogana", short: "JUV", colors: ["#005CA9", "#FFFFFF"], tier: 1, squad: [] },
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
     ...RAW_CZ_CZ1.map(c => { c.league = "CZ1"; c.crestInitials = c.short; return c; }),
     ...RAW_CZ_CZ2.map(c => { c.league = "CZ2"; c.crestInitials = c.short; return c; }),
     ...RAW_SR_SR1.map(c => { c.league = "SR1"; c.crestInitials = c.short; return c; }),
     ...RAW_SR_SR2.map(c => { c.league = "SR2"; c.crestInitials = c.short; return c; }),
     ...RAW_UA_UA1.map(c => { c.league = "UA1"; c.crestInitials = c.short; return c; }),
     ...RAW_UA_UA2.map(c => { c.league = "UA2"; c.crestInitials = c.short; return c; }),
     ...RAW_SE_SE1.map(c => { c.league = "SE1"; c.crestInitials = c.short; return c; }),
     ...RAW_SE_SE2.map(c => { c.league = "SE2"; c.crestInitials = c.short; return c; }),
     ...RAW_NO_NO1.map(c => { c.league = "NO1"; c.crestInitials = c.short; return c; }),
     ...RAW_NO_NO2.map(c => { c.league = "NO2"; c.crestInitials = c.short; return c; }),
     ...RAW_RO_RO1.map(c => { c.league = "RO1"; c.crestInitials = c.short; return c; }),
     ...RAW_RO_RO2.map(c => { c.league = "RO2"; c.crestInitials = c.short; return c; }),
     ...RAW_CY_CY1.map(c => { c.league = "CY1"; c.crestInitials = c.short; return c; }),
     ...RAW_CY_CY2.map(c => { c.league = "CY2"; c.crestInitials = c.short; return c; }),
     ...RAW_SK_SK1.map(c => { c.league = "SK1"; c.crestInitials = c.short; return c; }),
     ...RAW_SK_SK2.map(c => { c.league = "SK2"; c.crestInitials = c.short; return c; }),
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
     ...RAW_SVN1.map(c => { c.league = "SN1"; c.crestInitials = c.short; return c; }),
     ...RAW_SVN2.map(c => { c.league = "SN2"; c.crestInitials = c.short; return c; }),
     ...RAW_ISR1.map(c => { c.league = "IS1"; c.crestInitials = c.short; return c; }),
     ...RAW_ISR2.map(c => { c.league = "IS2"; c.crestInitials = c.short; return c; }),
     ...RAW_FIN1.map(c => { c.league = "FI1"; c.crestInitials = c.short; return c; }),
     ...RAW_FIN2.map(c => { c.league = "FI2"; c.crestInitials = c.short; return c; }),
     ...RAW_BUL1.map(c => { c.league = "BG1"; c.crestInitials = c.short; return c; }),
     ...RAW_BUL2.map(c => { c.league = "BG2"; c.crestInitials = c.short; return c; }),
     ...RAW_BIH1.map(c => { c.league = "BA1"; c.crestInitials = c.short; return c; }),
     ...RAW_BIH2.map(c => { c.league = "BA2"; c.crestInitials = c.short; return c; }),
     ...RAW_ISL1.map(c => { c.league = "IC1"; c.crestInitials = c.short; return c; }),
     ...RAW_ISL2.map(c => { c.league = "IC2"; c.crestInitials = c.short; return c; }),
     ...RAW_IRL1.map(c => { c.league = "IE1"; c.crestInitials = c.short; return c; }),
     ...RAW_IRL2.map(c => { c.league = "IE2"; c.crestInitials = c.short; return c; }),
     ...RAW_ALB1.map(c => { c.league = "AL1"; c.crestInitials = c.short; return c; }),
     ...RAW_ALB2.map(c => { c.league = "AL2"; c.crestInitials = c.short; return c; }),
     ...RAW_MKD1.map(c => { c.league = "MK1"; c.crestInitials = c.short; return c; }),
     ...RAW_MKD2.map(c => { c.league = "MK2"; c.crestInitials = c.short; return c; }),
     ...RAW_MDA1.map(c => { c.league = "MD1"; c.crestInitials = c.short; return c; }),
     ...RAW_MDA2.map(c => { c.league = "MD2"; c.crestInitials = c.short; return c; }),
     ...RAW_BLR1.map(c => { c.league = "BY1"; c.crestInitials = c.short; return c; }),
     ...RAW_BLR2.map(c => { c.league = "BY2"; c.crestInitials = c.short; return c; }),
     ...RAW_AZE1.map(c => { c.league = "AZ1"; c.crestInitials = c.short; return c; }),
     ...RAW_AZE2.map(c => { c.league = "AZ2"; c.crestInitials = c.short; return c; }),
     ...RAW_KAZ1.map(c => { c.league = "KZ1"; c.crestInitials = c.short; return c; }),
     ...RAW_KAZ2.map(c => { c.league = "KZ2"; c.crestInitials = c.short; return c; }),
     ...RAW_GEO1.map(c => { c.league = "GE1"; c.crestInitials = c.short; return c; }),
     ...RAW_GEO2.map(c => { c.league = "GE2"; c.crestInitials = c.short; return c; }),
     ...RAW_ARM1.map(c => { c.league = "AM1"; c.crestInitials = c.short; return c; }),
     ...RAW_ARM2.map(c => { c.league = "AM2"; c.crestInitials = c.short; return c; }),
     ...RAW_LVA1.map(c => { c.league = "LV1"; c.crestInitials = c.short; return c; }),
     ...RAW_LVA2.map(c => { c.league = "LV2"; c.crestInitials = c.short; return c; }),
     ...RAW_LTU1.map(c => { c.league = "LT1"; c.crestInitials = c.short; return c; }),
     ...RAW_LTU2.map(c => { c.league = "LT2"; c.crestInitials = c.short; return c; }),
     ...RAW_KVX1.map(c => { c.league = "XK1"; c.crestInitials = c.short; return c; }),
     ...RAW_KVX2.map(c => { c.league = "XK2"; c.crestInitials = c.short; return c; }),
     ...RAW_MNE1.map(c => { c.league = "ME1"; c.crestInitials = c.short; return c; }),
     ...RAW_MNE2.map(c => { c.league = "ME2"; c.crestInitials = c.short; return c; }),
     ...RAW_EST1.map(c => { c.league = "ET1"; c.crestInitials = c.short; return c; }),
     ...RAW_EST2.map(c => { c.league = "ET2"; c.crestInitials = c.short; return c; }),
     ...RAW_LUX1.map(c => { c.league = "LU1"; c.crestInitials = c.short; return c; }),
     ...RAW_LUX2.map(c => { c.league = "LU2"; c.crestInitials = c.short; return c; }),
     ...RAW_NIR1.map(c => { c.league = "NI1"; c.crestInitials = c.short; return c; }),
     ...RAW_NIR2.map(c => { c.league = "NI2"; c.crestInitials = c.short; return c; }),
     ...RAW_MLT1.map(c => { c.league = "MT1"; c.crestInitials = c.short; return c; }),
     ...RAW_MLT2.map(c => { c.league = "MT2"; c.crestInitials = c.short; return c; }),
     ...RAW_FRO1.map(c => { c.league = "FO1"; c.crestInitials = c.short; return c; }),
     ...RAW_FRO2.map(c => { c.league = "FO2"; c.crestInitials = c.short; return c; }),
     ...RAW_WAL1.map(c => { c.league = "WA1"; c.crestInitials = c.short; return c; }),
     ...RAW_WAL2.map(c => { c.league = "WA2"; c.crestInitials = c.short; return c; }),
     ...RAW_GIB1.map(c => { c.league = "GI1"; c.crestInitials = c.short; return c; }),
     ...RAW_GIB2.map(c => { c.league = "GI2"; c.crestInitials = c.short; return c; }),
     ...RAW_AND1.map(c => { c.league = "AD1"; c.crestInitials = c.short; return c; }),
     ...RAW_AND2.map(c => { c.league = "AD2"; c.crestInitials = c.short; return c; }),
     ...RAW_SMR1.map(c => { c.league = "SM1"; c.crestInitials = c.short; return c; }),
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
     // Batch 2 nations.
     { code: "CZ1", name: "Chance Liga",        short: "Chance Liga", country: "CZE", econ: 0.5, format: { split: { groups: [8, 8], legs: 1, points: "carry" } } },
     { code: "CZ2", name: "Národní Liga",       short: "FNL",        country: "CZE", econ: 0.22 },
     { code: "SR1", name: "SuperLiga",          short: "SuperLiga",  country: "SRB", econ: 0.45, format: { split: { groups: [8, 8], legs: 1, points: "carry" } } },
     { code: "SR2", name: "Prva Liga",          short: "Prva Liga",  country: "SRB", econ: 0.2 },
     { code: "UA1", name: "Ukrainian Premier League", short: "UPL",  country: "UKR", econ: 0.5, format: { split: { groups: [8, 8], legs: 1, points: "carry" } } },
     { code: "UA2", name: "Persha Liha",        short: "Persha Liha", country: "UKR", econ: 0.22 },
     { code: "SE1", name: "Allsvenskan",        short: "Allsvenskan", country: "SWE", econ: 0.5 },
     { code: "SE2", name: "Superettan",         short: "Superettan", country: "SWE", econ: 0.25 },
     { code: "NO1", name: "Eliteserien",        short: "Eliteserien", country: "NOR", econ: 0.5 },
     { code: "NO2", name: "OBOS-ligaen",        short: "OBOS",       country: "NOR", econ: 0.25 },
     { code: "RO1", name: "SuperLiga",          short: "Liga I",     country: "ROU", econ: 0.45, format: { split: { groups: [8, 8], legs: 1, points: "halveDown" } } },
     { code: "RO2", name: "Liga II",            short: "Liga II",    country: "ROU", econ: 0.2 },
     { code: "CY1", name: "First Division",     short: "First Div",  country: "CYP", econ: 0.45, format: { split: { groups: [7, 7], legs: 1, points: "carry" } } },
     { code: "CY2", name: "Second Division",    short: "Second Div", country: "CYP", econ: 0.2 },
     { code: "SK1", name: "Niké Liga",          short: "Niké Liga",  country: "SVK", econ: 0.4, format: { split: { groups: [6, 6], legs: 1, points: "carry" } } },
     { code: "SK2", name: "2. Liga",            short: "2. Liga",    country: "SVK", econ: 0.2 },
     // Batch 3 — all remaining UEFA nations.
     { code: "SN1", name: "PrvaLiga",           short: "PrvaLiga",   country: "SVN", econ: 0.35, format: { rounds: 4 } },
     { code: "SN2", name: "2. SNL",             short: "2. SNL",     country: "SVN", econ: 0.15 },
     { code: "IS1", name: "Ligat ha'Al",        short: "Ligat ha'Al", country: "ISR", econ: 0.4, format: { split: { groups: [7, 7], legs: 1, points: "carry" } } },
     { code: "IS2", name: "Liga Leumit",        short: "Leumit",     country: "ISR", econ: 0.18 },
     { code: "FI1", name: "Veikkausliiga",      short: "Veikkausliiga", country: "FIN", econ: 0.35, format: { split: { groups: [6, 6], legs: 1, points: "carry" } } },
     { code: "FI2", name: "Ykkösliiga",         short: "Ykkösliiga", country: "FIN", econ: 0.15 },
     { code: "BG1", name: "Parva Liga",         short: "Parva Liga", country: "BUL", econ: 0.4, format: { split: { groups: [8, 8], legs: 1, points: "carry" } } },
     { code: "BG2", name: "Vtora Liga",         short: "Vtora Liga", country: "BUL", econ: 0.18 },
     { code: "BA1", name: "Premijer Liga",      short: "Premijer",   country: "BIH", econ: 0.35 },
     { code: "BA2", name: "Prva Liga",          short: "Prva Liga",  country: "BIH", econ: 0.15 },
     { code: "IC1", name: "Besta deild",        short: "Besta deild", country: "ISL", econ: 0.3, format: { split: { groups: [6, 6], legs: 1, points: "carry" } } },
     { code: "IC2", name: "1. deild",           short: "1. deild",   country: "ISL", econ: 0.13 },
     { code: "IE1", name: "Premier Division",   short: "Premier Div", country: "IRL", econ: 0.35, format: { rounds: 4 } },
     { code: "IE2", name: "First Division",     short: "First Div",  country: "IRL", econ: 0.15, format: { rounds: 4 } },
     { code: "AL1", name: "Kategoria Superiore", short: "Superiore", country: "ALB", econ: 0.3, format: { rounds: 4 } },
     { code: "AL2", name: "Kategoria e Parë",   short: "e Parë",     country: "ALB", econ: 0.13 },
     { code: "MK1", name: "Prva Liga",          short: "Prva Liga",  country: "MKD", econ: 0.3, format: { rounds: 3 } },
     { code: "MK2", name: "Vtora Liga",         short: "Vtora Liga", country: "MKD", econ: 0.13 },
     { code: "MD1", name: "Super Liga",         short: "Super Liga", country: "MDA", econ: 0.3 },
     { code: "MD2", name: "Liga 1",             short: "Liga 1",     country: "MDA", econ: 0.13 },
     { code: "BY1", name: "Vysshaya Liga",      short: "Vysshaya",   country: "BLR", econ: 0.35 },
     { code: "BY2", name: "Pershaya Liga",      short: "Pershaya",   country: "BLR", econ: 0.15 },
     { code: "AZ1", name: "Premier Liqası",     short: "Premier Liq", country: "AZE", econ: 0.35, format: { rounds: 4 } },
     { code: "AZ2", name: "Birinci Dəstə",      short: "Birinci",    country: "AZE", econ: 0.15 },
     { code: "KZ1", name: "Premier League",     short: "Premier Lg", country: "KAZ", econ: 0.35 },
     { code: "KZ2", name: "First League",       short: "First Lg",   country: "KAZ", econ: 0.15 },
     { code: "GE1", name: "Erovnuli Liga",      short: "Erovnuli",   country: "GEO", econ: 0.3, format: { rounds: 4 } },
     { code: "GE2", name: "Erovnuli Liga 2",    short: "Liga 2",     country: "GEO", econ: 0.13, format: { rounds: 4 } },
     { code: "AM1", name: "Bardz. Khumb",       short: "Premier Lg", country: "ARM", econ: 0.3, format: { rounds: 4 } },
     { code: "AM2", name: "Aradzin Khumb",      short: "First Lg",   country: "ARM", econ: 0.13 },
     { code: "LV1", name: "Virslīga",           short: "Virslīga",   country: "LVA", econ: 0.3, format: { rounds: 4 } },
     { code: "LV2", name: "1. līga",            short: "1. līga",    country: "LVA", econ: 0.13 },
     { code: "LT1", name: "A Lyga",             short: "A Lyga",     country: "LTU", econ: 0.3, format: { rounds: 4 } },
     { code: "LT2", name: "I Lyga",             short: "I Lyga",     country: "LTU", econ: 0.13 },
     { code: "XK1", name: "Superliga",          short: "Superliga",  country: "KVX", econ: 0.3, format: { rounds: 4 } },
     { code: "XK2", name: "Liga e Parë",        short: "e Parë",     country: "KVX", econ: 0.13 },
     { code: "ME1", name: "Prva CFL",           short: "Prva CFL",   country: "MNE", econ: 0.3, format: { rounds: 4 } },
     { code: "ME2", name: "Druga CFL",          short: "Druga CFL",  country: "MNE", econ: 0.13 },
     { code: "ET1", name: "Meistriliiga",       short: "Meistriliiga", country: "EST", econ: 0.3, format: { rounds: 4 } },
     { code: "ET2", name: "Esiliiga",           short: "Esiliiga",   country: "EST", econ: 0.13, format: { rounds: 4 } },
     { code: "LU1", name: "National Division",  short: "National Div", country: "LUX", econ: 0.3 },
     { code: "LU2", name: "Promotion d'Honneur", short: "Promotion", country: "LUX", econ: 0.13 },
     { code: "NI1", name: "NIFL Premiership",   short: "Premiership", country: "NIR", econ: 0.35, format: { rounds: 3, split: { groups: [6, 6], legs: 1, points: "carry" } } },
     { code: "NI2", name: "NIFL Championship",  short: "Championship", country: "NIR", econ: 0.15 },
     { code: "MT1", name: "Premier League",     short: "Premier Lg", country: "MLT", econ: 0.3 },
     { code: "MT2", name: "Challenge League",   short: "Challenge",  country: "MLT", econ: 0.13 },
     { code: "FO1", name: "Betri deildin",      short: "Betri deildin", country: "FRO", econ: 0.28, format: { rounds: 3 } },
     { code: "FO2", name: "1. deild",           short: "1. deild",   country: "FRO", econ: 0.12 },
     { code: "WA1", name: "Cymru Premier",      short: "Cymru Premier", country: "WAL", econ: 0.3, format: { split: { groups: [6, 6], legs: 1, points: "carry" } } },
     { code: "WA2", name: "Cymru North",        short: "Cymru North", country: "WAL", econ: 0.12 },
     { code: "GI1", name: "Gibraltar Football League", short: "GFL", country: "GIB", econ: 0.25 },
     { code: "GI2", name: "Intermediate League", short: "Intermediate", country: "GIB", econ: 0.1 },
     { code: "AD1", name: "Primera Divisió",    short: "Primera Div", country: "AND", econ: 0.25, format: { rounds: 3 } },
     { code: "AD2", name: "Segona Divisió",     short: "Segona Div", country: "AND", econ: 0.1 },
     { code: "SM1", name: "Campionato Sammarinese", short: "Campionato", country: "SMR", econ: 0.2 },
   ];
   const COUNTRY_NAMES = {
     ENG: "England", ESP: "Spain", GER: "Germany", ITA: "Italy", FRA: "France",
     POR: "Portugal", NED: "Netherlands", POL: "Poland", TUR: "Turkey",
     BEL: "Belgium", AUT: "Austria", DEN: "Denmark", GRE: "Greece",
     SCO: "Scotland", SUI: "Switzerland", CRO: "Croatia", HUN: "Hungary",
     CZE: "Czechia", SRB: "Serbia", UKR: "Ukraine", SWE: "Sweden",
     NOR: "Norway", ROU: "Romania", CYP: "Cyprus", SVK: "Slovakia",
     SVN: "Slovenia", ISR: "Israel", FIN: "Finland", BUL: "Bulgaria",
     BIH: "Bosnia & Herz.", ISL: "Iceland", IRL: "Ireland", ALB: "Albania",
     MKD: "North Macedonia", MDA: "Moldova", BLR: "Belarus", AZE: "Azerbaijan",
     KAZ: "Kazakhstan", GEO: "Georgia", ARM: "Armenia", LVA: "Latvia",
     LTU: "Lithuania", KVX: "Kosovo", MNE: "Montenegro", EST: "Estonia",
     LUX: "Luxembourg", NIR: "N. Ireland", MLT: "Malta", FRO: "Faroe Islands",
     WAL: "Wales", GIB: "Gibraltar", AND: "Andorra", SMR: "San Marino",
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