/** Official 18-type chart (Pokémon Database / core games) plus TCG energy aliases. */

const CORE_TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

const TCG_TO_CORE = {
  Lightning: "Electric",
  Darkness: "Dark",
  Metal: "Steel",
  Colorless: "Normal",
};

const CHART = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
};

const SPECIES_CORE_TYPES = {
  pidgey: ["Normal", "Flying"], pidgeotto: ["Normal", "Flying"], pidgeot: ["Normal", "Flying"],
  spearow: ["Normal", "Flying"], fearow: ["Normal", "Flying"], zubat: ["Poison", "Flying"], golbat: ["Poison", "Flying"],
  geodude: ["Rock", "Ground"], graveler: ["Rock", "Ground"], golem: ["Rock", "Ground"],
  onix: ["Rock", "Ground"], rhyhorn: ["Ground", "Rock"], rhydon: ["Ground", "Rock"],
  omanyte: ["Rock", "Water"], omastar: ["Rock", "Water"], kabuto: ["Rock", "Water"], kabutops: ["Rock", "Water"],
  aerodactyl: ["Rock", "Flying"], articuno: ["Ice", "Flying"], zapdos: ["Electric", "Flying"], moltres: ["Fire", "Flying"],
  gyarados: ["Water", "Flying"], dragonite: ["Dragon", "Flying"], charizard: ["Fire", "Flying"],
  gastly: ["Ghost", "Poison"], haunter: ["Ghost", "Poison"], gengar: ["Ghost", "Poison"],
  ekans: ["Poison"], arbok: ["Poison"], nidoranf: ["Poison"], nidorina: ["Poison"], nidoqueen: ["Poison", "Ground"],
  nidoranm: ["Poison"], nidorino: ["Poison"], nidoking: ["Poison", "Ground"],
  oddish: ["Grass", "Poison"], gloom: ["Grass", "Poison"], vileplume: ["Grass", "Poison"], bellossom: ["Grass"],
  bellsprout: ["Grass", "Poison"], weepinbell: ["Grass", "Poison"], victreebel: ["Grass", "Poison"],
  tentacool: ["Water", "Poison"], tentacruel: ["Water", "Poison"],
  venonat: ["Bug", "Poison"], venomoth: ["Bug", "Poison"], paras: ["Bug", "Grass"], parasect: ["Bug", "Grass"],
  scyther: ["Bug", "Flying"], pinsir: ["Bug"], caterpie: ["Bug"], metapod: ["Bug"], butterfree: ["Bug", "Flying"],
  weedle: ["Bug", "Poison"], kakuna: ["Bug", "Poison"], beedrill: ["Bug", "Poison"],
  magnemite: ["Electric", "Steel"], magneton: ["Electric", "Steel"],
  jynx: ["Ice", "Psychic"], lapras: ["Water", "Ice"], dewgong: ["Water", "Ice"], cloyster: ["Water", "Ice"],
  sandshrew: ["Ground"], sandslash: ["Ground"], diglett: ["Ground"], dugtrio: ["Ground"], cubone: ["Ground"], marowak: ["Ground"],
  machop: ["Fighting"], machoke: ["Fighting"], machamp: ["Fighting"], hitmonlee: ["Fighting"], hitmonchan: ["Fighting"],
  mankey: ["Fighting"], primeape: ["Fighting"], poliwrath: ["Water", "Fighting"],
  dratini: ["Dragon"], dragonair: ["Dragon"],
  eevee: ["Normal"], snorlax: ["Normal"], rattata: ["Normal"], raticate: ["Normal"], tauros: ["Normal"],
  ditto: ["Normal"], porygon: ["Normal"], lickitung: ["Normal"], kangaskhan: ["Normal"],
  clefairy: ["Fairy"], clefable: ["Fairy"], jigglypuff: ["Fairy"], wigglytuff: ["Fairy"], "mr.mime": ["Psychic", "Fairy"],
  mrmime: ["Psychic", "Fairy"],
  scizor: ["Bug", "Steel"], heracross: ["Bug", "Fighting"], tyranitar: ["Rock", "Dark"],
  ampharos: ["Electric"], umbreon: ["Dark"], espeon: ["Psychic"], lugia: ["Psychic", "Flying"], hooh: ["Fire", "Flying"],
  chikorita: ["Grass"], bayleef: ["Grass"], meganium: ["Grass"],
  cyndaquil: ["Fire"], quilava: ["Fire"], typhlosion: ["Fire"],
  totodile: ["Water"], croconaw: ["Water"], feraligatr: ["Water"],
  treecko: ["Grass"], grovyle: ["Grass"], sceptile: ["Grass"],
  torchic: ["Fire"], combusken: ["Fire", "Fighting"], blaziken: ["Fire", "Fighting"],
  mudkip: ["Water"], marshtomp: ["Water", "Ground"], swampert: ["Water", "Ground"],
  gardevoir: ["Psychic", "Fairy"], ralts: ["Psychic", "Fairy"], kirlia: ["Psychic", "Fairy"],
  metagross: ["Steel", "Psychic"], salamence: ["Dragon", "Flying"], rayquaza: ["Dragon", "Flying"],
  kyogre: ["Water"], groudon: ["Ground"], flygon: ["Ground", "Dragon"], absol: ["Dark"],
  turtwig: ["Grass"], grotle: ["Grass"], torterra: ["Grass", "Ground"],
  chimchar: ["Fire"], monferno: ["Fire", "Fighting"], infernape: ["Fire", "Fighting"],
  piplup: ["Water"], prinplup: ["Water"], empoleon: ["Water", "Steel"],
  lucario: ["Fighting", "Steel"], garchomp: ["Dragon", "Ground"], luxray: ["Electric"],
  weavile: ["Dark", "Ice"], dialga: ["Steel", "Dragon"], palkia: ["Water", "Dragon"], giratina: ["Ghost", "Dragon"],
  snivy: ["Grass"], servine: ["Grass"], serperior: ["Grass"],
  tepig: ["Fire"], pignite: ["Fire", "Fighting"], emboar: ["Fire", "Fighting"],
  oshawott: ["Water"], dewott: ["Water"], samurott: ["Water"],
  zoroark: ["Dark"], hydreigon: ["Dark", "Dragon"], chandelure: ["Ghost", "Fire"],
  haxorus: ["Dragon"], volcarona: ["Bug", "Fire"], reshiram: ["Dragon", "Fire"], zekrom: ["Dragon", "Electric"],
  chespin: ["Grass"], quilladin: ["Grass"], chesnaught: ["Grass", "Fighting"],
  fennekin: ["Fire"], braixen: ["Fire"], delphox: ["Fire", "Psychic"],
  froakie: ["Water"], frogadier: ["Water"], greninja: ["Water", "Dark"],
  talonflame: ["Fire", "Flying"], aegislash: ["Steel", "Ghost"], sylveon: ["Fairy"],
  goodra: ["Dragon"], hawlucha: ["Fighting", "Flying"], noivern: ["Flying", "Dragon"],
  xerneas: ["Fairy"], yveltal: ["Dark", "Flying"],
  rowlet: ["Grass", "Flying"], dartrix: ["Grass", "Flying"], decidueye: ["Grass", "Ghost"],
  litten: ["Fire"], torracat: ["Fire"], incineroar: ["Fire", "Dark"],
  popplio: ["Water"], brionne: ["Water"], primarina: ["Water", "Fairy"],
  lycanroc: ["Rock"], mimikyu: ["Ghost", "Fairy"], toxapex: ["Poison", "Water"],
  vikavolt: ["Bug", "Electric"], kommoo: ["Dragon", "Fighting"], tapukoko: ["Electric", "Fairy"], solgaleo: ["Psychic", "Steel"],
  grookey: ["Grass"], thwackey: ["Grass"], rillaboom: ["Grass"],
  scorbunny: ["Fire"], raboot: ["Fire"], cinderace: ["Fire"],
  sobble: ["Water"], drizzile: ["Water"], inteleon: ["Water"],
  corviknight: ["Flying", "Steel"], dragapult: ["Dragon", "Ghost"], toxtricity: ["Electric", "Poison"],
  zacian: ["Fairy"], zamazenta: ["Fighting"],
  sprigatito: ["Grass"], floragato: ["Grass"], meowscarada: ["Grass", "Dark"],
  fuecoco: ["Fire"], crocalor: ["Fire"], skeledirge: ["Fire", "Ghost"],
  quaxly: ["Water"], quaxwell: ["Water"], quaquaval: ["Water", "Fighting"],
  tinkaton: ["Fairy", "Steel"], tinkatink: ["Fairy", "Steel"], tinkatuff: ["Fairy", "Steel"],
  armarouge: ["Fire", "Psychic"], ceruledge: ["Fire", "Ghost"], annihilape: ["Fighting", "Ghost"],
  kingambit: ["Dark", "Steel"], koraidon: ["Fighting", "Dragon"], miraidon: ["Electric", "Dragon"],
  glaceon: ["Ice"], leafeon: ["Grass"], vaporeon: ["Water"], jolteon: ["Electric"], flareon: ["Fire"],
  togepi: ["Fairy"], togetic: ["Fairy", "Flying"], togekiss: ["Fairy", "Flying"],
  noibat: ["Flying", "Dragon"], pineco: ["Bug"], joltik: ["Bug", "Electric"], galvantula: ["Bug", "Electric"],
  surskit: ["Bug", "Water"], masquerain: ["Bug", "Flying"], horsea: ["Water"], seadra: ["Water"], kingdra: ["Water", "Dragon"],
  tarountula: ["Bug"], spidops: ["Bug"], pawmi: ["Electric"], pawmo: ["Electric", "Fighting"], pawmot: ["Electric", "Fighting"],
  varoom: ["Steel", "Poison"], revavroom: ["Steel", "Poison"], dondozo: ["Water"],
  gimmighoul: ["Ghost"], gholdengo: ["Steel", "Ghost"],
  hisuianlilligant: ["Grass", "Fighting"], hisuiantyphlosion: ["Fire", "Ghost"],
  hisuiandecidueye: ["Grass", "Fighting"], hisuiansamurott: ["Water", "Dark"],
  alolanvulpix: ["Ice"], ninetales: ["Fire"], vulpix: ["Fire"],
  shaymin: ["Grass"], arceus: ["Normal"], kyurem: ["Dragon", "Ice"],
  enamorus: ["Fairy", "Flying"], drapion: ["Poison", "Dark"],
  abra: ["Psychic"], kadabra: ["Psychic"], alakazam: ["Psychic"],
  slowpoke: ["Water", "Psychic"], slowbro: ["Water", "Psychic"],
  staryu: ["Water"], starmie: ["Water", "Psychic"],
  magikarp: ["Water"], seel: ["Water"], shellder: ["Water"],
  growlithe: ["Fire"], arcanine: ["Fire"], ponyta: ["Fire"], rapidash: ["Fire"], magmar: ["Fire"],
  pikachu: ["Electric"], raichu: ["Electric"], voltorb: ["Electric"], electrode: ["Electric"], electabuzz: ["Electric"],
  bulbasaur: ["Grass", "Poison"], ivysaur: ["Grass", "Poison"], venusaur: ["Grass", "Poison"],
  charmander: ["Fire"], charmeleon: ["Fire"], squirtle: ["Water"], wartortle: ["Water"], blastoise: ["Water"],
  mewtwo: ["Psychic"], mew: ["Psychic"],
};

