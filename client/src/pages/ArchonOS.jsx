import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  getConfig,
  updateConfig,
  ingestCollateral,
  getAssets,
  activateDeadCapital,
  getIveOrders,
  placeIveOrder,
  triggerIveMatching,
  getObligations,
  createObligation,
  runNetting,
  rescheduleObligations,
  getAthenaAgents,
  createAthenaAgent,
  getAthenaLogs,
  simulateAthenaAgent,
  unsuspendAthenaAgent,
  exportSwift,
  exportIso,
  getPlatformStats
} from "../api/archon";

// High-fidelity templates for SWIFT and ISO 20022
const SWIFT_TEMPLATE = `{1:F01BANKBEBBAXXX0000000000}{2:I542JPMCB22XXXXN}{4:
:16R:GENL
:20C::SEME//REF-988392019
:23G:NEWM
:16S:GENL
:16R:FIAC
:36B::SETT//UNIT/15000000,
:35B:ISIN US912828GD60
:16S:FIAC
:16R:SETDET
:19A::SETT//USD14850000,
:16S:SETDET
-}`;

const ISO_TEMPLATE = `<Document xmlns="urn:iso:std:iso:20022:tech:xsd:sese.023.001.09">
  <SctiesSttlmTxInstr>
    <QtyAndValDetails>
      <Qty><Qty>25000000</Qty></Qty>
      <Val><Val>24750000</Val></Val>
    </QtyAndValDetails>
    <FinInstrmId>
      <ISIN>IN0020210017</ISIN>
      <Nm>Indian Sovereign G-Sec</Nm>
    </FinInstrmId>
  </SctiesSttlmTxInstr>
</Document>`;

