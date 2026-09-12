const { connectDB, User } = require("../db");
const { enrichCard } = require("../../scripts/card-meta");
const { getBattlePreview, getDamageBreakdown, getEffectivenessLabel, getMoveCooldown } = require("../battle-rules");
const {
  AI_USERNAME, AI_DISPLAY, pickAiTeam, pickAiMove, pickAiSwitch, parseAiRoom,
  defaultTournament, getRewardTier, pickRewardCards, getStage,
} = require("../ai-gym");

const battleRooms = new Map();
const TEAM_SIZE = 6; // Current UI deck size. The resolver supports a larger deck when the builder is expanded.
const TURN_LIMIT = 40;
const now = () => new Date().toISOString();
const uid = (prefix = "evt") => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

function normalizeCard(card) { return enrichCard(card?.toObject ? card.toObject() : { ...card }); }
function difficultyMultiplier(difficulty) {
  return {
    low: 0.9,
    mid: 1,
    high: 1.08,
    hard: 1.18,
    extreme: 1.3,
  }[difficulty] || 1;
}
function buildPokemonState(card, inventoryItemId, difficulty = "mid") {
  const normalized = normalizeCard(card);
  const multiplier = difficultyMultiplier(difficulty);
  const battleCard = difficulty === "mid" ? normalized : {
    ...normalized,
    hp: Math.round((normalized.hp || 70) * multiplier),
    attacks: (normalized.attacks || []).map((attack) => ({
      ...attack,
      damage: typeof attack.damage === "number" ? Math.round(attack.damage * multiplier) : attack.damage,
    })),
  };
  const preview = getBattlePreview(battleCard, battleCard.attacks?.[0]);
  return { card: battleCard, inventoryItemId, currentHp: battleCard.hp || 70, status: null, isFainted: false,
    battlePower: preview.power, battleMoveType: preview.moveType, moveCooldowns: (normalized.attacks || []).map(() => 0) };
}
function emptyPlayer(username, displayName, extra = {}) {
  return { username, displayName: displayName || username, connected: true, lockedTeam: false, ready: false,
    isAi: false, team: [], activeIndex: 0, lastAction: null, pendingAction: null, trophyCount: 0, skippedTurns: 0, needsSwitch: false, ...extra };
}
function addLog(room, kind, text) {
  room.log.push({ id: uid("log"), kind, text, at: now() });
  if (room.log.length > 120) room.log = room.log.slice(-120);
  room.updatedAt = now();
}
function createRoom(roomId, username, displayName) {
  const room = { roomId, ownerUsername: username, status: "waiting", currentTurnUsername: null, winnerUsername: null,
    players: [emptyPlayer(username, displayName)], log: [], turnNumber: 0, updatedAt: now() };
  addLog(room, "system", `Room ${roomId} created by ${displayName || username}.`);
  battleRooms.set(roomId, room); return room;
}
const getRoom = (roomId) => battleRooms.get(roomId) || null;
const getPlayer = (room, username) => room.players.find((player) => player.username === username) || null;
const getOpponent = (room, username) => room.players.find((player) => player.username !== username) || null;
const getActivePokemon = (player) => player.team[player.activeIndex] || null;
function usableIndex(team) { return team.findIndex((pokemon) => pokemon && !pokemon.isFainted && pokemon.currentHp > 0); }
function hasUsablePokemon(player) { return usableIndex(player.team) !== -1; }
function markFainted(pokemon) { pokemon.currentHp = 0; pokemon.isFainted = true; pokemon.status = null; }
function selectReplacement(room, player) {
  const nextIndex = usableIndex(player.team);
  if (nextIndex === -1) return false;
  player.activeIndex = nextIndex;
  addLog(room, "switch", `${player.displayName || player.username} sends out ${player.team[nextIndex].card.name}.`);
  return true;
}
function serializeRoom(room) {
  return { ...room, players: room.players.map((player) => ({ ...player,
    needsSwitch: !!player.needsSwitch,
    pendingAction: player.pendingAction ? { type: player.pendingAction.type } : null,
    team: player.team.map((pokemon) => ({ ...pokemon, moveCooldowns: pokemon.moveCooldowns || [] }))
  })) };
}
function emitRoom(io, room) { io.to(room.roomId).emit("battle-room-update", serializeRoom(room)); }
function emitError(socket, message) { socket.emit("battle-error", { message }); }
function isBattleReady(room) { return room.players.length === 2 && room.players.every((player) => player.lockedTeam && player.team.length === TEAM_SIZE); }

