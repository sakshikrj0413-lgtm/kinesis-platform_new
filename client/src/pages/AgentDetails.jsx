import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import DashboardLayout from "../layouts/DashboardLayout";
import useAgentsStore from "../store/agentsStore";
import socket from "../socket";

const t = {
  green: "#00ff88",
  greenGlow: "rgba(0,255,136,0.18)",
  greenBorder: "rgba(0,255,136,0.25)",
  yellow: "#ffd700",
  yellowGlow: "rgba(255,215,0,0.2)",
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

function TerminalLog({ logs }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getEventColor = (eventType) => {
    switch (eventType) {
      case "bet_placed":
      case "bet_won":
        return t.green;
      case "bet_lost":
      case "stop_loss":
        return t.red;
      case "edge_detected":
        return t.green;
      case "started":
        return t.green;
      case "stopped":
        return t.yellow;
      default:
        return t.muted;
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour12: false });
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(5,8,5,0.8)",
        border: "1px solid rgba(17,24,17,0.5)",
        borderRadius: 16,
        padding: 16,
        fontFamily: t.fontMono,
        fontSize: 14,
        height: 320,
        overflowY: "auto",
      }}
    >
      {logs.length === 0 ? (
        <div style={{ color: t.muted, textAlign: "center", paddingTop: 32, paddingBottom: 32 }}>No logs yet...</div>
      ) : (
        logs.map((log, i) => (
          <div
            key={log.id}
            style={{
              paddingTop: 4,
              paddingBottom: 4,
              borderBottom: i < logs.length - 1 ? "1px solid rgba(17,24,17,0.3)" : "none",
            }}
          >
            <span style={{ color: t.muted }}>[{formatTime(log.created_at)}]</span>{" "}
            <span style={{ color: getEventColor(log.event_type) }}>{log.message}</span>
          </div>
        ))
      )}
      <div ref={logEndRef} />
    </div>
  );
}

