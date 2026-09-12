const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const { connectDB, Card, User } = require("./db");
const { setupTradingSocket } = require("./socket/trading");
const { setupBattleSocket } = require("./socket/battle");
const { enrichCard } = require("../scripts/card-meta");
const {
  CORE_TYPES, getStarterOptions, drawLowMid, isMidTier, isLowMid, defaultTournament, getStageList, getStage,
} = require("./ai-gym");
const { cardMatchesCoreType, toCoreType } = require("./type-chart");

function withMeta(card) {
  const o = card?.toObject ? card.toObject() : { ...card };
  if (!o.attacks?.length) return enrichCard(o);
  return enrichCard(o);
}

const PACK_CONFIG = {
  basic: { cost: 50, slots: 3 },
  premium: { cost: 200, slots: 3 },
};

const DISPLAY_NAMES = {
  trainer: "Trainer Red",
  ash: "Ash Ketchum",
  misty: "Misty",
  brock: "Brock",
  rival: "Rival Blue",
  gary: "Gary Oak",
};

function pickCardPool(allCards, packType, roll) {
  const isUltra = (c) =>
    /Ultra|Secret|Rainbow|Hyper|Illustration|Special|Double Rare/i.test(c.rarity) ||
    /\b(VMAX|VSTAR|V|ex)\b/i.test(c.name);
  const isRareHolo = (c) => /Rare Holo/i.test(c.rarity);
  const isRare = (c) => /Rare/i.test(c.rarity) && !isUltra(c);
  const isUncommon = (c) => /Uncommon/i.test(c.rarity);
  const isCommon = (c) => /Common/i.test(c.rarity);

  if (packType === "premium") {
    if (roll < 0.15) return allCards.filter(isUltra);
    if (roll < 0.5) return allCards.filter(isRareHolo);
    if (roll < 0.85) return allCards.filter(isUncommon);
    return allCards.filter(isCommon);
  }

  // basic pack — mostly commons/uncommons
  if (roll < 0.05) return allCards.filter(isRareHolo);
  if (roll < 0.2) return allCards.filter(isRare);
  return allCards.filter((c) => isCommon(c) || isUncommon(c));
}

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3002",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3002" }));
app.use(express.json());

