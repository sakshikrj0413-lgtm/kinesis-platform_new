const G = "#00ff88";
const Y = "#ffd700";
const B = "#050805";
const S = "#0b0f0b";
const TX = "#e8f5e8";
const M = "#6b8a6b";

export default function MarketStatsBar({
  tradersOnline,
  liquidity,
  volume24h,
  matchedVolume,
  spread,
  bestOdds,
  volatility,
  lastUpdate,
}) {
  const stats = [
    { label: "Traders", value: tradersOnline, color: G, pulse: true },
    { label: "Liquidity", value: `$${(liquidity || 0).toLocaleString()}`, color: TX },
    { label: "24h Vol", value: `$${(volume24h || 0).toLocaleString()}`, color: Y },
    { label: "Matched", value: `$${(matchedVolume || 0).toLocaleString()}`, color: G },
    { label: "Spread", value: spread ?? "\u2014", color: "#ff8c00" },
    { label: "Best", value: bestOdds ?? "\u2014", color: G },
    { label: "Volatility", value: volatility ?? "\u2014", color: G },
  ];

  return (
    <>
      <style>{`
        @keyframes kping { 75%, 100% { transform: scale(2); opacity: 0; } }
      `}</style>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          columnGap: 16,
          rowGap: 4,
          backgroundColor: "rgba(5,8,5,0.40)",
          border: "1px solid rgba(17,24,17,0.6)",
          borderRadius: 8,
          padding: "8px 12px",
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
        }}
      >
        {stats.map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && (
              <span style={{ color: "#1a3a1a", display: "none" }}>{/* separator hidden on small */}</span>
            )}
            {s.pulse && (
              <span style={{ position: "relative", display: "flex", height: 6, width: 6 }}>
                <span
                  style={{
                    position: "absolute",
                    height: "100%",
                    width: "100%",
                    borderRadius: "50%",
                    backgroundColor: G,
                    opacity: 0.6,
                    animation: "kping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                  }}
                />
                <span
                  style={{
                    position: "relative",
                    borderRadius: "50%",
                    height: 6,
                    width: 6,
                    backgroundColor: G,
                  }}
                />
              </span>
            )}
            <span
              style={{
                color: "#3a5a3a",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: 9,
              }}
            >
              {s.label}
            </span>
            <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
        {lastUpdate && (
          <span
            style={{
              color: "#2a4a2a",
              fontSize: 9,
              marginLeft: "auto",
            }}
          >
            sync {lastUpdate}
          </span>
        )}
      </div>
    </>
  );
}
