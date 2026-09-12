"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import type { Card } from "@/types";
import { formatPrice, isRareCard, isPremiumCard } from "@/lib/api";
import PokemonCardFace from "./PokemonCardFace";
import TypeIcon from "./TypeIcon";

interface Card3DProps {
  card: Card;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, card: Card) => void;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  sm: { width: 180 },
  md: { width: 245 },
  lg: { width: 320 },
};

export default function Card3D({
  card,
  size = "md",
  showDetails = true,
  draggable = false,
  onDragStart,
  onClick,
  className,
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  const rare = isRareCard(card.rarity);
  const premium = isPremiumCard(card.rarity, card.name) || card.isFullArt;
  const dims = sizeMap[size];
  const primaryType = card.types[0] || "Colorless";

  function handleMouseMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -14;
    const rotateY = ((x - centerX) / centerX) * 14;

    setTransform(
      `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`
    );
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  }

  function handleMouseLeave() {
    setTransform("");
    setGlare({ x: 50, y: 50 });
  }

  return (
    <div
      className={clsx("card-perspective group", className)}
      style={{ width: dims.width, containerType: "inline-size" }}
    >
      <div
        ref={cardRef}
        className={clsx(
          "card-3d-inner relative cursor-pointer",
          draggable && "cursor-grab active:cursor-grabbing"
        )}
        style={{ transform, transformStyle: "preserve-3d" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        draggable={draggable}
        onDragStart={(e) => onDragStart?.(e, card)}
      >
        <div
          className={clsx(
            "transition-shadow duration-300 rounded-[14px]",
            premium
              ? "shadow-[0_8px_32px_rgba(251,191,36,0.3)] group-hover:shadow-[0_16px_48px_rgba(251,191,36,0.5)]"
              : rare
                ? "shadow-[0_8px_32px_rgba(168,85,247,0.2)] group-hover:shadow-[0_16px_48px_rgba(168,85,247,0.35)]"
                : "shadow-[0_8px_24px_rgba(0,0,0,0.5)] group-hover:shadow-[0_16px_40px_rgba(99,102,241,0.25)]"
          )}
        >
          <PokemonCardFace card={card} glare={glare} />
        </div>

        {showDetails && (
          <div className="mt-3 px-0.5">
            <div className="flex items-center gap-2">
              <TypeIcon type={primaryType} size={18} />
              <h3 className="font-bold text-sm truncate flex-1 tracking-tight text-poke-navy">
                {card.name}
              </h3>
              {card.hp && (
                <span className="text-xs font-bold text-poke-navy/60">{card.hp} HP</span>
              )}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span
                className={clsx(
                  "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  premium
                    ? "bg-poke-yellow/30 text-poke-navy"
                    : rare
                      ? "bg-poke-blue/10 text-poke-blue"
                      : "bg-poke-light text-poke-navy/50"
                )}
              >
                {card.suffix || card.rarity}
              </span>
              <span className="text-xs font-bold text-poke-blue">
                {formatPrice(card.marketPrice)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
