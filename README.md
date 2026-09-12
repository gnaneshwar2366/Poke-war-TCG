# PokeCard — Premium Pokémon Card Platform

Collect, showcase, and trade Pokémon cards with a gamified UI, booster pack openings, and real-time P2P trading.

## Folder Structure

```
pokecard/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout + navbar
│   ├── page.tsx                  # Redirects to /showcase
│   ├── globals.css               # Tailwind + glassmorphism + holo CSS
│   ├── showcase/page.tsx         # Dashboard — masonry card grid
│   ├── market/page.tsx           # Global market with filters
│   ├── booster/page.tsx          # Booster pack opening
│   └── trade/page.tsx            # Live trading room lobby
├── components/
│   ├── Navbar.tsx                # Glass navigation bar
│   ├── Card3D.tsx                # 3D tilt hover + holographic rare cards
│   ├── HolographicOverlay.tsx    # Rainbow holo CSS overlay
│   ├── BoosterPack.tsx           # Framer Motion pack shake/tear/reveal
│   └── TradingRoom.tsx           # Split-screen drag-and-drop trading UI
├── lib/
│   ├── api.ts                    # REST API client helpers
│   └── socket.ts                 # Socket.io client for trading
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
├── server/
│   ├── index.js                  # Express API + HTTP server
│   ├── db.js                     # Mongoose models (Card, User, Trade)
│   └── socket/
│       └── trading.js            # Socket.io P2P trade logic + MongoDB txn
├── scripts/
│   └── seed.js                   # Fetches 120+ cards from pokemontcg.io
├── package.json
├── tailwind.config.ts
├── next.config.js
└── .env.example
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a cloud URI)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Seed the database (requires network + MongoDB)
npm run seed

# 4. Start dev servers (Next.js :3000 + API/Socket :4000)
npm run dev
```

## Pages

| Route       | Description                                      |
|-------------|--------------------------------------------------|
| `/showcase` | Your collection with 3D card hover + holo rares  |
| `/market`   | Browse all cards with search, filter, sort       |
| `/booster`  | Animated booster pack opening (5 cards)          |
| `/trade`    | Real-time P2P trading room via WebSockets        |

## Trading Flow

1. Two users join the same room ID with different usernames
2. Drag cards from inventory into "My Offer"
3. Both click **Lock Trade**
4. Both click **Accept Trade** → MongoDB transaction swaps cards

## Seeder

The seeder (`scripts/seed.js`) automatically:
- Fetches 120+ popular cards from [pokemontcg.io](https://pokemontcg.io)
- Extracts name, HP, types, rarity, high-res image URLs
- Simulates market prices based on rarity tiers
- Inserts into MongoDB `cards` collection

## Tech Stack

- **Frontend:** Next.js 15, Tailwind CSS, Framer Motion
- **Backend:** Express, Socket.io, Mongoose
- **Database:** MongoDB
