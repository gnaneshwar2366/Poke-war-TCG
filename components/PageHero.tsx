"use client";

import { motion } from "framer-motion";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: string;
}

export default function PageHero({
  title,
  subtitle,
  icon,
  gradient = "from-poke-navy via-[#1b53ba] to-poke-navy",
}: PageHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative bg-gradient-to-r ${gradient} -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-16 pb-20 mb-8 overflow-hidden`}
      style={{ clipPath: "polygon(0 0, 100% 0, 100% 88%, 0 100%)" }}
    >
      <div className="absolute inset-0 opacity-15 mix-blend-overlay bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
      <div className="absolute right-[-40px] top-[-40px] w-80 h-80 rounded-full border-8 border-poke-yellow/20 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto flex items-center gap-5">
        {icon && (
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-2xl bg-poke-yellow border-3 border-black flex items-center justify-center shadow-[4px_4px_0px_#000] shrink-0"
          >
            {icon}
          </motion.div>
        )}
        <div className="space-y-1">
          <h1 className="text-4xl sm:text-5xl font-display font-black text-white uppercase tracking-widest" style={{ WebkitTextStroke: "2px #000", textShadow: "3px 3px 0px #000" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-poke-yellow font-display font-bold tracking-wide uppercase text-xs sm:text-sm" style={{ textShadow: "1px 1px 0px #000" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-4 inset-x-0 h-2 bg-poke-yellow border-y border-black -skew-y-1 pointer-events-none" />
      <div className="absolute bottom-2 inset-x-0 h-1.5 bg-poke-red border-y border-black -skew-y-1 pointer-events-none" />
    </motion.div>
  );
}
