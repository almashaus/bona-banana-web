import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "firebase/auth";

interface MobileSidebarState {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const useMobileSidebar = create<MobileSidebarState>()((set) => ({
  mobileOpen: false,
  setMobileOpen: (open) => set({ mobileOpen: open }),
}));
