"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import type { Card } from "@/types";
import HolographicOverlay from "./HolographicOverlay";
import { isPremiumCard } from "@/lib/api";

interface PokemonCardFaceProps {
  card: Card;
  glare?: { x: number; y: number };
  className?: string;
}

export default function PokemonCardFace({
  card,
  glare = { x: 50, y: 50 },
  className,
}: PokemonCardFaceProps) {
  const sources = useMemo(() => {
    const rawList = [
      card.displayImage,
      card.imageUrlLarge,
      card.imageUrl,
      card.artworkUrl,
    ];
    const expanded: string[] = [];
    rawList.forEach((url) => {
      if (typeof url === "string" && /^https?:\/\//.test(url)) {
        if (url.includes("images.pokemontcg.io")) {
          // Normalize padded numbers like /sv3pt5/001.png -> /sv3pt5/1.png
          const unpadded = url.replace(
            /(images\.pokemontcg\.io\/[^/]+\/)0+(\d+)(_hires)?(\.png)/,
            "$1$2$3$4"
          );
          if (unpadded !== url) expanded.push(unpadded);
        }
        expanded.push(url);
      }
    });
    if (card.dexNumber) {
      expanded.push(
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${card.dexNumber}.png`
      );
    }
    return [...new Set(expanded)];
  }, [card.displayImage, card.imageUrlLarge, card.imageUrl, card.artworkUrl, card.dexNumber]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const premium = isPremiumCard(card.rarity, card.name) || card.isFullArt;
  const borderClass = premium ? "tcg-gold-frame" : "tcg-silver-frame";

  // Components can be reused when a card changes (carousel, modal, and battle
  // slots), so reset the fallback chain whenever its image data changes.
  useEffect(() => {
    setSourceIndex(0);
    setImageLoaded(false);
  }, [sources]);

  function handleError() {
    setSourceIndex((current) => Math.min(current + 1, sources.length));
  }

  return (
    <div className={clsx("relative w-full aspect-[63/88] select-none", className)}>
      <div className={clsx("absolute inset-0 rounded-[10px] p-[3px]", borderClass)}>
        <div className="relative w-full h-full rounded-[7px] overflow-hidden bg-neutral-900">
          {/* Always render an on-device illustration underneath the live card art.
              This keeps every card visually complete when a remote TCG host is
              unavailable, while real card artwork still replaces it when loaded. */}
          {!imageLoaded && (
            <img
              src="/images/card-artwork-fallback.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
            />
          )}
          {sources[sourceIndex] ? (
            <img
              src={sources[sourceIndex]}
              alt={card.name}
              className="absolute inset-0 h-full w-full object-contain object-center"
              loading="lazy"
              referrerPolicy="no-referrer"
              onLoad={() => setImageLoaded(true)}
              onError={handleError}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs font-black uppercase tracking-widest text-white/70">
              {card.name}
            </div>
          )}
          {premium && (
            <HolographicOverlay glareX={glare.x} glareY={glare.y} intensity="high" />
          )}
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.3) 0%, transparent 55%)`,
            }}
          />
          <div className="absolute inset-0 pointer-events-none tcg-gloss" />
        </div>
      </div>
    </div>
  );
}