function normalizeKey(name) {
  return String(name || "")
    .replace(/\s+(ex|EX|V|VMAX|VSTAR|V-UNION)$/i, "")
    .replace(/^Alolan\s+/i, "alolan")
    .replace(/^Hisuian\s+/i, "hisuian")
    .replace(/^Ethan'?s\s+/i, "")
    .replace(/[-'\s]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function toCoreType(type) {
  const raw = String(type || "Normal");
  if (TCG_TO_CORE[raw]) return TCG_TO_CORE[raw];
  const titled = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (CORE_TYPES.includes(titled)) return titled;
  if (TCG_TO_CORE[titled]) return TCG_TO_CORE[titled];
  return "Normal";
}

function getCoreTypes(card) {
  const key = normalizeKey(card?.baseName || card?.name);
  if (SPECIES_CORE_TYPES[key]) return SPECIES_CORE_TYPES[key];
  const tcg = (card?.types || []).map(toCoreType);
  return tcg.length ? [...new Set(tcg)] : ["Normal"];
}

function getTypeMultiplier(attackType, defenderTypes) {
  const atk = toCoreType(attackType);
  const defs = (defenderTypes || []).map(toCoreType);
  if (!defs.length) return 1;
  return defs.reduce((mult, def) => {
    const row = CHART[atk] || {};
    const value = row[def];
    return mult * (value === undefined ? 1 : value);
  }, 1);
}

function cardMatchesCoreType(card, coreType) {
  const wanted = toCoreType(coreType);
  return getCoreTypes(card).includes(wanted);
}

module.exports = {
  CORE_TYPES,
  TCG_TO_CORE,
  CHART,
  toCoreType,
  getCoreTypes,
  getTypeMultiplier,
  cardMatchesCoreType,
  normalizeKey,
};
