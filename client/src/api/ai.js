import API from "./axios";

export async function sendChatMessage(message, chatId = null) {
  const body = { message };
  if (chatId) body.chat_id = chatId;
  const { data } = await API.post("/ai/chat", body);
  return data;
}

export async function getChatHistory() {
  const { data } = await API.get("/ai/chat/history");
  return data;
}

export async function getChat(chatId) {
  const { data } = await API.get(`/ai/chat/${chatId}`);
  return data;
}

export async function analyzeMarket(marketId) {
  const { data } = await API.post("/ai/analyze-market", { market_id: marketId });
  return data;
}

export async function getTrending() {
  const { data } = await API.get("/ai/trending");
  return data;
}