// ─── Cards API ───────────────────────────────────────────────
app.get("/api/cards", async (req, res) => {
  try {
    const {
      search,
      type,
      rarity,
      minPrice,
      maxPrice,
      sort = "name",
      order = "asc",
      page = 1,
      limit = 24,
    } = req.query;

    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (type) {
      filter.types = type;
    }
    if (rarity) {
      filter.rarity = rarity;
    }
    if (minPrice || maxPrice) {
      filter.marketPrice = {};
      if (minPrice) filter.marketPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.marketPrice.$lte = parseFloat(maxPrice);
    }

    const sortField = sort === "price" ? "marketPrice" : sort;
    const sortOrder = order === "desc" ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [cards, total] = await Promise.all([
      Card.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Card.countDocuments(filter),
    ]);

    res.json({
      cards: cards.map(withMeta),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cards/:id", async (req, res) => {
  try {
    const card = await Card.findById(req.params.id).lean();
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(withMeta(card));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cards/meta/filters", async (_req, res) => {
  try {
    const [types, rarities] = await Promise.all([
      Card.distinct("types"),
      Card.distinct("rarity"),
    ]);
    res.json({ types: types.filter(Boolean), rarities: rarities.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── User / Inventory API ────────────────────────────────────
app.get("/api/users/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate("inventory.card")
      .populate("pendingPackCards")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "Player profile not found. Please sign up." });
    }

    user.inventory = user.inventory.map((inv) => ({
      ...inv,
      card: inv.card ? withMeta(inv.card) : inv.card,
    }));

    user.pendingPackCards = (user.pendingPackCards || []).map((c) => c ? withMeta(c) : c).filter(Boolean);

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// A local session can survive a database reset. Create a playable starter profile
// when the battle screen encounters one of those stale session names.
app.post("/api/users/:username/bootstrap", async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!username) return res.status(400).json({ error: "Invalid username format" });

    let user = await User.findOne({ username }).populate("inventory.card").lean();
    if (!user) {
      const cards = await Card.find().lean();
      if (cards.length < 6) return res.status(500).json({ error: "At least six cards must be seeded before starting a battle." });
      const fireCards = cards.filter((card) => card.types?.includes("Fire"));
      const pool = [...fireCards, ...cards.filter((card) => !fireCards.some((fire) => fire._id.toString() === card._id.toString()))];
      const inventory = pool.slice(0, 8).map((card) => ({ card: card._id }));
      const created = await User.create({ username, displayName: req.params.username.trim(), coins: 500, inventory });
      user = await User.findById(created._id).populate("inventory.card").lean();
    }

    user.inventory = (user.inventory || []).map((entry) => ({ ...entry, card: entry.card ? withMeta(entry.card) : entry.card }));
    res.json(user);
  } catch (err) {
    // Concurrent bootstrap calls can race on the unique username. Return the
    // profile created by the other request instead of surfacing a false failure.
    const username = req.params.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const user = username && await User.findOne({ username }).populate("inventory.card").lean();
    if (user) {
      user.inventory = (user.inventory || []).map((entry) => ({ ...entry, card: entry.card ? withMeta(entry.card) : entry.card }));
      return res.json(user);
    }
    res.status(500).json({ error: err.message });
  }
});

function serializeInventoryUser(user) {
  return {
    ...user,
    inventory: (user.inventory || []).map((inv) => ({
      ...inv,
      card: inv.card ? withMeta(inv.card) : inv.card,
    })),
    pendingPackCards: (user.pendingPackCards || []).map((c) => (c ? withMeta(c) : c)).filter(Boolean),
  };
}

function tournamentPayload(userDoc) {
  const t = { ...defaultTournament(), ...(userDoc.aiTournament || {}) };
  return {
    ...t,
    stages: getStageList(t.currentStage || 1, t.highestStageCleared || 0),
  };
}

app.get("/api/starter-options", async (req, res) => {
  try {
    const type = toCoreType(req.query.type || "Fire");
    const allCards = await Card.find().lean();
    res.json({ type, types: CORE_TYPES, cards: getStarterOptions(allCards, type) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/types", (_req, res) => {
  res.json({ types: CORE_TYPES });
});

app.post("/api/users/signup", async (req, res) => {
  try {
    const { username, starterDeck = "fire", starterType, selectedCardIds } = req.body;
    if (!username) return res.status(400).json({ error: "Trainer username is required" });

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanUsername) return res.status(400).json({ error: "Invalid username format" });

    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const allCards = await Card.find().lean();
    if (allCards.length === 0) {
      return res.status(500).json({ error: "No cards in database. Seed cards first." });
    }

    const typeAlias = { grass: "Grass", fire: "Fire", water: "Water" };
    const targetType = toCoreType(starterType || typeAlias[starterDeck] || starterDeck || "Fire");
    const ids = Array.isArray(selectedCardIds) ? [...new Set(selectedCardIds.map(String))] : [];

    let chosen = [];
    if (ids.length) {
      if (ids.length !== 2) return res.status(400).json({ error: "Select exactly 2 mid-tier cards of your type." });
      chosen = allCards.filter((c) => ids.includes(c._id.toString()));
      if (chosen.length !== 2) return res.status(400).json({ error: "Those starter cards were not found." });
      const invalid = chosen.filter((c) => (
        !cardMatchesCoreType(enrichCard(c), targetType) || (!isMidTier(c) && !isLowMid(c))
      ));
      if (invalid.length) return res.status(400).json({ error: "Both picks must be starter cards of the chosen type." });
    } else {
      chosen = getStarterOptions(allCards, targetType).slice(0, 2);
    }

    if (chosen.length !== 2) return res.status(400).json({ error: "This type does not have two starter cards available yet." });

    const exclude = new Set(chosen.map((c) => c._id.toString()));
    const bonus = drawLowMid(allCards, exclude, 5);
    if (bonus.length !== 5) return res.status(500).json({ error: "Not enough low/mid cards are available to complete this starter pack." });
    const starterPool = [...chosen, ...bonus];

    const user = await User.create({
      username: cleanUsername,
      displayName: username,
      coins: 500,
      inventory: starterPool.slice(0, 7).map((c) => ({ card: c._id })),
      aiTournament: defaultTournament(),
    });

    const populatedUser = await User.findById(user._id)
      .populate("inventory.card")
      .populate("pendingPackCards")
      .lean();

    res.json(serializeInventoryUser(populatedUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/tournament/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) return res.status(404).json({ error: "Player profile not found" });
    const payload = tournamentPayload(user);
    let pendingRewardCards = [];
    const ids = payload.pendingTournamentReward?.cardIds || [];
    if (ids.length) {
      const cards = await Card.find({ _id: { $in: ids } }).lean();
      pendingRewardCards = cards.map((c) => withMeta(c));
    }
    res.json({ ...payload, pendingRewardCards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tournament/:username/start", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "Player profile not found" });
    const t = { ...defaultTournament(), ...(user.aiTournament?.toObject?.() || user.aiTournament || {}) };
    if (t.pendingTournamentReward?.cardIds?.length) {
      return res.status(400).json({ error: "Claim your gym reward before the next stage." });
    }
    const stage = t.currentStage || 1;
    const gym = getStage(stage);
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    res.json({ roomId: `AI-T${stage}-${code}`, stage, gym });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tournament/:username/claim-reward", async (req, res) => {
  try {
    const { cardId } = req.body || {};
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "Player profile not found" });
    const pending = user.aiTournament?.pendingTournamentReward;
    const allowed = (pending?.cardIds || []).map((id) => id.toString());
    if (!pending || !allowed.length) return res.status(400).json({ error: "No gym reward waiting." });
    if (!cardId || !allowed.includes(String(cardId))) return res.status(400).json({ error: "Pick one of the 6 reward cards." });
    user.inventory.push({ card: cardId });
    const claimed = user.aiTournament.claimedStageRewards || [];
    if (!pending.consolation && !claimed.includes(pending.stage)) claimed.push(pending.stage);
    user.aiTournament.claimedStageRewards = claimed;
    user.aiTournament.pendingTournamentReward = undefined;
    user.aiTournament.pendingRewardTier = null;
    await user.save();
    const populated = await User.findById(user._id).populate("inventory.card").populate("pendingPackCards").lean();
    res.json({ success: true, user: serializeInventoryUser(populated), tournament: tournamentPayload(populated) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/:username/open-pack", async (req, res) => {
  try {
    const packType = req.body?.packType === "premium" ? "premium" : "basic";
    const config = PACK_CONFIG[packType];

    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // If user already has a pending pack, return that instead of rolling a new one
    if (user.pendingPackCards && user.pendingPackCards.length > 0) {
      const populatedCards = await Card.find({ _id: { $in: user.pendingPackCards } }).lean();
      return res.json({
        cards: populatedCards.map(withMeta),
        coins: user.coins,
        packType,
        resumed: true,
      });
    }

    if (user.coins < config.cost) {
      return res.status(400).json({ error: `Not enough coins (need ${config.cost})` });
    }

    const allCards = await Card.find().lean();
    const pulled = [];
    const pendingIds = [];
    for (let i = 0; i < config.slots; i++) {
      const roll = Math.random();
      let pool = pickCardPool(allCards, packType, roll);
      if (pool.length === 0) pool = allCards;
      const card = pool[Math.floor(Math.random() * pool.length)];
      pulled.push(card);
      pendingIds.push(card._id);
    }

    user.coins -= config.cost;
    user.pendingPackCards = pendingIds;
    await user.save();

    res.json({ cards: pulled.map(withMeta), coins: user.coins, packType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/:username/claim-pack-card", async (req, res) => {
  try {
    const { cardId } = req.body;
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.pendingPackCards || user.pendingPackCards.length === 0) {
      return res.status(400).json({ error: "No pending pack cards to claim" });
    }

    const hasCard = user.pendingPackCards.some((id) => id.toString() === cardId);
    if (!hasCard) {
      return res.status(400).json({ error: "Card is not part of the opened pack" });
    }

    // Add to inventory
    user.inventory.push({ card: cardId });
    // Clear pending pack
    user.pendingPackCards = [];
    await user.save();

    res.json({ success: true, coins: user.coins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/leaderboard", async (_req, res) => {
  try {
    const users = await User.find().populate("inventory.card").lean();
    const entries = users
      .map((u) => ({
        username: u.username,
        displayName: u.displayName || DISPLAY_NAMES[u.username] || u.username,
        cardCount: u.inventory.length,
        totalValue: u.inventory.reduce(
          (sum, inv) => sum + (inv.card?.marketPrice || 0),
          0
        ),
      }))
      .sort((a, b) => b.totalValue - a.totalValue || b.cardCount - a.cardCount);

    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/:username/buy-card", async (req, res) => {
  try {
    const { cardId, paymentMethod, cardDetails } = req.body;
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ error: "Card not found" });

    if (paymentMethod === "coins") {
      const price = Math.round(card.marketPrice);
      if (user.coins < price) {
        return res.status(400).json({ error: "Not enough coins" });
      }
      user.coins -= price;
    } else if (paymentMethod === "credit_card") {
      // Simulate credit card verification
      if (!cardDetails || !cardDetails.cardNumber || !cardDetails.expiry || !cardDetails.cvv) {
        return res.status(400).json({ error: "Invalid payment details" });
      }
    } else {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    user.inventory.push({ card: card._id });
    await user.save();

    // Populate inventory and return updated user info
    const updatedUser = await User.findById(user._id).populate("inventory.card").lean();
    
    // Enrich cards with metadata
    updatedUser.inventory = updatedUser.inventory.map((inv) => ({
      ...inv,
      card: inv.card ? withMeta(inv.card) : inv.card,
    }));

    res.json({
      success: true,
      coins: updatedUser.coins,
      inventory: updatedUser.inventory,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/:username/sell-card", async (req, res) => {
  try {
    const { cardId } = req.body;
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Find the item index in inventory
    const itemIndex = user.inventory.findIndex(
      (inv) => inv.card && inv.card.toString() === cardId
    );
    if (itemIndex === -1) {
      return res.status(400).json({ error: "Card not in your inventory" });
    }

    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ error: "Card not found" });

    const payout = Math.round(card.marketPrice * 0.7); // 70% payout
    user.coins += payout;
    user.inventory.splice(itemIndex, 1);
    await user.save();

    const updatedUser = await User.findById(user._id).populate("inventory.card").lean();
    updatedUser.inventory = updatedUser.inventory.map((inv) => ({
      ...inv,
      card: inv.card ? withMeta(inv.card) : inv.card,
    }));

    res.json({
      success: true,
      coins: updatedUser.coins,
      inventory: updatedUser.inventory,
      payout,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users/:username/add-coins", async (req, res) => {
  try {
    const { amount, cardDetails } = req.body;
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid coin amount" });
    }

    // Simulate credit card verification
    if (!cardDetails || !cardDetails.cardNumber || !cardDetails.expiry || !cardDetails.cvv) {
      return res.status(400).json({ error: "Invalid payment details" });
    }

    user.coins += parseInt(amount, 10);
    await user.save();

    res.json({
      success: true,
      coins: user.coins,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Socket.io Trading ───────────────────────────────────────
setupTradingSocket(io);
setupBattleSocket(io);

// ─── Start ───────────────────────────────────────────────────
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`PokeCard server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
