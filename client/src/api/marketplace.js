import API from "./axios";

export async function publishAgent(agentId, title, description) {
  const { data } = await API.post("/marketplace/publish", {
    agent_id: agentId,
    title,
    description,
  });
  return data;
}

export async function cloneAgent(listingId) {
  const { data } = await API.post(`/marketplace/clone/${listingId}`);
  return data;
}

export async function getMarketplaceAgents(sort = "roi", limit = 20) {
  const { data } = await API.get(`/marketplace/agents?sort=${sort}&limit=${limit}`);
  return data;
}

export async function getMarketplaceAgent(listingId) {
  const { data } = await API.get(`/marketplace/agents/${listingId}`);
  return data;
}

export async function rateAgent(listingId, rating, review) {
  const { data } = await API.post(`/marketplace/rate/${listingId}`, {
    rating,
    review,
  });
  return data;
}

export async function getLeaderboard() {
  const { data } = await API.get("/marketplace/leaderboard");
  return data;
}
