import { create } from "zustand";
import {
  generateMarket,
  generateAgent,
  generateContract,
  generateCasino,
  validateData,
} from "../api/aiBuilder";

const useAIBuilderStore = create((set) => ({
  history: [],
  activeGeneration: null,
  result: null,
  validationErrors: [],
  isValid: false,
  loading: false,
  error: null,
  deploying: false,

  generate: async (type, prompt) => {
    set({ loading: true, error: null, result: null, validationErrors: [] });
    try {
      let data;
      switch (type) {
        case "market":
          data = await generateMarket(prompt);
          break;
        case "agent":
          data = await generateAgent(prompt);
          break;
        case "contract":
          data = await generateContract(prompt);
          break;
        case "casino":
          data = await generateCasino(prompt);
          break;
        default:
          throw new Error("Unknown generation type");
      }

      set((state) => ({
        result: data.result,
        validationErrors: data.validation_errors || [],
        isValid: data.valid,
        loading: false,
        activeGeneration: { type, prompt },
        history: [
          { type, prompt, result: data.result, timestamp: new Date().toISOString() },
          ...state.history.slice(0, 19),
        ],
      }));
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  validate: async (type, data) => {
    try {
      const result = await validateData(type, data);
      set({
        validationErrors: result.errors || [],
        isValid: result.valid,
      });
    } catch (err) {
      set({ error: err.message });
    }
  },

  updateResult: (newData) => {
    set((state) => ({
      result: { ...state.result, ...newData },
    }));
  },

  setDeploying: (val) => set({ deploying: val }),

  clear: () => set({ result: null, validationErrors: [], isValid: false, activeGeneration: null }),
}));

export default useAIBuilderStore;
