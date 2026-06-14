import API from "./axios";

export async function createAgent(data) {
  const { data: result } = await API.post("/agents/create", data);
  return result;
}

export async function startAgent(agentId) {
  const { data } = await API.post("/agents/start", { agent_id: agentId });
  return data;
}

export async function stopAgent(agentId) {
  const { data } = await API.post("/agents/stop", { agent_id: agentId });
  return data;
}

export async function getMyAgents() {
  const { data } = await API.get("/agents/my");
  return data;
}

export async function getAgent(agentId) {
  const { data } = await API.get(`/agents/${agentId}`);
  return data;
}

export async function getAgentLogs(agentId, limit = 50) {
  const { data } = await API.get(`/agents/${agentId}/logs?limit=${limit}`);
  return data;
}

export async function getAgentPositions(agentId) {
  const { data } = await API.get(`/agents/${agentId}/positions`);
  return data;
}

export async function runAgentOnce(agentId) {
  const { data } = await API.post(`/agents/${agentId}/run`);
  return data;
}
