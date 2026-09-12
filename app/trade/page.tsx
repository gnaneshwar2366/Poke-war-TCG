"use client";

import { useState } from "react";
import TradingRoom from "@/components/TradingRoom";
import PageHero from "@/components/PageHero";
import { ArrowLeftRight, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function TradePage() {
  const { username: authUser } = useAuth();
  const [roomId, setRoomId] = useState("lobby-1");
  const [partner, setPartner] = useState("rival");
  const [joined, setJoined] = useState(false);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (roomId.trim() && authUser) setJoined(true);
  }

  if (!joined) {
    return (
      <div>
        <PageHero
          title="Trading Room"
          subtitle="Join a room to trade cards in real-time with another trainer."
          icon={<ArrowLeftRight className="w-7 h-7 text-poke-navy" />}
          gradient="from-poke-red to-poke-navy"
        />

        <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10 pb-12">
          <form onSubmit={handleJoin} className="poke-card p-6 space-y-5">
            <div>
              <label className="text-[10px] uppercase font-bold text-poke-navy/45 mb-1.5 block">Room ID</label>
              <input
                type="text"
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="input-poke text-sm py-2.5"
                placeholder="e.g. lobby-1"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-poke-navy/45 mb-1.5 block">Trading As</label>
              <input
                type="text"
                readOnly
                value={authUser || ""}
                className="input-poke text-sm py-2.5 bg-poke-light"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-poke-navy/45 mb-1.5 block">Partner Username</label>
              <input
                type="text"
                required
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                className="input-poke text-sm py-2.5"
                placeholder="rival"
              />
            </div>
            <button type="submit" className="btn-poke w-full py-3 mt-2" disabled={!authUser}>
              Enter Trading Room
            </button>
            <div className="p-3.5 rounded-xl bg-poke-light border border-poke-gray flex items-start gap-2.5 text-xs text-poke-navy/60">
              <HelpCircle className="w-4 h-4 text-poke-blue shrink-0 mt-0.5" />
              <span>Open a second browser tab with a different user in the same room to test P2P trading.</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHero
        title="Live Trading"
        subtitle={`Room: ${roomId} — Trading as ${authUser}`}
        icon={<ArrowLeftRight className="w-7 h-7 text-poke-navy" />}
        gradient="from-poke-red to-poke-navy"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex justify-end mb-6 -mt-4">
          <button className="btn-poke-outline text-sm py-2 px-5" onClick={() => setJoined(false)}>
            Leave Room
          </button>
        </div>
        {authUser && (
          <TradingRoom roomId={roomId} username={authUser} partnerUsername={partner} />
        )}
      </div>
    </div>
  );
}
