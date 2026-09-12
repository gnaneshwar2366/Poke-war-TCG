"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Card } from "@/types";
import Card3D from "./Card3D";
import { openPack, claimPackCard, fetchUser, PACK_INFO, type PackType } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Coins, Sparkles, AlertCircle, RefreshCw, Star, Package, Check } from "lucide-react";

type Phase = "idle" | "shaking" | "tearing" | "revealing" | "done";

const PACK_STYLES = {
  basic: {
    gradient: "from-slate-600 via-slate-700 to-slate-800",
    border: "border-slate-400/40",
    shadow: "shadow-[0_20px_50px_rgba(71,85,105,0.35)]",
    label: "Basic Pack",
    accent: "text-slate-200",
    badge: "bg-slate-900/40 border-slate-500/20",
    iconBg: "from-slate-300 via-slate-400 to-slate-500",
    particle: "bg-slate-300",
    button: "btn-secondary",
    desc: "3 Pokémon · Select exactly 1 to keep",
  },
  premium: {
    gradient: "from-indigo-700 via-purple-700 to-pink-600",
    border: "border-indigo-400/40",
    shadow: "shadow-[0_20px_50px_rgba(99,102,241,0.3)]",
    label: "Premium Pack",
    accent: "text-indigo-200",
    badge: "bg-indigo-900/40 border-indigo-500/20",
    iconBg: "from-yellow-300 via-amber-500 to-yellow-600",
    particle: "bg-indigo-300",
    button: "btn-primary",
    desc: "3 Rare/Holo Pokémon · Better pulls · Keep 1",
  },
};

