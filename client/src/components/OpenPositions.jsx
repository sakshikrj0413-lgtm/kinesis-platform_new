import { useCallback, useState } from "react";
import API from "../api/axios";
import socket from "../socket";
import useAuthToken from "../hooks/useAuthToken";
import useAuthenticatedPolling, { PORTFOLIO_SOCKET_EVENTS } from "../hooks/useAuthenticatedPolling";

const G = "#00ff88";
const Y = "#ffd700";
const B = "#050805";
const S = "#0b0f0b";
const S2 = "#111811";
const S3 = "#161e16";
const TX = "#e8f5e8";
const M = "#6b8a6b";
const R = "#ff4444";

const STATUS_COLORS = {
  OPEN: { color: G, bg: "rgba(0,255,136,0.10)" },
  PARTIAL: { color: Y, bg: "rgba(255,215,0,0.10)" },
  MATCHED: { color: G, bg: "rgba(0,255,136,0.10)" },
  WON: { color: G, bg: "rgba(0,255,136,0.10)" },
  LOST: { color: R, bg: "rgba(255,68,68,0.10)" },
};

const statusStyle = (s) => STATUS_COLORS[s] || { color: M, bg: "rgba(107,138,107,0.10)" };

export default function OpenPositions({ compact = false }) {
  const token = useAuthToken();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(!!token);
  const [expandedId, setExpandedId] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const fetchPositions = useCallback(async () => {
    if (!token) {
      setPositions([]);
      setLoading(false);
      return;
    }

    try {
      const res = await API.get("/portfolio/open-positions");
      setPositions(res.data.positions || []);
    } catch (err) {
      if (err.response?.status === 401) {
        setPositions([]);
        return;
      }
      try {
        const fallback = await API.get("/bets/my");
        setPositions(
          (fallback.data.bets || [])
            .filter((b) => ["OPEN", "PARTIAL", "MATCHED"].includes(b.status))
            .map((b) => ({
              bet_id: b.id,
              market_title: b.market_title,
              market_status: "OPEN",
              outcome_title: b.outcome_title,
              side: b.side,
              stake: b.stake,
              odds: b.odds,
              live_odds: b.odds,
              matched_amount: b.matched_amount,
              remaining_amount: b.remaining_amount,
              exposure: b.stake,
              unrealized_pnl: 0,
              status: b.status,
            }))
        );
      } catch (e) {
        if (e.response?.status !== 401) {
          console.error(e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useAuthenticatedPolling(fetchPositions, {
    intervalMs: 8000,
    socket,
    socketEvents: PORTFOLIO_SOCKET_EVENTS,
  });

  if (!token) {
    return (
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
            padding: "8px 12px",
            borderBottom: "1px solid rgba(17,24,17,0.6)",
            backgroundColor: "rgba(11,15,11,0.5)",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: M,
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Positions
          </span>
        </div>
        <p
          style={{
            color: "#2a4a2a",
            fontSize: 10,
            fontFamily: "'Space Mono', monospace",
            textAlign: "center",
            padding: "24px 0",
            margin: 0,
          }}
        >
          Sign in to view positions
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <style>{`@keyframes kpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        <div
          style={{
            backgroundColor: "rgba(5,8,5,0.9)",
            border: "1px solid rgba(17,24,17,0.6)",
            borderRadius: 8,
            height: compact ? 96 : 128,
            animation: "kpulse 2s ease-in-out infinite",
          }}
        />
      </>
    );
  }

  return (
    <>
      <style>{`@keyframes kpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
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
            padding: "8px 12px",
            borderBottom: "1px solid rgba(17,24,17,0.6)",
            backgroundColor: "rgba(11,15,11,0.5)",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: M,
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Positions
          </span>
          <span
            style={{
              fontSize: 9,
              fontFamily: "'Space Mono', monospace",
              color: "#3a5a3a",
            }}
          >
            {positions.length} active
          </span>
        </div>

        <div
          style={{
            maxHeight: compact ? 192 : 288,
            overflowY: "auto",
          }}
        >
          {positions.length === 0 ? (
            <p
              style={{
                color: "#2a4a2a",
                fontSize: 10,
                fontFamily: "'Space Mono', monospace",
                textAlign: "center",
                padding: "24px 0",
                margin: 0,
              }}
            >
              No open positions
            </p>
          ) : (
            positions.map((p) => {
              const matchedPct = p.stake ? ((p.matched_amount / p.stake) * 100).toFixed(0) : 0;
              const expanded = expandedId === p.bet_id;
              const sc = statusStyle(p.status);
              return (
                <div
                  key={p.bet_id}
                  style={{
                    borderBottom: "1px solid rgba(17,24,17,0.8)",
                    backgroundColor: hoveredRow === p.bet_id ? "rgba(11,15,11,0.4)" : "transparent",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => setExpandedId(expanded ? null : p.bet_id)}
                  onMouseEnter={() => setHoveredRow(p.bet_id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <div style={{ padding: "8px 12px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 700,
                              padding: "2px 4px",
                              borderRadius: 4,
                              color: p.side === "BACK" ? G : R,
                              backgroundColor: p.side === "BACK" ? "rgba(0,255,136,0.15)" : "rgba(255,68,68,0.15)",
                            }}
                          >
                            {p.side}
                          </span>
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 700,
                              padding: "2px 4px",
                              borderRadius: 4,
                              color: sc.color,
                              backgroundColor: sc.bg,
                            }}
                          >
                            {p.status}
                          </span>
                          {p.market_status && p.market_status !== "OPEN" && (
                            <span style={{ fontSize: 8, color: "#3a5a3a" }}>{p.market_status}</span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 10,
                            color: TX,
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            margin: 0,
                            fontFamily: "'Syne', sans-serif",
                          }}
                        >
                          {p.outcome_title}
                        </p>
                        <p
                          style={{
                            fontSize: 9,
                            color: "#3a5a3a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            margin: 0,
                            fontFamily: "'Space Mono', monospace",
                          }}
                        >
                          {p.market_title}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, fontFamily: "'Space Mono', monospace" }}>
                        <p style={{ fontSize: 11, color: TX, fontWeight: 700, margin: 0 }}>
                          ${p.stake?.toFixed(0)}
                        </p>
                        <p style={{ fontSize: 9, color: "#4a6a4a", margin: 0 }}>
                          @ {p.odds?.toFixed(2)}
                        </p>
                        {p.unrealized_pnl !== undefined && (
                          <p
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              margin: 0,
                              color: p.unrealized_pnl >= 0 ? G : R,
                            }}
                          >
                            {p.unrealized_pnl >= 0 ? "+" : ""}{p.unrealized_pnl?.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        height: 4,
                        backgroundColor: S2,
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          backgroundColor: "rgba(0,255,136,0.80)",
                          width: `${matchedPct}%`,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 2,
                        fontSize: 8,
                        fontFamily: "'Space Mono', monospace",
                        color: "#3a5a3a",
                      }}
                    >
                      <span>Exp ${p.exposure?.toFixed(0)}</span>
                      <span>{matchedPct}% matched</span>
                      <span>Live {(p.live_odds * 100)?.toFixed(1)}%</span>
                    </div>
                  </div>

                  {expanded && (
                    <div
                      style={{
                        padding: "0 12px 8px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        fontSize: 9,
                        fontFamily: "'Space Mono', monospace",
                        borderTop: "1px solid rgba(17,24,17,0.4)",
                        paddingTop: 8,
                        backgroundColor: "rgba(5,8,5,0.20)",
                      }}
                    >
                      <div>
                        <span style={{ color: "#3a5a3a" }}>Matched </span>
                        <span style={{ color: G }}>${p.matched_amount?.toFixed(2)}</span>
                      </div>
                      <div>
                        <span style={{ color: "#3a5a3a" }}>Remaining </span>
                        <span style={{ color: Y }}>${p.remaining_amount?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
