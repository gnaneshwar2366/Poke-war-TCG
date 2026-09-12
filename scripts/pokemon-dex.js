/**
 * National dex numbers for accurate PokeAPI artwork matching.
 * Keys are normalized: lowercase, no special chars except handled overrides.
 */
const POKEMON_DEX = {
  // Gen 1
  bulbasaur: 1, ivysaur: 2, venusaur: 3, charmander: 4, charmeleon: 5, charizard: 6,
  squirtle: 7, wartortle: 8, blastoise: 9, caterpie: 10, metapod: 11, butterfree: 12,
  weedle: 13, kakuna: 14, beedrill: 15, pidgey: 16, pidgeotto: 17, pidgeot: 18,
  rattata: 19, raticate: 20, spearow: 21, fearow: 22, ekans: 23, arbok: 24,
  pikachu: 25, raichu: 26, sandshrew: 27, sandslash: 28, nidoranf: 29, nidorina: 30,
  nidoqueen: 31, nidoranm: 32, nidorino: 33, nidoking: 34, clefairy: 35, clefable: 36,
  vulpix: 37, ninetales: 38, jigglypuff: 39, wigglytuff: 40, zubat: 41, golbat: 42,
  oddish: 43, gloom: 44, vileplume: 45, paras: 46, parasect: 47, venonat: 48,
  venomoth: 49, diglett: 50, dugtrio: 51, meowth: 52, persian: 53, psyduck: 54,
  golduck: 55, mankey: 56, primeape: 57, growlithe: 58, arcanine: 59, poliwag: 60,
  poliwhirl: 61, poliwrath: 62, abra: 63, kadabra: 64, alakazam: 65, machop: 66,
  machoke: 67, machamp: 68, bellsprout: 69, weepinbell: 70, victreebel: 71,
  tentacool: 72, tentacruel: 73, geodude: 74, graveler: 75, golem: 76, ponyta: 77,
  rapidash: 78, slowpoke: 79, slowbro: 80, magnemite: 81, magneton: 82,
  farfetchd: 83, doduo: 84, dodrio: 85, seel: 86, dewgong: 87, grimer: 88, muk: 89,
  shellder: 90, cloyster: 91, gastly: 92, haunter: 93, gengar: 94, onix: 95,
  drowzee: 96, hypno: 97, krabby: 98, kingler: 99, voltorb: 100, electrode: 101,
  exeggcute: 102, exeggutor: 103, cubone: 104, marowak: 105, hitmonlee: 106,
  hitmonchan: 107, lickitung: 108, koffing: 109, weezing: 110, rhyhorn: 111,
  rhydon: 112, chansey: 113, tangela: 114, kangaskhan: 115, horsea: 116, seadra: 117,
  goldeen: 118, seaking: 119, staryu: 120, starmie: 121, mrmime: 122, scyther: 123,
  jynx: 124, electabuzz: 125, magmar: 126, pinsir: 127, tauros: 128, magikarp: 129,
  gyarados: 130, lapras: 131, ditto: 132, eevee: 133, vaporeon: 134, jolteon: 135,
  flareon: 136, porygon: 137, omanyte: 138, omastar: 139, kabuto: 140, kabutops: 141,
  aerodactyl: 142, snorlax: 143, articuno: 144, zapdos: 145, moltres: 146,
  dratini: 147, dragonair: 148, dragonite: 149, mewtwo: 150, mew: 151,
  // Gen 2-9 selected
  chikorita: 152, bayleef: 153, meganium: 154, cyndaquil: 155, quilava: 156, typhlosion: 157,
  totodile: 158, croconaw: 159, feraligatr: 160, ampharos: 181, heracross: 214, tyranitar: 248,
  hooh: 250, treecko: 252, grovyle: 253, sceptile: 254, torchic: 255, combusken: 256, blaziken: 257,
  mudkip: 258, marshtomp: 259, swampert: 260, metagross: 376, salamence: 373, kyogre: 382, groudon: 383,
  flygon: 330, absol: 359, turtwig: 387, grotle: 388, torterra: 389, chimchar: 390, monferno: 391,
  infernape: 392, piplup: 393, prinplup: 394, empoleon: 395, luxray: 405, weavile: 461,
  dialga: 483, palkia: 484, giratina: 487, snivy: 495, servine: 496, serperior: 497,
  tepig: 498, pignite: 499, emboar: 500, oshawott: 501, dewott: 502, samurott: 503,
  zoroark: 571, hydreigon: 635, chandelure: 609, haxorus: 612, volcarona: 637, reshiram: 643, zekrom: 644,
  chespin: 650, quilladin: 651, chesnaught: 652, fennekin: 653, braixen: 654, delphox: 655,
  froakie: 656, frogadier: 657, greninja: 658, talonflame: 663, hawlucha: 701, xerneas: 716, yveltal: 717,
  rowlet: 722, dartrix: 723, decidueye: 724, litten: 725, torracat: 726, incineroar: 727,
  popplio: 728, brionne: 729, primarina: 730, lycanroc: 745, mimikyu: 778, toxapex: 748,
  vikavolt: 738, kommoo: 784, tapukoko: 785, solgaleo: 791, grookey: 810, thwackey: 811, rillaboom: 812,
  scorbunny: 813, raboot: 814, cinderace: 815, sobble: 816, drizzile: 817, inteleon: 818,
  corviknight: 823, dragapult: 887, zacian: 888, zamazenta: 889, armarouge: 936, ceruledge: 937,
  annihilape: 979, kingambit: 983,
  scizor: 212, bellossom: 182, umbreon: 197, espeon: 196, sylveon: 700, leafeon: 470,
  glaceon: 471, vaporeon: 134, jolteon: 135, flareon: 136,
  lucario: 448, garchomp: 445, gardevoir: 282, ralts: 280, kirlia: 281,
  sprigatito: 906, floragato: 907, meowscarada: 908, fuecoco: 909, crocalor: 910,
  skeledirge: 911, quaxly: 912, quaxwell: 913, quaquaval: 914, pawmi: 921,
  pawmo: 922, pawmot: 923, koraidon: 1007, miraidon: 1008, cyclizar: 967,
  dondozo: 977, tatsugiri: 978, varoom: 965, revavroom: 966, tinkatink: 958,
  tinkatuff: 959, tinkaton: 960, noibat: 714, noivern: 715, squawkabilly: 931,
  chienpao: 1002, tinglu: 1003, chi_yu: 1004, chiyu: 1004, wochien: 1001,
  chienpaoex: 1002, tingluex: 1003, chiyuex: 1004, wochienex: 1001,
  gimmighoul: 999, gholdengo: 1000, roaringmoon: 1005, ironvaliant: 1006,
  tarountula: 917, spidops: 918, bellibolt: 939, clefairy: 35, clefable: 36,
  togepi: 175, togetic: 176, togekiss: 468, toxtricity: 849, aegislash: 681,
  volcanion: 721, horsea: 116, seadra: 117, kingdra: 230, joltik: 595,
  galvantula: 596, natu: 177, xatu: 178, surskit: 283, masquerain: 284,
  pineco: 204, oddish: 43, gloom: 44, scyther: 123, vulpix: 37, ninetales: 38,
  lapras: 131, alolanvulpix: 37, hisuianlilligant: 549, hisuiantyphlosion: 157,
  hisuiandecidueye: 724, hisuiansamurott: 503, shaymin: 492, arceus: 493,
  regieleki: 894, regidrago: 895, ursaluna: 901, kyurem: 646, enamorus: 905,
  aerodactyl: 142, drapion: 452, goodra: 706, lugia: 249, rayquaza: 384,
  mewtwo: 150, charizard: 6, blastoise: 9, venusaur: 3, pikachu: 25,
  gengar: 94, umbreon: 197, espeon: 196, eevee: 133,
};

function normalizeName(name) {
  return name
    .replace(/\s+(ex|EX|V|VMAX|VSTAR|V-UNION)$/i, "")
    .replace(/^Alolan\s+/i, "alolan")
    .replace(/^Hisuian\s+/i, "hisuian")
    .replace(/♀/g, "f")
    .replace(/♂/g, "m")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function lookupDexNumber(name, fallbackNum, setName) {
  const base = normalizeName(name);
  if (POKEMON_DEX[base]) return POKEMON_DEX[base];
  // Gen 1 from 151 set — card number IS national dex
  if (setName === "151" && fallbackNum) {
    const n = parseInt(fallbackNum, 10);
    if (n >= 1 && n <= 151) return n;
  }
  return null;
}

module.exports = { POKEMON_DEX, normalizeName, lookupDexNumber };
