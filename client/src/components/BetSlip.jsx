import { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import useWalletStore from "../store/walletStore";
import { useAccount } from "wagmi";

const QUICK_STAKES = [10, 25, 50, 100, 250, 500];

export default function BetSlip({ marketId, selectedOutcome, onBetPlaced }) {
  const [side, setSide] = useState("BACK");
  const [stake, setStake] = useState("");
  const [odds, setOdds] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const prevOutcomeRef = useRef(null);

  const { isConnected } = useAccount();
  const walletAddress = useWalletStore((state) => state.walletAddress);

  useEffect(() => {
    if (selectedOutcome) {
      if (prevOutcomeRef.current?.id !== selectedOutcome.id) {
        setOdds(selectedOutcome.odds ? (1 / selectedOutcome.odds).toFixed(2) : "");
      }
      prevOutcomeRef.current = selectedOutcome;
    }
  }, [selectedOutcome]);

  const decimalOdds = odds ? parseFloat(odds) : 0;
  const stakeValue = stake ? parseFloat(stake) : 0;

  const potentialWinnings = side === "BACK"
    ? (stakeValue * decimalOdds).toFixed(2)
    : (stakeValue / decimalOdds).toFixed(2);

  const potentialLoss = side === "BACK"
    ? stakeValue.toFixed(2)
    : (stakeValue * (decimalOdds - 1)).toFixed(2);

  const handleQuickStake = (amount) => {
    setStake(amount.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isConnected || !walletAddress) {
      setError("Please connect your wallet before placing bets");
      return;
    }

    if (!selectedOutcome) {
      setError("Please select an outcome");
      return;
    }

    if (!stake || parseFloat(stake) <= 0) {
      setError("Please enter a valid stake");
      return;
    }

    if (!odds || parseFloat(odds) < 1.01) {
      setError("Odds must be at least 1.01");
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/bets/place", {
        market_id: parseInt(marketId),
        outcome_id: selectedOutcome.id,
        side,
        stake: parseFloat(stake),
        odds: parseFloat(odds),
        wallet_address: walletAddress
      });

      setSuccess(`Bet placed successfully! ${side === "BACK" ? "Backing" : "Laying"} ${selectedOutcome.title} @ ${odds}`);
      setShowSuccess(true);
      setStake("");
      setOdds("");

      setTimeout(() => setShowSuccess(false), 3000);
      onBetPlaced?.(res.data.bet);

    } catch (err) {
      setError(err.response?.data?.error || "Failed to place bet");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !selectedOutcome || !isConnected;

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
        .ks-pulse { animation: ks-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .ks-spin { animation: ks-spin 1s linear infinite; }
        .ks-side-btn:hover { background: rgba(22,30,22,0.7) !important; color: rgba(232,245,232,0.7) !important; }
        .ks-odds-btn:hover { background: rgba(22,30,22,0.6) !important; }
        .ks-quick-stake:hover { background: rgba(22,30,22,0.7) !important; color: #e8f5e8 !important; }
        input.ks-input:focus { outline: none !important; border-color: #00ff88 !important; box-shadow: 0 0 0 2px rgba(0,255,136,0.2) !important; }
        input.ks-input-lay:focus { outline: none !important; border-color: #ff4466 !important; box-shadow: 0 0 0 2px rgba(255,68,102,0.2) !important; }
        .ks-submit[data-side="BACK"]:hover:not(:disabled) { box-shadow: 0 0 40px rgba(0,255,136,0.5) !important; }
        .ks-submit[data-side="LAY"]:hover:not(:disabled) { box-shadow: 0 0 40px rgba(255,68,102,0.5) !important; }
      `}</style>
      <div style={{ background: "rgba(11,15,11,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(17,24,17,0.6)", borderRadius: 16 }}>
        <div style={{ background: "linear-gradient(to right, rgba(17,24,17,0.8), rgba(11,15,11,0.8))", paddingLeft: 20, paddingRight: 20, paddingTop: 16, paddingBottom: 16, borderBottom: "1px solid rgba(22,30,22,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg style={{ width: 20, height: 20, color: "#00ff88" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#e8f5e8" }}>Bet Slip</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="ks-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88" }} />
              <span style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>LIVE</span>
            </div>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setSide("BACK")}
              className={side !== "BACK" ? "ks-side-btn" : ""}
              style={{
                flex: 1,
                paddingTop: 12,
                paddingBottom: 12,
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 300ms",
                border: "none",
                cursor: "pointer",
                ...(side === "BACK"
                  ? { background: "#00ff88", color: "#050805", boxShadow: "0 0 25px rgba(0,255,136,0.5)", transform: "scale(1.02)" }
                  : { background: "rgba(17,24,17,0.8)", color: "#6b8a6b" })
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                BACK
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSide("LAY")}
              className={side !== "LAY" ? "ks-side-btn" : ""}
              style={{
                flex: 1,
                paddingTop: 12,
                paddingBottom: 12,
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 300ms",
                border: "none",
                cursor: "pointer",
                ...(side === "LAY"
                  ? { background: "#ff4466", color: "#e8f5e8", boxShadow: "0 0 25px rgba(255,68,102,0.5)", transform: "scale(1.02)" }
                  : { background: "rgba(17,24,17,0.8)", color: "#6b8a6b" })
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                LAY
              </span>
            </button>
          </div>

          {selectedOutcome ? (
            <div style={{ background: "linear-gradient(to right, rgba(17,24,17,0.6), rgba(17,24,17,0.4))", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid rgba(22,30,22,0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ color: "#6b8a6b", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Selected Outcome</p>
                  <p style={{ color: "#e8f5e8", fontWeight: 700, fontSize: 18 }}>{selectedOutcome.title}</p>
                </div>
                <div style={{
                  textAlign: "right",
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 6,
                  paddingBottom: 6,
                  borderRadius: 8,
                  ...(side === "BACK" ? { background: "rgba(0,255,136,0.2)" } : { background: "rgba(255,68,102,0.2)" })
                }}>
                  <p style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    ...(side === "BACK" ? { color: "#00ff88" } : { color: "#ff4466" })
                  }}>{side}</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: "rgba(17,24,17,0.3)", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px dashed rgba(22,30,22,0.3)" }}>
              <p style={{ color: "#6b8a6b", fontSize: 14, textAlign: "center" }}>Select an outcome to place a bet</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", color: "#6b8a6b", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, fontWeight: 600 }}>
                Odds (Decimal)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="odds-input"
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  className={`ks-input${side === "LAY" ? "-lay" : ""}`}
                  style={{
                    width: "100%",
                    background: "rgba(17,24,17,0.8)",
                    border: `1px solid ${side === "BACK" ? "rgba(0,255,136,0.5)" : "rgba(255,68,102,0.5)"}`,
                    borderRadius: 12,
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingLeft: 16,
                    paddingRight: 16,
                    color: "#e8f5e8",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 20,
                    fontWeight: 700,
                    outline: "none",
                    transition: "all 300ms",
                    boxSizing: "border-box"
                  }}
                  placeholder="1.00"
                  required
                />
                <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setOdds((parseFloat(odds || 1) - 0.01).toFixed(2))}
                    className="ks-odds-btn"
                    style={{ width: 32, height: 32, background: "rgba(22,30,22,0.5)", borderRadius: 8, color: "#6b8a6b", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOdds((parseFloat(odds || 1) + 0.01).toFixed(2))}
                    className="ks-odds-btn"
                    style={{ width: 32, height: 32, background: "rgba(22,30,22,0.5)", borderRadius: 8, color: "#6b8a6b", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: "block", color: "#6b8a6b", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, fontWeight: 600 }}>
                Stake (GU)
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#6b8a6b", fontFamily: "'Space Mono', monospace", fontSize: 18, pointerEvents: "none" }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className={`ks-input${side === "LAY" ? "-lay" : ""}`}
                  style={{
                    width: "100%",
                    background: "rgba(17,24,17,0.8)",
                    border: `1px solid ${side === "BACK" ? "rgba(0,255,136,0.5)" : "rgba(255,68,102,0.5)"}`,
                    borderRadius: 12,
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingLeft: 40,
                    paddingRight: 80,
                    color: "#e8f5e8",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 20,
                    fontWeight: 700,
                    outline: "none",
                    transition: "all 300ms",
                    boxSizing: "border-box"
                  }}
                  placeholder="0.00"
                  required
                />
                <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#6b8a6b", fontFamily: "'Space Mono', monospace", fontSize: 14, pointerEvents: "none" }}>GU</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {QUICK_STAKES.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickStake(amount)}
                    className="ks-quick-stake"
                    style={{
                      flex: 1,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: "rgba(17,24,17,0.5)",
                      borderRadius: 8,
                      color: "#6b8a6b",
                      fontSize: 12,
                      fontFamily: "'Space Mono', monospace",
                      fontWeight: 600,
                      transition: "all 300ms",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {stakeValue > 0 && decimalOdds > 1 && (
              <div style={{ background: "linear-gradient(to right, rgba(17,24,17,0.6), rgba(11,15,11,0.8))", borderRadius: 12, padding: 16, border: "1px solid rgba(22,30,22,0.5)", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#6b8a6b", fontSize: 14 }}>Potential Winnings</span>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontWeight: 700,
                    fontSize: 20,
                    ...(side === "BACK" ? { color: "#00ff88" } : { color: "#ff4466" })
                  }}>
                    ${potentialWinnings}
                  </span>
                </div>
                <div style={{ height: 1, background: "rgba(22,30,22,0.5)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#6b8a6b", fontSize: 14 }}>
                    {side === "BACK" ? "Stake" : "Liability"}
                  </span>
                  <span style={{ color: "#e8f5e8", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>${potentialLoss}</span>
                </div>
                {side === "LAY" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#6b8a6b", fontSize: 14 }}>Liability</span>
                    <span style={{ color: "#ff4466", fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>${potentialLoss}</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="ks-pulse" style={{ background: "rgba(255,68,102,0.1)", border: "1px solid rgba(255,68,102,0.3)", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg style={{ width: 20, height: 20, color: "#ff4466" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ color: "#ff4466", fontSize: 14, fontWeight: 600, margin: 0 }}>{error}</p>
                </div>
              </div>
            )}

            {showSuccess && success && (
              <div className="ks-pulse" style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg style={{ width: 20, height: 20, color: "#00ff88" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ color: "#00ff88", fontSize: 14, fontWeight: 600, margin: 0 }}>{success}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isDisabled}
              data-side={side}
              className="ks-submit"
              style={{
                width: "100%",
                paddingTop: 16,
                paddingBottom: 16,
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 300ms",
                border: "none",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.5 : 1,
                ...(side === "BACK"
                  ? { background: "linear-gradient(to right, #00ff88, #00ff88)", color: "#050805", boxShadow: "0 0 30px rgba(0,255,136,0.3)" }
                  : { background: "linear-gradient(to right, #ff4466, #ff4466)", color: "#e8f5e8", boxShadow: "0 0 30px rgba(255,68,102,0.3)" })
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg className="ks-spin" style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Placing Bet...
                </span>
              ) : !isConnected ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Connect Wallet to Bet
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Place {side} Bet
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
