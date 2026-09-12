"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const slides = [
  {
    id: 1,
    tag: "What's New!",
    title: "Open Booster Packs & Discover Rare Cards",
    desc: "Crack open animated booster packs and pull V, EX, and holographic cards for your collection.",
    cta: "Open Packs",
    href: "/booster",
    gradient: "from-poke-blue via-blue-600 to-poke-navy",
    accent: "#FFCB05",
  },
  {
    id: 2,
    tag: "Collection",
    title: "Showcase Your Pokémon Card Collection",
    desc: "Display 280+ unique cards with premium full-art templates, 3D tilt, and holographic effects.",
    cta: "View Collection",
    href: "/showcase",
    gradient: "from-poke-navy via-indigo-800 to-purple-900",
    accent: "#0075BE",
  },
  {
    id: 3,
    tag: "Trading",
    title: "Trade Cards Live with Other Trainers",
    desc: "Join real-time P2P trading rooms. Drag, drop, lock, and accept trades instantly.",
    cta: "Start Trading",
    href: "/trade",
    gradient: "from-red-700 via-poke-red to-orange-700",
    accent: "#FFCB05",
  },
  {
    id: 4,
    tag: "Market",
    title: "Browse the Global Pokémon Card Market",
    desc: "Search, filter, and sort 280+ cards by type, rarity, and price.",
    cta: "Explore Market",
    href: "/market",
    gradient: "from-emerald-700 via-teal-700 to-poke-navy",
    accent: "#FFCB05",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-poke-lg">
      <div className="relative h-[320px] sm:h-[400px] lg:h-[460px]">
        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={slide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} flex items-center`}
          >
            {/* Decorative pokeball circles */}
            <div className="absolute right-[-60px] top-[-60px] w-[300px] h-[300px] rounded-full bg-white/5 blur-sm" />
            <div className="absolute right-[80px] bottom-[-80px] w-[250px] h-[250px] rounded-full bg-white/5" />
            <div
              className="absolute right-[10%] top-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 rounded-full opacity-20 animate-bounceSoft"
              style={{ background: `radial-gradient(circle, ${slide.accent} 0%, transparent 70%)` }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="inline-block bg-poke-yellow text-poke-navy font-black text-xs sm:text-sm px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider"
              >
                {slide.tag}
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-2xl sm:text-4xl lg:text-5xl font-display font-black text-white leading-tight max-w-2xl mb-4"
              >
                {slide.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-white/80 text-sm sm:text-base max-w-xl mb-8 leading-relaxed"
              >
                {slide.desc}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Link
                  href={slide.href}
                  className="inline-flex items-center gap-2 bg-poke-yellow text-poke-navy font-black px-7 py-3.5 rounded-full text-sm hover:brightness-105 hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  {slide.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/40 transition-all duration-200 flex items-center justify-center"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white hover:bg-white/40 transition-all duration-200 flex items-center justify-center"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-poke-yellow" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
