import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "PokeCard — Pokémon Trading Card Game",
  description: "Collect, showcase, trade, and battle Pokémon cards — inspired by the official Pokémon TCG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body flex flex-col min-h-screen">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-poke-yellow focus:text-poke-navy focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main-content" className="flex-1 pt-16 pb-20 md:pb-12">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
