"use client";

import Link from "next/link";
import { Sparkles, Store, Package, ArrowLeftRight, BookOpen, Swords } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import MorphingCard from "@/components/MorphingCard";
import FeatureTile from "@/components/FeatureTile";
import AnimatedSection from "@/components/AnimatedSection";
import Leaderboard from "@/components/Leaderboard";

export default function HomePage() {
  return (
    <div>
      {/* Hero carousel — "What's New!" like official site */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <HeroCarousel />
      </section>

      {/* Dynamic Card Morphing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedSection>
          <MorphingCard />
        </AnimatedSection>
      </section>

      {/* Feature sections — TCG Live / Pocket style blocks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <AnimatedSection>
          <h2 className="section-title mb-2">Explore the Platform</h2>
          <p className="section-subtitle mb-10 max-w-2xl">
            Everything you need to collect, battle, and trade — built for Pokémon trainers.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FeatureTile
            title="My Collection"
            description="Showcase your cards with premium full-art templates, 3D tilt effects, and holographic overlays on rare pulls."
            href="/showcase"
            cta="View Collection"
            gradient="from-poke-blue to-blue-800"
            icon={<Sparkles className="w-6 h-6 text-white" />}
            delay={0}
          />
          <FeatureTile
            title="Global Market"
            description="Browse 280+ unique Pokémon cards. Filter by type, rarity, and price. Buy cards to grow your deck."
            href="/market"
            cta="Browse Market"
            gradient="from-poke-navy to-indigo-900"
            icon={<Store className="w-6 h-6 text-white" />}
            delay={0.1}
          />
          <FeatureTile
            title="Booster Pack Opening"
            description="Choose Basic (50 coins) or Premium (200 coins) packs. Better odds for rare V, ex, and full-art pulls in Premium."
            href="/booster"
            cta="Open Packs"
            gradient="from-purple-700 to-poke-navy"
            icon={<Package className="w-6 h-6 text-white" />}
            delay={0.2}
          />
          <FeatureTile
            title="Live Trading Room"
            description="Trade cards in real-time with other trainers. Drag-and-drop offers, lock trades, and execute swaps instantly."
            href="/trade"
            cta="Start Trading"
            gradient="from-poke-red to-red-900"
            icon={<ArrowLeftRight className="w-6 h-6 text-white" />}
            delay={0.3}
          />
          <FeatureTile
            title="Battle Arena"
            description="Create a private room, lock six Pokemon from your collection, and battle turn-by-turn with live HP updates."
            href="/battle"
            cta="Enter Battle"
            gradient="from-poke-navy via-[#243c7c] to-slate-950"
            icon={<Swords className="w-6 h-6 text-white" />}
            delay={0.4}
          />
        </div>
      </section>

      {/* Leaderboard */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto">
          <Leaderboard />
        </div>
      </section>

      {/* New to Pokémon TCG section */}
      <section className="bg-poke-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-poke-yellow flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-poke-navy" />
                </div>
                <h2 className="section-title">New to the Pokémon TCG?</h2>
              </div>
              <p className="section-subtitle mb-6">
                Want to get started collecting Pokémon cards? Open booster packs to build your
                collection, browse the market for rare finds, and trade with fellow trainers online.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/booster" className="btn-poke">
                  Open Your First Pack
                </Link>
                <Link href="/market" className="btn-poke-outline">
                  Browse Cards
                </Link>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4 w-full max-w-md">
              {["Collect", "Trade", "Battle"].map((step, i) => (
                <div
                  key={step}
                  className="poke-card p-5 text-center hover:-translate-y-2 transition-transform duration-300"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-10 h-10 rounded-full bg-poke-blue text-white font-black text-lg flex items-center justify-center mx-auto mb-3">
                    {i + 1}
                  </div>
                  <p className="font-bold text-sm text-poke-navy">{step}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-poke-yellow via-yellow-300 to-poke-yellow p-10 sm:p-14 text-center">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-poke-blue" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-poke-red" />
            </div>
            <h2 className="relative text-2xl sm:text-3xl font-display font-black text-poke-navy mb-4">
              Start Your Collection Today
            </h2>
            <p className="relative text-poke-navy/70 mb-8 max-w-lg mx-auto">
              280+ unique Pokémon cards waiting to be discovered. Open packs, trade with friends, and become a master collector.
            </p>
            <Link href="/login" className="relative btn-poke text-base px-10">
              Choose Your Trainer
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
