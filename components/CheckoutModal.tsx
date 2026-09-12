"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Sparkles, AlertCircle, ShoppingBag, Coins, ShieldCheck, Loader2 } from "lucide-react";
import type { Card } from "@/types";
import { formatPrice } from "@/lib/api";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "buy_card" | "buy_coins";
  username: string;
  card?: Card;
  coinsAmount?: number;
  priceUsd?: number;
  onSuccess: (newCoins: number, newInventory?: any[]) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  type,
  username,
  card,
  coinsAmount = 500,
  priceUsd = 4.99,
  onSuccess,
}: CheckoutModalProps) {
  const [step, setStep] = useState<"method" | "card_details" | "processing" | "success">("method");
  const [paymentMethod, setPaymentMethod] = useState<"coins" | "credit_card">("coins");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Set default payment method based on checkout type
  useEffect(() => {
    setPaymentMethod("credit_card");
    setStep("card_details");
    setError(null);
  }, [type, isOpen]);

  if (!isOpen) return null;

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (paymentMethod === "credit_card") {
      if (!cardNumber || !expiry || !cvv || !cardName) {
        setError("Please fill in all credit card fields.");
        return;
      }
      if (cardNumber.replace(/\s/g, "").length < 16) {
        setError("Invalid credit card number.");
        return;
      }
    }

    setStep("processing");

    // Simulate API Call
    try {
      const endpoint =
        type === "buy_card"
          ? `/api/users/${username}/buy-card`
          : `/api/users/${username}/add-coins`;

      const body =
        type === "buy_card"
          ? {
              cardId: card?._id,
              paymentMethod,
              cardDetails: paymentMethod === "credit_card" ? { cardNumber, expiry, cvv, cardName } : null,
            }
          : {
              amount: coinsAmount,
              cardDetails: { cardNumber, expiry, cvv, cardName },
            };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Transaction failed");
      }

      // Success!
      setTimeout(() => {
        setStep("success");
        onSuccess(data.coins, data.inventory);
        // Trigger global coins update event
        window.dispatchEvent(new CustomEvent("coins-updated", { detail: data.coins }));
      }, 1500);

    } catch (err: any) {
      setStep(paymentMethod === "credit_card" ? "card_details" : "method");
      setError(err.message || "Something went wrong.");
    }
  }

  function handleCardNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "");
    const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ").slice(0, 19);
    setCardNumber(formatted);
  }

  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "");
    let formatted = val;
    if (val.length > 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setExpiry(formatted.slice(0, 5));
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden glass border border-white/10 shadow-2xl rounded-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              Checkout
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePaymentSubmit}>
              {/* Step 1: Select Payment Method */}
              {step === "method" && type === "buy_card" && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold">{card?.name}</p>
                        <p className="text-xs text-white/50">{card?.suffix || card?.rarity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-poke-gold text-lg">
                      {formatPrice(card?.marketPrice || 0)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-white/60 block">Select Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("coins")}
                        className={`p-4 rounded-2xl border text-center transition-all ${
                          paymentMethod === "coins"
                            ? "border-poke-gold bg-poke-gold/5 text-poke-gold"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                        }`}
                      >
                        <Coins className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-bold text-sm block">Pay with Coins</span>
                        <span className="text-xs text-white/40">{Math.round(card?.marketPrice || 0)} Coins</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod("credit_card");
                          setStep("card_details");
                        }}
                        className={`p-4 rounded-2xl border text-center transition-all ${
                          paymentMethod === "credit_card"
                            ? "border-indigo-500 bg-indigo-500/5 text-indigo-400"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                        }`}
                      >
                        <CreditCard className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-bold text-sm block">Credit Card</span>
                        <span className="text-xs text-white/40">USD {formatPrice(card?.marketPrice || 0)}</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
                  >
                    Confirm Purchase
                  </button>
                </div>
              )}

              {/* Step 2: Card Details Form */}
              {step === "card_details" && (
                <div className="space-y-4">
                  {type === "buy_coins" ? (
                    <div className="p-4 rounded-2xl bg-white/5 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-poke-gold/10 flex items-center justify-center text-poke-gold">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Buy {coinsAmount} Coins</p>
                          <p className="text-xs text-white/50">Instant Credit</p>
                        </div>
                      </div>
                      <span className="font-bold text-indigo-400 text-lg">
                        ${priceUsd.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/5 flex justify-between items-center text-sm">
                      <span className="text-white/60">Paying for {card?.name}</span>
                      <span className="font-bold text-indigo-300">{formatPrice(card?.marketPrice || 0)}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/50">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Ash Ketchum"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="input-glass text-sm py-2 px-3"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-white/50">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="input-glass pl-10 text-sm py-2"
                      />
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/50">Expiration</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={handleExpiryChange}
                        className="input-glass text-sm py-2 text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/50">CVV</label>
                      <input
                        type="password"
                        required
                        placeholder="•••"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                        className="input-glass text-sm py-2 text-center"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Pay Securely
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Processing */}
              {step === "processing" && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                  <h4 className="text-lg font-bold text-white mb-1">Processing Transaction</h4>
                  <p className="text-sm text-white/50 max-w-[250px]">
                    Verifying mock payment details with bank. Please do not close this window.
                  </p>
                </div>
              )}

              {/* Step 4: Success */}
              {step === "success" && (
                <div className="py-8 flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0.5, rotate: -10 }}
                    animate={{ scale: [1, 1.2, 1], rotate: 0 }}
                    className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 mb-4"
                  >
                    <Sparkles className="w-8 h-8" />
                  </motion.div>

                  <h4 className="text-2xl font-bold text-white mb-2">Purchase Successful!</h4>
                  <p className="text-sm text-white/60 mb-6 max-w-[280px]">
                    {type === "buy_card"
                      ? `Congratulations! ${card?.name} has been added to your collection.`
                      : `Successfully purchased ${coinsAmount} coins! Your balance has been updated.`}
                  </p>

                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary w-full py-2 text-sm text-center"
                  >
                    Done
                  </button>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
