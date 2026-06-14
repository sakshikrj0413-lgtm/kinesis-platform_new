import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import useMarketplaceStore from "../store/marketplaceStore";

function StrategyCard({ agent, index, onClone }) {
  const [cloning, setCloning] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleClone = async () => {
    setCloning(true);
    try {
      await onClone(agent.id);
    } finally {
      setCloning(false);
    }
  };

  const stars = Math.round(agent.rating);

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
        padding: 24,
        transition: 'all 0.3s',
        boxShadow: hovered ? '0 0 30px rgba(0,255,136,0.1)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            color: hovered ? '#00ff88' : '#e8f5e8',
            fontWeight: 'bold',
            fontSize: 18,
            transition: 'color 0.3s',
          }}>
            {agent.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ color: '#6b8a6b', fontSize: 12, textTransform: 'uppercase' }}>{agent.sport}</span>
            <span style={{ color: 'rgba(107,138,107,0.5)' }}>/</span>
            <span style={{ color: '#6b8a6b', fontSize: 12, textTransform: 'uppercase' }}>{agent.strategy_type}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} style={{
              fontSize: 14,
              color: s <= stars ? '#ffd700' : 'rgba(107,138,107,0.5)',
            }}>
              ★
            </span>
          ))}
          <span style={{ color: '#6b8a6b', fontSize: 12, marginLeft: 4 }}>({agent.rating_count || 0})</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ backgroundColor: 'rgba(22,30,22,0.5)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <div style={{ color: '#6b8a6b', fontSize: 10, textTransform: 'uppercase' }}>ROI</div>
          <div style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: agent.roi >= 0 ? '#00ff88' : '#ff4444',
          }}>
            {agent.roi >= 0 ? "+" : ""}{agent.roi.toFixed(1)}%
          </div>
        </div>
        <div style={{ backgroundColor: 'rgba(22,30,22,0.5)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <div style={{ color: '#6b8a6b', fontSize: 10, textTransform: 'uppercase' }}>Win Rate</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#00ff88' }}>{agent.win_rate.toFixed(1)}%</div>
        </div>
        <div style={{ backgroundColor: 'rgba(22,30,22,0.5)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <div style={{ color: '#6b8a6b', fontSize: 10, textTransform: 'uppercase' }}>Users</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#00ff88' }}>{agent.total_users}</div>
        </div>
      </div>

      <button
        onClick={handleClone}
        disabled={cloning}
        style={{
          width: '100%',
          paddingTop: 10,
          paddingBottom: 10,
          borderRadius: 12,
          backgroundColor: 'rgba(0,255,136,0.1)',
          color: '#00ff88',
          fontWeight: '600',
          border: '1px solid rgba(0,255,136,0.25)',
          opacity: cloning ? 0.5 : 1,
          fontSize: 14,
          cursor: cloning ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s',
        }}
        onMouseEnter={(e) => {
          if (!cloning) {
            e.target.style.backgroundColor = 'rgba(0,255,136,0.18)';
            e.target.style.borderColor = 'rgba(0,255,136,0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'rgba(0,255,136,0.1)';
          e.target.style.borderColor = 'rgba(0,255,136,0.25)';
        }}
      >
        {cloning ? "Cloning..." : "Clone Strategy"}
      </button>
    </motion.div>
  );
}

function LeaderboardSection({ title, agents }) {
  return (
    <div style={{
      backgroundColor: 'rgba(11,15,11,0.6)',
      border: '1px solid rgba(22,30,22,0.5)',
      borderRadius: 16,
      padding: 24,
    }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 16,
        color: '#00ff88',
      }}>{title}</h3>
      <div>
        {agents.slice(0, 5).map((agent, i) => (
          <div key={agent.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingTop: 8,
            paddingBottom: 8,
            borderBottom: '1px solid rgba(22,30,22,0.3)',
          }}>
            <span style={{ color: 'rgba(107,138,107,0.6)', fontSize: 14, fontFamily: "'Space Mono', monospace", width: 24 }}>#{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e8f5e8', fontSize: 14, fontWeight: '600' }}>{agent.title}</div>
              <div style={{ color: '#6b8a6b', fontSize: 12 }}>{agent.sport} / {agent.strategy_type}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#00ff88', fontSize: 14, fontWeight: 'bold' }}>+{agent.roi.toFixed(1)}%</div>
              <div style={{ color: '#6b8a6b', fontSize: 12 }}>{agent.total_users} users</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { agents, leaderboard, loadAgents, loadLeaderboard, cloneAgent, loading } = useMarketplaceStore();
  const [sort, setSort] = useState("roi");
  const [view, setView] = useState("grid");

  useEffect(() => {
    loadAgents(sort);
    loadLeaderboard();
  }, [sort]);

  const handleClone = async (listingId) => {
    await cloneAgent(listingId);
    loadAgents(sort);
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#00ff88' }} />
              AGENTEX Marketplace
            </h1>
            <p style={{ color: '#6b8a6b', marginTop: 4 }}>Clone, deploy, and share autonomous betting strategies</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setView("grid")}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: view === "grid" ? 'rgba(0,255,136,0.18)' : 'transparent',
                color: view === "grid" ? '#00ff88' : '#6b8a6b',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: view === "list" ? 'rgba(0,255,136,0.18)' : 'transparent',
                color: view === "list" ? '#00ff88' : '#6b8a6b',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: "roi", label: "Top ROI" },
            { key: "win_rate", label: "Highest Win Rate" },
            { key: "popularity", label: "Most Popular" },
            { key: "rating", label: "Top Rated" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: '600',
                backgroundColor: sort === s.key ? 'rgba(0,255,136,0.18)' : 'rgba(22,30,22,0.5)',
                color: sort === s.key ? '#00ff88' : '#6b8a6b',
                border: sort === s.key ? '1px solid rgba(0,255,136,0.4)' : '1px solid rgba(22,30,22,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                if (sort !== s.key) e.target.style.borderColor = 'rgba(22,30,22,0.8)';
              }}
              onMouseLeave={(e) => {
                if (sort !== s.key) e.target.style.borderColor = 'rgba(22,30,22,0.5)';
              }}
            >
              {s.label}
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
        ) : agents.length === 0 ? (
          <div style={{
            backgroundColor: 'rgba(11,15,11,0.6)',
            border: '1px solid rgba(22,30,22,0.5)',
            borderRadius: 16,
            padding: 48,
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#e8f5e8', marginBottom: 8 }}>Marketplace Empty</h2>
            <p style={{ color: '#6b8a6b' }}>Publish your agent to get started</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: 24,
            marginBottom: 32,
          }}>
            {agents.map((agent, i) => (
              <StrategyCard key={agent.id} agent={agent} index={i} onClone={handleClone} />
            ))}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: 24,
        }}>
          <LeaderboardSection title="Top ROI" agents={leaderboard.top_roi} />
          <LeaderboardSection title="Trending" agents={leaderboard.trending} />
          <LeaderboardSection title="Safest Strategies" agents={leaderboard.safest} />
        </div>
      </div>
    </DashboardLayout>
  );
}
