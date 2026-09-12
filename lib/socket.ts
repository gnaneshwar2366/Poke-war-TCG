"use client";

import { io, Socket } from "socket.io-client";
import type { BattleRoomState, RoomState } from "@/types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect();
}

export function joinRoom(
  roomId: string,
  username: string,
  callbacks: {
    onUpdate: (state: RoomState) => void;
    onComplete: (data: { message: string }) => void;
    onError: (data: { message: string }) => void;
  }
): Socket {
  const s = connectSocket();

  s.off("room-update");
  s.off("trade-complete");
  s.off("error");

  s.on("room-update", callbacks.onUpdate);
  s.on("trade-complete", callbacks.onComplete);
  s.on("error", callbacks.onError);

  s.emit("join-room", { roomId, username });
  return s;
}

export function addToOffer(card: unknown): void {
  getSocket().emit("add-to-offer", { card });
}

export function removeFromOffer(cardId: string): void {
  getSocket().emit("remove-from-offer", { cardId });
}

export function lockTrade(): void {
  getSocket().emit("lock-trade");
}

export function unlockTrade(): void {
  getSocket().emit("unlock-trade");
}

export function acceptTrade(): void {
  getSocket().emit("accept-trade");
}

export function leaveRoom(): void {
  getSocket().emit("leave-room");
}

export function joinBattleRoom(
  roomId: string,
  username: string,
  callbacks: {
    onUpdate: (state: BattleRoomState) => void;
    onError: (data: { message: string }) => void;
  }
): Socket {
  const s = connectSocket();

  s.off("battle-room-update");
  s.off("battle-error");
  s.off("battle-room-created");

  s.on("battle-room-update", callbacks.onUpdate);
  s.on("battle-error", callbacks.onError);

  s.emit("battle-join-room", { roomId, username });
  return s;
}

export function battleTeamUpdate(roomId: string, username: string, cardIds: string[]): void {
  getSocket().emit("battle-team-update", { roomId, username, cardIds });
}

export function battleLockTeam(roomId: string, username: string, cardIds?: string[]): void {
  getSocket().emit("battle-lock-team", { roomId, username, cardIds });
}

export function battleUnlockTeam(roomId: string, username: string): void {
  getSocket().emit("battle-unlock-team", { roomId, username });
}

export function battleAction(
  roomId: string,
  username: string,
  action:
    | { type: "attack"; moveIndex: number }
    | { type: "switch"; targetIndex: number }
    | { type: "skip" }
): void {
  getSocket().emit("battle-action", { roomId, username, action });
}

export function leaveBattleRoom(roomId: string, username: string): void {
  getSocket().emit("battle-leave-room", { roomId, username });
}
