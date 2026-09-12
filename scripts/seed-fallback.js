/**
 * Seeds 280+ unique Pokémon from the curated card catalog (real TCG hires images).
 * Preserves existing users across dev restarts; seeds default trainers on first run.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { buildCatalog } = require("./card-catalog");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/pokecard";

const cardSchema = new mongoose.Schema(
  {
    externalId: { type: String, unique: true, required: true },
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
    attacks: [{ name: String, cost: [String], damage: Number, text: String }],
    ruleText: String,
    isFullArt: Boolean,
    setTotal: String,
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  displayName: String,
  coins: { type: Number, default: 1000 },
  inventory: [{ card: mongoose.Schema.Types.ObjectId }],
});

const Card = mongoose.models.Card || mongoose.model("Card", cardSchema);
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

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const cards = buildCatalog();

  console.log(`Built catalog with ${cards.length} unique Pokémon cards.`);

  await Card.bulkWrite(
    cards.map((card) => ({
      updateOne: {
        filter: { externalId: card.externalId },
        update: { $set: card },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  const count = await Card.countDocuments();
  const names = new Set(cards.map((c) => c.name.replace(/\s+(ex|V|VMAX|VSTAR)$/i, "")));
  console.log(`✓ Seeded ${count} cards (${names.size} unique species).`);

  const allCardIds = (await Card.find({}, { _id: 1 }).lean()).map((c) => c._id);
  await seedDefaultUsers(allCardIds);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
