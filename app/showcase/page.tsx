"use client";

import { useEffect, useState } from "react";
import Card3D from "@/components/Card3D";
import PageHero from "@/components/PageHero";
import { StaggerGrid, StaggerItem } from "@/components/AnimatedSection";
import { fetchUser, formatPrice } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Leaderboard from "@/components/Leaderboard";
import type { User, Card } from "@/types";
import { Sparkles, TrendingUp, Coins, Search, SlidersHorizontal } from "lucide-react";
import CardDetailModal from "@/components/CardDetailModal";

export default function ShowcasePage() {
  const { username } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadUser = () => {
    if (!username) return;
    fetchUser(username)
      .then(setUser)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    loadUser();
    const handleCoinsUpdated = () => loadUser();
    window.addEventListener("coins-updated", handleCoinsUpdated);
    return () => window.removeEventListener("coins-updated", handleCoinsUpdated);
  }, [username]);

  const totalValue =
    user?.inventory.reduce((sum, inv) => sum + (inv.card?.marketPrice || 0), 0) || 0;

  const uniqueTypes = Array.from(
    new Set(user?.inventory.map((inv) => inv.card?.types?.[0]).filter(Boolean) as string[])
  );

  const filteredInventory =
    user?.inventory.filter((inv) => {
      if (!inv.card) return false;
      const matchesSearch = inv.card.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = selectedType === "" || inv.card.types.includes(selectedType);
      return matchesSearch && matchesType;
    }) || [];

  const handleUpdateUser = (newCoins: number, newInventory: User["inventory"]) => {
    if (user) setUser({ ...user, coins: newCoins, inventory: newInventory });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-2 border-poke-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-poke-red mb-4 font-semibold">{error}</p>
        <p className="text-poke-navy/50 text-sm">Run <code className="text-poke-blue">npm run dev</code> to start the server.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHero
        title="My Collection"
        subtitle="Manage, showcase, and evaluate your collected Pokémon cards."
        icon={<Sparkles className="w-7 h-7 text-poke-navy" />}
        gradient="from-poke-blue to-poke-navy"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 -mt-6 relative z-10">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                label: "Cards Owned",
                value: user?.inventory.length || 0,
                detail: `${uniqueTypes.length} type${uniqueTypes.length === 1 ? "" : "s"} represented`,
                icon: null,
                color: "text-poke-navy",
              },
              {
                label: "Collection Value",
                value: formatPrice(totalValue),
                detail: `${formatPrice(user?.inventory.length ? totalValue / user.inventory.length : 0)} average card value`,
                icon: TrendingUp,
                color: "text-poke-blue",
              },
              {
                label: "Coins Balance",
                value: user?.coins?.toLocaleString() || 0,
                detail: `${Math.floor((user?.coins || 0) / 50)} basic pack${Math.floor((user?.coins || 0) / 50) === 1 ? "" : "s"} available`,
                icon: Coins,
                color: "text-poke-navy",
              },
            ].map((stat) => (
              <div key={stat.label} className="poke-card self-start p-6 hover:-translate-y-1">
                <p className="text-poke-navy/50 text-xs uppercase font-bold tracking-wider flex items-center gap-1.5">
                  {stat.icon && <stat.icon className="w-3.5 h-3.5 text-poke-blue" />}
                  {stat.label}
                </p>
                <p className={`text-3xl font-black mt-2 ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] font-semibold text-poke-navy/45 mt-3 pt-3 border-t border-poke-gray">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>
          <Leaderboard />
        </div>

        {/* Search */}
        <div className="poke-card p-4 mb-8 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-poke-navy/30" />
            <input
              type="text"
              placeholder="Search your collection..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-poke pl-11 text-sm py-2"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-poke-outline py-2 px-4 text-sm flex items-center gap-2 ${showFilters ? "bg-poke-blue/5" : ""}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          {showFilters && (
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-poke text-sm py-2 w-44"
            >
              <option value="">All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
        </div>

        {/* Grid */}
        {filteredInventory.length === 0 ? (
          <div className="text-center py-20 poke-card p-8">
            <p className="text-poke-navy/50 italic">
              {user?.inventory.length === 0
                ? "Your collection is empty. Open booster packs or buy from the market!"
                : "No cards match your search."}
            </p>
          </div>
        ) : (
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center pb-8">
            {filteredInventory.map((inv, i) =>
              inv.card ? (
                <StaggerItem key={`${inv.card._id}-${i}`}>
                  <div
                    onClick={() => { setSelectedCard(inv.card); setIsDetailOpen(true); }}
                    className="cursor-pointer"
                  >
                    <Card3D card={inv.card} size="sm" />
                  </div>
                </StaggerItem>
              ) : null
            )}
          </StaggerGrid>
        )}
      </div>

      <CardDetailModal
        card={selectedCard}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedCard(null); }}
        isOwned={true}
        onUpdateUser={handleUpdateUser}
      />
    </div>
  );
}
