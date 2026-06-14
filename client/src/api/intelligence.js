import API from "./axios";

export async function getMarketEdge(marketId) {
  const { data } = await API.get(`/intelligence/markets/${marketId}/edge`);
  return data;
}

export async function getMarketIntelligence(marketId) {
  const { data } = await API.get(`/intelligence/markets/${marketId}/intelligence`);
  return data;
}

export async function getTrendingMarkets(limit = 10) {
  const { data } = await API.get(`/intelligence/markets/trending?limit=${limit}`);
  return data;
}
