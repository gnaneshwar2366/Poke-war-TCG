"use client";

import { useEffect, useState, useCallback } from "react";
import Card3D from "@/components/Card3D";
import PageHero from "@/components/PageHero";
import { StaggerGrid, StaggerItem } from "@/components/AnimatedSection";
import { fetchCards, fetchFilterMeta } from "@/lib/api";
import type { Card, FilterMeta } from "@/types";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Store } from "lucide-react";
import CardDetailModal from "@/components/CardDetailModal";

export default function MarketPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [meta, setMeta] = useState<FilterMeta>({ types: [], rarities: [] });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [rarity, setRarity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString(), limit: "24", sort, order };
      if (search) params.search = search;
      if (type) params.type = type;
      if (rarity) params.rarity = rarity;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const data = await fetchCards(params);
      setCards(data.cards);
      setTotal(data.total);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, type, rarity, minPrice, maxPrice, sort, order]);

  useEffect(() => { fetchFilterMeta().then(setMeta).catch(() => {}); }, []);
  useEffect(() => { loadCards(); }, [loadCards]);

  const totalPages = Math.ceil(total / 24);

  return (
    <div>
      <PageHero
        title="Global Market"
        subtitle={`Browse and purchase ${total.toLocaleString()} cards from trainers worldwide.`}
        icon={<Store className="w-7 h-7 text-poke-navy" />}
        gradient="from-emerald-600 to-poke-navy"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="poke-card p-4 mb-8 space-y-4 -mt-6 relative z-10">
          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); loadCards(); }}
            className="flex flex-wrap sm:flex-nowrap gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-poke-navy/30" />
              <input
                type="text"
                placeholder="Search cards by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-poke pl-11 text-sm py-2"
              />
            </div>
            <button type="submit" className="btn-poke py-2 px-6 text-sm">Search</button>
            <button
              type="button"
              className="btn-poke-outline py-2 px-4 text-sm flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </form>

          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-poke-gray">
              {[
                { label: "Type", el: (
                  <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="input-poke text-xs py-2">
                    <option value="">All Types</option>
                    {meta.types.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                )},
                { label: "Rarity", el: (
                  <select value={rarity} onChange={(e) => { setRarity(e.target.value); setPage(1); }} className="input-poke text-xs py-2">
                    <option value="">All Rarities</option>
                    {meta.rarities.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                )},
                { label: "Min $", el: <input type="number" placeholder="Min" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} className="input-poke text-xs py-2" /> },
                { label: "Max $", el: <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} className="input-poke text-xs py-2" /> },
                { label: "Sort", el: (
                  <select value={`${sort}-${order}`} onChange={(e) => { const [s, o] = e.target.value.split("-"); setSort(s); setOrder(o); setPage(1); }} className="input-poke text-xs py-2">
                    <option value="name-asc">Name A→Z</option>
                    <option value="name-desc">Name Z→A</option>
                    <option value="price-asc">Price Low→High</option>
                    <option value="price-desc">Price High→Low</option>
                  </select>
                )},
                { label: "", el: (
                  <button type="button" onClick={() => { setSearch(""); setType(""); setRarity(""); setMinPrice(""); setMaxPrice(""); setPage(1); }} className="btn-poke-outline w-full py-2 text-xs">
                    Clear All
                  </button>
                )},
              ].map(({ label, el }) => (
                <div key={label || "clear"} className="space-y-1">
                  {label && <label className="text-[10px] uppercase font-bold text-poke-navy/45 block">{label}</label>}
                  {el}
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-poke-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 poke-card p-8 text-poke-navy/50">No cards match your filters</div>
        ) : (
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 justify-items-center pb-8">
            {cards.map((card) => (
              <StaggerItem key={card._id}>
                <div onClick={() => { setSelectedCard(card); setIsDetailOpen(true); }} className="cursor-pointer">
                  <Card3D card={card} size="sm" />
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8 pb-8">
            <button className="btn-poke-outline p-2.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-poke-navy/50">Page {page} of {totalPages}</span>
            <button className="btn-poke-outline p-2.5" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <CardDetailModal
        card={selectedCard}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedCard(null); }}
        isOwned={false}
      />
    </div>
  );
}
