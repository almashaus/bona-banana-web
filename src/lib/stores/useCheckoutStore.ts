import { Event } from "@/src/models/event";
import { create } from "zustand";

interface CheckoutStore {
  event: Event | null;
  setEvent: (id: Event) => void;
  eventDateId: string;
  setEventDateId: (id: string) => void;
  quantity: number;
  setQuantity: (quan: number) => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  event: null,
  setEvent: (e: Event) => set({ event: e }),
  eventDateId: "",
  setEventDateId: (id: string) => set({ eventDateId: id }),
  quantity: 0,
  setQuantity: (quan: number) => set({ quantity: quan }),
}));
