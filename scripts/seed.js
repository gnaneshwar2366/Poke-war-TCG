require("dotenv").config();
const mongoose = require("mongoose");
const TCGdex = require("@tcgdex/sdk").default;

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/pokecard";

// Schema needs to match server/db.js exactly
const cardSchema = new mongoose.Schema(
  {
    externalId: { type: String, unique: true },
    name: { type: String, required: true, index: true },
    hp: { type: Number, default: null },
    types: [{ type: String }],
    rarity: { type: String, index: true },
    imageUrl: { type: String, required: true },
    imageUrlLarge: { type: String },
    setName: String,
    number: String,
    marketPrice: { type: Number, required: true, index: true },
    artist: String,
    baseName: String,
    suffix: String,
    stage: String,
    artworkUrl: String,
    dexNumber: Number,
    weakness: String,
    resistance: String,
    retreatCost: Number,
    attacks: [
      {
        name: String,
        cost: [String],
        damage: Number,
        text: String,
      },
    ],
    ruleText: String,
    isFullArt: Boolean,
    setTotal: String,
  },
  { timestamps: true }
);

const Card = mongoose.models.Card || mongoose.model("Card", cardSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  displayName: String,
  coins: { type: Number, default: 1000 },
  inventory: [{ card: mongoose.Schema.Types.ObjectId }],
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

const DEFAULT_USERS = [
  { username: "trainer", displayName: "Trainer Red", count: 15, coins: 1200 },
  { username: "ash", displayName: "Ash Ketchum", count: 12, coins: 900 },
  { username: "misty", displayName: "Misty", count: 10, coins: 800 },
  { username: "brock", displayName: "Brock", count: 10, coins: 750 },
  { username: "rival", displayName: "Rival Blue", count: 14, coins: 1100 },
  { username: "gary", displayName: "Gary Oak", count: 13, coins: 1000 },
];

async function seedDefaultUsers(allCardIds) {
  const existing = await User.countDocuments();
  if (existing > 0) {
    console.log(`✓ Keeping ${existing} existing user(s).`);
    return;
  }

  for (const u of DEFAULT_USERS) {
    const shuffled = [...allCardIds].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, u.count);
    await User.create({
      username: u.username,
      displayName: u.displayName,
      coins: u.coins,
      inventory: picks.map((id) => ({ card: id })),
    });
  }
  console.log(`✓ Seeded ${DEFAULT_USERS.length} default trainers for leaderboard.`);
}

const RARITY_PRICE_RANGES = {
  common: [0.1, 2],
  uncommon: [1, 5],
  rare: [5, 25],
  "rare holo": [10, 50],
  "holo rare": [10, 50],
  "holo rare v": [15, 80],
  "rare holo v": [15, 80],
  "holo rare vmax": [25, 120],
  "rare holo vmax": [25, 120],
  "holo rare vstar": [20, 100],
  "rare holo vstar": [20, 100],
  "ultra rare": [30, 150],
  "rare ultra": [30, 150],
  "secret rare": [50, 300],
  "rare secret": [50, 300],
  "rare rainbow": [40, 200],
  "rare shiny": [35, 180],
  "shiny rare": [35, 180],
  "amazing rare": [20, 90],
  "double rare": [15, 75],
  "illustration rare": [25, 150],
  "special illustration rare": [50, 350],
  "hyper rare": [60, 400],
  promo: [2, 30],
};

