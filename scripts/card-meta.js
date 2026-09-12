/** Generates TCG battle stats and enriches card data. */

const { lookupDexNumber, normalizeName } = require("./pokemon-dex");
const { getCoreTypes } = require("../server/type-chart");

const WEAKNESS = {
  Fire: "Water", Water: "Lightning", Grass: "Fire", Lightning: "Fighting",
  Psychic: "Darkness", Fighting: "Psychic", Darkness: "Grass", Metal: "Fire",
  Dragon: "Dragon", Fairy: "Metal", Colorless: "Fighting",
};

const RESISTANCE = {
  Psychic: "Fighting", Darkness: "Psychic", Metal: "Psychic",
};

const ATTACK_NAMES = {
  Fire: ["Ember", "Flame Wheel", "Heat Blast", "Inferno"],
  Water: ["Water Gun", "Aqua Tail", "Hydro Pump", "Splash Burn"],
  Grass: ["Vine Whip", "Razor Leaf", "Solar Beam", "Leaf Storm"],
  Lightning: ["Thunder Shock", "Spark", "Thunderbolt", "Volt Tackle"],
  Psychic: ["Confusion", "Psybeam", "Psychic", "Super Psy Bolt"],
  Fighting: ["Karate Chop", "Low Kick", "Brick Break", "Dynamic Punch"],
  Darkness: ["Bite", "Crunch", "Dark Pulse", "Shadow Claw"],
  Metal: ["Metal Claw", "Iron Head", "Flash Cannon", "Steel Beam"],
  Dragon: ["Dragon Claw", "Dragon Pulse", "Draco Meteor", "Outrage"],
  Fairy: ["Fairy Wind", "Dazzling Gleam", "Moonblast", "Starlight"],
  Colorless: ["Tackle", "Quick Attack", "Slam", "Hyper Beam"],
};

function parseName(name) {
  let baseName = name;
  let suffix = null;
  let stage = "BASIC";

  if (/\bVMAX\b/i.test(name)) {
    suffix = "VMAX";
    baseName = name.replace(/\s*VMAX/i, "").trim();
  } else if (/\bVSTAR\b/i.test(name)) {
    suffix = "VSTAR";
    baseName = name.replace(/\s*VSTAR/i, "").trim();
  } else if (/\s+V$/i.test(name)) {
    suffix = "V";
    baseName = name.replace(/\s+V$/i, "").trim();
  } else if (/\sEX$/i.test(name)) {
    suffix = "EX";
    baseName = name.replace(/\s+EX$/i, "").trim();
  } else if (/\s+ex$/i.test(name)) {
    suffix = "ex";
    baseName = name.replace(/\s+ex$/i, "").trim();
  }

  const stage1 = /^(Ivysaur|Charmeleon|Wartortle|Metapod|Kakuna|Pidgeotto|Nidorina|Nidorino|Gloom|Haunter|Graveler|Poliwhirl|Kadabra|Machoke|Weepinbell|Dragonair|Floragato|Crocalor|Quaxwell|Pawmo|Kirlia|Togetic)$/i;
  if (stage1.test(baseName)) stage = "STAGE 1";

  return { baseName, suffix, stage };
}

function calcRetreat(hp, suffix) {
  if (suffix === "VMAX" || suffix === "VSTAR") return 3;
  if (suffix === "V" || suffix === "EX" || suffix === "ex") return 2;
  if (hp >= 140) return 3;
  if (hp >= 100) return 2;
  return 1;
}

function generateAttacks(type, hp, suffix) {
  const names = ATTACK_NAMES[type] || ATTACK_NAMES.Colorless;
  const t = type;
  const C = "Colorless";
  const isPremium = ["V", "EX", "ex", "VMAX", "VSTAR"].includes(suffix || "");

  if (isPremium) {
    return [
      { name: names[1], cost: [t, C], damage: Math.round(hp * 0.25), text: null },
      { name: names[3], cost: [t, t, C, C], damage: Math.round(hp * 0.55), text: null },
    ];
  }
  return [
    { name: names[0], cost: [t], damage: Math.max(10, Math.round(hp * 0.15)), text: null },
    { name: names[2], cost: [t, C], damage: Math.max(20, Math.round(hp * 0.35)), text: null },
  ];
}

function getRuleText(suffix) {
  if (suffix === "VMAX") return "When your Pokémon VMAX is Knocked Out, your opponent takes 3 Prize cards.";
  if (suffix === "V" || suffix === "VSTAR") return "When your Pokémon V is Knocked Out, your opponent takes 2 Prize cards.";
  if (suffix === "EX" || suffix === "ex") return "When a Pokémon-EX has been Knocked Out, your opponent takes 2 Prize cards.";
  return null;
}

function enrichCard(card) {
  const { baseName, suffix, stage } = parseName(card.name);
  const type = (card.types && card.types[0]) || "Colorless";
  const dexNumber =
    card.dexNumber ||
    lookupDexNumber(baseName, card.number, card.setName) ||
    lookupDexNumber(card.name, card.number, card.setName);

  // Always prefer official TCG hires image — correct name + artwork baked in
  const displayImage = card.imageUrlLarge || card.imageUrl;
  const artworkUrl = dexNumber
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNumber}.png`
    : displayImage;

  return {
    ...card,
    baseName,
    suffix,
    stage,
    dexNumber: dexNumber || null,
    displayImage,
    artworkUrl,
    weakness: WEAKNESS[type] || "Fighting",
    resistance: RESISTANCE[type] || null,
    retreatCost: calcRetreat(card.hp || 70, suffix),
    attacks: card.attacks?.length ? card.attacks : generateAttacks(type, card.hp || 70, suffix),
    ruleText: getRuleText(suffix),
    coreTypes: getCoreTypes({ ...card, baseName }),
    isFullArt: !!(suffix || /Ultra|Illustration|Hyper|Secret|Double Rare/i.test(card.rarity)),
  };
}

module.exports = { enrichCard, parseName, WEAKNESS, RESISTANCE };
