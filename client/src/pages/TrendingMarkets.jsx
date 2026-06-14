import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import useIntelligenceStore from "../store/intelligenceStore";

function TrendingCard({ market, index }) {
  const [hovered, setHovered] = useState(false);

  const riskStyles = {
    safe: { bg: 'rgba(0,255,136,0.18)', text: '#00ff88', border: 'rgba(0,255,136,0.4)' },
    balanced: { bg: 'rgba(255,215,0,0.18)', text: '#ffd700', border: 'rgba(255,215,0,0.4)' },
    risky: { bg: 'rgba(255,215,0,0.18)', text: '#ffd700', border: 'rgba(255,215,0,0.4)' },
    degen: { bg: 'rgba(255,68,68,0.18)', text: '#ff4444', border: 'rgba(255,68,68,0.4)' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'rgba(11,15,11,0.8)',
        backdropFilter: 'blur(4px)',
        border: `1px solid ${hovered ? 'rgba(0,255,136,0.5)' : 'rgba(22,30,22,0.5)'}`,
        borderRadius: 16,
        padding: 20,
        transition: 'all 0.3s',
        boxShadow: hovered ? '0 0 30px rgba(0,255,136,0.1)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: 'rgba(107,138,107,0.6)', fontSize: 12, fontFamily: "'Space Mono', monospace" }}>#{index + 1}</span>
            <h3 style={{
              color: hovered ? '#00ff88' : '#e8f5e8',
              fontWeight: 'bold',
              fontSize: 18,
              transition: 'color 0.3s',
            }}>
              {market.title}
            </h3>
          </div>
          <span style={{ color: '#6b8a6b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{market.type}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {market.sharp_money && (
            <span style={{
              fontSize: 10,
              backgroundColor: 'rgba(0,255,136,0.18)',
              color: '#00ff88',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}>
              Sharp
            </span>
          )}
          <div style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            border: `1px solid ${riskStyles[market.risk].border}`,
            backgroundColor: riskStyles[market.risk].bg,
            color: riskStyles[market.risk].text,
          }}>
            {market.risk}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ color: '#6b8a6b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edge</div>
          <div style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: market.edge >= 0 ? '#00ff88' : '#ff4444',
          }}>
            {market.edge >= 0 ? "+" : ""}{market.edge.toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{ color: '#6b8a6b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#00ff88' }}>{market.confidence.toFixed(0)}%</div>
        </div>
        <div>
          <div style={{ color: '#6b8a6b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#00ff88' }}>{market.volume_score.toFixed(0)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: '#00ff88' }}>Bullish {market.bullish.toFixed(0)}%</span>
          <span style={{ color: '#ff4444' }}>Bearish {(100 - market.bullish).toFixed(0)}%</span>
        </div>
        <div style={{ height: 8, backgroundColor: '#161e16', borderRadius: 9999, overflow: 'hidden', display: 'flex' }}>
          <motion.div
            style={{ backgroundColor: '#00ff88', height: '100%' }}
            initial={{ width: 0 }}
            animate={{ width: `${market.bullish}%` }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          />
          <motion.div
            style={{ backgroundColor: '#ff4444', height: '100%' }}
            initial={{ width: 0 }}
            animate={{ width: `${100 - market.bullish}%` }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          />
        </div>
      </div>

      <Link
        to={`/markets/${market.market_id}`}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'center',
          paddingTop: 10,
          paddingBottom: 10,
          borderRadius: 12,
          backgroundColor: 'rgba(0,255,136,0.1)',
          color: '#00ff88',
          fontWeight: '600',
          border: '1px solid rgba(0,255,136,0.25)',
          fontSize: 14,
          textDecoration: 'none',
          transition: 'all 0.3s',
          boxSizing: 'border-box',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(0,255,136,0.18)';
          e.target.style.borderColor = 'rgba(0,255,136,0.5)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(0,255,136,0.1)';
          e.target.style.borderColor = 'rgba(0,255,136,0.25)';
        }}
      >
        View Market
      </Link>
    </motion.div>
  );
}

export default function TrendingMarkets() {
  const { trending, loadTrending, loading } = useIntelligenceStore();
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadTrending(20);
  }, []);

  const filtered = trending.filter((m) => {
    if (filter === "all") return true;
    if (filter === "safe") return m.risk === "safe";
    if (filter === "high-edge") return m.edge >= 5;
    if (filter === "sharp") return m.sharp_money;
    return true;
  });

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#00ff88' }} />
              Trending Markets
            </h1>
            <p style={{ color: '#6b8a6b', marginTop: 4 }}>AI-powered market intelligence rankings</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#6b8a6b', fontSize: 14 }}>Live</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00ff88' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: "all", label: "All Markets" },
            { key: "safe", label: "Safe Only" },
            { key: "high-edge", label: "High Edge (5%+)" },
            { key: "sharp", label: "Sharp Money" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: '600',
                backgroundColor: filter === f.key ? 'rgba(0,255,136,0.18)' : 'rgba(22,30,22,0.5)',
                color: filter === f.key ? '#00ff88' : '#6b8a6b',
                border: filter === f.key ? '1px solid rgba(0,255,136,0.4)' : '1px solid rgba(22,30,22,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (filter !== f.key) e.target.style.borderColor = 'rgba(22,30,22,0.8)';
              }}
              onMouseLeave={(e) => {
                if (filter !== f.key) e.target.style.borderColor = 'rgba(22,30,22,0.5)';
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
            <div style={{
              width: 48,
              height: 48,
              border: '4px solid rgba(0,255,136,0.25)',
              borderTopColor: '#00ff88',
              borderRadius: '50%',
            }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            backgroundColor: 'rgba(11,15,11,0.6)',
            border: '1px solid rgba(22,30,22,0.5)',
            borderRadius: 16,
            padding: 48,
            textAlign: 'center',
          }}>
            <p style={{ color: '#6b8a6b', fontSize: 18 }}>No trending markets found</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: 24,
          }}>
            {filtered.map((market, i) => (
              <TrendingCard key={market.market_id} market={market} index={i} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
