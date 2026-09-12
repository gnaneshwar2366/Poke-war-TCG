"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, ShieldAlert } from "lucide-react";
import type { Card } from "@/types";
import Card3D from "./Card3D";

const featuredCards = [
  {
    card: {
      _id: "demo-charizard",
      externalId: "base1-4",
      name: "Charizard",
      hp: 120,
      types: ["Fire"],
      rarity: "Rare Holo",
      imageUrl: "https://assets.tcgdex.net/en/base/base1/4/low.png",
      imageUrlLarge: "https://assets.tcgdex.net/en/base/base1/4/high.png",
      setName: "Base Set",
      number: "4",
      marketPrice: 350.00,
      artist: "Mitsuhiro Arita",
      baseName: "Charizard",
      suffix: "",
      stage: "Stage 2",
      weakness: "Water",
      retreatCost: 3,
      attacks: [
        { name: "Fire Spin", cost: ["Fire", "Fire", "Fire", "Fire"], damage: 100, text: "Discard 2 Energy cards attached to Charizard in order to use this attack." }
      ],
      ruleText: "",
      isFullArt: false,
      setTotal: "102"
    } as unknown as Card,
    bgColor: "from-red-500 via-orange-600 to-red-950",
    themeColor: "text-red-500",
    glowColor: "shadow-[0_0_40px_rgba(239,68,68,0.75)]",
    headingColor: "text-red-400"
  },
  {
    card: {
      _id: "demo-blastoise",
      externalId: "base1-2",
      name: "Blastoise",
      hp: 100,
      types: ["Water"],
      rarity: "Rare Holo",
      imageUrl: "https://assets.tcgdex.net/en/base/base1/2/low.png",
      imageUrlLarge: "https://assets.tcgdex.net/en/base/base1/2/high.png",
      setName: "Base Set",
      number: "2",
      marketPrice: 220.00,
      artist: "Ken Sugimori",
      baseName: "Blastoise",
      suffix: "",
      stage: "Stage 2",
      weakness: "Lightning",
      retreatCost: 3,
      attacks: [
        { name: "Hydro Pump", cost: ["Water", "Water", "Water"], damage: 40, text: "Does 40 damage plus 10 more damage for each Water Energy attached to Blastoise." }
      ],
      ruleText: "",
      isFullArt: false,
      setTotal: "102"
    } as unknown as Card,
    bgColor: "from-blue-500 via-cyan-600 to-blue-950",
    themeColor: "text-blue-500",
    glowColor: "shadow-[0_0_40px_rgba(59,130,246,0.75)]",
    headingColor: "text-blue-400"
  },
  {
    card: {
      _id: "demo-pikachu",
      externalId: "base1-58",
      name: "Pikachu",
      hp: 40,
      types: ["Lightning"],
      rarity: "Common",
      imageUrl: "https://assets.tcgdex.net/en/base/base1/58/low.png",
      imageUrlLarge: "https://assets.tcgdex.net/en/base/base1/58/high.png",
      setName: "Base Set",
      number: "58",
      marketPrice: 45.00,
      artist: "Mitsuhiro Arita",
      baseName: "Pikachu",
      suffix: "",
      stage: "Basic",
      weakness: "Fighting",
      retreatCost: 1,
      attacks: [
        { name: "Thunder Shock", cost: ["Lightning"], damage: 10, text: "Flip a coin. If heads, the Defending Pokémon is now Paralyzed." }
      ],
      ruleText: "",
      isFullArt: false,
      setTotal: "102"
    } as unknown as Card,
    bgColor: "from-yellow-400 via-amber-500 to-yellow-950",
    themeColor: "text-yellow-500",
    glowColor: "shadow-[0_0_40px_rgba(245,158,11,0.75)]",
    headingColor: "text-yellow-400"
  },
  {
    card: {
      _id: "demo-venusaur",
      externalId: "base1-15",
      name: "Venusaur",
      hp: 100,
      types: ["Grass"],
      rarity: "Rare Holo",
      imageUrl: "https://assets.tcgdex.net/en/base/base1/15/low.png",
      imageUrlLarge: "https://assets.tcgdex.net/en/base/base1/15/high.png",
      setName: "Base Set",
      number: "15",
      marketPrice: 190.00,
      artist: "Mitsuhiro Arita",
      baseName: "Venusaur",
      suffix: "",
      stage: "Stage 2",
      weakness: "Fire",
      retreatCost: 2,
      attacks: [
        { name: "Solar Beam", cost: ["Grass", "Grass", "Grass", "Grass"], damage: 60, text: "A very powerful energy beam blast." }
      ],
      ruleText: "",
      isFullArt: false,
      setTotal: "102"
    } as unknown as Card,
    bgColor: "from-green-500 via-emerald-600 to-green-950",
    themeColor: "text-green-500",
    glowColor: "shadow-[0_0_40px_rgba(16,185,129,0.75)]",
    headingColor: "text-emerald-400"
  }
];

