"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Info,
  Shield,
  SkipForward,
  Swords,
  Users,
  X,
} from "lucide-react";
import clsx from "clsx";
import PageHero from "./PageHero";
import PokemonCardFace from "./PokemonCardFace";
import TypeIcon from "./TypeIcon";
import EnergyIcon from "./EnergyIcon";
import { useAuth } from "@/lib/auth";
import { bootstrapUser, fetchUser } from "@/lib/api";
import {
  getBattlePreview,
  getDamageBreakdown,
  getEffectivenessLabel,
  getMoveCategory,
  getMoveCooldown,
} from "@/lib/battleRules";
import {
  battleAction,
  battleLockTeam,
  battleTeamUpdate,
  battleUnlockTeam,
  disconnectSocket,
  joinBattleRoom,
  leaveBattleRoom,
} from "@/lib/socket";
import type { BattleRoomState, Card, User } from "@/types";

interface BattleRoomProps {
  roomId: string;
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((id, index) => id === b[index]);
}

function hpPercent(currentHp: number, cardHp?: number | null) {
  const total = Math.max(1, cardHp || 1);
  return Math.max(0, Math.min(100, (currentHp / total) * 100));
}

function statusColor(status?: string | null) {
  switch (status) {
    case "Burn":
      return "bg-red-500/20 text-red-400 border-red-500/40";
    case "Poison":
      return "bg-violet-500/20 text-violet-400 border-violet-500/40";
    case "Sleep":
      return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    case "Freeze":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
    case "Paralyze":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "Confusion":
      return "bg-pink-500/20 text-pink-400 border-pink-500/40";
    default:
      return "bg-white/10 text-white/70 border-white/20";
  }
}

/** Classic red-and-white Pokeball indicator for team status */
function PokeballIcon({ fainted, active }: { fainted?: boolean; active?: boolean }) {
  return (
    <div
      className={clsx(
        "relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-black overflow-hidden shrink-0 transition-transform",
        active && "scale-125 ring-2 ring-poke-yellow",
        fainted ? "bg-stone-500 opacity-30 grayscale" : "bg-white"
      )}
      title={fainted ? "Fainted" : active ? "Active in battle" : "Ready"}
    >
      <div className={clsx("h-1/2 w-full", fainted ? "bg-stone-600" : "bg-[#EE1515]")} />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-black" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full border border-black bg-white" />
    </div>
  );
}

/** Classic Pokemon Game floating HUD */
function PokemonHud({
  trainerName,
  pokemonName,
  type,
  currentHp,
  totalHp,
  status,
  team,
  activeIndex,
  isOpponent,
}: {
  trainerName: string;
  pokemonName: string;
  type: string;
  currentHp: number;
  totalHp: number;
  status?: { type: string } | null;
  team: Array<{ isFainted: boolean; currentHp: number }>;
  activeIndex: number;
  isOpponent?: boolean;
}) {
  const pct = hpPercent(currentHp, totalHp);
  const hpColor =
    pct > 50
      ? "bg-gradient-to-r from-emerald-400 to-green-500"
      : pct > 20
        ? "bg-gradient-to-r from-amber-400 to-yellow-500"
        : "bg-gradient-to-r from-rose-600 to-red-600 animate-pulse";

  return (
    <div
      className={clsx(
        "relative rounded-2xl border-3 border-black p-3.5 sm:p-4 shadow-[6px_6px_0px_#000] z-20 backdrop-blur-md transition-all duration-200",
        isOpponent
          ? "bg-[#1E293B]/95 text-white"
          : "bg-white/95 text-poke-navy"
      )}
    >
      {/* Top row: Trainer & Pokemon Name + Type badge + Party pokeballs */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={clsx("text-[10px] uppercase font-black tracking-[0.2em]", isOpponent ? "text-poke-yellow" : "text-poke-red")}>
            {trainerName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <h4 className="font-display font-black text-base sm:text-lg uppercase tracking-wide leading-none">
              {pokemonName}
            </h4>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1",
                isOpponent
                  ? "bg-white/10 text-white border-white/20"
                  : "bg-poke-yellow text-poke-navy border-black"
              )}
            >
              <TypeIcon type={type} size={11} />
              {type}
            </span>
          </div>
        </div>

        {/* 6 Party Pokeballs */}
        <div className="flex items-center gap-1 pt-1">
          {team.map((slot, i) => (
            <PokeballIcon
              key={i}
              fainted={slot.isFainted || slot.currentHp <= 0}
              active={i === activeIndex}
            />
          ))}
        </div>
      </div>

      {/* HP Bar with iconic yellow 'HP' label */}
      <div className="mt-3 flex items-center gap-2">
        <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[10px] font-black tracking-tighter border border-black shadow-[1px_1px_0px_#000]">
          HP
        </span>
        <div className="flex-1 h-3.5 rounded-full bg-black/25 border border-black overflow-hidden p-[1px]">
          <motion.div
            className={clsx("h-full rounded-full transition-all", hpColor)}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Bottom row: status condition & numeric HP */}
      <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold">
        <div>
          {status ? (
            <span className={clsx("px-2 py-0.5 rounded-full border text-[10px] font-black uppercase", statusColor(status.type))}>
              {status.type}
            </span>
          ) : (
            <span className={clsx("text-[10px] uppercase font-bold", isOpponent ? "text-white/40" : "text-poke-navy/40")}>
              Status: Normal
            </span>
          )}
        </div>
        <span className={clsx("font-mono font-black text-xs", isOpponent ? "text-white" : "text-poke-navy")}>
          {Math.max(0, currentHp)} <span className="opacity-50">/</span> {totalHp}
        </span>
      </div>
    </div>
  );
}

