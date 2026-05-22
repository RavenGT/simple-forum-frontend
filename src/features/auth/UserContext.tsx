import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setCurrentUserId } from "@/lib/api/userIdMiddleware";

const STORAGE_KEY = "simple-forum:user-id";
const NAME_RE = /^[a-zA-Z0-9_-]{2,32}$/;

export type UserContextValue = {
  userId: string | null;
  login: (name: string) => void;
  logout: () => void;
};

export const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && NAME_RE.test(stored) ? stored : null;
  });

  useEffect(() => {
    setCurrentUserId(userId);
  }, [userId]);

  const value = useMemo<UserContextValue>(() => ({
    userId,
    login(name: string) {
      if (!NAME_RE.test(name)) {
        throw new Error("Username must be 2–32 chars: letters, digits, _ or -");
      }
      localStorage.setItem(STORAGE_KEY, name);
      setUserId(name);
    },
    logout() {
      localStorage.removeItem(STORAGE_KEY);
      setUserId(null);
    },
  }), [userId]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