export default function MorphingCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % featuredCards.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = featuredCards[index];

  return (
    <div className="w-full flex flex-col md:flex-row items-center gap-10 p-8 rounded-3xl border-3 border-black bg-white shadow-[8px_8px_0px_#000] overflow-hidden relative">
      {/* Background themed glow strip */}
      <div className={`absolute top-0 right-0 bottom-0 w-2/3 bg-gradient-to-l ${current.bgColor} opacity-10 transition-all duration-1000 -skew-x-12`} />
      
      {/* Left side: Content description */}
      <div className="flex-1 space-y-5 relative z-10">
        <span className="px-3.5 py-1 text-xs font-black bg-poke-yellow border-2 border-black text-poke-navy rounded-full uppercase tracking-widest shadow-[2px_2px_0px_#000] inline-flex items-center gap-1.5 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> Type Morph Showcase
        </span>
        
        <h3 className="text-3xl sm:text-4xl font-display font-black text-poke-navy uppercase tracking-wider text-stroke-sm" style={{ WebkitTextStroke: "1px #000" }}>
          Dynamic Cards Showcase
        </h3>
        
        <p className="text-sm font-bold text-poke-navy/60 leading-relaxed max-w-md">
          Cards dynamically reflect their typing. Watch as stats, weakness parameters, background colors, and holographic foil attributes update automatically when the card type changes.
        </p>

        {/* Dynamic Card Details Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.card.name}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.4 }}
            className="p-5 rounded-2xl border-3 border-black bg-poke-light shadow-[4px_4px_0px_#000] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-xl text-poke-navy tracking-tight">{current.card.name}</span>
              <span className="font-black text-lg text-poke-red">{current.card.hp} HP</span>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs font-black uppercase">
              <span className="px-2.5 py-0.5 rounded-full border border-black bg-white">
                {current.card.stage}
              </span>
              <span className="px-2.5 py-0.5 rounded-full border border-black bg-poke-yellow text-poke-navy">
                {current.card.types[0]} Type
              </span>
              <span className="px-2.5 py-0.5 rounded-full border border-black bg-white text-poke-navy/60">
                {current.card.rarity}
              </span>
            </div>

            <div className="border-t border-black/10 pt-3">
              <p className="text-[10px] uppercase font-black text-poke-navy/45">Primary Attack</p>
              <p className="font-black text-sm text-poke-navy mt-0.5">
                {current.card.attacks?.[0]?.name} <span className="text-poke-blue">({current.card.attacks?.[0]?.damage} Damage)</span>
              </p>
              <p className="text-xs text-poke-navy/60 leading-tight mt-1">{current.card.attacks?.[0]?.text}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-black/10 pt-3 text-[10px] uppercase font-black text-poke-navy/50">
              <div>
                <span>Weakness</span>
                <p className="font-bold text-xs text-poke-navy mt-0.5">{current.card.weakness || "None"}</p>
              </div>
              <div>
                <span>Artist</span>
                <p className="font-bold text-xs text-poke-navy mt-0.5">{current.card.artist}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right side: Morphing Card Preview */}
      <div className="flex-1 flex justify-center items-center py-6 relative">
        {/* Colorful Glowing Ring behind card */}
        <div className={`absolute w-72 h-72 rounded-full filter blur-xl transition-all duration-1000 ${current.glowColor} opacity-55 animate-pulse`} />
        
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.card.name}
              initial={{ scale: 0.8, rotateY: 90, opacity: 0 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              exit={{ scale: 0.8, rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeInOut" }}
            >
              <Card3D card={current.card} size="md" showDetails={false} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
