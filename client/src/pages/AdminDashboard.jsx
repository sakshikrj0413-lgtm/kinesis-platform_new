import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import useAuthStore from "../store/authStore";
import socket from "../socket";

const getRandomBettingPrice = () => Math.random() * (0.01 - 0.001) + 0.001;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [markets, setMarkets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newMarket, setNewMarket] = useState({
    title: "",
    description: "",
    type: "BINARY",
    outcomes: [
      { title: "YES", odds: 0.5, betting_price: getRandomBettingPrice() },
      { title: "NO", odds: 0.5, betting_price: getRandomBettingPrice() }
    ]
  });

  useEffect(() => {
    fetchMarkets();
    fetchStats();
    if (showTransactions) {
      fetchTransactions();
    }
  }, [showTransactions]);

  useEffect(() => {
    const handleAdminTransaction = (data) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          ...data,
          timestamp: new Date()
        },
        ...prev
      ]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== data.id));
      }, 10000);
    };

    socket.on("admin_transaction", handleAdminTransaction);

    return () => {
      socket.off("admin_transaction", handleAdminTransaction);
    };
  }, []);

  const fetchMarkets = async () => {
    try {
      const res = await API.get("/admin/markets/all");
      setMarkets(res.data.markets || []);
    } catch (err) {
      console.error("Failed to fetch markets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/stats");
      setStats(res.data.stats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await API.get("/admin/transactions");
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const handleCreateMarket = async (e) => {
    e.preventDefault();
    
    if (!newMarket.title.trim()) {
      alert("Market title is required");
      return;
    }
    
    if (!newMarket.description.trim()) {
      alert("Market description is required");
      return;
    }
    
    const invalidOutcomes = newMarket.outcomes.filter(o => !o.title.trim());
    if (invalidOutcomes.length > 0) {
      alert("All outcomes must have a title");
      return;
    }
    
    try {
      const response = await API.post("/admin/markets/create", {
        title: newMarket.title.trim(),
        description: newMarket.description.trim(),
        type: newMarket.type,
        outcomes: newMarket.outcomes.map(o => ({
          title: o.title.trim(),
          odds: parseFloat(o.odds) || 0.5,
          betting_price: parseFloat(o.betting_price) || 0.001
        }))
      });
      
      alert("Market created successfully!");
      setShowCreateModal(false);
      setNewMarket({
        title: "",
        description: "",
        type: "BINARY",
        outcomes: [
          { title: "YES", odds: 0.5, betting_price: getRandomBettingPrice() }, 
          { title: "NO", odds: 0.5, betting_price: getRandomBettingPrice() }
        ]
      });
      fetchMarkets();
      fetchStats();
    } catch (err) {
      console.error("Create market error:", err);
      alert(err.response?.data?.error || "Failed to create market");
    }
  };

  const handleResolveMarket = async (marketId, outcomeId) => {
    if (!confirm("Are you sure you want to resolve this market?")) return;
    try {
      await API.post(`/admin/markets/${marketId}/resolve`, { outcome_id: outcomeId });
      fetchMarkets();
      fetchStats();
      alert("Market resolved successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to resolve market");
    }
  };

  const handleCloseMarket = async (marketId) => {
    if (!confirm("Are you sure you want to close this market? All bets will be refunded.")) return;
    try {
      await API.post(`/admin/markets/${marketId}/close`);
      fetchMarkets();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to close market");
    }
  };

  const handleUpdateBettingPrice = async (outcomeId, newPrice) => {
    try {
      await API.patch(`/markets/outcome/${outcomeId}/betting-price`, {
        betting_price: newPrice
      });
      alert("Betting price updated successfully!");
      fetchMarkets();
    } catch (err) {
      console.error("Update betting price error:", err);
      alert(err.response?.data?.error || "Failed to update betting price");
    }
  };

  const isBinary = newMarket.type === "BINARY";

  return (
    <DashboardLayout>
      <div style={{ fontFamily: "var(--font-display)" }}>
        {notifications.length > 0 && (
          <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  backgroundColor: "var(--green-glow)",
                  border: "1px solid var(--green-border)",
                  borderRadius: 16,
                  padding: 16,
                  animation: "fadeIn 0.3s ease-out"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <svg style={{ width: 20, height: 20, color: "var(--green)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span style={{ color: "var(--green)", fontWeight: "bold" }}>Transaction Completed</span>
                    </div>
                    <p style={{ color: "var(--text)", fontSize: 14, marginBottom: 4 }}>
                      User <span style={{ fontFamily: "var(--font-mono)", color: "var(--green)" }}>{notification.user_wallet?.slice(0, 6)}...{notification.user_wallet?.slice(-4)}</span>
                    </p>
                    <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 4 }}>
                      Market: <span style={{ fontWeight: 600, color: "var(--text)" }}>{notification.market_title}</span>
                    </p>
                    <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 4 }}>
                      Outcome: <span style={{ fontWeight: 600, color: "var(--green)" }}>{notification.outcome_title}</span>
                    </p>
                    <p style={{ color: "var(--muted)", fontSize: 14 }}>
                      Amount: <span style={{ fontWeight: "bold", color: "var(--green)" }}>{notification.amount} ETH</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                    style={{ color: "var(--muted)", marginLeft: 16, background: "none", border: "none", cursor: "pointer" }}
                  >
                    <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: "bold", fontFamily: "var(--font-display)" }}>Admin Dashboard</h1>
            <p style={{ color: "var(--muted)", marginTop: 8 }}>Manage markets and platform</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              paddingLeft: 20,
              paddingRight: 20,
              paddingTop: 10,
              paddingBottom: 10,
              borderRadius: 12,
              backgroundColor: "var(--green)",
              color: "var(--text)",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              cursor: "pointer"
            }}
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Market
          </button>
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            style={{
              paddingLeft: 20,
              paddingRight: 20,
              paddingTop: 10,
              paddingBottom: 10,
              borderRadius: 12,
              backgroundColor: "var(--green)",
              color: "var(--text)",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              cursor: "pointer"
            }}
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {showTransactions ? "Hide" : "View"} Transactions
          </button>
        </div>

        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 32 }}>
            <div style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 16, padding: 16 }}>
              <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Users</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--text)", marginTop: 4 }}>{stats.total_users}</div>
            </div>
            <div style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 16, padding: 16 }}>
              <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Markets</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--green)", marginTop: 4 }}>{stats.total_markets}</div>
            </div>
            <div style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 16, padding: 16 }}>
              <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Open Markets</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--green)", marginTop: 4 }}>{stats.open_markets}</div>
            </div>
            <div style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 16, padding: 16 }}>
              <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resolved</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--green)", marginTop: 4 }}>{stats.resolved_markets}</div>
            </div>
            <div style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 16, padding: 16 }}>
              <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Bets</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--yellow)", marginTop: 4 }}>{stats.total_bets}</div>
            </div>
            <div style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 16, padding: 16 }}>
              <div style={{ color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Volume</div>
              <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--green)", marginTop: 4 }}>${stats.total_volume?.toLocaleString()}</div>
            </div>
          </div>
        )}

        {showTransactions && (
          <div style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 24, padding: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
              <svg style={{ width: 20, height: 20, color: "var(--green)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Wallet Transactions
            </h2>
            {transactions.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: 48, paddingBottom: 48, color: "var(--muted)" }}>No transactions yet</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--green-border)" }}>
                      <th style={{ textAlign: "left", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>ID</th>
                      <th style={{ textAlign: "left", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>Type</th>
                      <th style={{ textAlign: "left", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>Amount</th>
                      <th style={{ textAlign: "left", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>Market</th>
                      <th style={{ textAlign: "left", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>Outcome</th>
                      <th style={{ textAlign: "left", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>From</th>
                      <th style={{ textAlign: "left", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>Status</th>
                      <th style={{ textAlign: "left", color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: "1px solid rgba(0,255,136,0.12)" }}>
                        <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 14 }}>#{tx.id}</td>
                        <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                          <span style={{ paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, backgroundColor: "var(--green-glow)", color: "var(--green)", fontSize: 12, borderRadius: 8 }}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, color: "var(--green)", fontFamily: "var(--font-mono)", fontWeight: "bold" }}>${tx.amount}</td>
                        <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, color: "var(--text)", fontSize: 14 }}>
                          {tx.market_title || '-'}
                        </td>
                        <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, color: "var(--text)", fontSize: 14 }}>
                          {tx.outcome_title || '-'}
                        </td>
                        <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                          {tx.from_wallet ? `${tx.from_wallet.slice(0, 6)}...${tx.from_wallet.slice(-4)}` : '-'}
                        </td>
                        <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                          <span style={{
                            paddingLeft: 8,
                            paddingRight: 8,
                            paddingTop: 4,
                            paddingBottom: 4,
                            fontSize: 12,
                            borderRadius: 8,
                            ...(tx.status === 'completed'
                              ? { backgroundColor: "var(--green-glow)", color: "var(--green)" }
                              : tx.status === 'pending'
                              ? { backgroundColor: "rgba(255,215,0,0.18)", color: "var(--yellow)" }
                              : { backgroundColor: "rgba(255,80,80,0.2)", color: "#ff5050" }
                            )
                          }}>
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, color: "var(--muted)", fontSize: 14 }}>
                          {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 24, padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 24, fontFamily: "var(--font-display)" }}>All Markets</h2>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 128 }}>
              <div style={{ width: 40, height: 40, border: "4px solid rgba(0,255,136,0.3)", borderTopColor: "var(--green)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            </div>
          ) : markets.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 48, paddingBottom: 48, color: "var(--muted)" }}>No markets created yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {markets.map((market) => (
                <div key={market.id} style={{ backgroundColor: "var(--surface3)", border: "1px solid var(--green-border)", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <h3 style={{ fontSize: 18, fontWeight: "bold", color: "var(--text)" }}>{market.title}</h3>
                      <span style={{
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        ...(market.status === "OPEN"
                          ? { backgroundColor: "var(--green-glow)", color: "var(--green)" }
                          : market.status === "RESOLVED"
                          ? { backgroundColor: "var(--green-glow)", color: "var(--green)" }
                          : { backgroundColor: "#2a3a2a", color: "var(--muted)" }
                        )
                      }}>
                        {market.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "var(--muted)", fontSize: 14 }}>{market.total_bets} bets</span>
                      {market.status === "OPEN" && (
                        <>
                          <button
                            onClick={() => {
                              const outcome = market.outcomes[0];
                              if (outcome && confirm(`Resolve with "${outcome.title}" as winner?`)) {
                                handleResolveMarket(market.id, outcome.id);
                              }
                            }}
                            style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, backgroundColor: "var(--green-glow)", color: "var(--green)", borderRadius: 8, fontSize: 14, border: "none", cursor: "pointer" }}
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleCloseMarket(market.id)}
                            style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, backgroundColor: "rgba(255,80,80,0.2)", color: "#ff5050", borderRadius: 8, fontSize: 14, border: "none", cursor: "pointer" }}
                          >
                            Close
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    {market.outcomes.map((outcome) => (
                      <div key={outcome.id} style={{ backgroundColor: "var(--surface3)", borderRadius: 8, padding: 12, textAlign: "center" }}>
                        <div style={{ color: "var(--muted)", fontSize: 14, fontWeight: 600 }}>{outcome.title}</div>
                        <div style={{ color: "var(--green)", fontWeight: "bold", fontSize: 14, marginTop: 4 }}>{(outcome.odds * 100).toFixed(1)}%</div>
                        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 8, borderTop: "1px solid var(--green-border)", paddingTop: 8 }}>
                          {outcome.betting_price ? `${outcome.betting_price.toFixed(6)} ETH` : "N/A"}
                        </div>
                        <button
                          onClick={() => {
                            const newPrice = prompt(`Enter new betting price for "${outcome.title}" (0.001 - 0.01):`, outcome.betting_price || 0.001);
                            if (newPrice !== null) {
                              const val = parseFloat(newPrice);
                              if (val >= 0.001 && val <= 0.01) {
                                handleUpdateBettingPrice(outcome.id, val);
                              } else {
                                alert("Please enter a value between 0.001 and 0.01");
                              }
                            }
                          }}
                          style={{ marginTop: 8, fontSize: 12, color: "var(--green)", background: "none", border: "none", cursor: "pointer" }}
                        >
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(5,8,5,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
          <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--green-border)", borderRadius: 24, padding: 24, width: "100%", maxWidth: 512, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: "bold", fontFamily: "var(--font-display)" }}>Create Market</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
                <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateMarket} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: "bold", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Title</label>
                <input
                  type="text"
                  value={newMarket.title}
                  onChange={(e) => setNewMarket({ ...newMarket, title: e.target.value })}
                  placeholder="Will BTC exceed $100k by end of 2025?"
                  style={{ width: "100%", backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 12, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, color: "var(--text)", outline: "none", fontFamily: "var(--font-display)" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: "bold", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Description</label>
                <textarea
                  value={newMarket.description}
                  onChange={(e) => setNewMarket({ ...newMarket, description: e.target.value })}
                  placeholder="Market description..."
                  rows={3}
                  style={{ width: "100%", backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 12, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, color: "var(--text)", outline: "none", resize: "none", fontFamily: "var(--font-display)" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: "bold", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Market Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setNewMarket({ ...newMarket, type: "BINARY", outcomes: [{ title: "YES", odds: 0.5, betting_price: getRandomBettingPrice() }, { title: "NO", odds: 0.5, betting_price: getRandomBettingPrice() }] })}
                    style={isBinary ? { border: "2px solid var(--green)", backgroundColor: "var(--green-glow)", color: "var(--green)", padding: 12, borderRadius: 12, cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: "bold" } : { border: "2px solid var(--green-border)", color: "var(--muted)", padding: 12, borderRadius: 12, cursor: "pointer", background: "none", fontFamily: "var(--font-display)" }}
                  >
                    Binary
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMarket({ ...newMarket, type: "MULTI_OUTCOME", outcomes: [{ title: "", odds: 0.5, betting_price: getRandomBettingPrice() }, { title: "", odds: 0.5, betting_price: getRandomBettingPrice() }, { title: "", odds: 0.5, betting_price: getRandomBettingPrice() }] })}
                    style={!isBinary ? { border: "2px solid var(--green)", backgroundColor: "var(--green-glow)", color: "var(--green)", padding: 12, borderRadius: 12, cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: "bold" } : { border: "2px solid var(--green-border)", color: "var(--muted)", padding: 12, borderRadius: 12, cursor: "pointer", background: "none", fontFamily: "var(--font-display)" }}
                  >
                    Multi-Outcome
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: "bold", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Outcomes</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {newMarket.outcomes.map((outcome, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <input
                          type="text"
                          value={outcome.title}
                          onChange={(e) => {
                            const newOutcomes = [...newMarket.outcomes];
                            newOutcomes[idx].title = e.target.value;
                            setNewMarket({ ...newMarket, outcomes: newOutcomes });
                          }}
                          placeholder="Outcome name (e.g., YES, NO)"
                          style={{ flex: 1, backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 12, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, color: "var(--text)", outline: "none", fontFamily: "var(--font-display)" }}
                          required
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="0.99"
                          value={outcome.odds}
                          onChange={(e) => {
                            const newOutcomes = [...newMarket.outcomes];
                            newOutcomes[idx].odds = e.target.value;
                            setNewMarket({ ...newMarket, outcomes: newOutcomes });
                          }}
                          placeholder="0.50"
                          style={{ width: 96, backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 12, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, color: "var(--text)", outline: "none", fontFamily: "var(--font-display)" }}
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <label style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bet Amount (ETH):</label>
                        <input
                          type="number"
                          step="0.0001"
                          min="0.001"
                          max="0.01"
                          value={outcome.betting_price || 0.001}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (val >= 0.001 && val <= 0.01) {
                              const newOutcomes = [...newMarket.outcomes];
                              newOutcomes[idx].betting_price = val;
                              setNewMarket({ ...newMarket, outcomes: newOutcomes });
                            }
                          }}
                          placeholder="0.001"
                          style={{ flex: 1, backgroundColor: "var(--surface2)", border: "1px solid var(--green-border)", borderRadius: 12, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, color: "var(--text)", outline: "none", fontSize: 14, fontFamily: "var(--font-display)" }}
                        />
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>(0.001 - 0.01)</span>
                      </div>
                    </div>
                  ))}
                </div>
                {newMarket.type === "MULTI_OUTCOME" && (
                  <button
                    type="button"
                    onClick={() => setNewMarket({ ...newMarket, outcomes: [...newMarket.outcomes, { title: "", odds: 0.5, betting_price: getRandomBettingPrice() }] })}
                    style={{ marginTop: 12, color: "var(--green)", fontSize: 14, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-display)" }}
                  >
                    + Add Outcome
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 12, color: "var(--muted)", border: "1px solid var(--green-border)", background: "none", cursor: "pointer", fontFamily: "var(--font-display)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 12, backgroundColor: "var(--green)", color: "var(--text)", fontWeight: "bold", border: "none", cursor: "pointer", fontFamily: "var(--font-display)" }}
                >
                  Create Market
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
