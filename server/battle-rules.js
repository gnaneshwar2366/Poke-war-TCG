/** Authoritative cooldown-based combat calculations. */
const { getTypeMultiplier, toCoreType } = require("./type-chart");
function getMoveType(card, move) {
  return move?.cost?.find((cost) => cost !== "Colorless") || card?.types?.[0] || "Colorless";
}

function getMoveCost(move) {
  return Math.max(0, move?.convertedEnergyCost ?? move?.cost?.length ?? 0);
}

function getMoveCategory(move) {
  const cost = getMoveCost(move);
  return cost <= 1 ? "Quick" : cost === 2 ? "Standard" : "Heavy";
}

function getMoveCooldown(move) {
  const cost = getMoveCost(move);
  return cost <= 1 ? 0 : cost === 2 ? 1 : Math.min(3, cost - 1);
}

function parseDamage(damage) {
  if (Number.isFinite(damage)) return Math.max(0, damage);
  const match = String(damage || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getCardAttackBonus(card) {
  const rarity = String(card?.rarity || "");
  if (/Secret|Rainbow|Hyper|Special Illustration/i.test(rarity)) return 4;
  if (/Ultra Rare|Double Rare|Illustration Rare/i.test(rarity)) return 3;
  return /Rare/i.test(rarity) ? 2 : 0;
}

function getMovePower(card, move) {
  return parseDamage(move?.damage) + getCardAttackBonus(card);
}

function parseWeaknessMultiplier(value) {
  const match = String(value || "").match(/x?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : 2;
}

function parseResistanceReduction(value) {
  const match = String(value || "").match(/-?\s*(\d+)/);
  return match ? Number(match[1]) : 20;
}

function hasType(value, type) {
  if (Array.isArray(value)) return value.some((item) => hasType(item, type));
  if (value && typeof value === "object") return hasType(value.type || value.name || value.value, type);
  return String(value || "").toLowerCase().includes(String(type || "").toLowerCase());
}

function defenderCoreTypes(defenderCard) {
  if (Array.isArray(defenderCard?.coreTypes) && defenderCard.coreTypes.length) return defenderCard.coreTypes;
  const types = defenderCard?.types || [];
  return types.length ? types.map((type) => toCoreType(type)) : ["Normal"];
}

function getDamageBreakdown(attackerCard, defenderCard, move, variance = 1) {
  const moveType = getMoveType(attackerCard, move);
  const power = getMovePower(attackerCard, move);
  const multiplier = getTypeMultiplier(moveType, defenderCoreTypes(defenderCard));
  const beforeVariance = Math.max(0, power * multiplier);
  const damage = Math.max(0, Math.round(beforeVariance * variance));
  const effectiveness = multiplier === 0 ? "no-effect" : multiplier > 1 ? "super" : multiplier < 1 ? "not-effective" : "normal";
  return {
    moveType, power, cost: getMoveCost(move), category: getMoveCategory(move), cooldown: getMoveCooldown(move),
    weaknessChart: multiplier, resistanceReduction: 0, multiplier, variance, damage, effectiveness,
  };
}

function getEffectivenessLabel(effectiveness) {
  if (effectiveness === "super") return "Super Effective";
  if (effectiveness === "not-effective") return "Resisted";
  if (effectiveness === "no-effect") return "No Effect";
  return "Normal Damage";
}

function getBattlePreview(card, move) {
  const breakdown = getDamageBreakdown(card, {}, move);
  return { moveType: breakdown.moveType, power: breakdown.power, cost: breakdown.cost, category: breakdown.category, cooldown: breakdown.cooldown };
}

module.exports = { getMoveType, getMovePower, getMoveCost, getMoveCategory, getMoveCooldown, getDamageBreakdown, getEffectivenessLabel, getBattlePreview };
