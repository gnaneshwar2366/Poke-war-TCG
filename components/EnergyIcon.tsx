"use client";

import { TYPE_COLORS, toCoreType } from "@/lib/typeChart";

const SYMBOLS: Record<string, string> = {
  Fire: "🔥",
  Water: "💧",
  Grass: "🌿",
  Electric: "⚡",
  Lightning: "⚡",
  Ice: "❄",
  Fighting: "✊",
  Poison: "☠",
  Ground: "⛰",
  Flying: "✈",
  Psychic: "◉",
  Bug: "🐛",
  Rock: "◆",
  Ghost: "👻",
  Dragon: "🐉",
  Dark: "🌙",
  Darkness: "🌙",
  Steel: "⚙",
  Metal: "⚙",
  Fairy: "✦",
  Normal: "★",
  Colorless: "★",
};

interface EnergyIconProps {
  type: string;
  size?: number;
}

export default function EnergyIcon({ type, size = 14 }: EnergyIconProps) {
  const core = toCoreType(type);
  const fill = TYPE_COLORS[type] || TYPE_COLORS[core] || TYPE_COLORS.Normal;
  const symbol = SYMBOLS[type] || SYMBOLS[core] || SYMBOLS.Normal;
  const light = core === "Normal" || type === "Colorless" || core === "Ice" || core === "Electric";

  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className="inline-block shrink-0">
      <circle cx="10" cy="10" r="9" fill={fill} stroke="#1e293b" strokeWidth="0.8" />
      <text x="10" y="13.5" textAnchor="middle" fontSize="8" fill={light ? "#1e293b" : "white"} fontWeight="bold">
        {symbol}
      </text>
    </svg>
  );
}

export function TypeBadge({ type, size = 18 }: EnergyIconProps) {
  const core = toCoreType(type);
  const fill = TYPE_COLORS[type] || TYPE_COLORS[core] || TYPE_COLORS.Normal;
  const symbol = SYMBOLS[type] || SYMBOLS[core] || SYMBOLS.Normal;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="inline-block shrink-0 drop-shadow">
      <circle cx="12" cy="12" r="11" fill={fill} stroke="#1e293b" strokeWidth="1" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
        {symbol}
      </text>
    </svg>
  );
}
