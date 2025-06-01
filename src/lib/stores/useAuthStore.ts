import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "firebase/auth";

interface AuthState {
  currentUser: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      setUser: (user) => set({ currentUser: user }),
    }),
    {
      name: "auth-storage", // LocalStorage key
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
