"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Store, Package, ArrowLeftRight, Coins, Plus, Menu, X, LogOut, User, Swords } from "lucide-react";
import clsx from "clsx";
import { fetchUser } from "@/lib/api";
import { useAuth, PRESET_USERS } from "@/lib/auth";
import CheckoutModal from "./CheckoutModal";

const links = [
  { href: "/showcase", label: "Showcase" },
  { href: "/market", label: "Market" },
  { href: "/booster", label: "Booster" },
  { href: "/trade", label: "Trade" },
  { href: "/battle", label: "Battle" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { username, logout } = useAuth();
  const [coins, setCoins] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const displayLabel =
    PRESET_USERS.find((u) => u.id === username)?.label || username;

  useEffect(() => {
    if (!username) return;
    fetchUser(username)
      .then((d) => setCoins(d.coins))
      .catch(() => setCoins(0));
    const onCoins = (e: Event) => {
      const ev = e as CustomEvent<number>;
      if (ev.detail !== undefined) setCoins(ev.detail);
    };
    window.addEventListener("coins-updated", onCoins);
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("coins-updated", onCoins);
      window.removeEventListener("scroll", onScroll);
    };
  }, [username]);

  const showNav = pathname !== "/login";

  if (!showNav) return null;

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={clsx(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-poke-navy border-b-3 border-black text-white shadow-lg"
        )}
      >
        <div className="h-1.5 bg-poke-red w-full" />
        <div className="h-1 bg-poke-yellow w-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 rounded-full bg-poke-red border-2 border-black group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full bg-poke-red border-t-2 border-x-2 border-black" />
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-black" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-black text-sm text-white tracking-tight uppercase">Pokémon</span>
                <span className="font-display font-black text-[10px] text-poke-yellow tracking-widest uppercase">PokeCard</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {links.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={clsx(
                      "relative px-4 py-2 text-xs font-black tracking-widest uppercase transition-colors duration-200",
                      active ? "text-poke-yellow" : "text-white/80 hover:text-white"
                    )}
                  >
                    {label}
                    {active && (
                      <motion.div
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-poke-yellow rounded-full"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              {username ? (
                <>
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border-2 border-black text-xs font-bold text-poke-navy shadow-[2px_2px_0px_#000]">
                    <User className="w-3.5 h-3.5 text-poke-blue" />
                    {displayLabel}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.25 rounded-full bg-poke-yellow border-2 border-black text-poke-navy shadow-[2px_2px_0px_#000]">
                    <Coins className="w-4 h-4 text-poke-navy shrink-0" />
                    <span className="font-black text-xs sm:text-sm tracking-wide">{coins.toLocaleString()}</span>
                    <button
                      onClick={() => setIsCheckoutOpen(true)}
                      className="p-0.5 rounded-full bg-poke-navy text-white hover:bg-black transition-colors duration-200"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <Link
                    href="/login"
                    onClick={logout}
                    className="hidden md:flex p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-poke-red transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary py-2 px-5 text-xs font-black tracking-widest uppercase shadow-[3px_3px_0px_#000] bg-poke-red hover:bg-poke-yellow hover:text-poke-navy border-2 border-black flex items-center gap-1.5 transition-all text-white"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  Join Game
                </Link>
              )}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{ height: mobileOpen ? "auto" : 0, opacity: mobileOpen ? 1 : 0 }}
          className="md:hidden overflow-hidden border-t border-black bg-poke-navy"
        >
          <div className="px-4 py-3 space-y-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "block px-4 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-colors",
                  pathname === href ? "bg-white/10 text-poke-yellow" : "text-white/80 hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            ))}
            {username && (
              <Link
                href="/login"
                onClick={() => { logout(); setMobileOpen(false); }}
                className="block px-4 py-3 rounded-xl font-bold text-sm text-poke-red/90 hover:bg-white/5"
              >
                Switch User
              </Link>
            )}
          </div>
        </motion.div>
      </motion.header>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-poke-gray shadow-card py-2">
        <div className="flex justify-around">
          {[
            { href: "/showcase", icon: Sparkles, label: "Showcase" },
            { href: "/market", icon: Store, label: "Market" },
            { href: "/booster", icon: Package, label: "Booster" },
            { href: "/trade", icon: ArrowLeftRight, label: "Trade" },
            { href: "/battle", icon: Swords, label: "Battle" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all duration-200",
                pathname === href ? "text-poke-blue scale-105" : "text-poke-navy/40"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {username && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          type="buy_coins"
          coinsAmount={1000}
          priceUsd={9.99}
          username={username}
          onSuccess={(c) => setCoins(c)}
        />
      )}
    </>
  );
}
