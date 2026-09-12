import Link from "next/link";

const footerLinks = [
  { label: "Showcase", href: "/showcase" },
  { label: "Market", href: "/market" },
  { label: "Booster Packs", href: "/booster" },
  { label: "Trading Room", href: "/trade" },
  { label: "Battle", href: "/battle" },
];

export default function Footer() {
  return (
    <footer className="bg-poke-navy text-white mt-auto">
      <div className="h-1 pokeball-stripe" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-poke-yellow flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-poke-navy" />
              </div>
              <span className="font-display font-black text-lg">
                Poke<span className="text-poke-yellow">Card</span>
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              Collect, showcase, and trade Pokémon cards. Inspired by the official{" "}
              <a
                href="https://tcg.pokemon.com/en-gb/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-poke-yellow hover:underline"
              >
                Pokémon TCG
              </a>{" "}
              experience.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-poke-yellow mb-4">
              Explore
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-poke-yellow mb-4">
              New to Pokémon TCG?
            </h4>
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              Want to get started? Open booster packs, build your collection, and trade with fellow trainers.
            </p>
            <Link href="/booster" className="btn-poke-yellow text-xs py-2 px-5">
              Get Started
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-white/40">
          <span>©2026 PokeCard Platform</span>
          <span>Pokémon and Pokémon character names are trademarks of Nintendo.</span>
        </div>
      </div>
    </footer>
  );
}
