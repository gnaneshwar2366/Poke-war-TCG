"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface FeatureTileProps {
  title: string;
  description: string;
  href: string;
  cta?: string;
  gradient: string;
  icon: React.ReactNode;
  delay?: number;
}

export default function FeatureTile({
  title,
  description,
  href,
  cta = "Learn More",
  gradient,
  icon,
  delay = 0,
}: FeatureTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      <div className={`bg-gradient-to-br ${gradient} p-8 sm:p-10 min-h-[280px] flex flex-col justify-between relative`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 rounded-full border-8 border-white" />
          <div className="absolute right-[40px] bottom-[40px] w-20 h-20 rounded-full bg-white/30" />
        </div>

        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-black text-white mb-3 leading-tight">
            {title}
          </h3>
          <p className="text-white/75 text-sm leading-relaxed max-w-sm">
            {description}
          </p>
        </div>

        <Link
          href={href}
          className="relative z-10 inline-flex items-center gap-2 mt-6 bg-white text-poke-navy font-bold px-5 py-2.5 rounded-full text-sm w-fit group-hover:gap-3 transition-all duration-300 hover:shadow-lg"
        >
          {cta}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>
    </motion.div>
  );
}
