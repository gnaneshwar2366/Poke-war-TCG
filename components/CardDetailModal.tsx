"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, Sparkles, User, FileText, ArrowUpRight, TrendingUp, Info } from "lucide-react";
import type { Card } from "@/types";
import Card3D from "./Card3D";
import { formatPrice } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import EnergyIcon from "./EnergyIcon";
import CheckoutModal from "./CheckoutModal";

interface CardDetailModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  isOwned?: boolean;
  onUpdateUser?: (newCoins: number, newInventory: any[]) => void;
}

export default function CardDetailModal({
  card,
  isOpen,
  onClose,
  isOwned = false,
  onUpdateUser,
}: CardDetailModalProps) {
  const { username } = useAuth();
  const [isSelling, setIsSelling] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isOpen || !card) return null;

  async function handleSell() {
    if (!card || !username) return;
    setIsSelling(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}/api/users/${username}/sell-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card._id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Successfully sold
      if (onUpdateUser) {
        onUpdateUser(data.coins, data.inventory);
      }
      // Dispatch coins updated event
      window.dispatchEvent(new CustomEvent("coins-updated", { detail: data.coins }));
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to sell card");
    } finally {
      setIsSelling(false);
    }
  }

  const sellPrice = Math.round(card.marketPrice * 0.7);

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-poke-navy/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-4xl overflow-y-auto max-h-[90vh] bg-white border border-poke-gray shadow-poke-lg rounded-3xl grid md:grid-cols-12 gap-6 p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-poke-light hover:bg-poke-gray text-poke-navy/50 hover:text-poke-navy transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left side: Card Preview */}
            <div className="md:col-span-5 flex flex-col items-center justify-center py-6">
              <Card3D card={card} size="lg" showDetails={false} />
              <p className="text-xs text-poke-navy/40 mt-4 italic select-none">
                Hover or touch to tilt and reveal holographic foil
              </p>
            </div>

            {/* Right side: Card Stats & Info */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                {/* Species Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-poke-blue/10 text-poke-blue rounded-full border border-poke-blue/20">
                      {card.stage}
                    </span>
                    <h2 className="text-3xl font-display font-black text-poke-navy mt-2 leading-none">
                      {card.name}
                    </h2>
                    <p className="text-sm text-poke-navy/50 mt-1 select-none">
                      Set: <span className="text-poke-navy font-semibold">{card.setName} ({card.number}/{card.setTotal})</span>
                    </p>
                  </div>
                  {card.hp && (
                    <span className="text-2xl font-display font-black text-red-400">
                      {card.hp} HP
                    </span>
                  )}
                </div>

                {/* Market info box */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-3 rounded-2xl bg-poke-light border border-poke-gray flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-poke-blue" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-poke-navy/45 block">Market Price</span>
                      <span className="font-bold text-poke-blue text-lg leading-none">
                        {formatPrice(card.marketPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-poke-light border border-poke-gray flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-poke-blue" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-poke-navy/45 block">Rarity</span>
                      <span className="font-bold text-poke-navy text-sm truncate block max-w-[130px]">
                        {card.rarity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attack breakdown */}
                <div className="mt-6 space-y-3">
                  <h3 className="text-xs uppercase font-bold text-poke-navy/45 flex items-center gap-1.5 select-none">
                    <FileText className="w-3.5 h-3.5" /> Attacks
                  </h3>
                  {card.attacks && card.attacks.length > 0 ? (
                    card.attacks.map((atk, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-poke-light border border-poke-gray space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {atk.cost.map((c, j) => (
                                <EnergyIcon key={j} type={c} size={12} />
                              ))}
                            </div>
                            <span className="font-bold text-poke-navy text-sm">{atk.name}</span>
                          </div>
                          {atk.damage && (
                            <span className="font-black text-poke-navy text-sm">{atk.damage}</span>
                          )}
                        </div>
                        {atk.text && <p className="text-xs text-poke-navy/60 leading-relaxed">{atk.text}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/30 italic">No attacks available</p>
                  )}
                </div>

                {/* Battle Stats Row */}
                <div className="grid grid-cols-3 gap-2 mt-6 p-3 rounded-2xl bg-poke-light border border-poke-gray text-xs text-poke-navy/70">
                  <div className="text-center">
                    <span className="font-semibold block text-white/40 mb-1 select-none">Weakness</span>
                    <div className="flex items-center justify-center gap-1">
                      <EnergyIcon type={card.weakness || "Fighting"} size={11} />
                      <span className="font-bold">×2</span>
                    </div>
                  </div>
                  <div className="text-center border-x border-white/10">
                    <span className="font-semibold block text-white/40 mb-1 select-none">Resistance</span>
                    {card.resistance ? (
                      <div className="flex items-center justify-center gap-1">
                        <EnergyIcon type={card.resistance} size={11} />
                        <span className="font-bold">-30</span>
                      </div>
                    ) : (
                      <span className="font-semibold text-white/30">—</span>
                    )}
                  </div>
                  <div className="text-center">
                    <span className="font-semibold block text-white/40 mb-1 select-none">Retreat</span>
                    <div className="flex items-center justify-center gap-0.5">
                      {Array.from({ length: card.retreatCost || 1 }).map((_, i) => (
                        <EnergyIcon key={i} type="Colorless" size={10} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-poke-gray flex gap-3">
                {isOwned ? (
                  <button
                    onClick={handleSell}
                    disabled={isSelling}
                    className="w-full btn-secondary py-3 flex items-center justify-center gap-2 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-300 transition-all text-sm font-bold"
                  >
                    <Coins className="w-4 h-4" />
                    {isSelling ? "Selling..." : `Sell Card for ${sellPrice} Coins`}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsCheckoutOpen(true)}
                      className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm font-bold"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      Buy Now
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        type="buy_card"
        card={card}
        username={username || ""}
        onSuccess={(newCoins, newInventory) => {
          if (onUpdateUser && newInventory) {
            onUpdateUser(newCoins, newInventory);
          }
          setIsCheckoutOpen(false);
          onClose();
        }}
      />
    </>
  );
}
