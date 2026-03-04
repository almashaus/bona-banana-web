import { Event } from "@/src/models/event";
import { create } from "zustand";

interface CheckoutStore {
  event: Event | null;
  setEvent: (e: Event) => void;
  eventDateId: string;
  setEventDateId: (id: string) => void;
  quantity: number;
  setQuantity: (quan: number) => void;
  // Offer (auto-applied)
  offerId: string | null;
  offerDiscount: number;
  // Coupon (manual code)
  couponId: string | null;
  couponCode: string | null;
  discountAmount: number;
  discountType: string | null;
  setCoupon: (data: {
    couponId: string;
    couponCode: string;
    discountAmount: number;
    discountType: string;
  }) => void;
  clearCoupon: () => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  event: null,
  setEvent: (e: Event) => set({ event: e }),
  eventDateId: "",
  setEventDateId: (id: string) => set({ eventDateId: id }),
  quantity: 0,
  setQuantity: (quan: number) => set({ quantity: quan }),
  offerId: null,
  offerDiscount: 0,
  couponId: null,
  couponCode: null,
  discountAmount: 0,
  discountType: null,
  setCoupon: (data) =>
    set({
      couponId: data.couponId,
      couponCode: data.couponCode,
      discountAmount: data.discountAmount,
      discountType: data.discountType,
    }),
  clearCoupon: () =>
    set({
      couponId: null,
      couponCode: null,
      discountAmount: 0,
      discountType: null,
    }),
}));
