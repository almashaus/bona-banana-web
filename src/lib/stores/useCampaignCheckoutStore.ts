import { Campaign } from "@/src/models/campaign/campaign";
import { create } from "zustand";

interface CampaignCheckoutStore {
  campaign: Campaign | null;
  setCampaign: (c: Campaign) => void;

  selectedPlayerId: string;
  setSelectedPlayer: (id: string) => void;

  selectedSessionIds: string[];
  toggleSession: (sessionId: string) => void;

  bookAll: boolean;
  setBookAll: (val: boolean, allSessionIds: string[]) => void;

  totalAmount: number;
  discountAmount: number;

  reset: () => void;
}

const initialState = {
  campaign: null,
  selectedPlayerId: "",
  selectedSessionIds: [] as string[],
  bookAll: false,
  totalAmount: 0,
  discountAmount: 0,
};

export const useCampaignCheckoutStore = create<CampaignCheckoutStore>(
  (set, get) => ({
    ...initialState,

    setCampaign: (c: Campaign) => set({ campaign: c }),

    setSelectedPlayer: (id: string) => set({ selectedPlayerId: id }),

    toggleSession: (sessionId: string) => {
      const { selectedSessionIds, campaign } = get();
      const exists = selectedSessionIds.includes(sessionId);
      const newIds = exists
        ? selectedSessionIds.filter((id) => id !== sessionId)
        : [...selectedSessionIds, sessionId];

      const price = campaign?.price ?? 0;
      const total = price * newIds.length;

      set({
        selectedSessionIds: newIds,
        bookAll: false,
        totalAmount: total,
        discountAmount: 0,
      });
    },

    setBookAll: (val: boolean, allSessionIds: string[]) => {
      const { campaign } = get();
      const price = campaign?.price ?? 0;

      if (val) {
        const total = price * allSessionIds.length;
        const discount = total * 0.1;
        set({
          bookAll: true,
          selectedSessionIds: allSessionIds,
          totalAmount: total - discount,
          discountAmount: discount,
        });
      } else {
        set({
          bookAll: false,
          selectedSessionIds: [],
          totalAmount: 0,
          discountAmount: 0,
        });
      }
    },

    reset: () => set(initialState),
  }),
);
