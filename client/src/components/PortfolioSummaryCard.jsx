import { useCallback, useState } from "react";

import { Link } from "react-router-dom";

import API from "../api/axios";

import socket from "../socket";

import useAuthToken from "../hooks/useAuthToken";

import useAuthenticatedPolling, { PORTFOLIO_SOCKET_EVENTS } from "../hooks/useAuthenticatedPolling";

const G = "#00ff88";
const B = "#050805";
const S = "#0b0f0b";
const S2 = "#111811";
const TX = "#e8f5e8";
const M = "#6b8a6b";

export default function PortfolioSummaryCard() {

  const token = useAuthToken();

  const [summary, setSummary] = useState(null);

  const fetchSummary = useCallback(async () => {

    if (!token) {

      setSummary(null);

      return;

    }

    try {

      const res = await API.get("/portfolio/summary");

      setSummary(res.data);

    } catch (err) {

      if (err.response?.status !== 401) {

        console.error(err);

      }

      setSummary(null);

    }

  }, [token]);

  useAuthenticatedPolling(fetchSummary, {

    socket,

    socketEvents: PORTFOLIO_SOCKET_EVENTS,

  });

  if (!token) {

    return null;

  }

  if (!summary) {

    return (
      <>
        <style>{`@keyframes kpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        <div
          style={{
            backgroundColor: "rgba(5,8,5,0.9)",
            border: "1px solid rgba(17,24,17,0.6)",
            borderRadius: 8,
            padding: 16,
            animation: "kpulse 2s ease-in-out infinite",
            height: 128,
          }}
        />
      </>
    );

  }

  const pnlColor = summary.total_pnl >= 0 ? G : "#ff4444";

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
            backgroundColor: "rgba(11,15,11,0.6)",
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
            Portfolio
          </span>
          <Link
            to="/portfolio"
            style={{
              fontSize: 9,
              color: G,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textDecoration: "none",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Full →
          </Link>
        </div>

        <div
          style={{
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>

            <span style={{ color: "#3a5a3a" }}>Total PnL</span>

            <span style={{ fontSize: 18, fontWeight: 700, color: pnlColor }}>
              {summary.total_pnl >= 0 ? "+" : ""}${summary.total_pnl?.toFixed(2)}
            </span>

          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>

            <div>
              <p style={{ color: "#3a5a3a", fontSize: 9, textTransform: "uppercase", margin: 0 }}>Exposure</p>
              <p style={{ color: TX, fontWeight: 700, margin: 0 }}>${summary.open_exposure?.toFixed(0)}</p>
            </div>

            <div>
              <p style={{ color: "#3a5a3a", fontSize: 9, textTransform: "uppercase", margin: 0 }}>Balance</p>
              <p style={{ color: G, fontWeight: 700, margin: 0 }}>${summary.wallet_balance?.toFixed(0)}</p>
            </div>

            <div>
              <p style={{ color: "#3a5a3a", fontSize: 9, textTransform: "uppercase", margin: 0 }}>Win Rate</p>
              <p style={{ color: TX, fontWeight: 700, margin: 0 }}>{summary.win_rate}%</p>
            </div>

            <div>
              <p style={{ color: "#3a5a3a", fontSize: 9, textTransform: "uppercase", margin: 0 }}>ROI</p>
              <p style={{ fontWeight: 700, margin: 0, color: summary.roi_percent >= 0 ? G : "#ff4444" }}>
                {summary.roi_percent}%
              </p>
            </div>

          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 4,
              borderTop: "1px solid rgba(17,24,17,0.4)",
              fontSize: 9,
              color: "#3a5a3a",
            }}
          >
            <span>{summary.active_positions} open</span>
            <span>Avail ${summary.available_liquidity?.toFixed(0)}</span>
          </div>

        </div>

      </div>
    </>
  );

}
