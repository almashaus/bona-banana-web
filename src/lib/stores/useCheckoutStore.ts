import { create } from "zustand";

interface CheckoutStore {
  eventId: string;
  setEventId: (id: string) => void;
  eventDateId: string;
  setEventDateId: (id: string) => void;
  quantity: number;
  setQuantity: (quan: number) => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  eventId: "",
  setEventId: (id: string) => set({ eventId: id }),
  eventDateId: "",
  setEventDateId: (id: string) => set({ eventDateId: id }),
  quantity: 0,
  setQuantity: (quan: number) => set({ quantity: quan }),
}));
