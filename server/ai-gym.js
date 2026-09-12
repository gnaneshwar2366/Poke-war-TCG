const { Card } = require("./db");
const { enrichCard } = require("../scripts/card-meta");
const { cardMatchesCoreType, CORE_TYPES, toCoreType } = require("./type-chart");
const { getDamageBreakdown } = require("./battle-rules");

const AI_USERNAME = "ai_leader";
const AI_DISPLAY = "Gym Leader AI";

const GYM_STAGES = [
  { id: 1, name: "Pewter Gym", type: "Rock", leader: "Brock" },
  { id: 2, name: "Cerulean Gym", type: "Water", leader: "Misty" },
  { id: 3, name: "Vermilion Gym", type: "Electric", leader: "Lt. Surge" },
  { id: 4, name: "Celadon Gym", type: "Grass", leader: "Erika" },
  { id: 5, name: "Fuchsia Gym", type: "Poison", leader: "Koga" },
  { id: 6, name: "Saffron Gym", type: "Psychic", leader: "Sabrina" },
  { id: 7, name: "Cinnabar Gym", type: "Fire", leader: "Blaine" },
  { id: 8, name: "Viridian Gym", type: "Ground", leader: "Giovanni" },
  { id: 9, name: "Elite Four", type: "Dragon", leader: "Lance" },
  { id: 10, name: "Champion Cup", type: "Fairy", leader: "Champion" },
];

function defaultTournament() {
  return {
    currentStage: 1,
    highestStageCleared: 0,
    winsInARow: 0,
    lastPlayedAt: null,
    claimedStageRewards: [],
    pendingTournamentReward: null,
    pendingRewardTier: null,
  };
}

function getRewardTier(winsInARow) {
  if (winsInARow >= 4) return "rare";
  if (winsInARow === 3) return "epic";
  if (winsInARow === 2) return "mid";
  return "low";
}

function getStage(stageNumber) {
  const n = Math.max(1, Number(stageNumber) || 1);
  if (n <= GYM_STAGES.length) return { ...GYM_STAGES[n - 1], id: n, difficulty: getDifficulty(n) };
  const loop = GYM_STAGES[(n - 1) % GYM_STAGES.length];
  return { ...loop, id: n, name: `${loop.name} Rank ${n}`, difficulty: getDifficulty(n) };
}

function getDifficulty(stageNumber) {
  if (stageNumber <= 1) return "low";
  if (stageNumber === 2) return "mid";
  if (stageNumber === 3) return "high";
  if (stageNumber <= 6) return "hard";
  return "extreme";
}

function isPremium(card) {
  return /\b(ex|VMAX|VSTAR|\bV\b|Secret|Ultra|Hyper|Illustration|Double Rare)/i.test(`${card.rarity || ""} ${card.name || ""}`);
}

function isMidTier(card) {
  if (isPremium(card)) return false;
  const hp = card.hp || 0;
  return hp >= 70 && hp <= 160 && /^(Common|Uncommon|Rare)$/i.test(card.rarity || "");
}

