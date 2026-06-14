import { create } from "zustand";
import {
  sendChatMessage,
  getChatHistory,
  getChat,
  analyzeMarket,
  getTrending,
} from "../api/ai";

const useAIStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  trending: [],
  analysis: null,
  loading: false,
  error: null,

  loadChatHistory: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getChatHistory();
      set({ chats: data.chats || [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  selectChat: async (chatId) => {
    set({ loading: true, error: null });
    try {
      const data = await getChat(chatId);
      set({
        activeChat: data.chat,
        messages: data.messages || [],
        loading: false,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  sendMessage: async (message) => {
    const currentChat = get().activeChat;
    set({ loading: true, error: null });

    const tempUserMsg = {
      id: Date.now(),
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, tempUserMsg],
    }));

    try {
      const data = await sendChatMessage(message, currentChat?.id);
      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.response,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        activeChat: {
          id: data.chat_id,
          title: data.title,
          message_count: data.message_count,
        },
        suggestedBets: data.suggested_bets || [],
        loading: false,
      }));
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  analyzeMarket: async (marketId) => {
    set({ loading: true, error: null });
    try {
      const data = await analyzeMarket(marketId);
      set({ analysis: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  loadTrending: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getTrending();
      set({ trending: data.trending || [], trendingAnalysis: data.analysis, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  clearAnalysis: () => set({ analysis: null }),
  resetChat: () => set({ activeChat: null, messages: [], suggestedBets: [] }),
}));

export default useAIStore;
