import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import useArbitrageStore from "../store/arbitrageStore";
import socket from "../socket";

function FlashingCell({ value, prevValue, color = "var(--green)" }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevValue !== undefined && value !== prevValue) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [value, prevValue]);

  return (
    <motion.span
      style={{ color, fontFamily: "var(--font-mono)", fontWeight: 700 }}
      animate={flash ? { opacity: [1, 0.5, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] } : {}}
      transition={{ duration: 0.8 }}
    >
      {value}
    </motion.span>
  );
}

function EdgeBadge({ edge, guaranteed }) {
  return (
    <motion.div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 8px",
        borderRadius: "8px",
        fontSize: "12px",
        fontWeight: 700,
        backgroundColor: guaranteed ? "var(--green-glow)" : "var(--yellow-border)",
        color: guaranteed ? "var(--green)" : "var(--yellow)",
        border: guaranteed ? "1px solid var(--green-border)" : "1px solid var(--yellow-border)",
        boxShadow: guaranteed ? "0 0 15px var(--green-glow)" : "none",
      }}
      animate={guaranteed ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      {guaranteed && (
        <motion.span
          style={{ width: "6px", height: "6px", borderRadius: "9999px", backgroundColor: "var(--green)" }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
      +{edge.toFixed(1)}%
      {guaranteed && " GUARANTEED"}
    </motion.div>
  );
}

function ConfidenceIndicator({ score }) {
  const barColor = score >= 80 ? "var(--green)" : score >= 60 ? "var(--yellow)" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "64px", height: "8px", backgroundColor: "var(--surface2)", borderRadius: "9999px", overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", backgroundColor: barColor, borderRadius: "9999px" }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span style={{ color: "var(--muted)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>{score.toFixed(0)}%</span>
    </div>
  );
}

export default function Arbitrage() {
  const { liveOpportunities, loadLive, loading, lastUpdate } = useArbitrageStore();
  const [prevData, setPrevData] = useState({});
  const [filter, setFilter] = useState("all");
  const intervalRef = useRef(null);

  useEffect(() => {
    loadLive();
    intervalRef.current = setInterval(loadLive, 5000);

    socket.on("arb_update", (data) => {
      useArbitrageStore.getState().updateFromSocket(data);
    });

    return () => {
      clearInterval(intervalRef.current);
      socket.off("arb_update");
    };
  }, []);

  useEffect(() => {
    const prev = {};
    liveOpportunities.forEach((opp) => {
      prev[opp.market_id] = opp.edge;
    });
    setPrevData(prev);
  }, [liveOpportunities]);

  const filtered = liveOpportunities.filter((opp) => {
    if (filter === "all") return true;
    if (filter === "guaranteed") return opp.guaranteed_profit;
    if (filter === "high-edge") return opp.edge >= 8;
    if (filter === "safe") return opp.confidence >= 75;
    return true;
  });

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "30px", fontWeight: 700, display: "flex", alignItems: "center", gap: "12px" }}>
              <motion.span
                style={{ width: "12px", height: "12px", borderRadius: "9999px", backgroundColor: "var(--green)" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              Arbitrage Scanner
            </h1>
            <p style={{ color: "var(--muted)", marginTop: "4px" }}>Cross-platform odds mismatches & guaranteed profit detection</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "var(--muted)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
              {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : "--:--:--"}
            </span>
            <motion.span
              style={{ width: "8px", height: "8px", borderRadius: "9999px", backgroundColor: "var(--green)" }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <span style={{ color: "var(--green)", fontSize: "12px", fontWeight: 700 }}>LIVE</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All Opportunities" },
            { key: "guaranteed", label: "Guaranteed Profit" },
            { key: "high-edge", label: "High Edge (8%+)" },
            { key: "safe", label: "High Confidence" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: filter === f.key ? "var(--green-glow)" : "var(--surface2)",
                color: filter === f.key ? "var(--green)" : "var(--muted)",
                border: filter === f.key ? "1px solid var(--green-border)" : "1px solid var(--surface3)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && liveOpportunities.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
            <motion.div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "9999px",
                border: "4px solid var(--green-border)",
                borderTopColor: "var(--green)",
              }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: "16px", padding: "48px", textAlign: "center" }}>
            <p style={{ color: "var(--muted)", fontSize: "18px" }}>Scanning for opportunities...</p>
            <p style={{ color: "var(--surface3)", fontSize: "14px", marginTop: "8px" }}>New opportunities appear every 5 seconds</p>
          </div>
        ) : (
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--surface2)", backgroundColor: "var(--surface)" }}>
                    <th style={{ textAlign: "left", padding: "16px", color: "var(--muted)", fontWeight: 400, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Market</th>
                    <th style={{ textAlign: "left", padding: "16px", color: "var(--muted)", fontWeight: 400, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>AGON</th>
                    <th style={{ textAlign: "left", padding: "16px", color: "var(--muted)", fontWeight: 400, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Betfair</th>
                    <th style={{ textAlign: "left", padding: "16px", color: "var(--muted)", fontWeight: 400, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>DraftKings</th>
                    <th style={{ textAlign: "left", padding: "16px", color: "var(--muted)", fontWeight: 400, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>PolyMarket</th>
                    <th style={{ textAlign: "left", padding: "16px", color: "var(--muted)", fontWeight: 400, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Best Edge</th>
                    <th style={{ textAlign: "left", padding: "16px", color: "var(--muted)", fontWeight: 400, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confidence</th>
                    <th style={{ textAlign: "left", padding: "16px", color: "var(--muted)", fontWeight: 400, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((opp, i) => {
                    const pc = opp.platform_comparison || {};
                    const agon = pc["AGON"] || {};
                    const betfair = pc["Betfair"] || {};
                    const draftkings = pc["DraftKings"] || {};
                    const polymarket = pc["PolyMarket"] || {};

                    return (
                      <motion.tr
                        key={`${opp.market_id}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ borderBottom: "1px solid var(--surface2)", transition: "background-color 0.2s" }}
                        whileHover={{ backgroundColor: "var(--surface2)" }}
                      >
                        <td style={{ padding: "16px" }}>
                          <div style={{ color: "var(--text)", fontWeight: 600 }}>{opp.market_title}</div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <FlashingCell
                            value={Object.values(agon)[0]?.toFixed(2) || "--"}
                            prevValue={prevData[opp.market_id]}
                            color="var(--green)"
                          />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}>
                            {Object.values(betfair)[0]?.toFixed(2) || "--"}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}>
                            {Object.values(draftkings)[0]?.toFixed(2) || "--"}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}>
                            {Object.values(polymarket)[0]?.toFixed(2) || "--"}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <EdgeBadge edge={opp.edge} guaranteed={opp.guaranteed_profit} />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <ConfidenceIndicator score={opp.confidence} />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <button
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              backgroundColor: "var(--green-glow)",
                              color: "var(--green)",
                              fontSize: "12px",
                              fontWeight: 600,
                              border: "1px solid var(--green-border)",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            Trade
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "24px" }}>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: "16px", padding: "16px" }}>
            <div style={{ color: "var(--muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Opportunities</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--green)", marginTop: "4px" }}>{filtered.length}</div>
          </div>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: "16px", padding: "16px" }}>
            <div style={{ color: "var(--muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Guaranteed Profit</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--green)", marginTop: "4px" }}>
              {filtered.filter((o) => o.guaranteed_profit).length}
            </div>
          </div>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: "16px", padding: "16px" }}>
            <div style={{ color: "var(--muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Best Edge</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--green)", marginTop: "4px" }}>
              {filtered.length > 0 ? `+${Math.max(...filtered.map((o) => o.edge)).toFixed(1)}%` : "--"}
            </div>
          </div>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--surface2)", borderRadius: "16px", padding: "16px" }}>
            <div style={{ color: "var(--muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Platforms Scanned</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--green)", marginTop: "4px" }}>6</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
