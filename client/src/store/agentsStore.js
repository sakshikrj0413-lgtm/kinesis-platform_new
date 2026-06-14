import { create } from "zustand";
import {
  createAgent,
  startAgent,
  stopAgent,
  getMyAgents,
  getAgent,
  getAgentLogs,
  getAgentPositions,
  runAgentOnce,
} from "../api/agents";

const useAgentsStore = create((set, get) => ({
  agents: [],
  activeAgent: null,
  logs: [],
  positions: [],
  loading: false,
  error: null,

  loadAgents: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getMyAgents();
      set({ agents: data.agents || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createAgent: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await createAgent(data);
      set((state) => ({
        agents: [result.agent, ...state.agents],
        loading: false,
      }));
      return result;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  startAgent: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const data = await startAgent(agentId);
      set((state) => ({
        agents: state.agents.map((a) =>
          a.id === agentId ? { ...a, status: "running" } : a
        ),
        loading: false,
      }));
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  stopAgent: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const data = await stopAgent(agentId);
      set((state) => ({
        agents: state.agents.map((a) =>
          a.id === agentId ? { ...a, status: "stopped" } : a
        ),
        loading: false,
      }));
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  loadAgent: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const data = await getAgent(agentId);
      set({ activeAgent: data.agent, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  loadAgentLogs: async (agentId, limit = 50) => {
    set({ loading: true, error: null });
    try {
      const data = await getAgentLogs(agentId, limit);
      set({ logs: data.logs || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  loadAgentPositions: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const data = await getAgentPositions(agentId);
      set({ positions: data.positions || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  runAgentOnce: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const data = await runAgentOnce(agentId);
      set({ loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  clearAgent: () => set({ activeAgent: null, logs: [], positions: [] }),
}));

export default useAgentsStore;
