import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import useAgentsStore from "../store/agentsStore";
import CreateAgentModal from "../components/CreateAgentModal";

const t = {
  green: "#00ff88",
  greenGlow: "rgba(0,255,136,0.18)",
  greenBorder: "rgba(0,255,136,0.25)",
  yellow: "#ffd700",
  yellowBorder: "rgba(255,215,0,0.25)",
  black: "#050805",
  surface: "#0b0f0b",
  surface2: "#111811",
  surface3: "#161e16",
  text: "#e8f5e8",
  muted: "#6b8a6b",
  fontDisplay: "'Syne', sans-serif",
  fontMono: "'Space Mono', monospace",
  red: "#ef4444",
  redGlow: "rgba(239,68,68,0.1)",
  redBorder: "rgba(239,68,68,0.3)",
};

const keyframesStyle = `
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
`;

function AgentCard({ agent, index, onStart, onStop }) {
  const isRunning = agent.status === "running";
  const [cardHover, setCardHover] = useState(false);
  const [detailsHover, setDetailsHover] = useState(false);
  const [actionHover, setActionHover] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setCardHover(true)}
      onMouseLeave={() => setCardHover(false)}
      style={{
        backgroundColor: "rgba(11,15,11,0.8)",
        backdropFilter: "blur(4px)",
        border: "1px solid",
        borderColor: cardHover ? "rgba(0,255,136,0.5)" : "rgba(22,30,22,0.5)",
        borderRadius: 16,
        padding: 24,
        transition: "all 0.3s ease",
        color: t.text,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h3 style={{ color: t.text, fontWeight: 700, fontSize: 18, margin: 0, fontFamily: t.fontDisplay }}>{agent.name}</h3>
          <span style={{ color: t.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {agent.sport} / {agent.strategy}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: isRunning ? t.green : t.muted,
              animation: isRunning ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              color: isRunning ? t.green : t.muted,
            }}
          >
            {agent.status}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ color: t.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>ROI</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: agent.roi >= 0 ? t.green : t.red }}>
            {(agent.roi ?? 0) >= 0 ? "+" : ""}{(agent.roi ?? 0).toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{ color: t.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Profit</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: agent.total_profit >= 0 ? t.green : t.red }}>
            {(agent.total_profit ?? 0) >= 0 ? "+" : ""}{(agent.total_profit ?? 0).toFixed(2)} GU
          </div>
        </div>
        <div>
          <div style={{ color: t.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Win Rate</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: t.green }}>{(agent.win_rate ?? 0).toFixed(1)}%</div>
        </div>
        <div>
          <div style={{ color: t.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Trades</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: t.text }}>{agent.total_trades}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16, fontSize: 14 }}>
        <div style={{ backgroundColor: "rgba(17,24,17,0.5)", borderRadius: 8, padding: 8 }}>
          <span style={{ color: t.muted }}>Min Edge</span>
          <div style={{ color: t.text, fontFamily: t.fontMono }}>{agent.min_edge}%</div>
        </div>
        <div style={{ backgroundColor: "rgba(17,24,17,0.5)", borderRadius: 8, padding: 8 }}>
          <span style={{ color: t.muted }}>Max Stake</span>
          <div style={{ color: t.text, fontFamily: t.fontMono }}>{agent.max_stake} GU</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Link
          to={`/agents/${agent.id}`}
          onMouseEnter={() => setDetailsHover(true)}
          onMouseLeave={() => setDetailsHover(false)}
          style={{
            flex: 1,
            textAlign: "center",
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 12,
            backgroundColor: detailsHover ? t.surface3 : t.surface2,
            color: t.text,
            fontWeight: 600,
            transition: "all 0.3s",
            fontSize: 14,
            fontFamily: t.fontDisplay,
            textDecoration: "none",
            display: "block",
          }}
        >
          Details
        </Link>
        {isRunning ? (
          <button
            onClick={() => onStop(agent.id)}
            onMouseEnter={() => setActionHover(true)}
            onMouseLeave={() => setActionHover(false)}
            style={{
              flex: 1,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 12,
              backgroundColor: actionHover ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.1)",
              color: t.red,
              fontWeight: 600,
              transition: "all 0.3s",
              border: "1px solid rgba(239,68,68,0.3)",
              fontSize: 14,
              fontFamily: t.fontDisplay,
              cursor: "pointer",
            }}
          >
            Stop
          </button>
        ) : (
          <button
            onClick={() => onStart(agent.id)}
            onMouseEnter={() => setActionHover(true)}
            onMouseLeave={() => setActionHover(false)}
            style={{
              flex: 1,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 12,
              backgroundColor: actionHover ? t.greenGlow : "rgba(0,255,136,0.1)",
              color: t.green,
              fontWeight: 600,
              transition: "all 0.3s",
              border: "1px solid rgba(0,255,136,0.3)",
              fontSize: 14,
              fontFamily: t.fontDisplay,
              cursor: "pointer",
            }}
          >
            Start
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function Agents() {
  const { agents, loadAgents, startAgent, stopAgent, loading } = useAgentsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createHover, setCreateHover] = useState(false);
  const [emptyBtnHover, setEmptyBtnHover] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const handleStart = async (id) => {
    await startAgent(id);
    loadAgents();
  };

  const handleStop = async (id) => {
    await stopAgent(id);
    loadAgents();
  };

  return (
    <DashboardLayout>
      <style>{keyframesStyle}</style>
      <div style={{ maxWidth: 1280, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 700, display: "flex", alignItems: "center", gap: 12, margin: 0, fontFamily: t.fontDisplay }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: t.green,
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  display: "inline-block",
                }}
              />
              AGENTEX
            </h1>
            <p style={{ color: t.muted, margin: 0, marginTop: 4 }}>Autonomous AI betting agents</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            onMouseEnter={() => setCreateHover(true)}
            onMouseLeave={() => setCreateHover(false)}
            style={{
              paddingLeft: 24,
              paddingRight: 24,
              paddingTop: 12,
              paddingBottom: 12,
              borderRadius: 12,
              background: createHover
                ? "linear-gradient(135deg, rgba(0,255,136,0.3), rgba(0,200,150,0.3))"
                : "linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,200,150,0.2))",
              border: "1px solid rgba(0,255,136,0.4)",
              color: t.green,
              fontWeight: 600,
              transition: "all 0.3s",
              fontFamily: t.fontDisplay,
              cursor: "pointer",
            }}
          >
            + Create Agent
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: "4px solid rgba(0,255,136,0.3)",
                borderTopColor: t.green,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        ) : agents.length === 0 ? (
          <div
            style={{
              backgroundColor: "rgba(11,15,11,0.6)",
              border: "1px solid rgba(17,24,17,0.5)",
              borderRadius: 16,
              padding: 48,
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, margin: 0, marginBottom: 8, fontFamily: t.fontDisplay }}>
              No Agents Yet
            </h2>
            <p style={{ color: t.muted, margin: 0, marginBottom: 24 }}>Create your first autonomous betting agent</p>
            <button
              onClick={() => setShowCreateModal(true)}
              onMouseEnter={() => setEmptyBtnHover(true)}
              onMouseLeave={() => setEmptyBtnHover(false)}
              style={{
                paddingLeft: 24,
                paddingRight: 24,
                paddingTop: 12,
                paddingBottom: 12,
                borderRadius: 12,
                backgroundColor: emptyBtnHover ? "rgba(0,255,136,0.3)" : "rgba(0,255,136,0.2)",
                border: "1px solid rgba(0,255,136,0.4)",
                color: t.green,
                fontWeight: 600,
                transition: "all 0.3s",
                fontFamily: t.fontDisplay,
                cursor: "pointer",
              }}
            >
              Create Agent
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {agents.map((agent, i) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                index={i}
                onStart={handleStart}
                onStop={handleStop}
              />
            ))}
          </div>
        )}

        {showCreateModal && (
          <CreateAgentModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              loadAgents();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
