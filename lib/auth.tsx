"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface AuthContextType {
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  username: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const PRESET_USERS = [
  { id: "trainer", label: "Trainer Red", emoji: "🔴" },
  { id: "ash", label: "Ash Ketchum", emoji: "⚡" },
  { id: "misty", label: "Misty", emoji: "💧" },
  { id: "brock", label: "Brock", emoji: "🪨" },
  { id: "rival", label: "Rival Blue", emoji: "🔵" },
  { id: "gary", label: "Gary Oak", emoji: "⭐" },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("pokecard_user");
    if (saved) setUsername(saved);
    setIsLoading(false);
  }, []);

  const login = useCallback((name: string) => {
    const trimmed = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!trimmed) return;
    localStorage.setItem("pokecard_user", trimmed);
    setUsername(trimmed);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("pokecard_user");
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider value={{ username, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