function AnalyticsChart({ data, dataKey, color, label }) {
  return (
    <div
      style={{
        backgroundColor: "rgba(11,15,11,0.6)",
        border: "1px solid rgba(17,24,17,0.5)",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <h4 style={{ color: t.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, marginBottom: 12 }}>
        {label}
      </h4>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.surface3} />
          <XAxis dataKey="time" tick={{ fill: t.muted, fontSize: 10 }} />
          <YAxis tick={{ fill: t.muted, fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: t.surface2,
              border: `1px solid ${t.surface3}`,
              borderRadius: 8,
            }}
            labelStyle={{ color: t.muted }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={`${color}20`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AgentDetails() {
  const { id } = useParams();
  const { activeAgent, logs, positions, loadAgent, loadAgentLogs, loadAgentPositions, startAgent, stopAgent, loading } = useAgentsStore();
  const [chartData, setChartData] = useState([]);
  const [backHover, setBackHover] = useState(false);
  const [actionHover, setActionHover] = useState(false);

  useEffect(() => {
    loadAgent(parseInt(id));
    loadAgentLogs(parseInt(id), 100);
    loadAgentPositions(parseInt(id));
  }, [id]);

  useEffect(() => {
    const handleBet = (data) => {
      if (data.agent_id === parseInt(id)) {
        loadAgentLogs(parseInt(id), 100);
        loadAgentPositions(parseInt(id));
        loadAgent(parseInt(id));
      }
    };
    const handleAlert = (data) => {
      if (data.agent_id === parseInt(id)) {
        loadAgentLogs(parseInt(id), 100);
        loadAgent(parseInt(id));
      }
    };
    const handleProfit = (data) => {
      if (data.agent_id === parseInt(id)) {
        loadAgent(parseInt(id));
      }
    };

    socket.on("agent_bet", handleBet);
    socket.on("agent_alert", handleAlert);
    socket.on("agent_profit_update", handleProfit);

    return () => {
      socket.off("agent_bet", handleBet);
      socket.off("agent_alert", handleAlert);
      socket.off("agent_profit_update", handleProfit);
    };
  }, [id]);

  useEffect(() => {
    if (activeAgent) {
      const now = new Date().toLocaleTimeString("en-US", { hour12: false });
      setChartData((prev) => [
        ...prev.slice(-20),
        {
          time: now,
          profit: activeAgent.total_profit,
          roi: activeAgent.roi,
          winRate: activeAgent.win_rate,
        },
      ]);
    }
  }, [activeAgent]);

  if (!activeAgent) {
    return (
      <DashboardLayout>
        <style>{keyframesStyle}</style>
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
      </DashboardLayout>
    );
  }

  const isRunning = activeAgent.status === "running";

  return (
    <DashboardLayout>
      <style>{keyframesStyle}</style>
      <div style={{ maxWidth: 1280, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link
              to="/agents"
              onMouseEnter={() => setBackHover(true)}
              onMouseLeave={() => setBackHover(false)}
              style={{ color: backHover ? t.text : t.muted, transition: "color 0.3s" }}
            >
              <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, fontFamily: t.fontDisplay, color: t.text }}>
                  {activeAgent.name}
                </h1>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 4,
                    paddingBottom: 4,
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    backgroundColor: isRunning ? t.greenGlow : t.surface3,
                    color: isRunning ? t.green : t.muted,
                    fontFamily: t.fontDisplay,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: isRunning ? t.green : t.muted,
                      animation: isRunning ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
                    }}
                  />
                  {activeAgent.status}
                </span>
              </div>
              <p style={{ color: t.muted, fontSize: 14, margin: 0 }}>
                {activeAgent.sport} / {activeAgent.strategy}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isRunning ? (
              <button
                onClick={() => stopAgent(parseInt(id))}
                onMouseEnter={() => setActionHover(true)}
                onMouseLeave={() => setActionHover(false)}
                style={{
                  paddingLeft: 16,
                  paddingRight: 16,
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
                Stop Agent
              </button>
            ) : (
              <button
                onClick={() => startAgent(parseInt(id))}
                onMouseEnter={() => setActionHover(true)}
                onMouseLeave={() => setActionHover(false)}
                style={{
                  paddingLeft: 16,
                  paddingRight: 16,
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
                Start Agent
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ backgroundColor: "rgba(11,15,11,0.6)", border: "1px solid rgba(17,24,17,0.5)", borderRadius: 16, padding: 16 }}>
            <div style={{ color: t.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Profit</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: activeAgent.total_profit >= 0 ? t.green : t.red,
                fontFamily: t.fontDisplay,
              }}
            >
              {activeAgent.total_profit >= 0 ? "+" : ""}{activeAgent.total_profit.toFixed(2)} GU
            </div>
          </div>
          <div style={{ backgroundColor: "rgba(11,15,11,0.6)", border: "1px solid rgba(17,24,17,0.5)", borderRadius: 16, padding: 16 }}>
            <div style={{ color: t.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>ROI</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: activeAgent.roi >= 0 ? t.green : t.red,
                fontFamily: t.fontDisplay,
              }}
            >
              {activeAgent.roi >= 0 ? "+" : ""}{activeAgent.roi.toFixed(1)}%
            </div>
          </div>
          <div style={{ backgroundColor: "rgba(11,15,11,0.6)", border: "1px solid rgba(17,24,17,0.5)", borderRadius: 16, padding: 16 }}>
            <div style={{ color: t.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Win Rate</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: t.green, fontFamily: t.fontDisplay }}>
              {activeAgent.win_rate.toFixed(1)}%
            </div>
          </div>
          <div style={{ backgroundColor: "rgba(11,15,11,0.6)", border: "1px solid rgba(17,24,17,0.5)", borderRadius: 16, padding: 16 }}>
            <div style={{ color: t.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Trades</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: t.text, fontFamily: t.fontDisplay }}>
              {activeAgent.total_trades}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 24, marginBottom: 24 }}>
          <AnalyticsChart data={chartData} dataKey="profit" color={t.green} label="Profit (GU)" />
          <AnalyticsChart data={chartData} dataKey="roi" color={t.green} label="ROI (%)" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3
            style={{
              color: t.muted,
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: t.fontDisplay,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: t.green,
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                display: "inline-block",
              }}
            />
            Live Terminal
          </h3>
          <TerminalLog logs={logs} />
        </div>

        <div>
          <h3
            style={{
              color: t.muted,
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 12,
              fontFamily: t.fontDisplay,
            }}
          >
            Positions
          </h3>
          {positions.length === 0 ? (
            <div
              style={{
                backgroundColor: "rgba(11,15,11,0.6)",
                border: "1px solid rgba(17,24,17,0.5)",
                borderRadius: 16,
                padding: 32,
                textAlign: "center",
                color: t.muted,
              }}
            >
              No positions yet
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "rgba(11,15,11,0.6)",
                border: "1px solid rgba(17,24,17,0.5)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(17,24,17,0.5)" }}>
                    <th style={{ textAlign: "left", padding: 12, color: t.muted, fontWeight: 400 }}>Market</th>
                    <th style={{ textAlign: "left", padding: 12, color: t.muted, fontWeight: 400 }}>Side</th>
                    <th style={{ textAlign: "left", padding: 12, color: t.muted, fontWeight: 400 }}>Stake</th>
                    <th style={{ textAlign: "left", padding: 12, color: t.muted, fontWeight: 400 }}>Odds</th>
                    <th style={{ textAlign: "left", padding: 12, color: t.muted, fontWeight: 400 }}>PnL</th>
                    <th style={{ textAlign: "left", padding: 12, color: t.muted, fontWeight: 400 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(17,24,17,0.3)" }}>
                      <td style={{ padding: 12, color: t.text }}>#{p.market_id}</td>
                      <td style={{ padding: 12 }}>
                        <span
                          style={{
                            paddingLeft: 8,
                            paddingRight: 8,
                            paddingTop: 2,
                            paddingBottom: 2,
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            backgroundColor: p.side === "BACK" ? t.greenGlow : t.redGlow,
                            color: p.side === "BACK" ? t.green : t.red,
                          }}
                        >
                          {p.side}
                        </span>
                      </td>
                      <td style={{ padding: 12, color: t.text, fontFamily: t.fontMono }}>{p.stake.toFixed(2)}</td>
                      <td style={{ padding: 12, color: t.text, fontFamily: t.fontMono }}>{p.odds.toFixed(2)}</td>
                      <td
                        style={{
                          padding: 12,
                          fontFamily: t.fontMono,
                          fontWeight: 700,
                          color: p.pnl >= 0 ? t.green : t.red,
                        }}
                      >
                        {p.pnl >= 0 ? "+" : ""}{p.pnl.toFixed(2)}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span
                          style={{
                            paddingLeft: 8,
                            paddingRight: 8,
                            paddingTop: 2,
                            paddingBottom: 2,
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            backgroundColor:
                              p.status === "won" ? t.greenGlow :
                              p.status === "lost" ? t.redGlow :
                              t.yellowGlow,
                            color:
                              p.status === "won" ? t.green :
                              p.status === "lost" ? t.red :
                              t.yellow,
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
