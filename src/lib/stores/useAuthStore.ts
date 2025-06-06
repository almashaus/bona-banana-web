import { AppUser } from "@/src/models/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
    }),
    {
      name: "auth-storage", // LocalStorage key
      partialize: (state) => ({ user: state.user }),
    }
  )
);
