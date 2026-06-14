import { useEffect, useState, useRef } from "react";
import API from "../api/axios";
import socket from "../socket";

export default function OrderBook({ marketId, onSelectOdds, needsRefresh = false, onRefreshed }) {
  const [orderbook, setOrderbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flashRows, setFlashRows] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const prevDataRef = useRef({});
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!marketId) return;
    fetchOrderbook();
    pollingRef.current = setInterval(fetchOrderbook, 5000);

    const onOdds = (data) => {
      if (data.market_id === parseInt(marketId)) {
        setPriceChanges((p) => ({ ...p, [data.outcome_id]: data.change }));
        setTimeout(() => {
          setPriceChanges((p) => {
            const u = { ...p };
            delete u[data.outcome_id];
            return u;
          });
        }, 500);
      }
    };

    const refresh = (data) => {
      if (data.market_id === parseInt(marketId)) fetchOrderbook();
    };

    socket.on("odds_update", onOdds);
    socket.on("market_update", refresh);
    socket.on("orderbook_update", refresh);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      socket.off("odds_update", onOdds);
      socket.off("market_update", refresh);
      socket.off("orderbook_update", refresh);
    };
  }, [marketId]);

  useEffect(() => {
    if (!marketId || !needsRefresh) return;
    fetchOrderbook();
    onRefreshed?.();
  }, [marketId, needsRefresh]);

  const fetchOrderbook = async () => {
    try {
      const res = await API.get(`/markets/${marketId}/orderbook`);
      const newData = res.data;
      const flashes = {};
      if (prevDataRef.current.outcomes) {
        newData.outcomes.forEach((outcome) => {
          const prev = prevDataRef.current.outcomes?.find((o) => o.id === outcome.id);
          if (prev) {
            if (JSON.stringify(prev.back_orders) !== JSON.stringify(outcome.back_orders)) flashes[outcome.id] = "back";
            else if (JSON.stringify(prev.lay_orders) !== JSON.stringify(outcome.lay_orders)) flashes[outcome.id] = "lay";
          }
        });
      }
      if (Object.keys(flashes).length) {
        setFlashRows(flashes);
        setTimeout(() => setFlashRows({}), 400);
      }
      prevDataRef.current = newData;
      setOrderbook(newData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const maxStakeAll = (outcome) => {
    const backs = outcome.back_orders?.map((o) => o.total_stake) || [];
    const lays = outcome.lay_orders?.map((o) => o.total_stake) || [];
    return Math.max(...backs, ...lays, 1);
  };

  const depthPct = (stake, max) => (stake / max) * 100;

  if (loading) {
    return (
      <div style={{ background: "rgba(5,8,5,0.9)", border: "1px solid rgba(17,24,17,0.6)", borderRadius: 8, height: 192, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="ks-spin" style={{ width: 32, height: 32, border: "2px solid rgba(0,255,136,0.3)", borderTopColor: "#00ff88", borderRadius: "50%" }} />
      </div>
    );
  }

  if (!orderbook?.outcomes?.length) {
    return (
      <div style={{ background: "rgba(5,8,5,0.9)", border: "1px solid rgba(17,24,17,0.6)", borderRadius: 8, padding: 24, textAlign: "center", color: "#6b8a6b", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>
        No liquidity — place an order to seed the book
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes ks-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes ks-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ks-flash-row {
          0% { background-color: transparent; }
          50% { background-color: rgba(0,255,136,0.08); }
          100% { background-color: transparent; }
        }
        @keyframes ks-odds-flash-up {
          0%, 100% { color: #00ff88; }
          50% { color: #6b8a6b; }
        }
        @keyframes ks-odds-flash-down {
          0%, 100% { color: #ff4466; }
          50% { color: #6b8a6b; }
        }
        .ks-pulse { animation: ks-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .ks-spin { animation: ks-spin 1s linear infinite; }
        .ks-flash-row { animation: ks-flash-row 0.4s ease-out; }
        .ks-odds-flash-up { animation: ks-odds-flash-up 0.5s ease-out; }
        .ks-odds-flash-down { animation: ks-odds-flash-down 0.5s ease-out; }
        .ks-row-back:hover { background-color: rgba(0,255,136,0.1) !important; }
        .ks-row-lay:hover { background-color: rgba(255,68,102,0.1) !important; }
        .ks-divide > * + * { border-top: 1px solid rgba(17,24,17,0.5); }
      `}</style>
      <div style={{ background: "rgba(5,8,5,0.9)", border: "1px solid rgba(17,24,17,0.6)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderBottom: "1px solid rgba(17,24,17,0.6)", background: "rgba(11,15,11,0.5)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6b8a6b" }}>Order Book</span>
          <span className="ks-pulse" style={{ fontSize: 9, color: "#00ff88", fontFamily: "'Space Mono', monospace" }}>LIVE</span>
        </div>

        <div className="ks-divide" style={{ maxHeight: 420, overflowY: "auto" }}>
          {orderbook.outcomes.map((outcome) => {
            const maxStake = maxStakeAll(outcome);
            const bestBack = outcome.back_orders?.[0];
            const bestLay = outcome.lay_orders?.[0];
            const spread = bestBack && bestLay ? (bestLay.odds - bestBack.odds).toFixed(3) : "—";
            const pc = priceChanges[outcome.id];

            return (
              <div key={outcome.id} className={flashRows[outcome.id] ? "ks-flash-row" : ""}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6, background: "rgba(11,15,11,0.3)", borderBottom: "1px solid rgba(17,24,17,0.4)" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#e8f5e8" }}>{outcome.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 9, fontFamily: "'Space Mono', monospace" }}>
                    {pc && pc !== "stable" && (
                      <span style={{ color: pc === "up" ? "#00ff88" : "#ff4466" }}>{pc === "up" ? "▲" : "▼"}</span>
                    )}
                    <span style={{ color: "#6b8a6b" }}>spread <span style={{ color: "#ffd700" }}>{spread}</span></span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", fontSize: 11, fontFamily: "'Space Mono', monospace" }}>
                  <div style={{
                    borderRight: "1px solid rgba(17,24,17,0.4)",
                    ...(flashRows[outcome.id] === "back" ? { background: "rgba(0,255,136,0.1)" } : {})
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, background: "rgba(0,255,136,0.05)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(0,255,136,0.7)", borderBottom: "1px solid rgba(17,24,17,0.3)" }}>
                      <span>Back</span><span style={{ textAlign: "right" }}>Odds</span><span style={{ textAlign: "right" }}>Vol</span>
                    </div>
                    {(outcome.back_orders || []).slice(0, 6).map((order, idx) => (
                      <div
                        key={idx}
                        onClick={() => onSelectOdds?.(outcome.id, order.odds, "BACK")}
                        className="ks-row-back"
                        style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, cursor: "pointer", borderBottom: "1px solid rgba(11,15,11,0.5)" }}
                      >
                        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, background: "rgba(0,255,136,0.08)", width: `${depthPct(order.total_stake, maxStake)}%` }} />
                        <span style={{ position: "relative", color: "rgba(0,255,136,0.5)", fontSize: 8, alignSelf: "center" }}>█</span>
                        <span className={pc === "up" ? "ks-odds-flash-up" : ""} style={{
                          position: "relative",
                          textAlign: "right",
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          color: idx === 0 ? "#00ff88" : "#00ff88"
                        }}>
                          {order.odds.toFixed(2)}
                        </span>
                        <span style={{ position: "relative", textAlign: "right", color: "#6b8a6b" }}>{order.total_stake.toFixed(0)}</span>
                      </div>
                    ))}
                    {!outcome.back_orders?.length && <p style={{ color: "rgba(22,30,22,1)", fontSize: 9, textAlign: "center", paddingTop: 12, paddingBottom: 12, margin: 0 }}>—</p>}
                  </div>

                  <div style={flashRows[outcome.id] === "lay" ? { background: "rgba(255,68,102,0.1)" } : {}}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, background: "rgba(255,68,102,0.05)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,68,102,0.7)", borderBottom: "1px solid rgba(17,24,17,0.3)" }}>
                      <span>Lay</span><span style={{ textAlign: "right" }}>Odds</span><span style={{ textAlign: "right" }}>Vol</span>
                    </div>
                    {(outcome.lay_orders || []).slice(0, 6).map((order, idx) => (
                      <div
                        key={idx}
                        onClick={() => onSelectOdds?.(outcome.id, order.odds, "LAY")}
                        className="ks-row-lay"
                        style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, cursor: "pointer", borderBottom: "1px solid rgba(11,15,11,0.5)" }}
                      >
                        <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, background: "rgba(255,68,102,0.08)", width: `${depthPct(order.total_stake, maxStake)}%` }} />
                        <span style={{ position: "relative", color: "rgba(255,68,102,0.5)", fontSize: 8, alignSelf: "center" }}>█</span>
                        <span className={pc === "down" ? "ks-odds-flash-down" : ""} style={{
                          position: "relative",
                          textAlign: "right",
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          color: idx === 0 ? "#ff4466" : "#ff4466"
                        }}>
                          {order.odds.toFixed(2)}
                        </span>
                        <span style={{ position: "relative", textAlign: "right", color: "#6b8a6b" }}>{order.total_stake.toFixed(0)}</span>
                      </div>
                    ))}
                    {!outcome.lay_orders?.length && <p style={{ color: "rgba(22,30,22,1)", fontSize: 9, textAlign: "center", paddingTop: 12, paddingBottom: 12, margin: 0 }}>—</p>}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, fontSize: 9, fontFamily: "'Space Mono', monospace", color: "#6b8a6b", background: "rgba(5,8,5,0.3)" }}>
                  <span>Back <span style={{ color: "rgba(0,255,136,0.8)" }}>${outcome.back_orders?.reduce((s, o) => s + o.total_stake, 0).toFixed(0) || 0}</span></span>
                  <span>Lay <span style={{ color: "rgba(255,68,102,0.8)" }}>${outcome.lay_orders?.reduce((s, o) => s + o.total_stake, 0).toFixed(0) || 0}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