function simulateMarketPrice(rarity) {
  const norm = (rarity || "Common").toLowerCase();
  const range = RARITY_PRICE_RANGES[norm] || [1, 15];
  const [min, max] = range;
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function mapCard(card) {
  const isFullArt = !!(
    card.rarity?.toLowerCase().includes("ultra") ||
    card.rarity?.toLowerCase().includes("secret") ||
    card.rarity?.toLowerCase().includes("illustration") ||
    card.rarity?.toLowerCase().includes("hyper") ||
    card.rarity?.toLowerCase().includes("full art")
  );

  return {
    externalId: card.id,
    name: card.name,
    hp: card.hp || null,
    types: card.types || [],
    rarity: card.rarity || "Common",
    imageUrl: card.image ? `${card.image}/low.png` : "",
    imageUrlLarge: card.image ? `${card.image}/high.png` : "",
    setName: card.set?.name || "",
    number: card.localId || "",
    marketPrice: simulateMarketPrice(card.rarity),
    artist: card.illustrator || "",
    baseName: card.name ? card.name.replace(/\s+(ex|V|VMAX|VSTAR)$/i, "") : "",
    suffix: card.suffix || "",
    stage: card.stage || "",
    artworkUrl: card.image ? `${card.image}/high.png` : "",
    dexNumber: card.dexId && card.dexId.length > 0 ? card.dexId[0] : null,
    weakness: card.weaknesses && card.weaknesses.length > 0 ? card.weaknesses[0].type : "",
    resistance: card.resistances && card.resistances.length > 0 ? card.resistances[0].type : "",
    retreatCost: typeof card.retreat === 'number' ? card.retreat : null,
    attacks: (card.attacks || []).map(atk => ({
      name: atk.name || "",
      cost: atk.cost || [],
      damage: typeof atk.damage === 'number' ? atk.damage : parseInt(atk.damage, 10) || null,
      text: atk.effect || ""
    })),
    ruleText: card.effect || "",
    isFullArt: isFullArt,
    setTotal: card.set?.cardCount?.official ? card.set.cardCount.official.toString() : ""
  };
}

async function fetchInBatches(tcgdex, ids, batchSize = 15) {
  const results = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    console.log(`Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ids.length / batchSize)} (${batch.length} cards)...`);
    const batchResults = await Promise.all(
      batch.map(id => tcgdex.card.get(id).catch(err => {
        console.error(`Error fetching card ${id}:`, err.message);
        return null;
      }))
    );
    results.push(...batchResults.filter(Boolean));
  }
  return results;
}

async function fetchWithRetry(fetcher, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetcher();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        const delay = attempt * 1000;
        console.warn(`TCGdex request failed (attempt ${attempt}/${attempts}); retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  console.log("Initializing TCGdex SDK...");
  const tcgdex = new TCGdex("en");

  const popularSets = ["base1", "base2", "swsh1", "swsh3", "sv01", "sv02"];
  const candidateIds = [];

  console.log("Gathering candidate card IDs from popular sets...");
  for (const setId of popularSets) {
    try {
      const setInfo = await fetchWithRetry(() => tcgdex.set.get(setId));
      if (setInfo && setInfo.cards) {
        const validCards = setInfo.cards.filter(c => c.image);
        candidateIds.push(...validCards.map(c => c.id));
      }
    } catch (err) {
      console.warn(`Warning: Failed to fetch set ${setId}:`, err.message);
    }
  }

  console.log(`Found ${candidateIds.length} candidate cards.`);
  const seededCards = [];
  const batchSize = 25;
  let offset = 0;

  console.log(`Fetching the complete Pokémon card dataset (${candidateIds.length} cards)...`);
  while (offset < candidateIds.length) {
    const nextBatchIds = candidateIds.slice(offset, offset + batchSize);
    offset += batchSize;

    const detailedBatch = await fetchInBatches(tcgdex, nextBatchIds, 15);
    for (const card of detailedBatch) {
      if (card.category === "Pokemon" && card.image) {
        if (!seededCards.some(c => c.externalId === card.id)) {
          seededCards.push(mapCard(card));
        }
      }
    }
    console.log(`Status: Loaded ${seededCards.length} Pokémon cards...`);
  }

  if (seededCards.length === 0) {
    console.error("No cards fetched. Check your network connection.");
    process.exit(1);
  }

  console.log(`Updating ${seededCards.length} authoritative TCGdex cards without changing confirmed IDs...`);
  await Card.bulkWrite(
    seededCards.map((card) => ({
      updateOne: {
        filter: { externalId: card.externalId },
        update: { $set: card },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  const validExternalIds = seededCards.map((card) => card.externalId);
  const validCards = await Card.find({ externalId: { $in: validExternalIds } }, { _id: 1 }).lean();
  const validCardIds = validCards.map((card) => card._id);
  await User.updateMany({}, { $pull: { inventory: { card: { $nin: validCardIds } } } });
  await Card.deleteMany({ externalId: { $nin: validExternalIds } });

  const count = await Card.countDocuments();
  console.log(`\n✓ Seeded ${count} cards into MongoDB.`);
  
  console.log("Seeding default trainers...");
  const allCardIds = (await Card.find({}, { _id: 1 }).lean()).map((c) => c._id);
  await seedDefaultUsers(allCardIds);

  console.log(`\n✓ Seeding finished successfully.`);
  console.log(`  Database: ${MONGODB_URI}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