function isLowMid(card) {
  if (isPremium(card)) return false;
  return /^(Common|Uncommon|Rare)$/i.test(card.rarity || "");
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function pickUnique(pool, count, excludeIds = new Set()) {
  const picked = [];
  for (const card of shuffle(pool)) {
    const id = card._id.toString();
    if (excludeIds.has(id)) continue;
    picked.push(card);
    excludeIds.add(id);
    if (picked.length >= count) break;
  }
  return picked;
}

function cardsOfType(all, type) {
  return all.filter((card) => cardMatchesCoreType(enrichCard(card), type));
}

async function loadCards() {
  const all = await Card.find().lean();
  return all;
}

function stageTeamFilter(all, stage) {
  const themed = cardsOfType(all, stage.type);
  const low = themed.filter((c) => !isPremium(c) && (c.hp || 0) <= 120);
  const mid = themed.filter((c) => isMidTier(c) && (c.hp || 0) >= 80);
  const high = themed.filter((c) => !isPremium(c) && (c.hp || 0) >= 100);
  const hard = themed.filter((c) => isPremium(c) || (c.hp || 0) >= 130);
  const extreme = themed.filter((c) => isPremium(c) && (c.hp || 0) >= 180);
  const pools = { low, mid, high, hard, extreme };
  const preferred = pools[stage.difficulty] || extreme;
  if (preferred.length >= 6) return preferred;
  const fallbackOrder = {
    low: [mid, high, hard, extreme],
    mid: [low, high, hard, extreme],
    high: [mid, hard, extreme, low],
    hard: [high, extreme, mid, low],
    extreme: [hard, high, mid, low],
  }[stage.difficulty] || [hard, high, mid, low];
  const expanded = [preferred, ...fallbackOrder, themed, all].flat();
  const unique = [];
  const seen = new Set();
  for (const card of expanded) {
    const id = card._id.toString();
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(card);
  }
  return unique;
}

async function pickAiTeam(stageNumber = 1) {
  const all = await loadCards();
  const stage = getStage(stageNumber);
  const pool = stageTeamFilter(all, stage);
  const picks = pickUnique(pool, 6);
  while (picks.length < 6 && all.length) {
    const extra = all[Math.floor(Math.random() * all.length)];
    if (!picks.some((c) => c._id.toString() === extra._id.toString())) picks.push(extra);
    if (picks.length >= 200) break;
  }
  return picks.map((card) => ({ id: `ai-${card._id}`, card: enrichCard(card) }));
}

function pickAiMove(aiPlayer, humanPlayer) {
  const attacker = aiPlayer.team[aiPlayer.activeIndex];
  const defender = humanPlayer.team[humanPlayer.activeIndex];
  if (!attacker || attacker.isFainted) return { type: "skip" };
  const attacks = attacker.card.attacks || [];
  let best = { type: "skip", score: -1 };
  attacks.forEach((move, moveIndex) => {
    if ((attacker.moveCooldowns?.[moveIndex] || 0) > 0) return;
    const breakdown = getDamageBreakdown(attacker.card, defender?.card || {}, move, 1);
    const score = breakdown.damage + (breakdown.multiplier > 1 ? 30 : 0) + (breakdown.multiplier === 0 ? -50 : 0);
    if (score > best.score) best = { type: "attack", cardIndex: aiPlayer.activeIndex, moveIndex, score };
  });
  if (best.type === "skip") {
    const ready = attacks.findIndex((_, i) => (attacker.moveCooldowns?.[i] || 0) === 0);
    if (ready >= 0) return { type: "attack", cardIndex: aiPlayer.activeIndex, moveIndex: ready };
  }
  return best.type === "skip" ? { type: "skip" } : { type: "attack", cardIndex: best.cardIndex, moveIndex: best.moveIndex };
}

function pickAiSwitch(aiPlayer, humanPlayer) {
  const defender = humanPlayer?.team?.[humanPlayer.activeIndex];
  let bestIndex = -1;
  let bestScore = -Infinity;
  aiPlayer.team.forEach((pokemon, index) => {
    if (!pokemon || pokemon.isFainted || pokemon.currentHp <= 0 || index === aiPlayer.activeIndex) return;
    const moves = pokemon.card.attacks || [];
    const bestMove = moves.reduce((best, move, moveIndex) => {
      if ((pokemon.moveCooldowns?.[moveIndex] || 0) > 0) return best;
      const breakdown = defender?.card
        ? getDamageBreakdown(pokemon.card, defender.card, move, 1)
        : { damage: 0, multiplier: 1 };
      const score = breakdown.damage + (breakdown.multiplier > 1 ? 100 : 0) + (breakdown.multiplier === 0 ? -100 : 0);
      return score > best.score ? { score } : best;
    }, { score: -Infinity });
    const score = (bestMove.score === -Infinity
      ? Math.min(pokemon.currentHp, 100)
      : bestMove.score + Math.min(pokemon.currentHp, 100) * 0.1);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function parseAiRoom(roomId) {
  const tournament = /^AI-T(\d+)-/i.exec(roomId || "");
  if (tournament) return { isAi: true, mode: "tournament", stage: Number(tournament[1]) };
  if (/^AI-/i.test(roomId || "")) return { isAi: true, mode: "practice", stage: 1 };
  return { isAi: false, mode: "pvp", stage: null };
}

async function pickRewardCards(user, stageNumber, tier = "low") {
  const all = await loadCards();
  const owned = new Set((user.inventory || []).map((entry) => entry.card?.toString?.() || entry.card));
  const stage = getStage(stageNumber);
    let pool = tier === "low"
      ? all.filter(isLowMid)
      : tier === "mid"
        ? all.filter((c) => isMidTier(c) || /^(Rare|Uncommon)$/i.test(c.rarity || ""))
        : tier === "epic"
          ? all.filter((c) => isPremium(c) && /Rare Holo|Double Rare|Ultra Rare/i.test(c.rarity || ""))
          : all.filter((c) => isPremium(c));
    if (stage.id >= 7) pool = pool.filter((c) => (c.hp || 0) >= 100);
    if (stage.id >= 10) pool = pool.filter((c) => (c.hp || 0) >= 110);
    if (pool.length < 6) pool = all.filter((c) => isLowMid(c) || isPremium(c));
  const themed = cardsOfType(pool, stage.type);
  const mixed = [...pickUnique(themed, 3, owned), ...pickUnique(pool, 6, owned)];
  const unique = [];
  const seen = new Set();
  for (const card of mixed) {
    const id = card._id.toString();
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(card);
    if (unique.length >= 6) break;
  }
  while (unique.length < 6) {
    const extra = all[Math.floor(Math.random() * all.length)];
    if (!extra) break;
    const id = extra._id.toString();
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(extra);
  }
  return unique.slice(0, 6);
}

function getStarterOptions(allCards, coreType) {
  const type = toCoreType(coreType);
  const typed = allCards.filter((c) => cardMatchesCoreType(enrichCard(c), type));
  const mid = typed.filter(isMidTier);
  const lowMid = typed.filter(isLowMid);
  const pool = [...mid, ...lowMid.filter((card) => !mid.some((starter) => starter._id.toString() === card._id.toString()))];
  return shuffle(pool).slice(0, 12).map((card) => enrichCard(card));
}

function drawLowMid(allCards, excludeIds, count) {
  const pool = allCards.filter((c) => isLowMid(c) && !excludeIds.has(c._id.toString()));
  return pickUnique(pool, count, excludeIds).map((card) => enrichCard(card));
}

module.exports = {
  AI_USERNAME,
  AI_DISPLAY,
  CORE_TYPES,
  GYM_STAGES,
  defaultTournament,
  getRewardTier,
  getStage,
  isPremium,
  isMidTier,
  isLowMid,
  pickAiTeam,
  pickAiMove,
  pickAiSwitch,
  parseAiRoom,
  pickRewardCards,
  getStarterOptions,
  drawLowMid,
  getStageList(currentStage, highestCleared) {
    const maxShown = Math.max(10, currentStage + 1);
    return Array.from({ length: maxShown }, (_, i) => {
      const stage = getStage(i + 1);
      const status = i + 1 < currentStage ? "cleared" : i + 1 === currentStage ? "current" : "locked";
      return { ...stage, status, cleared: i + 1 <= highestCleared };
    });
  },
};
