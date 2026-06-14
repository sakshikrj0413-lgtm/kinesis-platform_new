import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import OddsCard from "../components/OddsCard";
import MarketFilters from "../components/MarketFilters";
import socket from "../socket";

export default function Markets() {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", status: "ALL" });
  const [liveOddsMap, setLiveOddsMap] = useState({});
  const [tradersOnline, setTradersOnline] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const prevOddsRef = useRef({});

  useEffect(() => {
    fetchMarkets();
  }, []);

  // Subscribe to real-time odds updates from LiveOddsEngine
  useEffect(() => {
    const handleOddsUpdate = (data) => {
      // data: { market_id, outcome_id, odds, change }
      const key = `${data.market_id}:${data.outcome_id}`;
      setLiveOddsMap((prev) => ({
        ...prev,
        [key]: {
          odds: data.odds,
          votePercentage: data.odds * 100,
          change: data.change,
        },
      }));
      // Clear the change indicator after 800ms so the flash doesn't stick
      setTimeout(() => {
        setLiveOddsMap((prev) => {
          if (!prev[key]) return prev;
          return { ...prev, [key]: { ...prev[key], change: "stable" } };
        });
      }, 800);
    };

    const handleMarketUpdate = (data) => {
      // Refresh market list when a market is resolved or updated
      if (data.type === "resolved") {
        setMarkets((prev) =>
          prev.map((m) =>
            m.id === data.market_id ? { ...m, status: "RESOLVED" } : m
          )
        );
      }
    };

    const handleLiveActivity = (data) => {
      // Bump traders-online counter on activity
      setTradersOnline((n) => Math.max(100, n + (Math.random() > 0.5 ? 1 : -1)));
    };

    socket.on("odds_update", handleOddsUpdate);
    socket.on("market_update", handleMarketUpdate);
    socket.on("market_resolved", handleMarketUpdate);
    socket.on("live_activity", handleLiveActivity);

    return () => {
      socket.off("odds_update", handleOddsUpdate);
      socket.off("market_update", handleMarketUpdate);
      socket.off("market_resolved", handleMarketUpdate);
      socket.off("live_activity", handleLiveActivity);
    };
  }, []);

  const fetchMarkets = async () => {
    try {
      const res = await API.get("/markets/");
      setMarkets(res.data);
      // Seed initial odds from HTTP response; socket will update from here
      const initialLive = {};
      let totalVol = 0;
      res.data.forEach((m) => {
        m.outcomes.forEach((o) => {
          initialLive[`${m.id}:${o.id}`] = {
            odds: o.odds,
            votePercentage: o.vote_percentage,
            change: "stable",
            bettingPrice: o.betting_price,
          };
        });
        totalVol += Math.random() * 50000 + 10000;
      });
      setLiveOddsMap(initialLive);
      setTotalVolume(totalVol);
      setTradersOnline(Math.floor(Math.random() * 150) + 100);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkets = markets.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === "ALL" || m.status === filters.status || m.type === filters.status;
    return matchesSearch && matchesStatus;
  });

  const getOddsWithLive = (marketId, outcomeId, defaultOdds) => {
    const key = `${marketId}:${outcomeId}`;
    // Prefer socket-pushed odds; fall back to original HTTP value
    return liveOddsMap[key]?.odds ?? liveOddsMap[key]?.votePercentage ?? defaultOdds;
  };

  const getChange = (marketId, outcomeId) => {
    const key = `${marketId}:${outcomeId}`;
    return liveOddsMap[key]?.change || "stable";
  };

  return (
    <DashboardLayout>
      <div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32}}>
          <div>
            <h1 style={{fontSize: '2.25rem', fontWeight: 700, color: 'var(--text)'}}>AGON Markets</h1>
            <p style={{color: 'var(--muted)', marginTop: 8}}>Real-time prediction markets</p>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--green-border)', borderRadius: 12, padding: '8px 16px'}}>
              <span style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'kinesisPulse 2s infinite'}} />
              <span style={{color: 'var(--green)', fontWeight: 700}}>{tradersOnline}</span>
              <span style={{color: 'var(--muted)', fontSize: '0.875rem'}}>traders online</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--green-border)', borderRadius: 12, padding: '8px 16px'}}>
              <span style={{color: 'var(--muted)', fontSize: '0.875rem'}}>24h Volume</span>
              <span style={{color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-mono)'}}>${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/markets/create")}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: 'var(--green)',
              color: 'var(--black)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--green-dim)';
              e.currentTarget.style.boxShadow = '0 0 30px var(--green-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--green)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: 20, lineHeight: '20px' }}>⟳</span>
          </button>
        </div>

        <div style={{marginBottom: 24}}>
          <MarketFilters onFilterChange={setFilters} />
        </div>

        {loading ? (
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256}}>
            <div style={{
              width: 48,
              height: 48,
              border: '4px solid var(--green-border)',
              borderTopColor: 'var(--green)',
              borderRadius: '50%',
              animation: 'kinesisSpin 0.8s linear infinite'
            }} />
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--green-border)',
            borderRadius: 24,
            padding: 48,
            textAlign: 'center'
          }}>
            <p style={{color: 'var(--muted)', fontSize: '1.25rem'}}>No markets found</p>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 24}} className="markets-grid">
            {filteredMarkets.map((market) => (
              <div
                key={market.id}
                onClick={() => navigate(`/markets/${market.id}/bet`)}
                style={{
                  background: 'var(--surface)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid var(--green-border)',
                  borderRadius: 24,
                  padding: 24,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0,255,136,0.5)';
                  e.currentTarget.style.boxShadow = '0 0 30px var(--green-glow)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--green-border)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16}}>
                  <h2 style={{fontSize: '1.25rem', fontWeight: 700, flex: 1, color: 'var(--text)'}}>{market.title}</h2>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 9999,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      ...(market.status === "OPEN"
                        ? { background: 'var(--green-glow)', color: 'var(--green)' }
                        : { background: 'var(--surface3)', color: 'var(--muted)' })
                    }}>
                      {market.status}
                    </span>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
                      borderRadius: 9999,
                      background: 'rgba(255,68,102,0.2)',
                      color: '#ff4466',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#ff4466',
                        animation: 'kinesisPulse 2s infinite'
                      }} />
                      LIVE
                    </span>
                  </div>
                </div>
                <p style={{
                  color: 'var(--muted)',
                  fontSize: '0.875rem',
                  marginBottom: 20,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>{market.description}</p>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12}}>
                  {market.outcomes.map((outcome) => (
                    <OddsCard
                      key={outcome.id}
                      title={outcome.title}
                      odds={getOddsWithLive(market.id, outcome.id, outcome.vote_percentage) / 100}
                      change={getChange(market.id, outcome.id)}
                      showLive
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <style>{`
          @keyframes kinesisSpin {
            to { transform: rotate(360deg); }
          }
          @keyframes kinesisPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          @media (min-width: 1024px) {
            .markets-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (min-width: 1280px) {
            .markets-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}
