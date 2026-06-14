import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import API from "../api/axios";
import socket from "../socket";
import DashboardLayout from "../layouts/DashboardLayout";
import BetSlip from "../components/BetSlip";
import OrderBook from "../components/OrderBook";
import OpenPositions from "../components/OpenPositions";
import LiveActivityTicker from "../components/LiveActivityTicker";
import ExchangeMarketsPanel from "../components/ExchangeMarketsPanel";
import MarketStatsBar from "../components/MarketStatsBar";
import MatchedTradesPanel from "../components/MatchedTradesPanel";
import PortfolioSummaryCard from "../components/PortfolioSummaryCard";

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

export default function BettingMarket() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const outcomeIdParam = searchParams.get("outcome");
  const [market, setMarket] = useState(null);
  const [liveOdds, setLiveOdds] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [oddsChanges, setOddsChanges] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  const [orderbookNeedsRefresh, setOrderbookNeedsRefresh] = useState(false);
  const prevOddsRef = useRef({});
  const pollingRef = useRef(null);

  const isLg = useMediaQuery("(min-width: 1024px)");
  const isSm = useMediaQuery("(min-width: 640px)");
  const isMd = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    fetchMarket();
    fetchLiveOdds();
    pollingRef.current = setInterval(fetchLiveOdds, 5000);

    const onOdds = (data) => {
      if (data.market_id === parseInt(id)) {
        setLiveOdds((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, outcomes: [...prev.outcomes] };
          const idx = updated.outcomes.findIndex((o) => o.id === data.outcome_id);
          if (idx !== -1) {
            updated.outcomes[idx] = { ...updated.outcomes[idx], odds: data.odds, change: data.change };
            setOddsChanges((c) => ({ ...c, [data.outcome_id]: data.change }));
            setTimeout(() => {
              setOddsChanges((c) => {
                const n = { ...c };
                delete n[data.outcome_id];
                return n;
              });
            }, 800);
          }
          return updated;
        });
        setLastUpdate(new Date());
      }
    };

    socket.on("odds_update", onOdds);
    socket.on("market_update", (d) => {
      if (d.market_id === parseInt(id)) {
        setOrderbookNeedsRefresh(true);
        setLastUpdate(new Date());
      }
    });
    socket.on("orderbook_update", (d) => {
      if (d.market_id === parseInt(id)) setOrderbookNeedsRefresh(true);
    });
    socket.on("bet_matched", (d) => {
      if (d.market_id === parseInt(id)) setLastUpdate(new Date());
    });

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      socket.off("odds_update", onOdds);
      socket.off("market_update");
      socket.off("orderbook_update");
      socket.off("bet_matched");
    };
  }, [id, outcomeIdParam]);

  const fetchMarket = async () => {
    try {
      const res = await API.get(`/markets/${id}`);
      setMarket(res.data);
      if (outcomeIdParam && res.data.outcomes) {
        const found = res.data.outcomes.find((o) => o.id === parseInt(outcomeIdParam));
        if (found) {
          setSelectedOutcome({ ...found, odds: parseFloat((1 / (found.odds || 0.5)).toFixed(2)) });
        }
      } else if (res.data.outcomes?.length && !selectedOutcome) {
        setSelectedOutcome(res.data.outcomes[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveOdds = async () => {
    try {
      const res = await API.get(`/markets/live-odds/${id}`);
      const data = res.data;
      setLiveOdds(data);
      const changes = {};
      data.outcomes.forEach((o) => {
        const prev = prevOddsRef.current[o.id];
        changes[o.id] = prev ? (o.odds > prev ? "up" : o.odds < prev ? "down" : "stable") : "stable";
        prevOddsRef.current[o.id] = o.odds;
      });
      setOddsChanges(changes);
      setTimeout(() => setOddsChanges({}), 800);

      const bestBack = Math.max(...data.outcomes.map((o) => o.odds));
      const bestLay = Math.min(...data.outcomes.map((o) => o.odds));
      setStats({
        tradersOnline: data.traders_online,
        liquidity: data.total_liquidity,
        volume24h: data.volume_24h,
        matchedVolume: data.total_liquidity / 2,
        spread: ((bestLay - bestBack) * 100).toFixed(1) + "%",
        bestOdds: (bestBack * 100).toFixed(1) + "%",
        volatility: (Math.abs(bestLay - bestBack) * 100).toFixed(1) + "%",
      });
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectOdds = (outcomeId, odds) => {
    const outcome = liveOdds?.outcomes?.find((o) => o.id === outcomeId) || market?.outcomes?.find((o) => o.id === outcomeId);
    if (outcome) {
      setSelectedOutcome({ ...outcome, odds: parseFloat(odds?.toFixed?.(2) || (1 / outcome.odds).toFixed(2)) });
    }
  };

  const getDisplayOdds = (outcomeId) => {
    const live = liveOdds?.outcomes?.find((o) => o.id === outcomeId);
    return live?.odds ?? market?.outcomes?.find((o) => o.id === outcomeId)?.odds ?? 0;
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return "...";
    const diff = Math.floor((new Date() - lastUpdate) / 1000);
    if (diff < 5) return "now";
    if (diff < 60) return `${diff}s`;
    return `${Math.floor(diff / 60)}m`;
  };

  const outcomeGridCols = isMd ? 4 : isSm ? 3 : 2;

  const keyframeStyle = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .ks-betslip-col::-webkit-scrollbar { width: 6px; }
    .ks-betslip-col::-webkit-scrollbar-track { background: transparent; }
    .ks-betslip-col::-webkit-scrollbar-thumb { background: rgba(0,255,136,0.25); border-radius: 8px; }
    .ks-betslip-col::-webkit-scrollbar-thumb:hover { background: rgba(0,255,136,0.45); }
    .ks-betslip-col { scrollbar-width: thin; scrollbar-color: rgba(0,255,136,0.25) transparent; }
  `;

  if (loading) {
    return (
      <DashboardLayout fullWidth>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh" }}>
          <div style={{ width: 40, height: 40, border: "2px solid rgba(0,255,136,0.3)", borderTopColor: "#00ff88", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!market) {
    return (
      <DashboardLayout>
        <p style={{ color: "#6b8a6b", textAlign: "center", paddingTop: 80, paddingBottom: 80 }}>Market not found</p>
      </DashboardLayout>
    );
  }

  return (
    <>
      <style>{keyframeStyle}</style>
      <DashboardLayout fullWidth>
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 96px)", minHeight: 500, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 4, paddingRight: 4, flexShrink: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontSize: 18, fontWeight: "bold", color: "#e8f5e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Space Mono', monospace" }}>{market.title}</h1>
                <span style={{ paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2, background: "rgba(255,68,102,0.2)", color: "#ff4466", fontSize: 9, fontWeight: "bold", borderRadius: 4, animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>LIVE</span>
                <span style={{
                  paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2,
                  fontSize: 9, fontWeight: "bold", borderRadius: 4,
                  background: market.status === "OPEN" ? "rgba(0,255,136,0.15)" : "#161e16",
                  color: market.status === "OPEN" ? "#00ff88" : "#6b8a6b"
                }}>{market.status}</span>
              </div>
              <p style={{ color: "#6b8a6b", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{market.description}</p>
            </div>
            <span style={{ fontSize: 9, color: "#6b8a6b", fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>&Delta; {formatLastUpdate()}</span>
          </div>

          <MarketStatsBar {...stats} lastUpdate={formatLastUpdate()} />

          <div style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: isLg ? "180px 1fr 340px" : "1fr",
            gap: 8,
            minHeight: 0,
            overflow: "hidden"
          }}>
            <div style={{
              display: isLg ? "flex" : "none",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden"
            }}>
              <ExchangeMarketsPanel />
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minHeight: 0,
              overflowY: "auto"
            }}>
              <div style={{ background: "rgba(5,8,5,0.9)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${outcomeGridCols}, 1fr)` }}>
                  {market.outcomes.map((outcome, index) => {
                    const displayOdds = getDisplayOdds(outcome.id);
                    const change = oddsChanges[outcome.id] || "stable";
                    const decimal = (1 / (displayOdds || 0.5)).toFixed(2);
                    const selected = selectedOutcome?.id === outcome.id;
                    return (
                      <button
                        key={outcome.id}
                        onClick={() => setSelectedOutcome({ ...outcome, odds: parseFloat(decimal) })}
                        style={{
                          position: "relative",
                          padding: "10px 12px",
                          textAlign: "left",
                          transition: "all 0.15s",
                          background: selected ? "rgba(0,255,136,0.18)" : "transparent",
                          borderLeft: index > 0 ? "1px solid rgba(0,255,136,0.25)" : "none",
                          boxShadow: selected ? "inset 0 0 0 1px rgba(0,255,136,0.3)" : "none",
                          cursor: "pointer",
                          color: "inherit",
                          border: "none",
                          width: "100%",
                          fontFamily: "inherit",
                          fontSize: "inherit"
                        }}
                        className={`${change === "up" ? "odds-flash-up" : change === "down" ? "odds-flash-down" : ""}`}
                        onMouseEnter={(e) => {
                          if (!selected) e.currentTarget.style.background = "rgba(11,15,11,0.8)";
                        }}
                        onMouseLeave={(e) => {
                          if (!selected) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <p style={{ fontSize: 10, color: "#6b8a6b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{outcome.title}</p>
                        <p style={{
                          fontSize: 20, fontWeight: "bold", fontFamily: "'Space Mono', monospace",
                          fontVariantNumeric: "tabular-nums", margin: 0,
                          color: change === "up" ? "#00ff88" : change === "down" ? "#ff4466" : "#e8f5e8"
                        }}>
                          {(displayOdds * 100).toFixed(1)}%
                        </p>
                        <p style={{ fontSize: 9, color: "#6b8a6b", fontFamily: "'Space Mono', monospace", margin: 0 }}>dec {decimal}</p>
                        {change !== "stable" && (
                          <span style={{
                            position: "absolute", top: 4, right: 4,
                            fontSize: 9, fontWeight: "bold",
                            color: change === "up" ? "#00ff88" : "#ff4466"
                          }}>{change === "up" ? "\u25B2" : "\u25BC"}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <OrderBook
                marketId={id}
                onSelectOdds={handleSelectOdds}
                needsRefresh={orderbookNeedsRefresh}
                onRefreshed={() => setOrderbookNeedsRefresh(false)}
              />

              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6b8a6b", marginBottom: 4, paddingLeft: 4, paddingRight: 4 }}>Live Feed</div>
                <LiveActivityTicker marketId={id} />
              </div>
            </div>

            <div className="ks-betslip-col" style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minHeight: 0,
              maxHeight: "100%",
              overflowY: "auto",
              overflowX: "hidden",
              paddingRight: 2
            }}>
              <BetSlip marketId={id} selectedOutcome={selectedOutcome} onBetPlaced={() => { fetchMarket(); fetchLiveOdds(); setOrderbookNeedsRefresh(true); }} />
              <PortfolioSummaryCard />
              <OpenPositions compact />
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <MatchedTradesPanel marketId={id} />
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
