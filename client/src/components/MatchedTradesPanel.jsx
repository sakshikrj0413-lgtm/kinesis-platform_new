import { useEffect, useState } from "react";
import API from "../api/axios";
import socket from "../socket";

export default function MatchedTradesPanel({ marketId }) {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    if (!marketId) return;
    fetchTrades();

    const onMatched = (data) => {
      if (data.market_id === parseInt(marketId)) {
        setTrades((prev) => [
          {
            id: data.bet_id,
            side: "MATCHED",
            stake: data.matched_amount,
            status: "MATCHED",
            created_at: data.timestamp,
            flash: true,
          },
          ...prev,
        ].slice(0, 20));
      }
    };

    const onActivity = () => fetchTrades();

    socket.on("bet_matched", onMatched);
    socket.on("market_update", onActivity);
    socket.on("live_activity", onActivity);

    const interval = setInterval(fetchTrades, 8000);
    return () => {
      clearInterval(interval);
      socket.off("bet_matched", onMatched);
      socket.off("market_update", onActivity);
      socket.off("live_activity", onActivity);
    };
  }, [marketId]);

  const fetchTrades = async () => {
    try {
      const res = await API.get(`/markets/${marketId}/activity`);
      setTrades(res.data.recent_bets || []);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "--:--:--";
    return new Date(ts).toLocaleTimeString("en-US", { hour12: false });
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(5,8,5,0.9)",
        border: "1px solid rgba(22,30,22,0.6)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes kinesis-flash {
          0% { background-color: rgba(0,255,136,0.08); }
          100% { background-color: transparent; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 6,
          paddingBottom: 6,
          borderBottom: "1px solid rgba(22,30,22,0.6)",
          backgroundColor: "rgba(11,15,11,0.6)",
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#6b8a6b",
          }}
        >
          Recent Trades · Liquidity
        </span>
        <span
          style={{
            fontSize: 9,
            color: "rgba(0,255,136,0.7)",
            fontFamily: "'Space Mono', monospace",
          }}
        >
          {trades.length} events
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            fontSize: 10,
            fontFamily: "'Space Mono', monospace",
            minWidth: 600,
          }}
        >
          <thead>
            <tr
              style={{
                color: "#6b8a6b",
                borderBottom: "1px solid rgba(22,30,22,0.4)",
              }}
            >
              <th
                style={{
                  textAlign: "left",
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontWeight: 400,
                }}
              >
                Time
              </th>
              <th
                style={{
                  textAlign: "left",
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontWeight: 400,
                }}
              >
                Side
              </th>
              <th
                style={{
                  textAlign: "right",
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontWeight: 400,
                }}
              >
                Stake
              </th>
              <th
                style={{
                  textAlign: "right",
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontWeight: 400,
                }}
              >
                Odds
              </th>
              <th
                style={{
                  textAlign: "right",
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontWeight: 400,
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    color: "#6b8a6b",
                    paddingTop: 12,
                    paddingBottom: 12,
                  }}
                >
                  No trades yet
                </td>
              </tr>
            ) : (
              trades.map((t, i) => {
                const sideColor =
                  t.side === "BACK"
                    ? "#00ff88"
                    : t.side === "LAY"
                    ? "#ff4444"
                    : "#00ff88";
                const statusColor =
                  t.status === "MATCHED"
                    ? "#00ff88"
                    : t.status === "OPEN"
                    ? "rgba(0,255,136,0.7)"
                    : "#6b8a6b";
                const flashAnim =
                  t.flash || i === 0
                    ? "kinesis-flash 1.5s ease-out"
                    : "none";
                return (
                  <tr
                    key={`${t.id}-${i}`}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(11,15,11,0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    style={{
                      borderBottom: "1px solid rgba(11,15,11,0.8)",
                      transition: "background-color 0.2s",
                      animation: flashAnim,
                    }}
                  >
                    <td
                      style={{
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        color: "#6b8a6b",
                      }}
                    >
                      {formatTime(t.created_at)}
                    </td>
                    <td
                      style={{
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 4,
                        paddingBottom: 4,
                        fontWeight: 700,
                        color: sideColor,
                      }}
                    >
                      {t.side}
                    </td>
                    <td
                      style={{
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 4,
                        paddingBottom: 4,
                        textAlign: "right",
                        color: "#e8f5e8",
                      }}
                    >
                      ${(t.stake || 0).toFixed(0)}
                    </td>
                    <td
                      style={{
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 4,
                        paddingBottom: 4,
                        textAlign: "right",
                        color: "rgba(255,215,0,0.9)",
                      }}
                    >
                      {(t.odds || 0).toFixed(2)}
                    </td>
                    <td
                      style={{
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        textAlign: "right",
                      }}
                    >
                      <span style={{ color: statusColor }}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