async function ensureAiOpponent(room) {
  const meta = parseAiRoom(room.roomId);
  room.aiMeta = meta;
  if (!meta.isAi || getPlayer(room, AI_USERNAME)) return meta;
  const stage = meta.mode === "tournament" ? meta.stage : 1;
  const gym = getStage(stage);
  const entries = await pickAiTeam(stage);
  const ai = emptyPlayer(AI_USERNAME, meta.mode === "tournament" ? gym.leader : AI_DISPLAY, { isAi: true });
  ai.team = entries.map((entry) => buildPokemonState(entry.card, entry.id, getStage(stage).difficulty));
  ai.lockedTeam = true;
  ai.ready = ai.team.length === TEAM_SIZE;
  ai.activeIndex = 0;
  room.players.push(ai);
  addLog(room, "system", `${ai.displayName} (${gym.name}) takes the field.`);
  if (room.players.length === 2 && room.status === "waiting") room.status = "building";
  return meta;
}

function maybeAiAct(room) {
  const ai = getPlayer(room, AI_USERNAME);
  const human = room.players.find((player) => player.username !== AI_USERNAME);
  if (!ai || !human || room.status !== "battling") return;
  if (ai.needsSwitch) {
    const targetIndex = pickAiSwitch(ai, human);
    if (targetIndex >= 0) handleBattleAction(room, AI_USERNAME, { type: "switch", targetIndex });
    return;
  }
  if (room.players.some((player) => player.needsSwitch) || ai.pendingAction) return;
  if (!human.pendingAction) return;
  handleBattleAction(room, AI_USERNAME, pickAiMove(ai, human));
}

async function settleTournament(room) {
  if (room.tournamentSettled || room.status !== "finished") return;
  const meta = room.aiMeta || parseAiRoom(room.roomId);
  if (meta.mode !== "tournament") return;
  room.tournamentSettled = true;
  const human = room.players.find((player) => player.username !== AI_USERNAME);
  if (!human) return;
  const user = await User.findOne({ username: human.username });
  if (!user) return;
  const t = { ...defaultTournament(), ...(user.aiTournament?.toObject?.() || user.aiTournament || {}) };
  const stage = meta.stage || t.currentStage || 1;
  t.lastPlayedAt = new Date();
  const won = room.winnerUsername === human.username;
  if (won) {
    t.highestStageCleared = Math.max(t.highestStageCleared || 0, stage);
    t.currentStage = Math.max(t.currentStage || 1, stage + 1);
    t.winsInARow = (t.winsInARow || 0) + 1;
    const rewardTier = getRewardTier(t.winsInARow);
    const claimed = t.claimedStageRewards || [];
    if (!t.pendingTournamentReward?.cardIds?.length && !claimed.includes(stage)) {
      const cards = await pickRewardCards(user, stage, rewardTier);
      t.pendingTournamentReward = { stage, cardIds: cards.map((card) => card._id) };
      t.pendingRewardTier = rewardTier;
    }
  } else {
    if (!t.pendingTournamentReward?.cardIds?.length) {
      const cards = await pickRewardCards(user, stage, "low");
      t.pendingTournamentReward = { stage, cardIds: cards.map((card) => card._id), consolation: true };
      t.pendingRewardTier = "low";
    }
    t.winsInARow = 0;
  }
  user.aiTournament = t;
  await user.save();
  addLog(room, "system", won ? `Stage ${stage} cleared! Claim your 6-card reward on the tournament board.` : "The gym stands. Progress is saved — try again anytime.");
}

