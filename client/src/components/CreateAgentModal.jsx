import { useState } from "react";
import { motion } from "framer-motion";
import useAgentsStore from "../store/agentsStore";

const G = "#00ff88";
const Y = "#ffd700";
const B = "#050805";
const S = "#0b0f0b";
const S2 = "#111811";
const S3 = "#161e16";
const TX = "#e8f5e8";
const M = "#6b8a6b";

export default function CreateAgentModal({ onClose, onSuccess }) {
  const { createAgent, loading } = useAgentsStore();
  const [form, setForm] = useState({
    name: "",
    sport: "all",
    strategy: "edge_hunter",
    minEdge: 3,
    maxStake: 50,
    dailyLossLimit: 200,
    maxOdds: 0.95,
    minOdds: 0.05,
    cooldownSeconds: 60,
    stopLoss: 100,
  });
  const [error, setError] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [hoverCancel, setHoverCancel] = useState(false);
  const [hoverSubmit, setHoverSubmit] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Agent name is required");
      return;
    }

    try {
      await createAgent({
        name: form.name,
        sport: form.sport,
        strategy: form.strategy,
        minEdge: parseFloat(form.minEdge),
        maxStake: parseFloat(form.maxStake),
        dailyLossLimit: parseFloat(form.dailyLossLimit),
        rules: {
          max_odds: parseFloat(form.maxOdds),
          min_odds: parseFloat(form.minOdds),
          cooldown_seconds: parseInt(form.cooldownSeconds),
          stop_loss: parseFloat(form.stopLoss),
          allowed_market_types: "BINARY,MULTI",
        },
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create agent");
    }
  };

  const inputStyle = (name) => ({
    width: "100%",
    backgroundColor: S2,
    border: `1px solid ${focusedField === name ? G : "rgba(22,30,22,0.6)"}`,
    borderRadius: 12,
    padding: "12px 16px",
    color: TX,
    outline: "none",
    boxShadow: focusedField === name ? `0 0 0 1px rgba(0,255,136,0.20)` : "none",
    fontFamily: "'Space Mono', monospace",
    fontSize: 14,
    boxSizing: "border-box",
  });

  const labelStyle = {
    display: "block",
    color: M,
    fontSize: 14,
    marginBottom: 4,
    fontFamily: "'Syne', sans-serif",
  };

  return (
    <>
      <style>{`
        @keyframes kpulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(5,8,5,0.7)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: S,
            border: "1px solid rgba(22,30,22,0.5)",
            borderRadius: 24,
            padding: 32,
            width: "100%",
            maxWidth: 512,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: TX }}>
              Create Agent
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: M,
                cursor: "pointer",
                padding: 0,
              }}
            >
              <svg width={24} height={24} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: "rgba(255,68,68,0.10)",
                border: "1px solid rgba(255,68,68,0.30)",
                color: "#ff4444",
                fontSize: 14,
                fontFamily: "'Space Mono', monospace",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label style={labelStyle}>Agent Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Football Hunter"
                style={inputStyle("name")}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Sport</label>
                <select
                  name="sport"
                  value={form.sport}
                  onChange={handleChange}
                  style={inputStyle("sport")}
                  onFocus={() => setFocusedField("sport")}
                  onBlur={() => setFocusedField(null)}
                >
                  <option value="all">All Sports</option>
                  <option value="football">Football</option>
                  <option value="basketball">Basketball</option>
                  <option value="tennis">Tennis</option>
                  <option value="cricket">Cricket</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Strategy</label>
                <select
                  name="strategy"
                  value={form.strategy}
                  onChange={handleChange}
                  style={inputStyle("strategy")}
                  onFocus={() => setFocusedField("strategy")}
                  onBlur={() => setFocusedField(null)}
                >
                  <option value="edge_hunter">Edge Hunter</option>
                  <option value="momentum">Momentum</option>
                  <option value="conservative">Conservative</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Min Edge (%)</label>
                <input
                  type="number"
                  name="minEdge"
                  value={form.minEdge}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  step="0.5"
                  style={inputStyle("minEdge")}
                  onFocus={() => setFocusedField("minEdge")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <div>
                <label style={labelStyle}>Max Stake (GU)</label>
                <input
                  type="number"
                  name="maxStake"
                  value={form.maxStake}
                  onChange={handleChange}
                  min="1"
                  max="1000"
                  style={inputStyle("maxStake")}
                  onFocus={() => setFocusedField("maxStake")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <div>
                <label style={labelStyle}>Daily Loss Limit</label>
                <input
                  type="number"
                  name="dailyLossLimit"
                  value={form.dailyLossLimit}
                  onChange={handleChange}
                  min="10"
                  max="5000"
                  style={inputStyle("dailyLossLimit")}
                  onFocus={() => setFocusedField("dailyLossLimit")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>Stop Loss (GU)</label>
                <input
                  type="number"
                  name="stopLoss"
                  value={form.stopLoss}
                  onChange={handleChange}
                  min="10"
                  style={inputStyle("stopLoss")}
                  onFocus={() => setFocusedField("stopLoss")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <div>
                <label style={labelStyle}>Cooldown (sec)</label>
                <input
                  type="number"
                  name="cooldownSeconds"
                  value={form.cooldownSeconds}
                  onChange={handleChange}
                  min="10"
                  style={inputStyle("cooldownSeconds")}
                  onFocus={() => setFocusedField("cooldownSeconds")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, paddingTop: 16 }}>
              <button
                type="button"
                onClick={onClose}
                onMouseEnter={() => setHoverCancel(true)}
                onMouseLeave={() => setHoverCancel(false)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 12,
                  backgroundColor: hoverCancel ? S3 : S2,
                  border: "none",
                  color: "#b8d5b8",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                  transition: "background-color 0.2s",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => setHoverSubmit(true)}
                onMouseLeave={() => setHoverSubmit(false)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 12,
                  background: hoverSubmit
                    ? "linear-gradient(to right, rgba(0,255,136,0.30), rgba(0,255,136,0.30))"
                    : "linear-gradient(to right, rgba(0,255,136,0.20), rgba(0,255,136,0.20))",
                  border: "1px solid rgba(0,255,136,0.40)",
                  color: G,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                  transition: "background 0.2s",
                }}
              >
                {loading ? "Creating..." : "Create Agent"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  );
}
