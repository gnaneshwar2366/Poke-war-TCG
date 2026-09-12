"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bot, Lock, Swords, Users, Sparkles, Copy, ChevronRight, Shield, Trophy } from "lucide-react";
import PageHero from "./PageHero";
import { useAuth } from "@/lib/auth";
import { claimTournamentReward, fetchTournament, startTournamentStage } from "@/lib/api";
import type { TournamentProgress } from "@/types";

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const modes = [
  {
    title: "Local Battle",
    subtitle: "Private room battles for two trainers",
    icon: Swords,
    available: true,
    gradient: "from-poke-red to-poke-navy",
    cta: "Create Room",
  },
  {
    title: "VS AI",
    subtitle: "Battle AI opponents",
    icon: Bot,
    available: true,
    gradient: "from-slate-700 to-slate-900",
    cta: "Battle AI",
  },
  {
    title: "Online Matchmaking",
    subtitle: "Queue against live players",
    icon: Users,
    available: false,
    gradient: "from-blue-700 to-indigo-900",
  },
  {
    title: "Ranked Battle",
    subtitle: "Earn rating and climb the ladder",
    icon: Shield,
    available: false,
    gradient: "from-amber-600 to-orange-900",
  },
];

export default function BattleHome() {
  const router = useRouter();
  const { username } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [origin, setOrigin] = useState("");
  const [tournament, setTournament] = useState<TournamentProgress | null>(null);
  const [tournamentError, setTournamentError] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!username) return;
    fetchTournament(username).then(setTournament).catch(() => setTournament(null));
  }, [username]);

  const normalizedRoomCode = useMemo(
    () => roomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, ""),
    [roomCode]
  );

  function createRoom() {
    const code = makeRoomCode();
    router.push(`/battle/${code}`);
  }

  async function createAiRoom() {
    if (!username) {
      router.push("/login");
      return;
    }
    try {
      setTournamentError(null);
      const result = await startTournamentStage(username);
      router.push(`/battle/${result.roomId}`);
    } catch (error: any) {
      setTournamentError(error.message || "Could not start the AI challenge.");
    }
  }

  function joinRoom() {
    if (!normalizedRoomCode) return;
    router.push(`/battle/${normalizedRoomCode}`);
  }

  async function startNextAi() {
    if (!username) return;
    try {
      setTournamentError(null);
      const result = await startTournamentStage(username);
      router.push(`/battle/${result.roomId}`);
    } catch (error: any) {
      setTournamentError(error.message || "Could not start the next AI battle.");
    }
  }

  async function claimReward(cardId: string) {
    if (!username) return;
    try {
      const result = await claimTournamentReward(username, cardId);
      setTournament(result.tournament);
    } catch (error: any) {
      setTournamentError(error.message || "Could not claim reward.");
    }
  }

  async function copyInvite(code: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/battle/${code}`);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      /* clipboard can fail on some browsers */
    }
  }

  return (
    <div>
      <PageHero
        title="Gym Run"
        subtitle="Build a team, outplay the AI, and risk your win streak for better cards."
        icon={<Trophy className="w-7 h-7 text-poke-navy" />}
        gradient="from-poke-yellow via-[#f59e0b] to-poke-red"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12 space-y-8">
        {username && tournament && (
          <section className="poke-card p-6 sm:p-8 border-3 border-poke-yellow bg-gradient-to-br from-white via-white to-poke-yellow/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-poke-red">AI Challenge Run</p>
                <h2 className="text-2xl font-display font-black text-poke-navy mt-1">Gym streak: {tournament.winsInARow} win{tournament.winsInARow === 1 ? "" : "s"}</h2>
                <p className="text-sm text-poke-navy/65 mt-2">Win continuously to unlock stronger reward pools: low, mid, epic, then rare.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-poke-navy text-poke-yellow font-black text-sm">
                <Trophy className="w-4 h-4" /> Stage {tournament.currentStage}
              </div>
            </div>

            {tournament.pendingRewardCards?.length ? (
              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-widest text-poke-navy/60 mb-3">
                  {tournament.pendingTournamentReward?.consolation ? "Consolation reward: choose one low-tier card, then retry" : `Victory reward: choose one ${tournament.pendingRewardTier || "card"} card, then continue`}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {tournament.pendingRewardCards.map((card) => (
                    <button key={card._id} onClick={() => claimReward(card._id)} className="p-2 rounded-xl border-2 border-black bg-white hover:-translate-y-1 transition-transform shadow-[2px_2px_0px_#000]">
                      <img src={card.displayImage || card.imageUrl} alt={card.name} className="w-full aspect-[2/3] object-cover rounded-lg" />
                      <span className="block mt-1 text-[10px] font-black truncate text-poke-navy">{card.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button onClick={startNextAi} className="mt-5 btn-primary py-3 px-6 text-sm inline-flex items-center gap-2">
                Continue to AI Stage {tournament.currentStage} <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {tournamentError && <p className="mt-3 text-sm font-bold text-red-600">{tournamentError}</p>}
          </section>
        )}

        <section className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
          <div className="poke-card p-7 sm:p-10 bg-poke-navy text-white relative overflow-hidden border-4 border-black shadow-[8px_8px_0px_#000]">
            <div className="absolute -right-12 -top-16 w-56 h-56 rounded-full border-[24px] border-poke-red/40" />
            <div className="absolute right-16 bottom-[-72px] w-44 h-44 rounded-full border-[18px] border-poke-yellow/30" />
            <div className="relative max-w-2xl">
              <p className="text-[10px] uppercase font-black tracking-[0.35em] text-poke-yellow mb-3">The main game</p>
              <h2 className="text-3xl sm:text-5xl font-display font-black leading-tight">How far can your team climb?</h2>
              <p className="text-sm sm:text-base text-white/75 mt-4 max-w-xl leading-relaxed">
                Win a gym battle, choose one card, and decide whether to continue. Every win improves the reward pool. One loss resets your streak.
              </p>
              <button onClick={createAiRoom} className="mt-7 btn-primary py-3.5 px-7 text-sm inline-flex items-center gap-2 shadow-[4px_4px_0px_#000]">
                {tournament?.winsInARow ? "Continue Your Run" : "Start Gym Run"}
                <ChevronRight className="w-5 h-5" />
              </button>
              {!username && <p className="text-xs text-white/55 mt-3">Sign in to save your streak and rewards.</p>}
              {tournamentError && <p className="text-sm font-bold text-red-300 mt-3">{tournamentError}</p>}
            </div>
          </div>

          <div className="poke-card p-7 bg-white border-4 border-black shadow-[6px_6px_0px_#000]">
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-poke-red mb-4">Run rules</p>
            <div className="space-y-4">
              {[
                ["01", "Choose six", "Build your battle team from your collection."],
                ["02", "Exploit types", "Switch and hit weaknesses to win."],
                ["03", "Take the risk", "Keep winning to unlock mid, epic, and rare cards."],
              ].map(([number, title, detail]) => (
                <div key={number} className="flex gap-3">
                  <span className="w-8 h-8 shrink-0 rounded-full bg-poke-yellow border-2 border-black flex items-center justify-center text-xs font-black">{number}</span>
                  <div>
                    <p className="font-black text-poke-navy">{title}</p>
                    <p className="text-xs text-poke-navy/55 mt-1 leading-relaxed">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="poke-card p-6 sm:p-8 bg-gradient-to-br from-white via-white to-poke-light/80">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-poke-red mb-2">Version 1</p>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-poke-navy">
                  Launch a private battle room
                </h2>
                <p className="text-sm text-poke-navy/65 mt-2 max-w-xl leading-relaxed">
                  Create a room code, invite another trainer, select six Pokemon from your own collection,
                  and start a live battle with turn-based actions.
                </p>
              </div>
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-poke-yellow border-3 border-black items-center justify-center shadow-[4px_4px_0px_#000]">
                <Sparkles className="w-7 h-7 text-poke-navy" />
              </div>
            </div>

            <div className="grid sm:grid-cols-[1fr_auto] gap-3">
              <div>
                <label className="text-[10px] uppercase font-black tracking-[0.25em] text-poke-navy/45 mb-1.5 block">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="e.g. A1B2C3"
                  className="input-poke text-sm py-3 uppercase tracking-widest"
                />
              </div>
              <div className="flex flex-col sm:justify-end gap-3">
                <button className="btn-poke py-3 px-6 text-sm" onClick={joinRoom} disabled={!normalizedRoomCode}>
                  Join Room
                </button>
                <button className="btn-poke-outline py-3 px-6 text-sm" onClick={createRoom}>
                  Create Room
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {username ? (
                <div className="px-3 py-2 rounded-full bg-poke-light border border-poke-gray text-xs font-bold text-poke-navy">
                  Signed in as <span className="text-poke-red">{username}</span>
                </div>
              ) : (
                <div className="px-3 py-2 rounded-full bg-poke-light border border-poke-gray text-xs font-bold text-poke-navy">
                  Sign in before starting a battle
                </div>
              )}
              <div className="px-3 py-2 rounded-full bg-white border border-poke-gray text-xs font-bold text-poke-navy flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-poke-blue" />
                Private rooms only
              </div>
            </div>
          </div>

          <div className="poke-card p-6 sm:p-8 bg-poke-navy text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_55%)]" />
            <div className="relative">
              <p className="text-[10px] uppercase font-black tracking-[0.3em] text-poke-yellow mb-2">Battle Flow</p>
              <ol className="space-y-4 text-sm">
                {[
                  "Create a room or enter a shared room code.",
                  "Pick six Pokemon from your own inventory.",
                  "Lock your team to begin the battle.",
                  "Take turns using attacks, switches, or skip.",
                ].map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-poke-yellow text-poke-navy border-2 border-black font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="pt-1 text-white/85 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6 p-4 rounded-2xl bg-white/10 border border-white/10">
                <p className="text-xs uppercase font-black tracking-[0.25em] text-poke-yellow mb-2">Invite Link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs sm:text-sm break-all text-white/80">
                    {normalizedRoomCode ? `${origin || ""}/battle/${normalizedRoomCode}` : "Create or type a room code to generate a share link."}
                  </code>
                  <button
                    className="p-2 rounded-xl bg-white text-poke-navy border border-black disabled:opacity-40"
                    onClick={() => normalizedRoomCode && copyInvite(normalizedRoomCode)}
                    disabled={!normalizedRoomCode}
                    title="Copy invite link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] mt-2 text-white/50">
                  {copyState === "copied" ? "Invite link copied." : "Share this with the second trainer."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] uppercase font-black tracking-[0.3em] text-poke-red">Game Modes</p>
              <h3 className="text-2xl font-display font-black text-poke-navy mt-1">Choose your opponent</h3>
            </div>
            <p className="hidden md:block text-sm text-poke-navy/55 max-w-md text-right">
              Challenge an AI opponent or invite another trainer into a private room.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {modes.map(({ title, subtitle, icon: Icon, available, gradient, cta }) => (
              <motion.div
                key={title}
                whileHover={{ y: -5 }}
                className="rounded-3xl overflow-hidden border-3 border-black shadow-[6px_6px_0px_#000] min-h-[220px]"
              >
                <div className={`h-full p-6 text-white bg-gradient-to-br ${gradient} relative flex flex-col justify-between`}>
                  <div className="absolute inset-0 opacity-15">
                    <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full border-8 border-white/80" />
                    <div className="absolute left-6 top-8 w-16 h-16 rounded-full bg-white/20" />
                  </div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur border border-white/15 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-xl font-display font-black">{title}</h4>
                    <p className="text-sm text-white/80 mt-2 leading-relaxed">{subtitle}</p>
                  </div>
                  <div className="relative flex items-center justify-between mt-6">
                    <span className={`text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full border ${available ? "bg-poke-yellow text-poke-navy border-black" : "bg-black/25 text-white border-white/20"}`}>
                      {available ? "Available" : "Coming Soon"}
                    </span>
                    {available ? (
                      <button className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest bg-white text-poke-navy px-4 py-2 rounded-full border border-black shadow-[3px_3px_0px_#000]" onClick={title === "VS AI" ? createAiRoom : createRoom}>
                        {cta}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest bg-white/20 text-white px-4 py-2 rounded-full border border-white/20">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