function startBattle(room) {
  if (room.status === "battling") return;
  room.status = "battling"; room.turnNumber = 1; room.currentTurnUsername = null;
  room.players.forEach((player) => {
    player.ready = true;
    player.pendingAction = null;
    player.trophyCount = 0;
    player.activeIndex = usableIndex(player.team);
    player.needsSwitch = false;
  });
  addLog(room, "system", "The battle begins! Both trainers choose a move, then reveal together.");
}
function tickCooldowns(player) {
  player.team.forEach((pokemon) => {
    pokemon.moveCooldowns = (pokemon.moveCooldowns || []).map((cooldown) => Math.max(0, cooldown - 1));
  });
}
function setMoveCooldown(pokemon, moveIndex) {
  const turns = getMoveCooldown(pokemon.card.attacks?.[moveIndex]);
  if (!turns) return;
  pokemon.moveCooldowns[moveIndex] = turns;
}
function randomVariance() { return 0.9 + Math.random() * 0.2; }
function finishByRemainingCards(room) {
  const living = room.players.filter(hasUsablePokemon);
  if (living.length === 2) return false;
  room.status = "finished";
  room.winnerUsername = living[0]?.username || null;
  addLog(room, "victory", living.length ? `${living[0].displayName || living[0].username} wins the battle!` : "Both teams were knocked out. The battle is a draw.");
  return true;
}
function finishAtTurnLimit(room) {
  if (room.turnNumber <= TURN_LIMIT) return false;
  room.status = "finished";
  const [first, second] = room.players;
  room.winnerUsername = first.trophyCount === second.trophyCount ? null : first.trophyCount > second.trophyCount ? first.username : second.username;
  addLog(room, "victory", room.winnerUsername ? `${getPlayer(room, room.winnerUsername).displayName || room.winnerUsername} wins on trophy count.` : "Turn limit reached: the battle is a draw.");
  return true;
}
function autoSwitchAi(room, player) {
  if (!player?.isAi || !player.needsSwitch) return;
  const opponent = room.players.find((entry) => entry !== player && !entry.isAi);
  const preferredIndex = pickAiSwitch(player, opponent);
  const fallbackIndex = player.team.findIndex((pokemon) => pokemon && !pokemon.isFainted && pokemon.currentHp > 0);
  const targetIndex = preferredIndex >= 0 ? preferredIndex : fallbackIndex;
  if (targetIndex < 0) return;
  player.activeIndex = targetIndex;
  player.needsSwitch = false;
  addLog(room, "switch", `${player.displayName || player.username} sends out ${player.team[targetIndex].card.name}.`);
}
function validateAction(room, player, action) {
  if (!action || !["attack", "skip", "switch"].includes(action.type)) throw new Error("Unknown battle action");
  if (player.pendingAction) throw new Error("Your choice is already locked. Waiting for the opponent.");
  if (action.type === "switch") {
    if (!Number.isInteger(action.targetIndex)) throw new Error("Select a valid Pokémon to switch to.");
    const target = player.team[action.targetIndex];
    if (!target || target.isFainted || target.currentHp <= 0 || action.targetIndex === player.activeIndex) {
      throw new Error("Choose an eligible, ready Pokémon to switch to.");
    }
    return;
  }
  if (action.type !== "attack") return;
  const cardIndex = Number.isInteger(action.cardIndex) ? action.cardIndex : player.activeIndex;
  const pokemon = player.team[cardIndex];
  const move = pokemon?.card.attacks?.[action.moveIndex];
  if (!pokemon || pokemon.isFainted || pokemon.currentHp <= 0 || !move) throw new Error("Choose a ready card and valid move");
  if ((pokemon.moveCooldowns?.[action.moveIndex] || 0) > 0) throw new Error(`${move.name} is on cooldown for ${pokemon.moveCooldowns[action.moveIndex]} more turn(s)`);
}
function lockAction(room, player, action) {
  validateAction(room, player, action);
  player.pendingAction = {
    ...action,
    cardIndex: Number.isInteger(action.cardIndex) ? action.cardIndex : player.activeIndex,
    targetIndex: action.targetIndex,
  };
  player.lastAction = action.type === "attack" ? "Move locked" : action.type === "skip" ? "Pass locked" : "Switch locked";
  addLog(room, "system", `${player.displayName || player.username} locked an action.`);
}
function applySwitch(room, player, action) {
  if (action.type !== "switch") return;
  const target = player.team[action.targetIndex];
  if (!target || target.isFainted || target.currentHp <= 0 || action.targetIndex === player.activeIndex) return;
  player.activeIndex = action.targetIndex;
  addLog(room, "switch", `${player.displayName || player.username} switched to ${target.card.name}.`);
}
function resolveRound(room) {
  const [first, second] = room.players;
  const firstAction = first.pendingAction; const secondAction = second.pendingAction;
  if (!firstAction || !secondAction) return;

  // Previous cooldowns expire after each completed simultaneous round; newly-used moves are set afterwards.
  room.players.forEach(tickCooldowns);
  room.players.forEach((player) => applySwitch(room, player, player.pendingAction));
  const attacks = [
    { player: first, opponent: second, action: firstAction },
    { player: second, opponent: first, action: secondAction },
  ].flatMap(({ player, opponent, action }) => {
    if (action.type !== "attack") return [];
    const attacker = player.team[action.cardIndex]; const defender = getActivePokemon(opponent);
    if (!attacker || attacker.isFainted || !defender || defender.isFainted) return [];
    const move = attacker.card.attacks[action.moveIndex];
    return [{ player, opponent, attacker, defender, action, move, breakdown: getDamageBreakdown(attacker.card, defender.card, move, randomVariance()) }];
  });

  attacks.forEach(({ attacker, action }) => setMoveCooldown(attacker, action.moveIndex));
  attacks.forEach(({ player, defender, move, breakdown }) => {
    defender.currentHp = Math.max(0, defender.currentHp - breakdown.damage);
    addLog(room, "attack", `${player.displayName || player.username}'s ${move.name} deals ${breakdown.damage} damage (${getEffectivenessLabel(breakdown.effectiveness)}).`);
  });

  let anyNeedsSwitch = false;
  room.players.forEach((player) => {
    const active = getActivePokemon(player);
    if (active && active.currentHp <= 0 && !active.isFainted) {
      markFainted(active);
      const opponent = getOpponent(room, player.username);
      if (opponent) opponent.trophyCount += 1;
      addLog(room, "status", `${active.card.name} was knocked out!`);
      if (hasUsablePokemon(player)) {
        player.needsSwitch = true;
        anyNeedsSwitch = true;
        if (!player.isAi) addLog(room, "switch", `${player.displayName || player.username} must select a replacement Pokémon!`);
        autoSwitchAi(room, player);
      }
    }
  });
  anyNeedsSwitch = room.players.some((player) => player.needsSwitch);

  room.players.forEach((player) => { player.pendingAction = null; });
  if (finishByRemainingCards(room)) return;

  if (!anyNeedsSwitch) {
    room.turnNumber += 1;
    finishAtTurnLimit(room);
  }
}
function handleBattleAction(room, username, action) {
  if (room.status !== "battling") throw new Error("Battle has not started yet");
  const player = getPlayer(room, username);
  if (!player) throw new Error("Player is not in this room");

  // Recover AI rooms that were left waiting by an earlier knockout event.
  room.players.filter((entry) => entry.isAi && entry.needsSwitch).forEach((entry) => autoSwitchAi(room, entry));

  // If this player needs to choose a replacement Pokémon:
  if (player.needsSwitch) {
    if (!action || action.type !== "switch" || !Number.isInteger(action.targetIndex)) {
      throw new Error("You must select a replacement Pokémon!");
    }
    const target = player.team[action.targetIndex];
    if (!target || target.isFainted || target.currentHp <= 0 || action.targetIndex === player.activeIndex) {
      throw new Error("Choose an eligible, non-fainted Pokémon to send out.");
    }
    player.activeIndex = action.targetIndex;
    player.needsSwitch = false;
    addLog(room, "switch", `${player.displayName || player.username} sent out ${target.card.name}!`);

    const stillWaiting = room.players.some((p) => p.needsSwitch);
    if (!stillWaiting) {
      if (finishByRemainingCards(room)) return;
      room.turnNumber += 1;
      finishAtTurnLimit(room);
    }
    return;
  }

  // If another player in the room is still choosing a replacement, normal actions must wait
  if (room.players.some((p) => p.needsSwitch)) {
    throw new Error("Waiting for replacement Pokémon to be chosen.");
  }

  lockAction(room, player, action);
  if (room.players.every((entry) => entry.pendingAction)) resolveRound(room);
}