export default function BoosterPack() {
  const { username } = useAuth();
  const [selectedPack, setSelectedPack] = useState<PackType | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pulledCards, setPulledCards] = useState<Card[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimedCard, setClaimedCard] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetchUser(username)
      .then((user) => {
        if (user.pendingPackCards && user.pendingPackCards.length > 0) {
          setPulledCards(user.pendingPackCards);
          setRevealedCount(user.pendingPackCards.length);
          setPhase("revealing");
          setSelectedPack("basic"); // default styling for resume
        }
      })
      .catch((err) => console.error("Error resuming pending pack:", err))
      .finally(() => setLoading(false));
  }, [username]);

  async function handleBuyPack(packType: PackType) {
    if (!username || loading || phase !== "idle") return;
    setSelectedPack(packType);
    setLoading(true);
    setError(null);
    setPulledCards([]);
    setRevealedCount(0);
    setSelectedCard(null);
    setClaimedCard(null);
    setPhase("shaking");

    try {
      const result = await openPack(username, packType);
      setPulledCards(result.cards);
      window.dispatchEvent(new CustomEvent("coins-updated", { detail: result.coins }));

      setTimeout(() => setPhase("tearing"), 1200);
      setTimeout(() => {
        setPhase("revealing");
        revealCardsSequentially(result.cards.length);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open pack");
      setPhase("idle");
      setSelectedPack(null);
    } finally {
      setLoading(false);
    }
  }

  function revealCardsSequentially(total: number) {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setRevealedCount(count);
      if (count >= total) {
        clearInterval(interval);
      }
    }, 600);
  }

  async function handleClaimCard() {
    if (!username || !selectedCard || claiming) return;
    setClaiming(true);
    setError(null);

    try {
      const result = await claimPackCard(username, selectedCard._id);
      window.dispatchEvent(new CustomEvent("coins-updated", { detail: result.coins }));
      setClaimedCard(selectedCard);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim card");
    } finally {
      setClaiming(false);
    }
  }

  function reset() {
    setPhase("idle");
    setSelectedPack(null);
    setPulledCards([]);
    setRevealedCount(0);
    setSelectedCard(null);
    setClaimedCard(null);
    setError(null);
  }

  const activeStyle = selectedPack ? PACK_STYLES[selectedPack] : null;

  return (
    <div className="flex flex-col items-center gap-10 py-8">
      {/* Pack selection */}
      {phase === "idle" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {(["basic", "premium"] as PackType[]).map((packType) => {
            const style = PACK_STYLES[packType];
            const info = PACK_INFO[packType];
            return (
              <motion.div
                key={packType}
                whileHover={{ y: -4 }}
                className="poke-card p-6 flex flex-col items-center gap-5 bg-white"
              >
                <div
                  className={`w-44 h-64 rounded-3xl relative overflow-hidden border-3 border-black bg-gradient-to-br ${style.gradient} ${style.shadow} cursor-pointer shadow-[6px_6px_0px_#000]`}
                  onClick={() => handleBuyPack(packType)}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full animate-[shimmer_3s_infinite_linear]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-between p-5">
                    <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-black bg-poke-yellow text-poke-navy`}>
                      {style.label}
                    </span>
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${style.iconBg} border-3 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]`}>
                      {packType === "premium" ? (
                        <Sparkles className="w-6 h-6 text-white" />
                      ) : (
                        <Package className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="text-center bg-black/40 px-3 py-1.5 rounded-xl border border-white/20">
                      <p className="text-white font-black text-lg tracking-wider font-display">BOOSTER</p>
                      <p className={`text-[10px] font-black tracking-wide text-poke-yellow`}>KEEP 1 OF 3</p>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2 w-full">
                  <p className="font-black text-lg uppercase tracking-wide text-poke-navy">{info.label}</p>
                  <p className="text-xs font-bold text-poke-navy/60">{style.desc}</p>
                  <button
                    className={`${style.button} text-sm px-6 py-2.5 flex items-center gap-2 mx-auto font-black shadow-[4px_4px_0px_#000]`}
                    onClick={() => handleBuyPack(packType)}
                    disabled={loading}
                  >
                    <Coins className="w-4 h-4 shrink-0" />
                    Open — {info.cost} Coins
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Opening animation area */}
      {phase !== "idle" && (
        <div className="relative w-full max-w-4xl min-h-[420px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {(phase === "shaking" || phase === "tearing") && activeStyle && (
              <motion.div
                key="pack"
                className="relative select-none"
                animate={
                  phase === "shaking"
                    ? { x: [0, -8, 8, -6, 6, -4, 4, 0], rotate: [0, -3, 3, -2, 2, 0] }
                    : { scale: [1, 1.05, 0], opacity: [1, 1, 0], rotate: [0, 5, -10] }
                }
                transition={
                  phase === "shaking"
                    ? { duration: 1.2, ease: "easeInOut" }
                    : { duration: 0.8, ease: "easeIn" }
                }
              >
                <div className={`w-56 h-80 rounded-3xl relative overflow-hidden border-3 border-black bg-gradient-to-br ${activeStyle.gradient} shadow-[8px_8px_0px_#000]`}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Star className="w-12 h-12 text-poke-yellow animate-pulse" />
                    <p className="text-white font-black text-2xl uppercase tracking-wider text-stroke-black" style={{ WebkitTextStroke: "1px #000" }}>{activeStyle.label}</p>
                  </div>
                  {phase === "tearing" && (
                    <motion.div
                      className="absolute top-0 inset-x-0 h-1/2 bg-white/35"
                      initial={{ y: 0 }}
                      animate={{ y: -120, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                </div>
                {phase === "tearing" &&
                  [...Array(15)].map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className={`absolute w-3.5 h-3.5 rounded-full ${activeStyle.particle} border border-black`}
                      style={{ top: "25%", left: `${20 + i * 5}%` }}
                      initial={{ opacity: 1, scale: 1 }}
                      animate={{
                        opacity: 0,
                        scale: 0,
                        x: (Math.random() - 0.5) * 200,
                        y: Math.random() * 150 + 50,
                      }}
                      transition={{ duration: 0.8, delay: i * 0.02 }}
                    />
                  ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3 Cards reveal & pick choice */}
          {phase === "revealing" && (
            <div className="flex flex-col items-center gap-8 w-full">
              <div className="text-center space-y-1 select-none">
                <span className="px-3 py-1 text-xs font-black bg-poke-yellow border-2 border-black text-poke-navy rounded-full uppercase tracking-wider shadow-[2px_2px_0px_#000]">
                  Selection Phase
                </span>
                <h3 className="text-2xl font-black text-poke-navy uppercase tracking-wider mt-2">
                  Choose exactly 1 Pokémon card to keep
                </h3>
                <p className="text-xs font-bold text-poke-navy/55">
                  Click on your favorite Pokémon to select it, then click Claim.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 justify-center w-full justify-items-center max-w-3xl py-4">
                {pulledCards.map((card, i) => {
                  const isRevealed = i < revealedCount;
                  const isSelected = selectedCard?._id === card._id;
                  
                  return (
                    <div key={`${card._id}-pull-${i}`} className="relative">
                      {isRevealed ? (
                        <motion.div
                          initial={{ opacity: 0, y: 100, rotateY: 180, scale: 0.4 }}
                          animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 220, damping: 18 }}
                          onClick={() => setSelectedCard(card)}
                          className={`relative rounded-[14px] transition-all duration-300 ${
                            isSelected 
                              ? "ring-4 ring-poke-yellow border-2 border-black scale-105 shadow-[0_0_25px_rgba(255,203,5,0.9)] z-10" 
                              : "hover:scale-102 hover:shadow-[0_0_15px_rgba(0,117,190,0.3)]"
                          }`}
                        >
                          <Card3D card={card} size="sm" showDetails={true} />
                          {isSelected && (
                            <div className="absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full bg-poke-yellow border-3 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] z-20">
                              <Check className="w-5.5 h-5.5 text-poke-navy stroke-[4px]" />
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        /* Card Back placeholder for sequential reveal */
                        <div className="w-[180px] h-[252px] rounded-[14px] bg-poke-navy border-3 border-black shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center p-4">
                          <div className="w-10 h-10 rounded-full bg-poke-red border-3 border-black animate-pulse" />
                          <p className="text-[10px] font-black uppercase text-poke-yellow tracking-widest mt-3">Revealing...</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Claim button */}
              <AnimatePresence>
                {selectedCard && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="pt-2"
                  >
                    <button
                      onClick={handleClaimCard}
                      disabled={claiming}
                      className="btn-primary py-3 px-8 text-sm font-black flex items-center gap-2 tracking-wider shadow-[4px_4px_0px_#000] bg-poke-red hover:bg-poke-navy transition-all uppercase"
                    >
                      <Sparkles className="w-4 h-4 animate-spin text-white" />
                      {claiming ? "Claiming Pokémon..." : `Claim ${selectedCard.name} & Save`}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Success "Gotcha!" Claim animation */}
          {phase === "done" && claimedCard && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-6 py-6"
            >
              <div className="text-center space-y-1">
                <span className="px-4 py-1.5 text-xs font-black bg-poke-yellow border-3 border-black text-poke-navy rounded-full uppercase tracking-widest shadow-[3px_3px_0px_#000]">
                  Congratulations!
                </span>
                <h2 className="text-4xl font-display font-black text-poke-navy uppercase tracking-widest text-stroke-black mt-3" style={{ WebkitTextStroke: "1px #000" }}>
                  Gotcha! {claimedCard.name} Claimed
                </h2>
                <p className="text-xs font-bold text-poke-navy/60">
                  This Pokémon has been added to your collection.
                </p>
              </div>

              <motion.div
                initial={{ rotateY: 180, scale: 0.5 }}
                animate={{ rotateY: 0, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 180, damping: 15 }}
                className="my-4 border-4 border-poke-yellow rounded-[14px] shadow-[0_0_40px_rgba(255,203,5,0.7)]"
              >
                <Card3D card={claimedCard} size="md" showDetails={true} />
              </motion.div>

              <motion.button
                className="btn-poke-outline py-3 px-8 text-xs font-black tracking-widest uppercase flex items-center gap-2 mx-auto shadow-[4px_4px_0px_#000]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={reset}
              >
                <RefreshCw className="w-4 h-4" />
                Open Another Pack
              </motion.button>
            </motion.div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="text-center space-y-4">
        {error && (
          <div className="mx-auto max-w-sm p-3 rounded-xl bg-red-500/10 border-2 border-red-500/20 text-red-600 text-sm flex items-center justify-center gap-2 font-bold shadow-[2px_2px_0px_rgba(239,68,68,0.2)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {phase === "shaking" && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-poke-navy font-black text-sm tracking-widest uppercase text-stroke-sm"
          >
            Opening {activeStyle?.label}...
          </motion.p>
        )}
      </div>
    </div>
  );
}
