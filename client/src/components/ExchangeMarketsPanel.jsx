import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";

const CATEGORIES = ["ALL", "OPEN", "SPORTS", "POLITICS", "CRYPTO"];

export default function ExchangeMarketsPanel() {
  const { id: activeId } = useParams();
  const navigate = useNavigate();
  const [markets, setMarkets] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarkets = async () => {
    try {
      const res = await API.get("/markets/");
      setMarkets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = markets
    .filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.title.toLowerCase().includes(q);
      const matchCat =
        category === "ALL" ||
        (category === "OPEN" && m.status === "OPEN") ||
        m.type?.toUpperCase() === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => (b.volume_24h || 0) - (a.volume_24h || 0));

  const trending = [...markets]
    .sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0))
    .slice(0, 3);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        backgroundColor: "rgba(5,8,5,0.9)",
        border: "1px solid rgba(22,30,22,0.6)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes kinesis-spin { to { transform: rotate(360deg); } }
        @keyframes kinesis-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .kinesis-placeholder::placeholder { color: #6b8a6b; }
      `}</style>
      <div
        style={{
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 10,
          paddingBottom: 10,
          borderBottom: "1px solid rgba(22,30,22,0.8)",
          backgroundColor: "rgba(11,15,11,0.8)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#00ff88",
            }}
          >
            Markets
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#6b8a6b",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {markets.length}
          </span>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search markets..."
          className="kinesis-placeholder"
          style={{
            width: "100%",
            backgroundColor: "rgba(5,8,5,0.6)",
            border: `1px solid ${searchFocused ? "rgba(0,255,136,0.5)" : "#161e16"}`,
            borderRadius: 4,
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 6,
            paddingBottom: 6,
            fontSize: 12,
            color: "#e8f5e8",
            outline: "none",
            fontFamily: "'Space Mono', monospace",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 8,
          paddingBottom: 8,
          borderBottom: "1px solid rgba(22,30,22,0.6)",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            onMouseEnter={(e) => {
              if (cat !== category)
                e.currentTarget.style.color = "#e8f5e8";
            }}
            onMouseLeave={(e) => {
              if (cat !== category)
                e.currentTarget.style.color = "#6b8a6b";
            }}
            style={{
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 2,
              paddingBottom: 2,
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              backgroundColor: category === cat ? "rgba(0,255,136,0.2)" : "transparent",
              color: category === cat ? "#00ff88" : "#6b8a6b",
              border: category === cat
                ? "1px solid rgba(0,255,136,0.3)"
                : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {trending.length > 0 && (
        <div
          style={{
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 8,
            paddingBottom: 8,
            borderBottom: "1px solid rgba(22,30,22,0.4)",
          }}
        >
          <p
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#6b8a6b",
              marginBottom: 6,
            }}
          >
            Trending
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {trending.map((m) => (
              <button
                key={`t-${m.id}`}
                onClick={() => navigate(`/markets/${m.id}/bet`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(22,30,22,0.6)";
                  e.currentTarget.style.borderColor = "rgba(0,255,136,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(11,15,11,0.5)";
                  e.currentTarget.style.borderColor = "transparent";
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 4,
                  paddingBottom: 4,
                  borderRadius: 4,
                  backgroundColor: "rgba(11,15,11,0.5)",
                  border: "1px solid transparent",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    color: "#e8f5e8",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                  }}
                >
                  {m.title}
                </p>
                <p
                  style={{
                    fontSize: 9,
                    color: "rgba(0,255,136,0.8)",
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  ${(m.liquidity || 0).toLocaleString()} liq
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: 32,
              paddingBottom: 32,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                border: "2px solid rgba(0,255,136,0.3)",
                borderTopColor: "#00ff88",
                borderRadius: "50%",
                animation: "kinesis-spin 0.6s linear infinite",
              }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <p
            style={{
              color: "#6b8a6b",
              fontSize: 12,
              textAlign: "center",
              paddingTop: 24,
              paddingBottom: 24,
            }}
          >
            No markets
          </p>
        ) : (
          filtered.map((m) => {
            const isActive = String(m.id) === String(activeId);
            const topOutcome = m.outcomes?.[0];
            return (
              <button
                key={m.id}
                onClick={() => navigate(`/markets/${m.id}/bet`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(11,15,11,0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isActive
                    ? "rgba(0,255,136,0.05)"
                    : "transparent";
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderBottom: "1px solid rgba(22,30,22,0.4)",
                  transition: "all 0.2s",
                  backgroundColor: isActive
                    ? "rgba(0,255,136,0.05)"
                    : "transparent",
                  borderLeft: isActive
                    ? "2px solid #00ff88"
                    : "2px solid transparent",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: 1.25,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      color: isActive ? "#00ff88" : "#e8f5e8",
                    }}
                  >
                    {m.title}
                  </p>
                  {m.status === "OPEN" && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#00ff88",
                        flexShrink: 0,
                        marginTop: 4,
                        animation: "kinesis-pulse 2s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color:
                        m.status === "OPEN"
                          ? "rgba(0,255,136,0.7)"
                          : "#6b8a6b",
                    }}
                  >
                    {m.status}
                  </span>
                  {topOutcome && (
                    <span
                      style={{
                        fontSize: 9,
                        color: "#6b8a6b",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      {(topOutcome.vote_percentage || 0).toFixed(0)}%
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 9,
                      color: "#6b8a6b",
                      fontFamily: "'Space Mono', monospace",
                      marginLeft: "auto",
                    }}
                  >
                    ${(m.volume_24h || 0).toLocaleString()}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
