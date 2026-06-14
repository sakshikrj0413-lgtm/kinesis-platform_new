import { motion } from "framer-motion";

export default function SuggestedBetCard({ bet }) {
  const riskColors = { LOW: "var(--green)", MEDIUM: "var(--yellow)", HIGH: "#ff4466" };
  const riskBorders = { LOW: "1px solid var(--green-border)", MEDIUM: "1px solid var(--yellow-border)", HIGH: "1px solid rgba(255,68,102,0.3)" };
  const riskBg = { LOW: "rgba(0,255,136,0.1)", MEDIUM: "rgba(255,215,0,0.1)", HIGH: "rgba(255,68,102,0.1)" };
  const sideColor = bet.side === "BACK" ? "var(--green)" : "#ff4466";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, borderColor: "var(--green-border)" }}
      style={{
        padding: "10px 12px",
        background: "rgba(17,24,17,0.4)",
        border: "1px solid rgba(22,30,22,0.3)",
        borderRadius: 8,
        transition: "border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>
          {bet.market}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, border: riskBorders[bet.risk] || riskBorders.MEDIUM, color: riskColors[bet.risk] || riskColors.MEDIUM, background: riskBg[bet.risk] || riskBg.MEDIUM, flexShrink: 0 }}>
          {bet.risk}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 10, color: "var(--muted)" }}>
        <span style={{ color: sideColor, fontWeight: 700 }}>{bet.side}</span>
        <span>Confidence: {bet.confidence}%</span>
        <span>Edge: +{bet.edge}%</span>
      </div>
    </motion.div>
  );
}
