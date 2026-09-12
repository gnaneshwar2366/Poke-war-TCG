"use client";

import BoosterPack from "@/components/BoosterPack";
import PageHero from "@/components/PageHero";
import AnimatedSection from "@/components/AnimatedSection";
import { Package } from "lucide-react";

export default function BoosterPage() {
  return (
    <div>
      <PageHero
        title="Booster Pack"
        subtitle="Crack open a pack and discover 5 new cards for your collection."
        icon={<Package className="w-7 h-7 text-poke-navy" />}
        gradient="from-purple-600 to-poke-navy"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 pb-12">
        <AnimatedSection>
          <div className="poke-card p-8 sm:p-12">
            <BoosterPack />
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
