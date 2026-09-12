"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal } from "lucide-react";
import { fetchLeaderboard, formatPrice } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { LeaderboardEntry } from "@/types";

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { username } = useAuth();

  useEffect(() => {
    fetchLeaderboard()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="poke-card p-6 animate-pulse">
        <div className="h-6 bg-poke-gray rounded w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-poke-light rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) return null;

  const medals = [Crown, Medal, Medal];
  const colors = ["text-poke-yellow", "text-gray-400", "text-amber-700"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="poke-card p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <Trophy className="w-5 h-5 text-poke-yellow" />
        <h2 className="font-display font-black text-lg text-poke-navy">Top Collectors</h2>
      </div>

      <div className="space-y-2">
        {entries.slice(0, 6).map((entry, i) => {
          const Icon = medals[i] || Medal;
          const isMe = entry.username === username;
          return (
            <motion.div
              key={entry.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isMe ? "bg-poke-blue/10 border border-poke-blue/20" : "bg-poke-light"
              }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${i < 3 ? colors[i] : "text-poke-navy/30"}`}>
                {i < 3 ? <Icon className="w-5 h-5" /> : <span className="font-bold text-sm">#{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-poke-navy truncate">
                  {entry.displayName || entry.username}
                  {isMe && <span className="text-poke-blue text-xs ml-1">(You)</span>}
                </p>
                <p className="text-[10px] text-poke-navy/45">{entry.cardCount} cards</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-sm text-poke-blue">{formatPrice(entry.totalValue)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
