import type { Card, CardAttack } from "@/types";
import { getTypeMultiplier, toCoreType } from "@/lib/typeChart";

export type MoveCategory = "Quick" | "Standard" | "Heavy";

export function getMoveType(card: Card, move?: CardAttack): string {
  return move?.cost?.find((cost) => cost !== "Colorless") || card?.types?.[0] || "Colorless";
}

export function getMoveCost(move?: CardAttack): number {
  return Math.max(0, move?.convertedEnergyCost ?? move?.cost?.length ?? 0);
}

export function getMoveCategory(move?: CardAttack): MoveCategory {
  const cost = getMoveCost(move);
  return cost <= 1 ? "Quick" : cost === 2 ? "Standard" : "Heavy";
}

export function getMoveCooldown(move?: CardAttack): number {
  const cost = getMoveCost(move);
  return cost <= 1 ? 0 : cost === 2 ? 1 : Math.min(3, cost - 1);
}

function parseDamage(damage: CardAttack["damage"]): number {
  if (Number.isFinite(damage)) return Math.max(0, damage as number);
  const match = String(damage || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getCardAttackBonus(card: Card): number {
  if (/Secret|Rainbow|Hyper|Special Illustration/i.test(card.rarity || "")) return 4;
  if (/Ultra Rare|Double Rare|Illustration Rare/i.test(card.rarity || "")) return 3;
  return /Rare/i.test(card.rarity || "") ? 2 : 0;
}

export function getMovePower(card: Card, move?: CardAttack): number {
  return parseDamage(move?.damage ?? null) + getCardAttackBonus(card);
}

function hasType(value: unknown, type: string): boolean {
  if (Array.isArray(value)) return value.some((item) => hasType(item, type));
  if (value && typeof value === "object") {
    const item = value as { type?: string; name?: string; value?: string };
    return hasType(item.type || item.name || item.value, type);
  }
  return String(value || "").toLowerCase().includes(type.toLowerCase());
}

function defenderCoreTypes(defenderCard: Card): string[] {
  if (Array.isArray(defenderCard?.coreTypes) && defenderCard.coreTypes.length) return defenderCard.coreTypes;
  const types = defenderCard?.types || [];
  return types.length ? types.map((type) => toCoreType(type)) : ["Normal"];
}

export function getDamageBreakdown(attackerCard: Card, defenderCard: Card, move?: CardAttack) {
  const moveType = getMoveType(attackerCard, move);
  const power = getMovePower(attackerCard, move);
  const multiplier = getTypeMultiplier(moveType, defenderCoreTypes(defenderCard));
  const tcgWeakness = hasType(defenderCard.weakness, moveType) ? 1.1 : 1;
  const resistanceReduction = 0;
  const damage = Math.max(0, Math.round(power * multiplier * tcgWeakness));
  const effectiveness =
    multiplier === 0 ? "no-effect" as const
      : multiplier > 1 ? "super" as const
      : multiplier < 1 ? "not-effective" as const
      : "normal" as const;
  return {
    moveType, power, cost: getMoveCost(move), category: getMoveCategory(move), cooldown: getMoveCooldown(move),
    weaknessChart: multiplier, resistanceReduction, multiplier, damage, effectiveness,
  };
}

export function getEffectivenessLabel(effectiveness: "super" | "not-effective" | "normal" | "no-effect") {
  if (effectiveness === "super") return "Super Effective";
  if (effectiveness === "not-effective") return "Resisted";
  if (effectiveness === "no-effect") return "No Effect";
  return "Normal Damage";
}

export interface BattlePreview { moveType: string; power: number; cost: number; category: MoveCategory; cooldown: number; }

export function getBattlePreview(card: Card, move?: CardAttack): BattlePreview {
  const result = getDamageBreakdown(card, {} as Card, move);
  return { moveType: result.moveType, power: result.power, cost: result.cost, category: result.category, cooldown: result.cooldown };
}
