"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { fetchStarterOptions, fetchUser, signupUser } from "@/lib/api";
import { CORE_TYPES } from "@/lib/typeChart";
import type { Card } from "@/types";
import Card3D from "@/components/Card3D";
import { User, Sparkles, AlertCircle, Play, Sparkle, Package } from "lucide-react";

type ScreenState = "login" | "signup" | "unpacking";
export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [screen, setScreen] = useState<ScreenState>("login");
  const [username, setUsername] = useState("");
  const [selectedDeck, setSelectedDeck] = useState<string>("Fire");
  const [starterOptions, setStarterOptions] = useState<Card[]>([]);
  const [selectedStarterIds, setSelectedStarterIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Starter pack cards revealed state
  const [starterCards, setStarterCards] = useState<Card[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (tab !== "signup") return;
    let cancelled = false;
    fetchStarterOptions(selectedDeck).then((cards) => {
      if (!cancelled) {
        setStarterOptions(cards);
        setSelectedStarterIds([]);
      }
    }).catch(() => {
      if (!cancelled) setStarterOptions([]);
    });
    return () => { cancelled = true; };
  }, [selectedDeck, tab]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your Trainer ID.");
      return;
    }
    setLoading(true);
    setError(null);

    const cleanName = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    try {
      // Verify if user exists
      await fetchUser(cleanName);
      login(cleanName);
      router.push("/showcase");
    } catch (err: any) {
      setError("Trainer ID not found. Click 'Create Account' to choose a Starter Deck!");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a Trainer ID.");
      return;
    }
    setLoading(true);
    setError(null);

    const cleanName = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanName) {
      setError("Trainer ID contains invalid characters.");
      setLoading(false);
      return;
    }

    try {
      if (selectedStarterIds.length !== 2) {
        setError("Choose exactly 2 cards from your starter pack.");
        setLoading(false);
        return;
      }
      const newUser = await signupUser(cleanName, selectedDeck, selectedStarterIds);
      const cards = newUser.inventory.map((inv) => inv.card).filter(Boolean) as Card[];
      
      setStarterCards(cards);
      setScreen("unpacking");
      
      // Animate card reveal sequentially
      setTimeout(() => {
        revealStarterCards(cards.length);
      }, 1800);

    } catch (err: any) {
      setError(err.message || "Failed to register trainer.");
    } finally {
      setLoading(false);
    }
  }

  function revealStarterCards(total: number) {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setRevealedCount(count);
      if (count >= total) {
        clearInterval(interval);
      }
    }, 450);
  }

  function handleCompleteRegistration() {
    const cleanName = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    login(cleanName);
    router.push("/showcase");
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-poke-light">
      <AnimatePresence mode="wait">
        
        {/* Sign In & Sign Up Console */}
        {screen === "login" && (
          <motion.div
            key="login-console"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-xl flex flex-col p-8 rounded-3xl border-4 border-black bg-white shadow-[8px_8px_0px_#000]"
          >
            {/* Header branding */}
            <div className="text-center mb-8 select-none">
              <div className="relative w-14 h-14 rounded-2xl bg-poke-yellow border-3 border-black flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_#000]">
                <Sparkles className="w-7 h-7 text-poke-navy animate-pulse" />
              </div>
              <h1 className="text-3xl font-display font-black text-poke-navy uppercase tracking-wider text-stroke-sm" style={{ WebkitTextStroke: "1px #000" }}>
                Trainer Portal
              </h1>
              <p className="text-xs font-bold text-poke-navy/50 uppercase tracking-wide mt-1">
                Enter the Pokémon Trading Card Game
              </p>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-6 border-b-3 border-black pb-3">
              <button
                onClick={() => { setTab("signin"); setError(null); }}
                className={`py-2 text-xs font-black tracking-widest uppercase border-2 border-black rounded-xl transition-all shadow-[2px_2px_0px_#000] ${
                  tab === "signin"
                    ? "bg-poke-blue text-white"
                    : "bg-white text-poke-navy hover:bg-poke-light"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab("signup"); setError(null); }}
                className={`py-2 text-xs font-black tracking-widest uppercase border-2 border-black rounded-xl transition-all shadow-[2px_2px_0px_#000] ${
                  tab === "signup"
                    ? "bg-poke-blue text-white"
                    : "bg-white text-poke-navy hover:bg-poke-light"
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border-2 border-red-500/20 text-red-600 text-sm flex items-center gap-2 font-bold shadow-[2px_2px_0px_rgba(239,68,68,0.1)]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Forms */}
            {tab === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-poke-navy/60">
                    Trainer Username ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. ash99"
                      className="input-poke pl-10 text-sm py-2.5"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-poke-navy/40" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] text-sm font-black text-white uppercase tracking-wider"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {loading ? "Connecting..." : "Launch Game"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-poke-navy/60">
                    Choose Trainer ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose username..."
                      className="input-poke pl-10 text-sm py-2.5"
                      maxLength={18}
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-poke-navy/40" />
                  </div>
                </div>

                {/* Starter Deck selector */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-poke-navy/60 block">
                    Choose Your Starter Deck
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {CORE_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedDeck(type)}
                        className={`py-2 px-1 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${
                          selectedDeck === type
                            ? "border-poke-red bg-poke-red text-white shadow-[2px_2px_0px_#000]"
                            : "border-black bg-white text-poke-navy hover:bg-poke-light"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-poke-navy/60">
                      Choose 2 starter cards
                    </label>
                    <span className="text-xs font-black text-poke-red">{selectedStarterIds.length}/2</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto p-1">
                    {starterOptions.map((card) => {
                      const selected = selectedStarterIds.includes(card._id);
                      return (
                        <button
                          key={card._id}
                          type="button"
                          onClick={() => setSelectedStarterIds((current) =>
                            selected ? current.filter((id) => id !== card._id) : current.length < 2 ? [...current, card._id] : current
                          )}
                          className={`p-2 rounded-xl border-2 text-left transition-all ${selected ? "border-poke-red bg-poke-red/10 shadow-[2px_2px_0px_#000]" : "border-poke-gray bg-white hover:border-black"}`}
                        >
                          <img src={card.displayImage || card.imageUrl} alt={card.name} className="w-full aspect-[2/3] object-cover rounded-lg" />
                          <span className="block mt-1 text-[10px] font-black truncate text-poke-navy">{card.name}</span>
                          <span className="block text-[9px] font-bold text-poke-navy/50">{card.rarity}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] font-bold text-poke-navy/55">Starter cards are limited to {selectedDeck} type and use the strongest available low/mid cards.</p>
                </div>

                {/* Sign up reward description */}
                <div className="p-3 bg-poke-light border-2 border-black rounded-xl text-[11px] font-bold text-poke-navy/70 flex items-center gap-2 select-none shadow-[2px_2px_0px_#000]">
                  <Sparkle className="w-4 h-4 text-poke-yellow animate-spin shrink-0" />
                  <span>Signup Reward: 2 chosen starter cards + 5 random low/mid cards + 500 Coins.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || selectedStarterIds.length !== 2}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] text-sm font-black text-white uppercase tracking-wider"
                >
                  <Package className="w-4 h-4 text-white" />
                  {loading ? "Generating Pack..." : "Claim Starter Pack & Sign Up"}
                </button>
              </form>
            )}
          </motion.div>
        )}

        {/* Custom Unpacking Starter pack screen */}
        {screen === "unpacking" && (
          <motion.div
            key="unpack-deck"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl flex flex-col items-center p-8 rounded-3xl border-4 border-black bg-white shadow-[12px_12px_0px_#000] relative overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute inset-0 bg-pokeball-mesh opacity-5 pointer-events-none" />

            {revealedCount < starterCards.length ? (
              <div className="flex flex-col items-center justify-center py-16">
                <motion.div
                  animate={{
                    x: [0, -10, 10, -8, 8, -6, 6, 0],
                    rotate: [0, -3, 3, -2, 2, 0],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "mirror" }}
                  className="w-48 h-68 rounded-3xl bg-gradient-to-br from-poke-navy to-indigo-900 border-4 border-black flex flex-col items-center justify-center gap-4 text-center shadow-[10px_10px_0px_#000] p-6 relative"
                >
                  <Package className="w-16 h-16 text-poke-yellow animate-bounce" />
                  <p className="text-white font-black text-xl uppercase tracking-widest text-stroke-sm" style={{ WebkitTextStroke: "1.5px #000" }}>
                    STARTER PACK
                  </p>
                  <span className="text-[10px] font-black tracking-widest uppercase bg-poke-red text-white px-3 py-1 rounded-full border border-black animate-pulse">
                    UNZIPPING
                  </span>
                </motion.div>
                <p className="text-poke-navy font-black text-sm tracking-widest uppercase mt-12 animate-pulse">
                  Opening Starter Pack for @{username}...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8 w-full">
                <div className="text-center space-y-1.5 select-none">
                  <span className="px-3.5 py-1 text-xs font-black bg-poke-yellow border-2 border-black text-poke-navy rounded-full uppercase tracking-widest shadow-[2px_2px_0px_#000]">
                    Deck Unlocked!
                  </span>
                  <h2 className="text-4xl font-display font-black text-poke-navy uppercase tracking-widest text-stroke-black mt-3" style={{ WebkitTextStroke: "1px #000" }}>
                    Starter Pack Opened
                  </h2>
                  <p className="text-xs font-bold text-poke-navy/60 max-w-md mx-auto">
                    You have received 7 starting cards and 500 Coins. Check your new cards below!
                  </p>
                </div>

                {/* Grid of starter cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-center w-full justify-items-center py-4">
                  {starterCards.map((card, i) => (
                    <motion.div
                      key={`${card._id}-starter-${i}`}
                      initial={{ opacity: 0, y: 50, scale: 0.5, rotate: -15 }}
                      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: i * 0.1 }}
                      className="hover:scale-105 transition-transform"
                    >
                      <Card3D card={card} size="sm" showDetails={true} />
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  onClick={handleCompleteRegistration}
                  className="btn-primary py-3.5 px-10 text-sm font-black tracking-widest uppercase flex items-center gap-2 mx-auto shadow-[4px_4px_0px_#000]"
                >
                  Enter PokéCard Game
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
