import API from "./axios";

export async function generateMarket(prompt) {
  const { data } = await API.post("/ai-builder/generate-market", { prompt });
  return data;
}

export async function generateAgent(prompt) {
  const { data } = await API.post("/ai-builder/generate-agent", { prompt });
  return data;
}

export async function generateContract(prompt) {
  const { data } = await API.post("/ai-builder/generate-contract", { prompt });
  return data;
}

export async function generateCasino(prompt) {
  const { data } = await API.post("/ai-builder/generate-casino", { prompt });
  return data;
}

export async function validateData(type, data) {
  const { data: result } = await API.post("/ai-builder/validate", { type, data });
  return result;
}

export async function deployMarket(marketData) {
  const { data } = await API.post("/markets/create", {
    title: marketData.title,
    description: marketData.description,
    type: marketData.type || "BINARY",
    outcomes: (marketData.outcomes || []).map(o => ({
      title: o.title,
      odds: o.initial_odds || o.odds || 0.5,
    })),
  });
  return data;
}