function CardTile({
  card,
  selected,
  disabled,
  onClick,
}: {
  card: Card;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const primaryType = card.types?.[0] || "Colorless";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "group text-left rounded-3xl border-3 border-black shadow-[6px_6px_0px_#000] transition-all duration-200 overflow-hidden bg-white",
        selected ? "ring-4 ring-poke-yellow scale-[1.01]" : "hover:-translate-y-1",
        disabled && "opacity-60 cursor-not-allowed hover:translate-y-0"
      )}
    >
      <div className="grid grid-cols-[110px_1fr] gap-0">
        <div className="bg-poke-light p-2">
          <PokemonCardFace card={card} className="shadow-none" />
        </div>
        <div className="p-4 flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase font-black tracking-[0.25em] text-poke-navy/35">Battle Card</p>
              <h4 className="text-sm sm:text-base font-black text-poke-navy leading-tight mt-1">{card.name}</h4>
            </div>
            {selected && (
              <span className="px-2 py-1 rounded-full bg-poke-yellow text-poke-navy border border-black text-[10px] font-black uppercase">
                Selected
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-full bg-poke-red/10 text-poke-red border border-poke-red/20 font-bold">
              {card.hp || 0} HP
            </span>
            <span className="px-2 py-1 rounded-full bg-poke-light text-poke-navy border border-poke-gray font-bold">
              {card.rarity}
            </span>
            <span className="px-2 py-1 rounded-full bg-white text-poke-navy border border-poke-gray font-bold flex items-center gap-1">
              <TypeIcon type={primaryType} size={14} />
              {primaryType}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-poke-navy/40">Attacks</p>
            <div className="flex flex-wrap gap-1.5">
              {card.attacks?.slice(0, 2).map((attack) => (
                <span
                  key={attack.name}
                  className="inline-flex items-center gap-1 rounded-full border border-poke-gray bg-white px-2 py-1 text-[11px] font-semibold text-poke-navy/80"
                >
                  {attack.cost?.slice(0, 2).map((energy, index) => (
                    <EnergyIcon key={`${attack.name}-${energy}-${index}`} type={energy} size={11} />
                  ))}
                  {attack.name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold">
              Weak: {card.weakness || "None"}
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 font-bold">
              Resist: {card.resistance || "None"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function BattleRoom({ roomId }: BattleRoomProps) {
  const router = useRouter();
  const { username } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState<BattleRoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [origin, setOrigin] = useState("");
  const logRef = useRef<HTMLDivElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Classic Console Tab state: "menu" (2x2) | "fight" (moves) | "pokemon" (party switch) | "bag" (intel)
  const [consoleTab, setConsoleTab] = useState<"menu" | "fight" | "pokemon" | "bag">("menu");
  const [showLogModal, setShowLogModal] = useState(false);

  const myPlayer = room?.players.find((player) => player.username === username);
  const opponent = room?.players.find((player) => player.username !== username);
  const myActive = myPlayer?.team?.[myPlayer.activeIndex];
  const theirActive = opponent?.team?.[opponent.activeIndex];
  const roomReady = room?.status === "battling" || room?.status === "finished";

  // Auto-switch to party selector if my active Pokemon faints and I need a replacement!
  useEffect(() => {
    if (myPlayer?.needsSwitch) {
      setConsoleTab("pokemon");
    }
  }, [myPlayer?.needsSwitch]);

  // When round resolves, return to the main menu
  useEffect(() => {
    if (!myPlayer?.pendingAction && !myPlayer?.needsSwitch) {
      setConsoleTab("menu");
    }
  }, [room?.turnNumber, myPlayer?.pendingAction, myPlayer?.needsSwitch]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!username) return;
    const battleUsername = username;
    let active = true;
    async function loadBattleProfile() {
      try {
        let profile: User;
        try {
          profile = await fetchUser(battleUsername);
        } catch {
          profile = await bootstrapUser(battleUsername);
        }
        if (!active) return;
        setUser(profile);
        joinBattleRoom(roomId, battleUsername, {
          onUpdate: setRoom,
          onError: (data) => setError(data.message),
        });
      } catch (e: any) {
        if (active) setError(e.message || "Failed to prepare your battle profile");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadBattleProfile();

    return () => {
      active = false;
      leaveBattleRoom(roomId, battleUsername);
      disconnectSocket();
    };
  }, [roomId, username]);

  useEffect(() => {
    if (!myPlayer) return;
    const teamIds = myPlayer.team.map((slot) => slot.inventoryItemId || slot.card._id);
    if (!sameIds(teamIds, selectedIds)) {
      setSelectedIds(teamIds);
    }
  }, [myPlayer?.team, myPlayer?.lockedTeam, myPlayer?.activeIndex]);

  useEffect(() => {
    if (!myPlayer || myPlayer.lockedTeam || roomReady || selectedIds.length !== 6) return;
    const serverIds = myPlayer.team.map((slot) => slot.inventoryItemId || slot.card._id);
    if (!sameIds(serverIds, selectedIds)) {
      battleTeamUpdate(roomId, username || "", selectedIds);
    }
  }, [selectedIds, roomId, username, myPlayer?.lockedTeam, roomReady, myPlayer?.team]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [room?.log, showLogModal]);

  const inventoryCards = useMemo(() => {
    const inventory = Array.isArray(user?.inventory) ? user.inventory : [];
    const cards = inventory
      .filter((entry) => Boolean(entry?.card))
      .map((entry) => ({ ...entry.card, _inventoryId: entry._id || entry.card._id }))
      .filter(Boolean) as Array<Card & { _inventoryId: string }>;

    return cards.filter((card) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        card.name.toLowerCase().includes(q) ||
        card.types.some((type) => type.toLowerCase().includes(q)) ||
        card.rarity.toLowerCase().includes(q);
      const matchesType = !typeFilter || card.types.includes(typeFilter);
      const matchesRarity = !rarityFilter || card.rarity === rarityFilter;
      return matchesSearch && matchesType && matchesRarity;
    });
  }, [user, search, typeFilter, rarityFilter]);

  const selectedCards = useMemo(() => {
    const inventory = Array.isArray(user?.inventory) ? user.inventory : [];
    const lookup = new Map(
      inventory.filter((entry) => Boolean(entry?.card)).map((entry) => [(entry._id || entry.card._id).toString(), entry.card])
    );
    return selectedIds.map((id) => lookup.get(id)).filter(Boolean) as Card[];
  }, [selectedIds, user]);

  const allTypes = useMemo(() => {
    const items = new Set<string>();
    const inventory = Array.isArray(user?.inventory) ? user.inventory : [];
    inventory.forEach((entry) => entry.card?.types?.forEach((type) => items.add(type)));
    return [...items].sort();
  }, [user]);

  const allRarities = useMemo(() => {
    const items = new Set<string>();
    const inventory = Array.isArray(user?.inventory) ? user.inventory : [];
    inventory.forEach((entry) => {
      if (entry.card?.rarity) items.add(entry.card.rarity);
    });
    return [...items].sort();
  }, [user]);

  const canLock = selectedIds.length === 6 && !!myPlayer && !myPlayer.lockedTeam && !roomReady;
  const isMyTurn = room?.status === "battling" && !myPlayer?.pendingAction && !myPlayer?.needsSwitch;
  const battleFinished = room?.status === "finished";
  const didWin = battleFinished && room?.winnerUsername === username;
  const isTournamentRoom = /^AI-T\d+-/i.test(roomId);

  // Most recent meaningful log entry for dialogue box narrative
  const latestLog = useMemo(() => {
    if (!room?.log?.length) return null;
    const meaningful = [...room.log].reverse().find((e) => e.kind === "attack" || e.kind === "status" || e.kind === "switch");
    return meaningful || room.log[room.log.length - 1];
  }, [room?.log]);

  const dialogueNarrative = useMemo(() => {
    if (myPlayer?.needsSwitch) {
      return `⚠️ YOUR ${myActive?.card.name.toUpperCase() || "POKÉMON"} FAINTED! Choose a replacement Pokémon to send into battle!`;
    }
    if (opponent?.needsSwitch) {
      return `Opponent's ${theirActive?.card.name.toUpperCase() || "Pokémon"} fainted! Waiting for ${opponent?.displayName || "opponent"} to send out their next Pokémon...`;
    }
    if (myPlayer?.pendingAction) {
      return `Action locked in! Waiting for ${opponent?.displayName || opponent?.username || "opponent"} to make their move...`;
    }
    if (isMyTurn && myActive) {
      return `What will ${myActive.card.name.toUpperCase()} do?`;
    }
    if (latestLog) {
      return latestLog.text;
    }
    return "The stadium is roaring! Choose your command.";
  }, [myPlayer?.needsSwitch, opponent?.needsSwitch, myPlayer?.pendingAction, isMyTurn, myActive, opponent?.displayName, opponent?.username, latestLog]);

  function toggleSelection(card: Card & { _inventoryId: string }) {
    if (!myPlayer || myPlayer.lockedTeam || roomReady) return;
    setError(null);
    setSelectedIds((prev) => {
      const exists = prev.includes(card._inventoryId);
      if (exists) return prev.filter((id) => id !== card._inventoryId);
      if (prev.length >= 6) return prev;
      return [...prev, card._inventoryId];
    });
  }

  async function handleCopyInvite() {
    try {
      await navigator.clipboard.writeText(`${origin || window.location.origin}/battle/${roomId}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy the invite link.");
    }
  }

  function handleLockTeam() {
    if (!myPlayer || !canLock) return;
    battleTeamUpdate(roomId, username || "", selectedIds);
    battleLockTeam(roomId, username || "", selectedIds);
  }

  function handleUnlockTeam() {
    if (!username) return;
    battleUnlockTeam(roomId, username);
  }

  function handleAttack(moveIndex: number) {
    if (!username) return;
    battleAction(roomId, username, { type: "attack", moveIndex });
    setConsoleTab("menu");
  }

  function handleSwitch(targetIndex: number) {
    if (!username) return;
    battleAction(roomId, username, { type: "switch", targetIndex });
    setConsoleTab("menu");
  }

  function handleSkip() {
    if (!username) return;
    battleAction(roomId, username, { type: "skip" });
    setConsoleTab("menu");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-poke-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!username) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F0F3F8]">
      <PageHero
        title={`Stadium Room ${roomId}`}
        subtitle={
          room?.status === "battling"
            ? `Turn ${room.turnNumber} — Classic Pokémon Battle Arena`
            : "Assemble your 6-Pokémon team and prepare for battle"
        }
        icon={<Swords className="w-7 h-7 text-poke-navy" />}
        gradient="from-poke-red via-[#B91C1C] to-poke-navy"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-16 space-y-6">
        {/* Room Header bar */}
        <section className="poke-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-poke-navy/40">Battle Room</p>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <h2 className="text-xl font-display font-black text-poke-navy">{roomId}</h2>
              <button
                onClick={handleCopyInvite}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-poke-light border border-poke-gray text-xs font-bold text-poke-navy hover:bg-poke-gray/50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "Copied Link!" : "Copy Invite"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx(
              "px-3 py-1.5 rounded-full border border-black text-xs font-black uppercase tracking-widest",
              room?.status === "battling" ? "bg-poke-yellow text-poke-navy" : "bg-white text-poke-navy"
            )}>
              {room?.status === "battling" ? `Turn ${room.turnNumber}` : (room?.status || "waiting")}
            </span>
            <span className="px-3 py-1.5 rounded-full border border-poke-gray bg-poke-light text-xs font-bold text-poke-navy">
              {room?.players.length || 0} / 2 Trainers
            </span>
            {isMyTurn && (
              <span className="px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 text-xs font-black uppercase tracking-widest animate-pulse">
                Your Move
              </span>
            )}
            {myPlayer?.needsSwitch && (
              <span className="px-3 py-1.5 rounded-full border border-red-500/40 bg-red-500/20 text-red-700 text-xs font-black uppercase tracking-widest animate-bounce">
                Choose Replacement!
              </span>
            )}
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-700 font-semibold text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-xs uppercase font-black tracking-widest underline">
              Dismiss
            </button>
          </div>
        )}

        {/* ─── LOBBY / TEAM SELECTION VIEW ───────────────────────── */}
        {room?.status !== "battling" && !battleFinished && (
          <section className="grid xl:grid-cols-[1.15fr_0.85fr] gap-6">
            <div className="poke-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[10px] uppercase font-black tracking-[0.3em] text-poke-red">Team Builder</p>
                  <h3 className="text-2xl font-display font-black text-poke-navy mt-1">Select 6 Pokémon for battle</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-black tracking-[0.25em] text-poke-navy/40">Selected</p>
                  <p className="text-2xl font-black text-poke-red">{selectedIds.length}/6</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-[0.25em] text-poke-navy/45 mb-1.5 block">Search</label>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-poke text-sm py-2.5"
                    placeholder="Name, type, rarity"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-[0.25em] text-poke-navy/45 mb-1.5 block">Type</label>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-poke text-sm py-2.5">
                    <option value="">All Types</option>
                    {allTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-[0.25em] text-poke-navy/45 mb-1.5 block">Rarity</label>
                  <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} className="input-poke text-sm py-2.5">
                    <option value="">All Rarities</option>
                    {allRarities.map((rarity) => (
                      <option key={rarity} value={rarity}>
                        {rarity}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCards.map((card, index) => (
                  <span
                    key={`${card._id}-${index}`}
                    className="px-3 py-1.5 rounded-full bg-poke-yellow text-poke-navy border border-black text-xs font-black"
                  >
                    {index + 1}. {card.name}
                  </span>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {inventoryCards.map((card) => (
                  <CardTile
                    key={card._inventoryId}
                    card={card}
                    selected={selectedIds.includes(card._inventoryId)}
                    disabled={!!myPlayer?.lockedTeam || roomReady}
                    onClick={() => toggleSelection(card)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="poke-card p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-poke-red">Lobby Controls</p>
                    <h3 className="text-xl font-display font-black text-poke-navy mt-1">Ready to Battle</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="btn-poke py-3 text-sm" onClick={handleLockTeam} disabled={!canLock}>
                    Lock Team
                  </button>
                  <button className="btn-poke-outline py-3 text-sm" onClick={handleUnlockTeam} disabled={!myPlayer?.lockedTeam}>
                    Unlock
                  </button>
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-poke-light border border-poke-gray text-sm text-poke-navy/70">
                  <p className="font-bold text-poke-navy mb-2">Battle Rules</p>
                  <ul className="space-y-2 text-xs sm:text-sm leading-relaxed">
                    <li>• Each trainer locks a team of exactly six Pokémon.</li>
                    <li>• Battles take place simultaneously in real time.</li>
                    <li>• When an active Pokémon is knocked out, you choose which Pokémon to send out next!</li>
                  </ul>
                </div>
              </div>

              <div className="poke-card p-5 sm:p-6">
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-poke-red mb-3">Trainers</p>
                <div className="space-y-3">
                  {room?.players.map((player) => (
                    <div key={player.username} className="rounded-2xl border border-poke-gray bg-poke-light p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-poke-navy">{player.displayName || player.username}</p>
                          <p className="text-xs text-poke-navy/50">@{player.username}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              "px-2.5 py-1 rounded-full border text-[10px] font-black uppercase",
                              player.connected ? "bg-green-500/10 text-green-700 border-green-500/20" : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                            )}
                          >
                            {player.connected ? "Online" : "Offline"}
                          </span>
                          <span
                            className={clsx(
                              "px-2.5 py-1 rounded-full border text-[10px] font-black uppercase",
                              player.lockedTeam ? "bg-poke-yellow text-poke-navy border-black" : "bg-white text-poke-navy border-poke-gray"
                            )}
                          >
                            {player.lockedTeam ? "Locked" : "Selecting"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {player.team.map((slot, index) => (
                          <span
                            key={`${player.username}-${index}`}
                            className="px-2.5 py-1 rounded-full bg-white border border-poke-gray text-[11px] font-bold text-poke-navy"
                          >
                            {index + 1}. {slot.card.name}
                          </span>
                        ))}
                        {player.team.length === 0 && (
                          <span className="text-xs text-poke-navy/45 italic">No lineup yet.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── AUTHENTIC POKÉMON BATTLE SCREEN ───────────────────── */}
        {room?.status === "battling" && myActive && theirActive && (
          <section className="space-y-5">
            {/* 1. STADIUM BATTLEFIELD ARENA */}
            <div className="relative rounded-3xl border-4 border-black overflow-hidden bg-gradient-to-b from-[#151D2A] via-[#1E293B] to-[#0F172A] p-4 sm:p-6 lg:p-8 shadow-[8px_8px_0px_#000] min-h-[460px] flex flex-col justify-between">
              {/* Stadium Background Atmosphere & Arena Rings */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2),_transparent_70%)]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[340px] rounded-[50%] border-4 border-white/10 opacity-30 pointer-events-none transform -rotate-12 scale-y-50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[180px] rounded-[50%] border-2 border-poke-yellow/30 opacity-40 pointer-events-none transform -rotate-12 scale-y-50" />

              {/* ARENA UPPER HALF: OPPONENT SIDE (TOP RIGHT) */}
              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
                {/* Opponent floating HUD */}
                <div className="w-full sm:w-[340px]">
                  <PokemonHud
                    trainerName={opponent?.displayName || opponent?.username || "Opponent"}
                    pokemonName={theirActive.card.name}
                    type={theirActive.card.types?.[0] || "Colorless"}
                    currentHp={theirActive.currentHp}
                    totalHp={theirActive.card.hp || 70}
                    status={theirActive.status}
                    team={opponent?.team || []}
                    activeIndex={opponent?.activeIndex || 0}
                    isOpponent={true}
                  />
                </div>

                {/* Opponent Pokemon Sprite on Arena Platform */}
                <div className="relative flex flex-col items-center justify-center pr-4 sm:pr-12">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-36 sm:w-44 z-10"
                  >
                    <PokemonCardFace card={theirActive.card} className="shadow-2xl" />
                  </motion.div>
                  {/* Arena Platform Shadow */}
                  <div className="w-40 sm:w-52 h-8 sm:h-10 -mt-4 bg-black/60 rounded-[50%] filter blur-md border border-white/10" />
                </div>
              </div>

              {/* ARENA LOWER HALF: PLAYER SIDE (BOTTOM LEFT) */}
              <div className="relative flex flex-col-reverse sm:flex-row items-center justify-between gap-4 z-10 mt-6 sm:mt-0">
                {/* Player Pokemon Sprite on Arena Platform */}
                <div className="relative flex flex-col items-center justify-center pl-4 sm:pl-12">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-40 sm:w-48 z-10"
                  >
                    <PokemonCardFace card={myActive.card} className="shadow-2xl ring-2 ring-poke-yellow/60 rounded-xl" />
                  </motion.div>
                  {/* Arena Platform Shadow & Glow Ring */}
                  <div className="w-44 sm:w-56 h-8 sm:h-10 -mt-4 bg-poke-yellow/20 rounded-[50%] filter blur-md border border-poke-yellow/40" />
                </div>

                {/* Player floating HUD */}
                <div className="w-full sm:w-[340px]">
                  <PokemonHud
                    trainerName={myPlayer?.displayName || username}
                    pokemonName={myActive.card.name}
                    type={myActive.card.types?.[0] || "Colorless"}
                    currentHp={myActive.currentHp}
                    totalHp={myActive.card.hp || 70}
                    status={myActive.status}
                    team={myPlayer?.team || []}
                    activeIndex={myPlayer?.activeIndex || 0}
                    isOpponent={false}
                  />
                </div>
              </div>
            </div>

            {/* 2. CLASSIC DUAL-PANEL BATTLE CONSOLE (GBA / DS STYLE) */}
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4">
              {/* LEFT PANEL: THE DIALOGUE / NARRATIVE BOX */}
              <div className="rounded-3xl border-4 border-black bg-white p-5 sm:p-6 shadow-[6px_6px_0px_#000] flex flex-col justify-between min-h-[170px] relative overflow-hidden">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-poke-yellow border border-black text-[10px] font-black uppercase tracking-wider text-poke-navy">
                      Battle Dialogue
                    </span>
                    <button
                      onClick={() => setShowLogModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-poke-gray bg-poke-light text-xs font-bold text-poke-navy hover:bg-poke-gray/50 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5 text-poke-blue" />
                      Battle Log ({room.log.length})
                    </button>
                  </div>
                  <p className="font-display font-black text-lg sm:text-xl text-poke-navy leading-snug pt-1">
                    {dialogueNarrative}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/10 flex items-center justify-between text-xs text-poke-navy/60 font-semibold">
                  <span>Turn {room.turnNumber}</span>
                  <span>{myPlayer?.pendingAction ? "Action Locked" : isMyTurn ? "Select Action" : "Waiting"}</span>
                </div>
              </div>

              {/* RIGHT PANEL: 2x2 ACTION COMMAND BOX OR SUBMENUS */}
              <div className="rounded-3xl border-4 border-black bg-white p-4 sm:p-5 shadow-[6px_6px_0px_#000] min-h-[170px] flex flex-col justify-center">
                {/* SUBMENU 1: MAIN 2x2 COMMANDS */}
                {consoleTab === "menu" && (
                  <div className="grid grid-cols-2 gap-3 h-full">
                    {/* FIGHT BUTTON */}
                    <button
                      onClick={() => setConsoleTab("fight")}
                      disabled={!isMyTurn}
                      className="group rounded-2xl border-3 border-black bg-gradient-to-br from-[#E52D27] to-[#B31217] text-white p-3 sm:p-4 text-left shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-black text-lg sm:text-xl tracking-wider uppercase">FIGHT</span>
                        <Swords className="w-5 h-5 text-white/80 group-hover:rotate-12 transition-transform" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-white/75 tracking-wider">Choose an Attack</p>
                    </button>

                    {/* POKÉMON (PARTY SWITCH) BUTTON */}
                    <button
                      onClick={() => setConsoleTab("pokemon")}
                      disabled={!isMyTurn && !myPlayer?.needsSwitch}
                      className="group rounded-2xl border-3 border-black bg-gradient-to-br from-[#10B981] to-[#047857] text-white p-3 sm:p-4 text-left shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-black text-lg sm:text-xl tracking-wider uppercase">POKéMON</span>
                        <Users className="w-5 h-5 text-white/80 group-hover:scale-110 transition-transform" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-white/75 tracking-wider">Switch Pokémon</p>
                    </button>

                    {/* BAG / INTEL BUTTON */}
                    <button
                      onClick={() => setConsoleTab("bag")}
                      className="group rounded-2xl border-3 border-black bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-poke-navy p-3 sm:p-4 text-left shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-black text-lg sm:text-xl tracking-wider uppercase">INTEL</span>
                        <Shield className="w-5 h-5 text-poke-navy/80 group-hover:scale-110 transition-transform" />
                      </div>
                      <p className="text-[10px] uppercase font-black text-poke-navy/70 tracking-wider">Type Matchups</p>
                    </button>

                    {/* RUN / PASS BUTTON */}
                    <button
                      onClick={handleSkip}
                      disabled={!isMyTurn}
                      className="group rounded-2xl border-3 border-black bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8] text-white p-3 sm:p-4 text-left shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display font-black text-lg sm:text-xl tracking-wider uppercase">PASS</span>
                        <SkipForward className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-white/75 tracking-wider">Skip this Turn</p>
                    </button>
                  </div>
                )}

                {/* SUBMENU 2: FIGHT (ATTACK SELECTION) */}
                {consoleTab === "fight" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-poke-red">Select Move</p>
                      <button
                        onClick={() => setConsoleTab("menu")}
                        className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-poke-navy hover:underline"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {myActive.card.attacks?.slice(0, 4).map((move, index) => {
                        const preview = getDamageBreakdown(myActive.card, theirActive.card, move);
                        const cooldown = myActive.moveCooldowns?.[index] || 0;
                        const isReady = isMyTurn && cooldown === 0;

                        return (
                          <button
                            key={`${move.name}-${index}`}
                            onClick={() => handleAttack(index)}
                            disabled={!isReady}
                            className={clsx(
                              "rounded-2xl border-2 border-black p-3 text-left shadow-[3px_3px_0px_#000] transition-all relative overflow-hidden",
                              isReady
                                ? "bg-white hover:bg-poke-light hover:-translate-y-0.5"
                                : "bg-stone-100 opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  {move.cost?.slice(0, 2).map((energy, idx) => (
                                    <EnergyIcon key={`${move.name}-${energy}-${idx}`} type={energy} size={12} />
                                  ))}
                                  <span className="font-black text-sm text-poke-navy">{move.name}</span>
                                </div>
                                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold">
                                  <span
                                    className={clsx(
                                      "px-1.5 py-0.5 rounded border uppercase",
                                      preview.effectiveness === "super"
                                        ? "bg-green-500/15 text-green-700 border-green-500/30"
                                        : preview.effectiveness === "not-effective"
                                          ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                                          : "bg-blue-500/15 text-blue-700 border-blue-500/30"
                                    )}
                                  >
                                    {getEffectivenessLabel(preview.effectiveness)}
                                  </span>
                                  <span className="text-poke-navy/50">
                                    {cooldown > 0 ? `CD: ${cooldown} turn(s)` : "Ready"}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-black text-poke-red">{cooldown > 0 ? "—" : preview.damage}</span>
                                <span className="block text-[9px] uppercase font-bold text-poke-navy/40">DMG</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SUBMENU 3: BAG / INTEL TAB */}
                {consoleTab === "bag" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-poke-navy">Matchup Intel</p>
                      <button
                        onClick={() => setConsoleTab("menu")}
                        className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-poke-navy hover:underline"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl border border-poke-gray bg-poke-light">
                        <p className="text-[10px] uppercase font-black text-poke-navy/40 mb-1">Your Pokémon</p>
                        <p className="font-black text-poke-navy">{myActive.card.name}</p>
                        <p className="text-[11px] text-poke-navy/70 mt-1">Weakness: {myActive.card.weakness || "None"}</p>
                        <p className="text-[11px] text-poke-navy/70">Resistance: {myActive.card.resistance || "None"}</p>
                      </div>
                      <div className="p-3 rounded-xl border border-poke-gray bg-poke-light">
                        <p className="text-[10px] uppercase font-black text-poke-navy/40 mb-1">Opponent</p>
                        <p className="font-black text-poke-navy">{theirActive.card.name}</p>
                        <p className="text-[11px] text-poke-navy/70 mt-1">Weakness: {theirActive.card.weakness || "None"}</p>
                        <p className="text-[11px] text-poke-navy/70">Resistance: {theirActive.card.resistance || "None"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SUBMENU 4 / MODAL: POKÉMON PARTY SCREEN (MANDATORY ON FAINT OR VOLUNTARY SWITCH) */}
            <AnimatePresence>
              {consoleTab === "pokemon" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="poke-card p-5 sm:p-6 bg-gradient-to-br from-white to-poke-light border-4 border-black shadow-[6px_6px_0px_#000]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest border border-black">
                          Party Menu
                        </span>
                        {myPlayer.needsSwitch && (
                          <span className="px-2.5 py-1 rounded-full bg-poke-red text-white text-[10px] font-black uppercase tracking-widest border border-black animate-pulse">
                            Mandatory Selection
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-display font-black text-poke-navy mt-1">
                        {myPlayer.needsSwitch
                          ? `Select your next Pokémon to send into battle!`
                          : `Choose a Pokémon to switch into battle`}
                      </h3>
                    </div>

                    {!myPlayer.needsSwitch && (
                      <button
                        onClick={() => setConsoleTab("menu")}
                        className="btn-poke-outline py-2 px-4 text-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Battle
                      </button>
                    )}
                  </div>

                  {/* 6 Party Pokémon Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {myPlayer.team.map((slot, index) => {
                      const isActive = index === myPlayer.activeIndex;
                      const isFainted = slot.isFainted || slot.currentHp <= 0;

                      return (
                        <div
                          key={`${slot.card._id}-${index}`}
                          className={clsx(
                            "rounded-2xl border-3 border-black p-3.5 transition-all relative overflow-hidden flex flex-col justify-between gap-3",
                            isActive
                              ? "bg-poke-yellow/30 border-poke-yellow shadow-[4px_4px_0px_#FFCB05]"
                              : isFainted
                                ? "bg-stone-200 opacity-60 grayscale cursor-not-allowed"
                                : "bg-white shadow-[4px_4px_0px_#000] hover:-translate-y-1"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-16 shrink-0">
                              <PokemonCardFace card={slot.card} className="shadow-none" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="font-display font-black text-sm text-poke-navy truncate">
                                  {slot.card.name}
                                </h4>
                                <span className="text-[10px] font-black text-poke-navy/40">
                                  #{index + 1}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="px-2 py-0.5 rounded-full bg-white border border-poke-gray text-[10px] font-black uppercase text-poke-navy flex items-center gap-1">
                                  <TypeIcon type={slot.card.types?.[0] || "Colorless"} size={10} />
                                  {slot.card.types?.[0] || "Colorless"}
                                </span>
                                {slot.status && (
                                  <span className={clsx("px-1.5 py-0.5 rounded-full border text-[9px] font-black uppercase", statusColor(slot.status.type))}>
                                    {slot.status.type}
                                  </span>
                                )}
                              </div>

                              {/* Health status */}
                              <div className="mt-2">
                                <div className="h-2 rounded-full bg-black/10 border border-black/30 overflow-hidden">
                                  <div
                                    className={clsx(
                                      "h-full rounded-full",
                                      hpPercent(slot.currentHp, slot.card.hp) > 50
                                        ? "bg-emerald-500"
                                        : hpPercent(slot.currentHp, slot.card.hp) > 20
                                          ? "bg-amber-400"
                                          : "bg-red-500"
                                    )}
                                    style={{ width: `${hpPercent(slot.currentHp, slot.card.hp)}%` }}
                                  />
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-poke-navy/70">
                                  <span>{isFainted ? "Fainted" : `${Math.max(0, slot.currentHp)} / ${slot.card.hp || 70} HP`}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div>
                            {isActive ? (
                              <span className="w-full block text-center py-2 rounded-xl bg-poke-yellow text-poke-navy font-black text-xs uppercase tracking-wider border border-black">
                                In Battle
                              </span>
                            ) : isFainted ? (
                              <span className="w-full block text-center py-2 rounded-xl bg-stone-300 text-stone-600 font-black text-xs uppercase tracking-wider border border-stone-400">
                                Fainted
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSwitch(index)}
                                className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                              >
                                {myPlayer.needsSwitch ? "Send Out" : "Switch In"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* ─── FULL BATTLE LOG MODAL / DRAWER ─────────────────────── */}
        <AnimatePresence>
          {showLogModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="poke-card w-full max-w-2xl max-h-[80vh] flex flex-col p-6 bg-white border-4 border-black shadow-[8px_8px_0px_#000]"
              >
                <div className="flex items-center justify-between pb-4 border-b border-black/10">
                  <div className="flex items-center gap-2">
                    <Swords className="w-5 h-5 text-poke-red" />
                    <h3 className="text-xl font-display font-black text-poke-navy">Chronological Battle Log</h3>
                  </div>
                  <button
                    onClick={() => setShowLogModal(false)}
                    className="p-1 rounded-xl hover:bg-poke-light border border-poke-gray text-poke-navy"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div ref={logRef} className="flex-1 overflow-y-auto space-y-2 py-4 pr-1">
                  {room?.log.map((entry) => (
                    <div
                      key={entry.id}
                      className={clsx(
                        "rounded-xl border p-3 text-xs sm:text-sm leading-relaxed",
                        entry.kind === "victory"
                          ? "bg-green-500/15 text-green-800 border-green-500/30 font-bold"
                          : entry.kind === "attack"
                            ? "bg-poke-light text-poke-navy border-poke-gray"
                            : entry.kind === "warning"
                              ? "bg-amber-500/15 text-amber-800 border-amber-500/30"
                              : entry.kind === "status"
                                ? "bg-rose-500/15 text-rose-800 border-rose-500/30 font-semibold"
                                : entry.kind === "switch"
                                  ? "bg-blue-500/15 text-blue-800 border-blue-500/30 font-semibold"
                                  : "bg-white text-poke-navy border-poke-gray"
                      )}
                    >
                      {entry.text}
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-black/10 flex justify-end">
                  <button onClick={() => setShowLogModal(false)} className="btn-poke py-2 px-6 text-xs">
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ─── VICTORY / DEFEAT SCREEN ───────────────────────────── */}
        {battleFinished && (
          <section className="poke-card p-6 sm:p-10 text-center bg-gradient-to-br from-white via-white to-poke-light border-4 border-black shadow-[8px_8px_0px_#000]">
            <div
              className={clsx(
                "mx-auto w-20 h-20 rounded-3xl border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_#000] mb-5",
                didWin ? "bg-emerald-500 text-white" : "bg-poke-red text-white"
              )}
            >
              {didWin ? <Check className="w-10 h-10 stroke-[3]" /> : <X className="w-10 h-10 stroke-[3]" />}
            </div>
            <h3 className="text-3xl sm:text-4xl font-display font-black text-poke-navy">
              {didWin ? "VICTORY!" : "DEFEAT"}
            </h3>
            <p className="text-base text-poke-navy/70 mt-2 max-w-xl mx-auto">
              {didWin
                ? "Congratulations! You knocked out all of the opponent's Pokémon and emerged as the Champion!"
                : "All of your Pokémon were knocked out. Head back to the Pokémon Center to revive your team!"}
            </p>
            {isTournamentRoom && (
              <button
                onClick={() => router.push("/battle")}
                className="mt-6 btn-primary py-3 px-6 text-sm inline-flex items-center gap-2"
              >
                {didWin ? "Claim Reward & Continue" : "Claim Consolation Reward & Retry"}
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
