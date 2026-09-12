const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/pokecard";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
}

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

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    displayName: String,
    avatar: String,
    coins: { type: Number, default: 1000 },
    inventory: [
      {
        card: { type: mongoose.Schema.Types.ObjectId, ref: "Card" },
        acquiredAt: { type: Date, default: Date.now },
      },
    ],
    pendingPackCards: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Card" }
    ],
    aiTournament: {
      currentStage: { type: Number, default: 1 },
      highestStageCleared: { type: Number, default: 0 },
      winsInARow: { type: Number, default: 0 },
      lastPlayedAt: Date,
      claimedStageRewards: { type: [Number], default: [] },
      pendingTournamentReward: {
        stage: Number,
        cardIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Card" }],
        consolation: { type: Boolean, default: false },
        expiresAt: Date,
      },
      pendingRewardTier: String,
    },
  },
  { timestamps: true }
);

const tradeSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "locked", "completed", "cancelled"],
      default: "pending",
    },
    participants: [
      {
        userId: String,
        username: String,
        offer: [{ type: mongoose.Schema.Types.ObjectId, ref: "Card" }],
        locked: { type: Boolean, default: false },
        accepted: { type: Boolean, default: false },
      },
    ],
    completedAt: Date,
  },
  { timestamps: true }
);

const Card = mongoose.models.Card || mongoose.model("Card", cardSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Trade = mongoose.models.Trade || mongoose.model("Trade", tradeSchema);

module.exports = { connectDB, Card, User, Trade, mongoose };
