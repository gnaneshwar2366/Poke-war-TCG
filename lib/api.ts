import type {
  Card,
  CardsResponse,
  FilterMeta,
  LeaderboardEntry,
  User,
  TournamentProgress,
} from "@/types";

export type PackType = "basic" | "premium";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function fetchCards(params: Record<string, string> = {}): Promise<CardsResponse> {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/cards?${query}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch cards");
  return res.json();
}

export async function fetchFilterMeta(): Promise<FilterMeta> {
  const res = await fetch(`${API_URL}/api/cards/meta/filters`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch filters");
  return res.json();
}

export async function fetchUser(username: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/users/${username}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

/** Restores a playable local profile after a database reset. */
export async function bootstrapUser(username: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/users/${username}/bootstrap`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not create a battle profile");
  }
  return res.json();
}

export async function openPack(
  username: string,
  packType: PackType = "basic"
): Promise<{ cards: Card[]; coins: number; packType: PackType; resumed?: boolean }> {
  const res = await fetch(`${API_URL}/api/users/${username}/open-pack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packType }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to open pack");
  }
  return res.json();
}

export async function claimPackCard(
  username: string,
  cardId: string
): Promise<{ success: boolean; coins: number }> {
  const res = await fetch(`${API_URL}/api/users/${username}/claim-pack-card`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to claim card");
  }
  return res.json();
}

export async function signupUser(
  username: string,
  starterType: string,
  selectedCardIds: string[] = []
): Promise<User> {
  const res = await fetch(`${API_URL}/api/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, starterType, selectedCardIds }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to sign up player");
  }
  return res.json();
}

export async function fetchStarterOptions(type: string): Promise<Card[]> {
  const res = await fetch(`${API_URL}/api/starter-options?type=${encodeURIComponent(type)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load starter pack");
  const data = await res.json();
  return data.cards || [];
}

export async function fetchTournament(username: string): Promise<TournamentProgress> {
  const res = await fetch(`${API_URL}/api/tournament/${username}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load tournament");
  return res.json();
}

export async function startTournamentStage(username: string): Promise<{ roomId: string; stage: number; gym: { name: string; leader: string; type: string } }> {
  const res = await fetch(`${API_URL}/api/tournament/${username}/start`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not start gym battle");
  }
  return res.json();
}

export async function claimTournamentReward(username: string, cardId: string): Promise<{ success: boolean; user: User; tournament: TournamentProgress }> {
  const res = await fetch(`${API_URL}/api/tournament/${username}/claim-reward`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to claim reward");
  }
  return res.json();
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${API_URL}/api/leaderboard`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

export const PACK_INFO = {
  basic: { cost: 50, label: "Basic Pack", cards: 5 },
  premium: { cost: 200, label: "Premium Pack", cards: 5 },
} as const;

export function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    Fire: "text-poke-fire",
    Water: "text-poke-water",
    Grass: "text-poke-grass",
    Electric: "text-poke-electric",
    Lightning: "text-poke-electric",
    Ice: "text-cyan-400",
    Fighting: "text-orange-500",
    Poison: "text-purple-400",
    Ground: "text-amber-500",
    Flying: "text-indigo-300",
    Psychic: "text-poke-psychic",
    Bug: "text-lime-400",
    Rock: "text-yellow-600",
    Ghost: "text-violet-400",
    Dragon: "text-orange-400",
    Dark: "text-poke-dark",
    Darkness: "text-poke-dark",
    Steel: "text-gray-400",
    Metal: "text-gray-400",
    Fairy: "text-pink-400",
    Normal: "text-gray-300",
    Colorless: "text-gray-300",
  };
  return colors[type] || "text-white";
}

export function isRareCard(rarity: string): boolean {
  return /Rare|Ultra|Secret|Rainbow|Hyper|Illustration|Amazing|Shiny|Double/i.test(rarity);
}

export function isPremiumCard(rarity: string, name: string): boolean {
  return (
    /V(MAX|STAR)?| ex|Ultra Rare|Special Illustration|Hyper Rare|Secret/i.test(
      rarity + " " + name
    )
  );
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}
