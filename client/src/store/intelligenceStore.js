import { create } from "zustand";
import {
  getMarketEdge,
  getMarketIntelligence,
  getTrendingMarkets,
} from "../api/intelligence";

const useIntelligenceStore = create((set, get) => ({
  marketEdge: null,
  marketIntelligence: null,
  trending: [],
  loading: false,
  error: null,

  loadMarketEdge: async (marketId) => {
    set({ loading: true, error: null });
    try {
      const data = await getMarketEdge(marketId);
      set({ marketEdge: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  loadMarketIntelligence: async (marketId) => {
    set({ loading: true, error: null });
    try {
      const data = await getMarketIntelligence(marketId);
      set({ marketIntelligence: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  loadTrending: async (limit = 10) => {
    set({ loading: true, error: null });
    try {
      const data = await getTrendingMarkets(limit);
      set({ trending: data.trending || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  clearIntelligence: () => set({ marketEdge: null, marketIntelligence: null }),
}));

export default useIntelligenceStore;
