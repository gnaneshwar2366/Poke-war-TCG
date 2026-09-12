export interface CardAttack {
  name: string;
  cost: string[];
  convertedEnergyCost?: number;
  damage: number | null;
  text: string | null;
}

export interface Card {
  _id: string;
  externalId?: string;
  name: string;
  baseName?: string;
  suffix?: string | null;
  stage?: string;
  hp: number | null;
  types: string[];
  coreTypes?: string[];
  rarity: string;
  imageUrl: string;
  imageUrlLarge?: string;
  displayImage?: string;
  artworkUrl?: string;
  setName?: string;
  setTotal?: string;
  number?: string;
  marketPrice: number;
  artist?: string;
  dexNumber?: number;
  weakness?: string;
  resistance?: string | null;
  retreatCost?: number;
  attacks?: CardAttack[];
  ruleText?: string | null;
  isFullArt?: boolean;
}

export interface InventoryItem {
  _id?: string;
  card: Card;
  acquiredAt?: string;
}

export interface User {
  _id: string;
  username: string;
  displayName?: string;
  coins: number;
  inventory: InventoryItem[];
  pendingPackCards?: Card[];
  aiTournament?: TournamentProgress;
}

export interface TournamentProgress {
  currentStage: number;
  highestStageCleared: number;
  winsInARow: number;
  lastPlayedAt?: string | null;
  claimedStageRewards?: number[];
  pendingTournamentReward?: { stage: number; cardIds?: string[]; consolation?: boolean } | null;
  pendingRewardTier?: "low" | "mid" | "epic" | "rare" | null;
  pendingRewardCards?: Card[];
  stages?: Array<{
    id: number;
    name: string;
    type: string;
    leader: string;
    status: "cleared" | "current" | "locked";
    cleared?: boolean;
  }>;
}

export interface TradeParticipant {
  socketId: string;
  userId: string;
  username: string;
  offer: Card[];
  locked: boolean;
  accepted: boolean;
}

export interface RoomState {
  roomId: string;
  users: TradeParticipant[];
  status: string;
}

export interface CardsResponse {
  cards: Card[];
  total: number;
  page: number;
  limit: number;
}

export interface FilterMeta {
  types: string[];
  rarities: string[];
}

export interface LeaderboardEntry {
  username: string;
  displayName?: string;
  cardCount: number;
  totalValue: number;
}

export type BattleStatusEffectType =
  | "Burn"
  | "Poison"
  | "Sleep"
  | "Freeze"
  | "Paralyze"
  | "Confusion";

export interface BattleStatusEffect {
  type: BattleStatusEffectType;
  turnsRemaining: number;
}

export interface BattlePokemonState {
  card: Card;
  inventoryItemId?: string;
  currentHp: number;
  status: BattleStatusEffect | null;
  isFainted: boolean;
  battlePower?: number;
  battleMoveType?: string;
  /** Remaining locked rounds per attack, by attack index. */
  moveCooldowns?: number[];
}

export interface BattleMoveResult {
  moveName: string;
  damage: number;
  effectiveness: "super" | "not-effective" | "normal" | "no-effect";
  power?: number;
  cost?: number;
  statusApplied?: BattleStatusEffectType | null;
  targetFainted?: boolean;
}

export interface BattlePlayerState {
  username: string;
  displayName?: string;
  connected?: boolean;
  lockedTeam: boolean;
  ready: boolean;
  isAi?: boolean;
  team: BattlePokemonState[];
  activeIndex: number;
  lastAction?: string | null;
  skippedTurns?: number;
  pendingAction?: { type: "attack" | "skip" | "switch" } | null;
  trophyCount?: number;
  needsSwitch?: boolean;
}

export interface BattleLogEntry {
  id: string;
  text: string;
  kind: "system" | "attack" | "status" | "switch" | "victory" | "warning";
  at: string;
}

export interface BattleRoomState {
  roomId: string;
  ownerUsername: string;
  status: "waiting" | "building" | "battling" | "finished";
  currentTurnUsername: string | null;
  winnerUsername: string | null;
  players: BattlePlayerState[];
  log: BattleLogEntry[];
  turnNumber: number;
  updatedAt: string;
}