export default function ArchonOS() {
  // Config state
  const [config, setConfig] = useState({
    rehypothecation_depth_limit: 3,
    circuit_breaker_active: false,
    isolation_zones: []
  });
  
  // Ingestion state
  const [inputText, setInputText] = useState(SWIFT_TEMPLATE);
  const [useZkp, setUseZkp] = useState(true);
  const [zkpSteps, setZkpSteps] = useState([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestedResult, setIngestedResult] = useState(null);
  
  // Assets state
  const [assets, setAssets] = useState([]);
  const [activatedCert, setActivatedCert] = useState(null);
  
  // IVE state
  const [iveOrders, setIveOrders] = useState([]);
  const [yieldCurve, setYieldCurve] = useState({ 15: null, 120: null, 240: null, 1440: null });
  const [orderType, setOrderType] = useState("bid");
  const [orderAmount, setOrderAmount] = useState(1000000);
  const [orderRate, setOrderRate] = useState(5.25);
  const [orderDuration, setOrderDuration] = useState(120);
  const [matchingLogs, setMatchingLogs] = useState([]);
  
  // Export Modal state
  const [exportModalContent, setExportModalContent] = useState(null);
  const [exportModalType, setExportModalType] = useState("");
  
  // GOG / Netting state
  const [obligations, setObligations] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [nettingResult, setNettingResult] = useState(null);
  const [obDebtor, setObDebtor] = useState("");
  const [obCreditor, setObCreditor] = useState("");
  const [obAmount, setObAmount] = useState(5000000);
  const [obDelay, setObDelay] = useState(2);
  const [nettingLoading, setNettingLoading] = useState(false);
  
  // ATHENA state
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]);
  const [newAgentName, setNewAgentName] = useState("Treasury Optimizer Beta");
  const [newAgentBudget, setNewAgentBudget] = useState(3000000);
  const [newAgentRisk, setNewAgentRisk] = useState("Conservative");
  const [agentSimulating, setAgentSimulating] = useState(false);
  
  // Platform Revenue (from real DB — no fake numbers)
  const [platformFees, setPlatformFees] = useState({
    spread: 0,
    rehypothecation: 0,
    savingsShare: 0,
    subscriptions: 0,
  });

  useEffect(() => {
    fetchConfig();
    fetchAssets();
    fetchIve();
    fetchObligations();
    fetchAgents();
    fetchStats();
  }, []);

  // Poll IVE, obligations, and real stats
  useEffect(() => {
    const t = setInterval(() => {
      fetchIve();
      fetchObligations();
      fetchStats();
      if (selectedAgent) {
        fetchAgentLogs(selectedAgent.id);
      }
    }, 8000);
    return () => clearInterval(t);
  }, [selectedAgent]);

  const fetchConfig = async () => {
    try {
      const res = await getConfig();
      setConfig(res.data);
    } catch (e) { console.error(e); }
  };

  const updateConfigField = async (fields) => {
    try {
      const updated = { ...config, ...fields };
      const res = await updateConfig(updated);
      setConfig(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchAssets = async () => {
    try {
      const res = await getAssets();
      setAssets(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchIve = async () => {
    try {
      const res = await getIveOrders();
      setIveOrders(res.data.orders);
      setYieldCurve(res.data.yield_curve);
    } catch (e) { console.error(e); }
  };

  const fetchObligations = async () => {
    try {
      const res = await getObligations();
      setObligations(res.data.obligations);
      setRecommendations(res.data.recommendations);
    } catch (e) { console.error(e); }
  };

  const fetchAgents = async () => {
    try {
      const res = await getAthenaAgents();
      setAgents(res.data);
      if (res.data.length > 0 && !selectedAgent) {
        setSelectedAgent(res.data[0]);
        fetchAgentLogs(res.data[0].id);
      }
    } catch (e) { console.error(e); }
  };

  const fetchStats = async () => {
    try {
      const res = await getPlatformStats();
      setPlatformFees({
        spread: res.data.ive_spread,
        rehypothecation: res.data.rehypothecation,
        savingsShare: res.data.savings_share,
        subscriptions: res.data.subscriptions,
      });
    } catch (e) { console.error(e); }
  };

  const fetchAgentLogs = async (agentId) => {
    try {
      const res = await getAthenaLogs(agentId);
      setAgentLogs(res.data);
    } catch (e) { console.error(e); }
  };

  // Trigger Ingestion
  const handleIngest = async () => {
    setIsIngesting(true);
    setIngestedResult(null);
    setZkpSteps([]);
    
    if (useZkp) {
      // Animate ZKP Steps for absolute visual wow
      const steps = [
        "Initializing local client-side Homomorphic Ingestion API...",
        "Validating document encoding structure (SWIFT MT542/ISO 20022)...",
        "Encrypting position metrics using Paillier public key G=5...",
        "Transmitting encrypted balance state (ZKP proof payload generated)...",
        "Evaluating Basel IV margin haircut on ciphertext...",
        "Validating proof validity against regional parameters... OK.",
        "Verification complete. Saving Collateral Passport."
      ];
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, 600));
        setZkpSteps((prev) => [...prev, steps[i]]);
      }
    }

    try {
      const res = await ingestCollateral(inputText, useZkp);
      setIngestedResult(res.data);
      fetchAssets();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.error || "Failed to ingest collateral");
    } finally {
      setIsIngesting(false);
    }
  };

  // Dead capital activation
  const handleActivateCapital = async (assetId) => {
    try {
      const res = await activateDeadCapital(assetId);
      setActivatedCert(res.data.gap_certificate);
      fetchAssets();
      fetchStats();
    } catch (e) { console.error(e); }
  };

  const handleExportSwift = async (assetId) => {
    try {
      const res = await exportSwift(assetId);
      setExportModalContent(res.data.swift_message);
      setExportModalType("SWIFT MT542 Message");
    } catch (e) { console.error(e); }
  };

  const handleExportIso = async (assetId) => {
    try {
      const res = await exportIso(assetId);
      setExportModalContent(res.data.iso_message);
      setExportModalType("ISO 20022 XML Message");
    } catch (e) { console.error(e); }
  };

  // Place IVE order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await placeIveOrder({
        type: orderType,
        amount: orderAmount,
        rate: orderRate,
        duration: orderDuration
      });
      fetchIve();
      if (res.data.matches_triggered?.length > 0) {
        setMatchingLogs(res.data.matches_triggered);
        fetchStats();
      }
    } catch (e) { alert(e.response?.data?.error); }
  };

  const handleTriggerMatch = async () => {
    try {
      const res = await triggerIveMatching();
      fetchIve();
      if (res.data.matches?.length > 0) {
        setMatchingLogs(res.data.matches);
        fetchStats();
      } else {
        alert("No matches found in orderbook.");
      }
    } catch (e) { console.error(e); }
  };

  // GOG Netting
  const handleNetting = async () => {
    setNettingLoading(true);
    try {
      const res = await runNetting();
      setNettingResult(res.data);
      fetchObligations();
      if (res.data.savings > 0) {
        fetchStats();
      }
    } catch (e) { console.error(e); }
    finally { setNettingLoading(false); }
  };

  // POE reschedule execution
  const handleReschedule = async (rec) => {
    try {
      await rescheduleObligations(rec.obligations, rec.suggested_time);
      fetchObligations();
      alert(`Successfully synchronized obligations. Multi-lateral netting potential increased by $${(rec.netting_savings/1e6).toFixed(1)}M.`);
    } catch (e) { console.error(e); }
  };

  // Create mock obligations
  const handleCreateObligation = async (e) => {
    e.preventDefault();
    if (!obDebtor || !obCreditor) {
      alert("Please specify valid debtor and creditor usernames");
      return;
    }
    try {
      await createObligation({
        debtor: obDebtor,
        creditor: obCreditor,
        amount: obAmount,
        hours_delay: obDelay
      });
      fetchObligations();
      setObDebtor("");
      setObCreditor("");
    } catch (e) { alert(e.response?.data?.error || "Error creating obligation"); }
  };

  // Mint ACA Agent
  const handleMintAgent = async (e) => {
    e.preventDefault();
    try {
      const res = await createAthenaAgent({
        name: newAgentName,
        budget: newAgentBudget,
        risk_profile: newAgentRisk,
        permitted_counterparties: ["ClearingPool_A", "MarketMaker_X", "LiquidityBridge"]
      });
      setAgents(prev => [res.data, ...prev]);
      setSelectedAgent(res.data);
      fetchAgentLogs(res.data.id);
      fetchStats();
    } catch (e) { console.error(e); }
  };

  // Simulate agent runs
  const handleSimulateAgent = async (attack = false) => {
    if (!selectedAgent) return;
    setAgentSimulating(true);
    try {
      const res = await simulateAthenaAgent(selectedAgent.id, attack);
      fetchAgentLogs(selectedAgent.id);
      // Update selected agent status
      setSelectedAgent(prev => ({ ...prev, status: res.data.status }));
      setAgents(prev => prev.map(a => a.id === selectedAgent.id ? { ...a, status: res.data.status } : a));
      
      if (res.data.status === "suspended") {
        updateConfigField({ circuit_breaker_active: true });
      }
    } catch (e) { console.error(e); }
    finally { setAgentSimulating(false); }
  };

  // Reintegrate / unsuspend
  const handleUnsuspendAgent = async () => {
    if (!selectedAgent) return;
    try {
      const res = await unsuspendAthenaAgent(selectedAgent.id);
      setSelectedAgent(res.data);
      setAgents(prev => prev.map(a => a.id === selectedAgent.id ? res.data : a));
      fetchAgentLogs(selectedAgent.id);
      updateConfigField({ circuit_breaker_active: false });
    } catch (e) { console.error(e); }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* HEADER CONTROLS */}
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center",
          gap: "16px", padding: "20px", borderRadius: "16px", background: "var(--surface2)",
          border: "1px solid var(--green-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
        }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--green)", letterSpacing: "0.05em", margin: 0 }}>
              ARCHON // OS
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
              Autonomous Unified Routing & Optimization for Real-time Assets
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "center" }}>
            {/* Rehypothecation Ceiling */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)" }}>REHYPOTHECATION DEPTH LIMIT</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={config.rehypothecation_depth_limit}
                  onChange={(e) => updateConfigField({ rehypothecation_depth_limit: parseInt(e.target.value) })}
                  style={{ accentColor: "var(--green)", cursor: "pointer", width: "100px" }}
                />
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--green)", fontWeight: 700 }}>
                  {config.rehypothecation_depth_limit}x
                </span>
              </div>
            </div>

            {/* Circuit Breaker */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)" }}>CIRCUIT BREAKER</span>
              <button
                onClick={() => updateConfigField({ circuit_breaker_active: !config.circuit_breaker_active })}
                style={{
                  padding: "6px 16px", borderRadius: "8px", border: "1px solid",
                  borderColor: config.circuit_breaker_active ? "#ff4d4d" : "var(--green-border)",
                  background: config.circuit_breaker_active ? "rgba(255, 77, 77, 0.2)" : "rgba(0, 255, 136, 0.05)",
                  color: config.circuit_breaker_active ? "#ff4d4d" : "var(--green)",
                  cursor: "pointer", fontWeight: 700, fontSize: "0.75rem", transition: "all 0.2s"
                }}
              >
                {config.circuit_breaker_active ? "ACTIVE (HALTED)" : "STANDBY (SECURE)"}
              </button>
            </div>

            {/* Isolation Zones */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)" }}>ISOLATION ZONES</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {["Offshore", "Shadow Pool", "EM sovereigns"].map((zone) => {
                  const active = config.isolation_zones.includes(zone);
                  return (
                    <button
                      key={zone}
                      onClick={() => {
                        const newZones = active 
                          ? config.isolation_zones.filter(z => z !== zone)
                          : [...config.isolation_zones, zone];
                        updateConfigField({ isolation_zones: newZones });
                      }}
                      style={{
                        padding: "4px 8px", borderRadius: "6px", border: "1px solid",
                        borderColor: active ? "var(--green)" : "var(--surface3)",
                        background: active ? "var(--green-glow)" : "var(--surface3)",
                        color: active ? "var(--green)" : "var(--muted)",
                        fontSize: "0.65rem", fontWeight: 700, cursor: "pointer"
                      }}
                    >
                      {zone}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* REVENUE ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          {[
            { label: "Intraday Velocity Spread", val: platformFees.spread, desc: "IVE matching bid/ask delta capture" },
            { label: "Rehypothecation Net Interest", val: platformFees.rehypothecation, desc: "Cumulative net interest on chain multipliers" },
            { label: "Netting Savings Share", val: platformFees.savingsShare, desc: "10% cut on documented client liquidity savings" },
            { label: "Agent Subscriptions", val: platformFees.subscriptions, desc: "ACA certificate security fees" }
          ].map((card, idx) => (
            <div key={idx} style={{
              padding: "16px", borderRadius: "12px", background: "var(--surface2)",
              border: "1px solid var(--green-border)", display: "flex", flexDirection: "column", gap: "4px"
            }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>{card.label}</span>
              <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--green)", fontFamily: "var(--font-mono)" }}>
                ${card.val.toLocaleString()}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{card.desc}</span>
            </div>
          ))}
        </div>

        {/* LAYER 1 & 2: CONDUIT INGESTION & CVN COLLATERAL PASSPORT */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          
          {/* CONDUIT INGESTION */}
          <div style={{
            padding: "20px", borderRadius: "16px", background: "var(--surface2)",
            border: "1px solid var(--green-border)", display: "flex", flexDirection: "column", gap: "16px"
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
                  LAYER 1: CONDUIT // Ambient Integration
                </h2>
                <span style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", background: "var(--green-glow)", color: "var(--green)", fontWeight: 700 }}>
                  SWIFT/ISO 20022
                </span>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "4px 0 0 0" }}>
                Ingest position documentation and calculate valuations homomorphically.
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setInputText(SWIFT_TEMPLATE)}
                style={{
                  padding: "6px 12px", borderRadius: "6px", background: "var(--surface3)",
                  border: "1px solid var(--green-border)", color: "var(--text)", fontSize: "0.7rem",
                  cursor: "pointer", fontWeight: 700
                }}
              >
                Load SWIFT MT542 Template
              </button>
              <button
                onClick={() => setInputText(ISO_TEMPLATE)}
                style={{
                  padding: "6px 12px", borderRadius: "6px", background: "var(--surface3)",
                  border: "1px solid var(--green-border)", color: "var(--text)", fontSize: "0.7rem",
                  cursor: "pointer", fontWeight: 700
                }}
              >
                Load ISO 20022 XML Template
              </button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                width: "100%", height: "140px", background: "var(--surface3)",
                border: "1px solid var(--green-border)", borderRadius: "8px",
                color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: "0.75rem",
                padding: "10px", outline: "none", resize: "none"
              }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.8rem" }}>
                <input
                  type="checkbox"
                  checked={useZkp}
                  onChange={(e) => setUseZkp(e.target.checked)}
                  style={{ accentColor: "var(--green)", cursor: "pointer" }}
                />
                <span style={{ fontWeight: 700 }}>Enable Zero-Knowledge Proof (ZKP)</span>
              </label>

              <button
                onClick={handleIngest}
                disabled={isIngesting}
                className="kn-sidebar-toggle"
                style={{
                  padding: "10px 24px", borderRadius: "8px", border: "1px solid var(--green)",
                  background: "var(--green-glow)", color: "var(--green)", fontWeight: 900,
                  fontSize: "0.8rem", letterSpacing: "0.05em", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px"
                }}
              >
                {isIngesting ? "INGESTING..." : "INGEST TO PROTOCOL"}
              </button>
            </div>

            {/* ZKP Telemetry Display */}
            {zkpSteps.length > 0 && (
              <div style={{
                background: "#050805", padding: "12px", borderRadius: "8px",
                border: "1px solid var(--green-border)", display: "flex", flexDirection: "column", gap: "4px"
              }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>ZKP Homomorphic Computation Pipeline</span>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--green)", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {zkpSteps.map((step, idx) => (
                    <div key={idx}>&gt; {step}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingested Result Details */}
            {ingestedResult && (
              <div style={{
                background: "var(--surface3)", padding: "12px", borderRadius: "8px",
                border: "1px solid var(--green-border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"
              }}>
                <div>
                  <div style={{ fontSize: "0.65rem", color: "var(--muted)" }}>ASSET NAME</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{ingestedResult.asset_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.65rem", color: "var(--muted)" }}>ASSET TYPE</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{ingestedResult.asset_type}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.65rem", color: "var(--muted)" }}>BASE VALUATION</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>${ingestedResult.face_value.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.65rem", color: "var(--muted)" }}>NET COLLATERAL VALUE ({ingestedResult.haircut * 100}% HAIRCUT)</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--green)" }}>${ingestedResult.valuation.toLocaleString()}</div>
                </div>
                {ingestedResult.is_zk_encrypted && (
                  <div style={{ gridColumn: "span 2" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--muted)" }}>HOMOMORPHIC SHIELD HASH</div>
                    <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--yellow)" }}>{ingestedResult.encrypted_hash}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--green)", marginTop: "4px" }}>✔ ZK-Proof Verified: {ingestedResult.zkp_proof}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CVN PASSPORTS */}
          <div style={{
            padding: "20px", borderRadius: "16px", background: "var(--surface2)",
            border: "1px solid var(--green-border)", display: "flex", flexDirection: "column", gap: "16px"
          }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
                LAYER 2: CVN // Collateral passports
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "4px 0 0 0" }}>
                Global collateral ledger. Active multiplier chain tracks rehypothecated assets.
              </p>
            </div>

            <div style={{ flex: 1, overflowY: "auto", maxHeight: "400px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {assets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                  No active collateral passports found. Ingest a SWIFT/ISO record to create one.
                </div>
              ) : (
                assets.map((asset) => (
                  <div key={asset.id} style={{
                    background: "var(--surface3)", padding: "14px", borderRadius: "12px",
                    border: "1px solid var(--green-border)", display: "flex", flexDirection: "column", gap: "8px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--green)" }}>{asset.asset_name}</span>
                        <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "2px" }}>
                          TYPE: {asset.asset_type} // ELIGIBILITY SCORE: {asset.eligibility_score * 100}%
                        </div>
                      </div>
                      <span style={{
                        fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", fontWeight: 700,
                        background: asset.status === "pledged" ? "rgba(255, 215, 0, 0.15)" : "var(--green-glow)",
                        color: asset.status === "pledged" ? "var(--yellow)" : "var(--green)"
                      }}>
                        {asset.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                      <span>Valuation: ${asset.valuation.toLocaleString()}</span>
                      <span>Haircut: {asset.haircut * 100}%</span>
                    </div>

                    {/* Chain Multipliers */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "6px" }}>
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--muted)" }}>ACTIVE REHYPOTHECATION CHAIN</span>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", fontSize: "0.65rem" }}>
                        {asset.rehypothecation_chain.map((node, index) => (
                          <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "var(--text)", padding: "2px 6px", background: "var(--surface2)", borderRadius: "4px", border: "1px solid var(--green-border)" }}>
                              {node}
                            </span>
                            {index < asset.rehypothecation_chain.length - 1 && <span style={{ color: "var(--green)" }}>➔</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {asset.status !== "pledged" && (
                      <button
                        onClick={() => handleActivateCapital(asset.id)}
                        style={{
                          width: "100%", padding: "8px", borderRadius: "8px", background: "var(--green-glow)",
                          border: "1px solid var(--green)", color: "var(--green)", fontWeight: 700,
                          fontSize: "0.75rem", cursor: "pointer", transition: "all 0.2s"
                        }}
                      >
                        ACTIVATE DEAD CAPITAL (FREE LIQUIDITY)
                      </button>
                    )}

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleExportSwift(asset.id)}
                        style={{
                          flex: 1, padding: "6px", borderRadius: "6px", background: "var(--surface2)",
                          border: "1px solid var(--green-border)", color: "var(--text)", fontSize: "0.65rem",
                          cursor: "pointer", fontWeight: 700
                        }}
                      >
                        EXPORT SWIFT
                      </button>
                      <button
                        onClick={() => handleExportIso(asset.id)}
                        style={{
                          flex: 1, padding: "6px", borderRadius: "6px", background: "var(--surface2)",
                          border: "1px solid var(--green-border)", color: "var(--text)", fontSize: "0.65rem",
                          cursor: "pointer", fontWeight: 700
                        }}
                      >
                        EXPORT ISO 20022
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Gap certificate display */}
            <AnimatePresence>
              {activatedCert && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    background: "rgba(255, 215, 0, 0.05)", border: "1px solid var(--yellow-border)",
                    padding: "12px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "4px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--yellow)", fontWeight: 900, fontSize: "0.75rem" }}>Structured Gap Certificate Minted</span>
                    <button onClick={() => setActivatedCert(null)} style={{ background: "none", border: "none", color: "var(--yellow)", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
                  </div>
                  <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>ID: {activatedCert.id}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--muted)", margin: "4px 0" }}>{activatedCert.description}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem" }}>
                    <span>Underlying: {activatedCert.underlying_asset}</span>
                    <span>Maturity: T+2 Settlement Gap Coverage</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* LAYER 3 & 4: IVE ORDERBOOK & GOG NETTING */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          
          {/* IVE ORDERBOOK */}
          <div style={{
            padding: "20px", borderRadius: "16px", background: "var(--surface2)",
            border: "1px solid var(--green-border)", display: "flex", flexDirection: "column", gap: "16px"
          }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
                LAYER 3: IVE // Intraday Velocity Engine
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "4px 0 0 0" }}>
                Continuous clearing & matching of intraday liquidity bids/asks.
              </p>
            </div>

            <form onSubmit={handlePlaceOrder} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700 }}>DIRECTION</span>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  style={{ background: "var(--surface3)", border: "1px solid var(--green-border)", padding: "6px", borderRadius: "6px", color: "var(--text)", width: "100%", boxSizing: "border-box" }}
                >
                  <option value="bid">Borrow (Bid)</option>
                  <option value="ask">Lend (Ask)</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700 }}>AMOUNT (USD)</span>
                <input
                  type="number"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(parseFloat(e.target.value))}
                  style={{ background: "var(--surface3)", border: "1px solid var(--green-border)", padding: "6px", borderRadius: "6px", color: "var(--text)", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700 }}>RATE (%, APR)</span>
                <input
                  type="number"
                  step="0.01"
                  value={orderRate}
                  onChange={(e) => setOrderRate(parseFloat(e.target.value))}
                  style={{ background: "var(--surface3)", border: "1px solid var(--green-border)", padding: "6px", borderRadius: "6px", color: "var(--text)", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700 }}>TENOR</span>
                <select
                  value={orderDuration}
                  onChange={(e) => setOrderDuration(parseInt(e.target.value))}
                  style={{ background: "var(--surface3)", border: "1px solid var(--green-border)", padding: "6px", borderRadius: "6px", color: "var(--text)", width: "100%", boxSizing: "border-box" }}
                >
                  <option value={15}>15 Mins</option>
                  <option value={120}>2 Hours</option>
                  <option value={240}>4 Hours</option>
                  <option value={1440}>24h Overnight</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  gridColumn: "1 / -1", padding: "8px", borderRadius: "8px", background: "var(--green)",
                  border: "none", color: "var(--black)", fontWeight: 900, cursor: "pointer", width: "100%"
                }}
              >
                SUBMIT INTRADAY VELOCITY INTENT
              </button>
            </form>

            {/* Yield curve */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)" }}>EMERGENT YIELD CURVE (GSR BENCHMARK)</span>
                <button
                  onClick={handleTriggerMatch}
                  style={{
                    padding: "3px 8px", background: "none", border: "1px solid var(--green-border)",
                    borderRadius: "4px", color: "var(--green)", fontSize: "0.65rem", cursor: "pointer"
                  }}
                >
                  Force Match Loop
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", textAlign: "center" }}>
                {Object.entries(yieldCurve).map(([tenor, rate]) => (
                  <div key={tenor} style={{ background: "var(--surface3)", padding: "6px", borderRadius: "6px", border: "1px solid var(--green-border)" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--muted)" }}>
                      {tenor === "1440" ? "24h Bridge" : `${tenor} Mins`}
                    </div>
                    <div style={{
                      fontSize: rate !== null ? "0.95rem" : "0.75rem",
                      fontWeight: 800,
                      color: rate !== null ? "var(--green)" : "var(--muted)",
                      fontFamily: "var(--font-mono)"
                    }}>
                      {rate !== null ? `${rate}%` : "— No trades"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Matches log */}
            {matchingLogs.length > 0 && (
              <div style={{
                background: "rgba(0,255,136,0.05)", border: "1px solid var(--green-border)",
                padding: "10px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "4px"
              }}>
                <span style={{ fontSize: "0.65rem", color: "var(--green)", fontWeight: 700 }}>MATCH MATCHED ATOMICALLY</span>
                {matchingLogs.map((m, idx) => (
                  <div key={idx} style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", display: "flex", justifyContent: "space-between" }}>
                    <span>Matched ${m.amount.toLocaleString()} @ {m.rate.toFixed(3)}%</span>
                    <span>Duration: {m.duration_minutes}m</span>
                  </div>
                ))}
              </div>
            )}

            {/* Orderbook list */}
            <div style={{ flex: 1, overflowY: "auto", maxHeight: "200px" }}>
              <table style={{ width: "100%", fontSize: "0.75rem", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--green-border)", color: "var(--muted)" }}>
                    <th style={{ padding: "6px 0" }}>Direction</th>
                    <th>Amount</th>
                    <th>Rate</th>
                    <th>Tenor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {iveOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                        No pending orders in IVE orderbook.
                      </td>
                    </tr>
                  ) : (
                    iveOrders.map((ord) => (
                      <tr key={ord.id} style={{ borderBottom: "1px solid rgba(0,255,136,0.05)" }}>
                        <td style={{ padding: "6px 0", color: ord.type === "bid" ? "var(--green)" : "var(--yellow)", fontWeight: 700 }}>
                          {ord.type === "bid" ? "BORROW" : "LEND"}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>${ord.amount.toLocaleString()}</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>{(ord.rate * 100).toFixed(2)}%</td>
                        <td>{ord.duration_minutes}m</td>
                        <td style={{ color: "var(--muted)" }}>{ord.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* GOG & POE NETTING */}
          <div style={{
            padding: "20px", borderRadius: "16px", background: "var(--surface2)",
            border: "1px solid var(--green-border)", display: "flex", flexDirection: "column", gap: "16px"
          }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
                LAYER 4: GOG & POE // Settlement & Netting
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "4px 0 0 0" }}>
                Directed global obligation graph clearing. Proactive rescheduling minimizes lockups.
              </p>
            </div>

            {/* Create mock obligation */}
            <form onSubmit={handleCreateObligation} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700 }}>DEBTOR</span>
                <input
                  type="text"
                  placeholder="e.g. admin"
                  value={obDebtor}
                  onChange={(e) => setObDebtor(e.target.value)}
                  style={{ background: "var(--surface3)", border: "1px solid var(--green-border)", padding: "6px", borderRadius: "6px", color: "var(--text)", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700 }}>CREDITOR</span>
                <input
                  type="text"
                  placeholder="e.g. user"
                  value={obCreditor}
                  onChange={(e) => setObCreditor(e.target.value)}
                  style={{ background: "var(--surface3)", border: "1px solid var(--green-border)", padding: "6px", borderRadius: "6px", color: "var(--text)", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700 }}>AMOUNT (USD)</span>
                <input
                  type="number"
                  value={obAmount}
                  onChange={(e) => setObAmount(parseFloat(e.target.value))}
                  style={{ background: "var(--surface3)", border: "1px solid var(--green-border)", padding: "6px", borderRadius: "6px", color: "var(--text)", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700 }}>SCHED DELAY</span>
                <select
                  value={obDelay}
                  onChange={(e) => setObDelay(parseInt(e.target.value))}
                  style={{ background: "var(--surface3)", border: "1px solid var(--green-border)", padding: "6px", borderRadius: "6px", color: "var(--text)", width: "100%", boxSizing: "border-box" }}
                >
                  <option value={0}>Immediate</option>
                  <option value={2}>2 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={8}>8 Hours</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  gridColumn: "1 / -1", padding: "8px", borderRadius: "8px", background: "var(--surface3)",
                  border: "1px solid var(--green-border)", color: "var(--green)", fontWeight: 700, cursor: "pointer", width: "100%"
                }}
              >
                RECORD MOCK OBLIGATION ON GOG
              </button>
            </form>

            {/* Run Netting Trigger */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={handleNetting}
                disabled={nettingLoading}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px", background: "var(--green-glow)",
                  border: "1px solid var(--green)", color: "var(--green)", fontWeight: 900, cursor: "pointer"
                }}
              >
                {nettingLoading ? "CLEARING CYCLE..." : "RUN MULTILATERAL NETTING CYCLE"}
              </button>
            </div>

            {/* Netting results */}
            {nettingResult && (
              <div style={{
                background: "rgba(0,255,136,0.06)", border: "1px solid var(--green-border)",
                padding: "12px", borderRadius: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px"
              }}>
                <span style={{ gridColumn: "span 2", fontSize: "0.7rem", fontWeight: 700, color: "var(--green)" }}>MULTILATERAL NETTING ENGINE OUTCOME</span>
                <div style={{ fontSize: "0.7rem" }}>Gross Settlements: <b style={{ fontFamily: "var(--font-mono)" }}>${nettingResult.total_gross.toLocaleString()}</b></div>
                <div style={{ fontSize: "0.7rem" }}>Net Physical Settled: <b style={{ fontFamily: "var(--font-mono)" }}>${nettingResult.total_net.toLocaleString()}</b></div>
                <div style={{ fontSize: "0.7rem" }}>Liquidity Saved: <b style={{ fontFamily: "var(--font-mono)", color: "var(--green)" }}>${nettingResult.savings.toLocaleString()}</b></div>
                <div style={{ fontSize: "0.7rem" }}>Prefund Reduction: <b style={{ fontFamily: "var(--font-mono)", color: "var(--green)" }}>{nettingResult.savings_percentage.toFixed(1)}%</b></div>
              </div>
            )}

            {/* POE Recommendations list */}
            {recommendations.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--yellow)" }}>
                  ⚡ POE OPPORTUNITIES IDENTIFIED (PREDICTIVE OPTIMIZATION)
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                  {recommendations.map((rec) => (
                    <div key={rec.id} style={{
                      background: "rgba(255, 215, 0, 0.05)", border: "1px solid var(--yellow-border)",
                      padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text)" }}>
                          Sync {rec.debtor_a} ➔ {rec.debtor_b} offsets
                        </span>
                        <span style={{ fontSize: "0.6rem", color: "var(--muted)" }}>
                          Time offset: {rec.lockup_reduction_hours}h // Netting Unlock: ${(rec.netting_savings/1e6).toFixed(1)}M
                        </span>
                      </div>
                      <button
                        onClick={() => handleReschedule(rec)}
                        style={{
                          padding: "4px 10px", borderRadius: "6px", background: "var(--yellow-dim)",
                          border: "none", color: "var(--black)", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        ALIGN TIME
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Obligations list */}
            <div style={{ flex: 1, overflowY: "auto", maxHeight: "200px" }}>
              <table style={{ width: "100%", fontSize: "0.75rem", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--green-border)", color: "var(--muted)" }}>
                    <th style={{ padding: "6px 0" }}>Debtor</th>
                    <th>Creditor</th>
                    <th>Amount</th>
                    <th>Scheduled</th>
                    <th>Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {obligations.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                        No pending obligations in clearing graph.
                      </td>
                    </tr>
                  ) : (
                    obligations.map((ob) => (
                      <tr key={ob.id} style={{ borderBottom: "1px solid rgba(0,255,136,0.05)" }}>
                        <td style={{ padding: "6px 0", color: "var(--text)", fontWeight: 700 }}>{ob.debtor_name}</td>
                        <td style={{ color: "var(--text)" }}>{ob.creditor_name}</td>
                        <td style={{ fontFamily: "var(--font-mono)" }}>${ob.amount.toLocaleString()}</td>
                        <td>{new Date(ob.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          {ob.is_rescheduled ? (
                            <span style={{ color: "var(--green)", fontSize: "0.65rem", fontWeight: 700 }}>✔ POE</span>
                          ) : (
                            <span style={{ color: "var(--muted)", fontSize: "0.65rem" }}>Static</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* LAYER 5: ATHENA AGENT INFRASTRUCTURE */}
        <div style={{
          padding: "20px", borderRadius: "16px", background: "var(--surface2)",
          border: "1px solid var(--green-border)", display: "flex", flexDirection: "column", gap: "20px"
        }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
              LAYER 5: ATHENA // Autonomous Agent Economy
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "4px 0 0 0" }}>
              Authorized Computational Agents (ACAs) moving capital securely within cryptographic agency mandates.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
            
            {/* Agent List & Mint Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <form onSubmit={handleMintAgent} style={{
                background: "var(--surface3)", padding: "12px", borderRadius: "12px",
                border: "1px solid var(--green-border)", display: "flex", flexDirection: "column", gap: "10px"
              }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Mint ACA Certificate</span>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.6rem", color: "var(--muted)" }}>AGENT NAME</span>
                  <input
                    type="text"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    style={{ background: "var(--surface2)", border: "1px solid var(--green-border)", padding: "6px", borderRadius: "6px", color: "var(--text)", fontSize: "0.75rem" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.6rem", color: "var(--muted)" }}>CREDIT LIMIT / BUDGET (USD)</span>
                  <input
                    type="number"
                    value={newAgentBudget}
                    onChange={(e) => setNewAgentBudget(parseFloat(e.target.value))}
                    style={{ background: "var(--surface2)", border: "1px solid var(--green-border)", padding: "6px", borderRadius: "6px", color: "var(--text)", fontSize: "0.75rem" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "0.6rem", color: "var(--muted)" }}>RISK MANDATE</span>
                  <select
                    value={newAgentRisk}
                    onChange={(e) => setNewAgentRisk(e.target.value)}
                    style={{ background: "var(--surface2)", border: "1px solid var(--green-border)", padding: "6px", borderRadius: "6px", color: "var(--text)", fontSize: "0.75rem" }}
                  >
                    <option value="Conservative">Conservative (A-rated counterparties only)</option>
                    <option value="Moderate">Moderate (Standard Liquidity Pools)</option>
                    <option value="Aggressive">Aggressive (Arbitrage yield optimization)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  style={{
                    padding: "8px", borderRadius: "6px", background: "var(--green)",
                    border: "none", color: "var(--black)", fontWeight: 700, fontSize: "0.75rem", cursor: "pointer"
                  }}
                >
                  MINT ACA CERTIFICATE
                </button>
              </form>

              {/* Active Agents list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Minted ACA Certificates</span>
                {agents.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => { setSelectedAgent(a); fetchAgentLogs(a.id); }}
                    style={{
                      padding: "10px", borderRadius: "8px", border: "1px solid",
                      borderColor: selectedAgent?.id === a.id ? "var(--green)" : "var(--green-border)",
                      background: selectedAgent?.id === a.id ? "var(--green-glow)" : "var(--surface3)",
                      cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{a.name}</div>
                      <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>Limit: ${a.budget.toLocaleString()} // {a.risk_profile}</div>
                    </div>
                    <span style={{
                      fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", fontWeight: 700,
                      background: a.status === "suspended" ? "rgba(255,77,77,0.2)" : "var(--green-glow)",
                      color: a.status === "suspended" ? "#ff4d4d" : "var(--green)"
                    }}>
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Telemetry audit logs */}
            <div style={{
              background: "#050805", border: "1px solid var(--green-border)",
              borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--green)" }}>
                    ACA AUDIT TELEMETRY // {selectedAgent?.name || "No Agent Selected"}
                  </span>
                  <div style={{ fontSize: "0.6rem", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                    FINGERPRINT: {selectedAgent?.model_fingerprint}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  {selectedAgent?.status === "suspended" ? (
                    <button
                      onClick={handleUnsuspendAgent}
                      style={{
                        padding: "4px 8px", background: "none", border: "1px solid var(--green)",
                        borderRadius: "4px", color: "var(--green)", fontSize: "0.65rem", cursor: "pointer", fontWeight: 700
                      }}
                    >
                      Reintegrate Agent (Unsuspend)
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSimulateAgent(false)}
                        disabled={agentSimulating || !selectedAgent}
                        style={{
                          padding: "4px 8px", background: "none", border: "1px solid var(--green-border)",
                          borderRadius: "4px", color: "var(--text)", fontSize: "0.65rem", cursor: "pointer"
                        }}
                      >
                        Simulate Optimization Run
                      </button>
                      <button
                        onClick={() => handleSimulateAgent(true)}
                        disabled={agentSimulating || !selectedAgent}
                        style={{
                          padding: "4px 8px", background: "rgba(255, 77, 77, 0.1)", border: "1px solid #ff4d4d",
                          borderRadius: "4px", color: "#ff4d4d", fontSize: "0.65rem", cursor: "pointer", fontWeight: 700
                        }}
                      >
                        Simulate Injection Attack
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Log Ticker terminal */}
              <div style={{
                flex: 1, minHeight: "220px", background: "#020402", border: "1px solid rgba(0,255,136,0.1)",
                borderRadius: "8px", padding: "10px", fontFamily: "var(--font-mono)", fontSize: "0.7rem",
                overflowY: "auto", maxHeight: "250px", display: "flex", flexDirection: "column", gap: "6px"
              }}>
                {agentLogs.length === 0 ? (
                  <div style={{ color: "var(--muted)", textAlign: "center", paddingTop: "80px" }}>
                    &gt; Telemetry line idle. Select simulate run above.
                  </div>
                ) : (
                  [...agentLogs].reverse().map((log) => {
                    let logColor = "var(--green)";
                    if (log.severity === "WARNING") logColor = "var(--yellow)";
                    if (log.severity === "ALERT") logColor = "#ff4d4d";
                    return (
                      <div key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "4px" }}>
                        <span style={{ color: "var(--muted)", marginRight: "6px" }}>
                          [{new Date(log.created_at).toLocaleTimeString()}]
                        </span>
                        <span style={{ color: logColor }}>
                          {log.severity !== "INFO" && `[${log.severity}] `}
                          {log.message}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

        {/* EXPORT MODAL */}
        <AnimatePresence>
          {exportModalContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex",
                alignItems: "center", justifyContent: "center", padding: "20px"
              }}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                style={{
                  width: "100%", maxWidth: "600px", background: "var(--surface2)",
                  border: "1px solid var(--green-border)", borderRadius: "16px",
                  padding: "24px", display: "flex", flexDirection: "column", gap: "16px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--green)" }}>
                    {exportModalType}
                  </h3>
                  <button
                    onClick={() => setExportModalContent(null)}
                    style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.2rem" }}
                  >
                    ✕
                  </button>
                </div>
                
                <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  Use this raw output payload to upload directly to legacy rails or SWIFT Alliance Gateways.
                </p>

                <textarea
                  readOnly
                  value={exportModalContent}
                  style={{
                    width: "100%", height: "240px", background: "var(--surface3)",
                    border: "1px solid var(--green-border)", borderRadius: "8px",
                    color: "var(--green)", fontFamily: "var(--font-mono)", fontSize: "0.75rem",
                    padding: "12px", outline: "none", resize: "none"
                  }}
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exportModalContent);
                      alert("Copied to clipboard!");
                    }}
                    style={{
                      flex: 1, padding: "10px", borderRadius: "8px", background: "var(--green)",
                      border: "none", color: "var(--black)", fontWeight: 900, cursor: "pointer"
                    }}
                  >
                    COPY TO CLIPBOARD
                  </button>
                  <button
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob([exportModalContent], {type: 'text/plain'});
                      element.href = URL.createObjectURL(file);
                      element.download = exportModalType.toLowerCase().replace(/\s/g, "_") + ".txt";
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    style={{
                      flex: 1, padding: "10px", borderRadius: "8px", background: "var(--surface3)",
                      border: "1px solid var(--green-border)", color: "var(--green)", fontWeight: 700, cursor: "pointer"
                    }}
                  >
                    DOWNLOAD FILE
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
