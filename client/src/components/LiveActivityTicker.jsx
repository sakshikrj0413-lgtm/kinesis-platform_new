import { useEffect, useState, useRef } from "react";
import socket from "../socket";
import API from "../api/axios";

const G = "#00ff88";
const Y = "#ffd700";
const B = "#050805";
const S = "#0b0f0b";
const S2 = "#111811";
const TX = "#e8f5e8";
const M = "#6b8a6b";

export default function LiveActivityTicker({ marketId }) {
  const [activities, setActivities] = useState([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (marketId) loadInitial();
  }, [marketId]);

  useEffect(() => {
    const add = (activity) => {
      if (pausedRef.current) return;
      setActivities((prev) => [{ ...activity, id: Date.now() + Math.random() }, ...prev].slice(0, 20));
    };

    const onLive = (data) => {
      if (marketId && data.market_id && data.market_id !== parseInt(marketId)) return;
      add({
        trader: data.trader || "Trader",
        action: data.action,
        outcome: data.outcome,
        odds: data.odds,
        type: data.type,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    };

    const onMatched = (data) => {
      if (marketId && data.market_id !== parseInt(marketId)) return;
      const stake = data.matched_amount;
      add({
        trader: "Exchange",
        action: stake > 100 ? "large match" : "matched",
        outcome: `Bet #${data.bet_id}`,
        odds: "\u2014",
        type: "matched",
        timestamp: data.timestamp,
      });
    };

    const onOdds = (data) => {
      if (marketId && data.market_id !== parseInt(marketId)) return;
      if (data.change === "stable") return;
      add({
        trader: "Market",
        action: data.change === "up" ? "odds up" : "odds down",
        outcome: `Outcome #${data.outcome_id}`,
        odds: (data.odds * 100).toFixed(1) + "%",
        type: "odds_change",
        timestamp: new Date().toISOString(),
      });
    };

    socket.on("live_activity", onLive);
    socket.on("bet_matched", onMatched);
    socket.on("odds_update", onOdds);

    return () => {
      socket.off("live_activity", onLive);
      socket.off("bet_matched", onMatched);
      socket.off("odds_update", onOdds);
    };
  }, [marketId]);

  const loadInitial = async () => {
    try {
      const res = await API.get(`/markets/${marketId}/activity`);
      const items = (res.data.recent_bets || []).slice(0, 8).map((b) => ({
        id: b.id,
        trader: `Trader${b.id}`,
        action: b.side === "BACK" ? "backed" : "laid",
        outcome: `Outcome #${b.outcome_id}`,
        odds: b.odds,
        type: "bet",
        timestamp: b.created_at,
      }));
      setActivities(items);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const actionColor = (a) => {
    if (a === "backed" || a === "odds up") return G;
    if (a === "laid" || a === "odds down") return R;
    if (a?.includes("match")) return G;
    return M;
  };

  const R = "#ff4444";

  return (
    <>
      <style>{`
        @keyframes kpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes kticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
      <div
        style={{
          backgroundColor: "rgba(5,8,5,0.9)",
          border: "1px solid rgba(17,24,17,0.6)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 12px",
            borderBottom: "1px solid rgba(17,24,17,0.5)",
            backgroundColor: "rgba(11,15,11,0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#ff4444",
                animation: "kpulse 2s ease-in-out infinite",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#4a6a4a",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Activity
            </span>
          </div>
          <button
            onClick={() => setPaused(!paused)}
            style={{
              fontSize: 9,
              color: "#3a5a3a",
              background: "none",
              border: "none",
              cursor: "pointer",
              textTransform: "uppercase",
              fontFamily: "'Syne', sans-serif",
              padding: 0,
            }}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
        <div style={{ overflow: "hidden", height: 32, position: "relative" }}>
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "center",
              height: "100%",
              padding: "0 12px",
              whiteSpace: "nowrap",
              animation: paused ? "none" : "kticker 30s linear infinite",
            }}
          >
            {[...activities, ...activities].map((a, i) => (
              <span
                key={`${a.id}-${i}`}
                style={{
                  fontSize: 10,
                  fontFamily: "'Space Mono', monospace",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "#2a4a2a" }}>{formatTime(a.timestamp)}</span>
                <span style={{ color: "#b8d5b8", fontWeight: 600 }}>{a.trader}</span>
                <span style={{ fontWeight: 700, textTransform: "uppercase", color: actionColor(a.action) }}>
                  {a.action}
                </span>
                <span style={{ color: M }}>{a.outcome}</span>
                {a.odds !== "\u2014" && (
                  <span style={{ color: Y }}>
                    @ {typeof a.odds === "number" ? a.odds.toFixed(2) : a.odds}
                  </span>
                )}
              </span>
            ))}
            {activities.length === 0 && (
              <span
                style={{
                  fontSize: 10,
                  color: "#2a4a2a",
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                Awaiting market activity\u2026
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
