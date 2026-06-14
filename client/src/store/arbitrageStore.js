import { create } from "zustand";
import {
  getArbOpportunities,
  getLiveArb,
  getMarketArb,
} from "../api/arbitrage";

const useArbitrageStore = create((set) => ({
  opportunities: [],
  liveOpportunities: [],
  marketArb: null,
  loading: false,
  error: null,
  lastUpdate: null,

  loadOpportunities: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getArbOpportunities();
      set({
        opportunities: data.opportunities || [],
        loading: false,
        lastUpdate: new Date().toISOString(),
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  loadLive: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getLiveArb();
      set({
        liveOpportunities: data.live || [],
        loading: false,
        lastUpdate: data.timestamp,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  loadMarketArb: async (marketId) => {
    set({ loading: true, error: null });
    try {
      const data = await getMarketArb(marketId);
      set({ marketArb: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  updateFromSocket: (data) => {
    set({
      liveOpportunities: data.opportunities || [],
      lastUpdate: new Date().toISOString(),
    });
  },

  clear: () => set({ opportunities: [], liveOpportunities: [], marketArb: null }),
}));

export default useArbitrageStore;