async function validateTeam(username, cardIds) {
  await connectDB(); const user = await User.findOne({ username }).populate("inventory.card");
  if (!user) throw new Error("Player profile not found");
  const owned = new Map();
  user.inventory.forEach((entry) => { if (entry.card) { const id = entry._id?.toString() || entry.card._id.toString(); owned.set(id, { id, card: entry.card }); owned.set(entry.card._id.toString(), { id, card: entry.card }); } });
  const uniqueIds = [...new Set(cardIds)];
  if (uniqueIds.length !== TEAM_SIZE) throw new Error(`Select exactly ${TEAM_SIZE} Pokemon before locking`);
  return { displayName: user.displayName || username, cards: uniqueIds.map((id) => { const entry = owned.get(id); if (!entry) throw new Error("One or more selected cards are not in your inventory"); return entry; }) };
}
function updateTeam(room, username, entries, displayName) {
  const player = getPlayer(room, username); if (!player) throw new Error("Player not found in room"); if (player.lockedTeam) throw new Error("Your team is locked");
  player.displayName = displayName || player.displayName; player.team = entries.map((entry) => buildPokemonState(entry.card, entry.id)); player.activeIndex = 0; player.ready = player.team.length === TEAM_SIZE;
  addLog(room, "system", `${player.displayName} prepared a battle lineup.`);
}
async function applyTeamSelection(room, username, cardIds, shouldLock = false) {
  const { displayName, cards } = await validateTeam(username, cardIds); updateTeam(room, username, cards, displayName);
  const player = getPlayer(room, username); if (shouldLock) { player.lockedTeam = true; addLog(room, "system", `${player.displayName || player.username} locked their team.`); }
  if (isBattleReady(room)) startBattle(room);
}
function clearPlayerRoomState(player) { player.lockedTeam = false; player.ready = false; player.pendingAction = null; player.lastAction = null; }
function removePlayer(room, username) {
  if (username === AI_USERNAME) return;
  room.players = room.players.filter((player) => player.username !== username);
  const remainingHumans = room.players.filter((player) => player.username !== AI_USERNAME);
  if (!remainingHumans.length) return battleRooms.delete(room.roomId);
  if (room.status === "battling") { room.status = "finished"; room.winnerUsername = room.players[0].username; addLog(room, "victory", `${room.players[0].displayName || room.players[0].username} wins by default.`); }
  else room.status = room.players.length === 2 ? "building" : "waiting";
}
function setupBattleSocket(io) {
  io.on("connection", (socket) => {
    socket.on("battle-join-room", async ({ roomId, username }) => { try {
      if (!roomId || !username) throw new Error("Room code and username are required");
      if (username === AI_USERNAME) throw new Error("That trainer ID is reserved");
      await connectDB(); const user = await User.findOne({ username }); if (!user) throw new Error("Player profile not found");
      let room = getRoom(roomId); if (!room) room = createRoom(roomId, username, user.displayName || username);
      await ensureAiOpponent(room);
      const existing = getPlayer(room, username);
      const meta = parseAiRoom(roomId);
      if (existing) {
        existing.connected = true;
      } else {
        const humanCount = room.players.filter((player) => player.username !== AI_USERNAME).length;
        const full = meta.isAi ? humanCount >= 1 : room.players.length >= 2;
        if (full) throw new Error("Room is full");
        room.players.push(emptyPlayer(username, user.displayName || username));
      }
      socket.join(roomId); socket.data.battleRoomId = roomId; socket.data.battleUsername = username;
      if (room.players.length === 2 && room.status === "waiting") room.status = "building";
      emitRoom(io, room);
    } catch (err) { emitError(socket, err.message); } });
    socket.on("battle-team-update", async ({ roomId, username, cardIds }) => { try { const room = getRoom(roomId); if (!room) throw new Error("Room not found"); if (room.status === "battling" || room.status === "finished") throw new Error("Battle teams can no longer be changed"); await applyTeamSelection(room, username, cardIds, false); emitRoom(io, room); } catch (err) { emitError(socket, err.message); } });
    socket.on("battle-lock-team", async ({ roomId, username, cardIds }) => { try { const room = getRoom(roomId); if (!room) throw new Error("Room not found"); const player = getPlayer(room, username); if (!player || player.lockedTeam) throw new Error("Your team is already locked"); await applyTeamSelection(room, username, cardIds || player.team.map((p) => p.inventoryItemId), true); maybeAiAct(room); emitRoom(io, room); } catch (err) { emitError(socket, err.message); } });
    socket.on("battle-unlock-team", ({ roomId, username }) => { const room = getRoom(roomId); const player = room && getPlayer(room, username); if (!player || player.isAi || room.status === "battling" || room.status === "finished") return; clearPlayerRoomState(player); if (room.players.length === 2) room.status = "building"; emitRoom(io, room); });
    socket.on("battle-action", async ({ roomId, username, action }) => { try { const room = getRoom(roomId); if (!room) throw new Error("Room not found"); handleBattleAction(room, username, action); maybeAiAct(room); await settleTournament(room); emitRoom(io, room); } catch (err) { emitError(socket, err.message); } });
    socket.on("battle-leave-room", ({ roomId, username }) => { const room = getRoom(roomId); if (!room) return; removePlayer(room, username); if (battleRooms.has(roomId)) emitRoom(io, room); });
    socket.on("disconnect", () => { const room = getRoom(socket.data.battleRoomId); const player = room && getPlayer(room, socket.data.battleUsername); if (player) { player.connected = false; emitRoom(io, room); } });
  });
}
module.exports = { setupBattleSocket };
