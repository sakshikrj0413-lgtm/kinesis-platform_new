import API from "./axios";

export async function getArbOpportunities() {
  const { data } = await API.get("/arb/opportunities");
  return data;
}

export async function getLiveArb() {
  const { data } = await API.get("/arb/live");
  return data;
}

export async function getMarketArb(marketId) {
  const { data } = await API.get(`/arb/market/${marketId}`);
  return data;
}
