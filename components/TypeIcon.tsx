"use client";

import { TYPE_COLORS, toCoreType } from "@/lib/typeChart";

interface TypeIconProps {
  type: string;
  size?: number;
  className?: string;
}

const TYPE_ICONS: Record<string, string> = {
  Fire: "🔥",
  Water: "💧",
  Grass: "🌿",
  Electric: "⚡",
  Lightning: "⚡",
  Ice: "❄️",
  Fighting: "👊",
  Poison: "☠",
  Ground: "⛰️",
  Flying: "🪶",
  Psychic: "👁",
  Bug: "🐛",
  Rock: "🪨",
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

export default function TypeIcon({ type, size = 22, className = "" }: TypeIconProps) {
  const core = toCoreType(type);
  const bg = TYPE_COLORS[type] || TYPE_COLORS[core] || TYPE_COLORS.Normal;
  const icon = TYPE_ICONS[type] || TYPE_ICONS[core] || TYPE_ICONS.Normal;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 shadow-md border border-black/20 ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 35%, ${bg}ee, ${bg})`,
        fontSize: size * 0.45,
      }}
      title={type}
    >
      {icon}
    </span>
  );
}
