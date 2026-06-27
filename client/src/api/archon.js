import API from "./axios";

export const getConfig = () => API.get("/aurora/config");

export const updateConfig = (config) => API.post("/aurora/config", config);

export const ingestCollateral = (message, useZkp) => 
  API.post("/aurora/ingest", { message, use_zkp: useZkp });

export const getAssets = () => API.get("/aurora/assets");

export const activateDeadCapital = (assetId) => 
  API.post("/aurora/assets/activate", { asset_id: assetId });

export const getIveOrders = () => API.get("/aurora/ive/orders");

export const placeIveOrder = (order) => API.post("/aurora/ive/orders", order);

export const triggerIveMatching = () => API.post("/aurora/ive/match");

export const getObligations = () => API.get("/aurora/gog/obligations");

export const createObligation = (ob) => API.post("/aurora/gog/obligations", ob);

export const runNetting = () => API.post("/aurora/gog/net");

export const rescheduleObligations = (obligationIds, suggestedTime) => 
  API.post("/aurora/gog/reschedule", { obligation_ids: obligationIds, suggested_time: suggestedTime });

export const getAthenaAgents = () => API.get("/aurora/athena/agents");

export const createAthenaAgent = (agent) => API.post("/aurora/athena/agents", agent);

export const getAthenaLogs = (agentId) => 
  API.get(`/aurora/athena/logs?agent_id=${agentId}`);

export const simulateAthenaAgent = (agentId, triggerAttack) => 
  API.post("/aurora/athena/simulate", { agent_id: agentId, trigger_attack: triggerAttack });

export const unsuspendAthenaAgent = (agentId) => 
  API.post("/aurora/athena/unsuspend", { agent_id: agentId });

export const exportSwift = (assetId) => 
  API.get(`/aurora/assets/${assetId}/export/swift`);

export const exportIso = (assetId) => 
  API.get(`/aurora/assets/${assetId}/export/iso`);

export const getPlatformStats = () => API.get("/aurora/stats");
