import { DigitalProduct } from "@/src/models/digitalProduct";
import { create } from "zustand";

interface ProductCheckoutStore {
  product: DigitalProduct | null;
  setProduct: (p: DigitalProduct) => void;
  quantity: number;
  setQuantity: (quan: number) => void;
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
  reset: () => void;
}

const initialState = {
  product: null,
  quantity: 1,
  couponId: null,
  couponCode: null,
  discountAmount: 0,
  discountType: null,
};

export const useProductCheckoutStore = create<ProductCheckoutStore>((set) => ({
  ...initialState,
  setProduct: (p: DigitalProduct) => set({ product: p }),
  setQuantity: (quan: number) => set({ quantity: quan }),
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
  reset: () => set(initialState),
}));
