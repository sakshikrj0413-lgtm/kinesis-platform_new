import { create } from "zustand";
import {
  getMarketplaceAgents,
  getMarketplaceAgent,
  getLeaderboard,
  cloneAgent,
  rateAgent,
  publishAgent,
} from "../api/marketplace";

const useMarketplaceStore = create((set) => ({
  agents: [],
  activeAgent: null,
  leaderboard: { top_roi: [], trending: [], safest: [] },
  loading: false,
  error: null,

  loadAgents: async (sort = "roi", limit = 20) => {
    set({ loading: true, error: null });
    try {
      const data = await getMarketplaceAgents(sort, limit);
      set({ agents: data.agents || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  loadAgent: async (listingId) => {
    set({ loading: true, error: null });
    try {
      const data = await getMarketplaceAgent(listingId);
      set({ activeAgent: data.listing, ratings: data.ratings || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  loadLeaderboard: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getLeaderboard();
      set({ leaderboard: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  cloneAgent: async (listingId) => {
    set({ loading: true, error: null });
    try {
      const data = await cloneAgent(listingId);
      set({ loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  rateAgent: async (listingId, rating, review) => {
    try {
      await rateAgent(listingId, rating, review);
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  publishAgent: async (agentId, title, description) => {
    set({ loading: true, error: null });
    try {
      const data = await publishAgent(agentId, title, description);
      set({ loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  clear: () => set({ activeAgent: null, ratings: [] }),
}));

export default useMarketplaceStore;
