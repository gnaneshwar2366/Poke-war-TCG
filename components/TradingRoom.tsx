"use client";

import { useEffect, useState } from "react";
import Card3D from "./Card3D";
import type { Card, User, RoomState } from "@/types";
import { fetchUser, formatPrice } from "@/lib/api";
import {
  joinRoom,
  addToOffer,
  removeFromOffer,
  lockTrade,
  unlockTrade,
  acceptTrade,
  leaveRoom,
  disconnectSocket,
} from "@/lib/socket";
import { Lock, Unlock, Check, X, Users, ArrowLeftRight, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import clsx from "clsx";

interface TradingRoomProps {
  roomId: string;
  username?: string;
  partnerUsername?: string;
}

export default function TradingRoom({
  roomId,
  username,
  partnerUsername = "rival",
}: TradingRoomProps) {
  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const myParticipant = room?.users.find((u) => u.username === username);
  const theirParticipant = room?.users.find((u) => u.username !== username);
  const myOffer = myParticipant?.offer || [];
  const theirOffer = theirParticipant?.offer || [];
  const myLocked = myParticipant?.locked || false;
  const myAccepted = myParticipant?.accepted || false;
  const theirLocked = theirParticipant?.locked || false;
  const theirAccepted = theirParticipant?.accepted || false;
  const bothLocked = room?.users.length === 2 && room.users.every((u) => u.locked);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    fetchUser(username)
      .then(setUser)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    joinRoom(roomId, username, {
      onUpdate: setRoom,
      onComplete: (data) => {
        setMessage(data.message);
        fetchUser(username).then(setUser);
      },
      onError: (data) => setError(data.message),
    });

    return () => {
      leaveRoom();
      disconnectSocket();
    };
  }, [roomId, username]);

  function handleDragStart(e: React.DragEvent, card: Card) {
    e.dataTransfer.setData("application/json", JSON.stringify(card));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDropOnOffer(e: React.DragEvent) {
    e.preventDefault();
    if (myLocked) return;
    try {
      const card = JSON.parse(e.dataTransfer.getData("application/json")) as Card;
      const inOffer = myOffer.some((c) => c._id === card._id);
      const inInventory = user?.inventory.some((inv) => inv.card._id === card._id);
      if (!inOffer && inInventory) {
        addToOffer(card);
      }
    } catch {
      /* ignore invalid drop */
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  const offeredIds = new Set(myOffer.map((c) => c._id));
  const inventoryCards =
    user?.inventory
      .map((inv) => inv.card)
      .filter((c) => c && !offeredIds.has(c._id)) || [];

  // Trade Value Calculations
  const myOfferValue = myOffer.reduce((sum, c) => sum + (c.marketPrice || 0), 0);
  const theirOfferValue = theirOffer.reduce((sum, c) => sum + (c.marketPrice || 0), 0);
  const netValueChange = theirOfferValue - myOfferValue;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-poke-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Session status banner */}
      <div className="poke-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Users className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Active Room: {roomId}</p>
            <p className="text-xs text-white/45">
              {room?.users.length || 0} / 2 Traders Connected
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/50">Session Status:</span>
          {room?.status === "completed" ? (
            <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Trade Complete
            </span>
          ) : bothLocked ? (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <Lock className="w-3.5 h-3.5" /> Awaiting Confirmation
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5" /> Negotiating
            </span>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl border border-green-500/30 bg-green-500/10 text-green-300 text-center font-semibold text-sm flex items-center justify-center gap-2 animate-bounce">
          <Check className="w-5 h-5" />
          {message}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-center font-semibold text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>{error}</span>
          </div>
          <button className="underline hover:text-white" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Direct Trade values comparison */}
      {room?.users.length === 2 && (
        <div className="grid grid-cols-3 gap-4 text-center glass p-4 border border-white/5 bg-white/[0.02] text-sm">
          <div>
            <span className="text-xs text-white/40 block mb-1">Your Offer Value</span>
            <span className="font-bold text-white text-base">{formatPrice(myOfferValue)}</span>
          </div>
          <div className="border-x border-white/10 flex flex-col items-center justify-center">
            <span className="text-xs text-white/40 block mb-1">Net Gain/Loss</span>
            <span
              className={clsx(
                "font-black text-base flex items-center gap-1",
                netValueChange > 0
                  ? "text-green-400"
                  : netValueChange < 0
                    ? "text-red-400"
                    : "text-white/50"
              )}
            >
              {netValueChange > 0 ? "+" : ""}
              {formatPrice(netValueChange)}
            </span>
          </div>
          <div>
            <span className="text-xs text-white/40 block mb-1">Their Offer Value</span>
            <span className="font-bold text-white text-base">{formatPrice(theirOfferValue)}</span>
          </div>
        </div>
      )}

      {/* Split trading window */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Offer Area */}
        <div className="glass p-6 space-y-4 poke-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-indigo-300 tracking-tight">Your Offer</h2>
              <p className="text-xs text-white/40">Trainer: {username}</p>
            </div>
            <div className="flex items-center gap-2">
              {myAccepted && (
                <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Accepted
                </span>
              )}
              {myLocked && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
          </div>

          <div
            className={clsx(
              "min-h-[220px] rounded-2xl border-2 border-dashed p-4 flex flex-wrap gap-4 transition-colors relative",
              myLocked ? "border-amber-500/30 bg-amber-500/5" : "border-indigo-500/20 bg-indigo-500/[0.02]"
            )}
            onDrop={handleDropOnOffer}
            onDragOver={handleDragOver}
          >
            {myOffer.length === 0 ? (
              <p className="text-white/30 text-xs m-auto text-center max-w-[200px] leading-relaxed select-none">
                Drag cards here from your inventory below to build your offer.
              </p>
            ) : (
              myOffer.map((card) => (
                <div key={card._id} className="relative group/card">
                  <Card3D card={card} size="sm" showDetails={false} />
                  {!myLocked && (
                    <button
                      className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg transition-colors z-10"
                      onClick={() => removeFromOffer(card._id)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {!myLocked ? (
              <button
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold shadow-lg"
                onClick={lockTrade}
                disabled={myOffer.length === 0}
              >
                <Lock className="w-4 h-4" /> Lock Offer
              </button>
            ) : !myAccepted ? (
              <>
                <button
                  className="btn-secondary py-3 flex-1 flex items-center justify-center gap-2 text-sm font-bold"
                  onClick={unlockTrade}
                >
                  <Unlock className="w-4 h-4" /> Unlock
                </button>
                <button
                  className="btn-primary py-3 flex-[2] flex items-center justify-center gap-2 text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-green-500/20"
                  onClick={acceptTrade}
                  disabled={!theirLocked}
                >
                  <Check className="w-4 h-4" /> Accept Trade
                </button>
              </>
            ) : (
              <div className="w-full text-center py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4 animate-bounce" /> Offer Locked & Accepted. Waiting for partner...
              </div>
            )}
          </div>
        </div>

        {/* Partner Offer Area */}
        <div className="glass p-6 space-y-4 poke-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-purple-300 tracking-tight">
                {theirParticipant?.username || partnerUsername}&apos;s Offer
              </h2>
              <p className="text-xs text-white/40">Trainer ID: {theirParticipant?.socketId ? "Connected" : "Offline"}</p>
            </div>
            <div className="flex items-center gap-2">
              {theirAccepted && (
                <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Accepted
                </span>
              )}
              {theirLocked && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
          </div>

          <div
            className={clsx(
              "min-h-[220px] rounded-2xl border-2 border-dashed p-4 flex flex-wrap gap-4 transition-colors",
              theirLocked ? "border-amber-500/30 bg-amber-500/5" : "border-purple-500/20 bg-purple-500/[0.02]"
            )}
          >
            {theirOffer.length === 0 ? (
              <p className="text-white/30 text-xs m-auto text-center max-w-[200px] leading-relaxed select-none">
                Waiting for partner to drag and drop cards.
              </p>
            ) : (
              theirOffer.map((card) => (
                <Card3D key={card._id} card={card} size="sm" showDetails={false} />
              ))
            )}
          </div>

          {bothLocked && !myAccepted && (
            <div className="text-center py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold animate-pulse">
              Both offers are locked. Please review and click Accept when ready.
            </div>
          )}
        </div>
      </div>

      {/* Inventory Deck */}
      <div className="glass p-6 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-400" /> Your Inventory Deck
          </h2>
          <span className="text-xs text-white/40 font-semibold select-none">
            Drag cards from here into your Offer box above
          </span>
        </div>

        <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
          {inventoryCards.length === 0 ? (
            <div className="py-12 w-full text-center text-white/30 text-sm italic select-none">
              No tradable cards left in your inventory.
            </div>
          ) : (
            inventoryCards.map((card) => (
              <div
                key={card._id}
                draggable={!myLocked}
                onDragStart={(e) => handleDragStart(e, card)}
                className={clsx(
                  "transform transition-all duration-200",
                  myLocked
                    ? "opacity-50 cursor-not-allowed scale-95"
                    : "hover:scale-105 cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-indigo-500/10"
                )}
              >
                <Card3D card={card} size="sm" showDetails={true} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
