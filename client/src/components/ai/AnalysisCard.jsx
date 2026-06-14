import { motion } from "framer-motion";

export default function AnalysisCard({ analysis, onClose }) {
  const riskColors = { LOW: "var(--green)", MEDIUM: "var(--yellow)", HIGH: "#ff4466" };
  const riskBg = { LOW: "rgba(0,255,136,0.15)", MEDIUM: "rgba(255,215,0,0.15)", HIGH: "rgba(255,68,102,0.15)" };
  const riskBorder = { LOW: "1px solid var(--green-border)", MEDIUM: "1px solid var(--yellow-border)", HIGH: "1px solid rgba(255,68,102,0.3)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ background: "rgba(11,15,11,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(22,30,22,0.4)", borderRadius: 16, overflow: "hidden" }}
    >
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(22,30,22,0.4)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg style={{ width: 16, height: 16, color: "var(--green)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", letterSpacing: "0.03em" }}>AGENTEX Analysis</span>
        </div>
        <button onClick={onClose} style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", marginBottom: 10 }}>{analysis.market_title}</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
          {[
            { label: "Risk", value: analysis.risk, color: riskColors[analysis.risk] || riskColors.MEDIUM, bg: riskBg[analysis.risk] || riskBg.MEDIUM, border: riskBorder[analysis.risk] || riskBorder.MEDIUM },
            { label: "Edge", value: `+${analysis.edge}%`, color: "var(--green)", bg: "rgba(17,24,17,0.5)", border: "1px solid rgba(22,30,22,0.3)" },
            { label: "Confidence", value: `${analysis.confidence}%`, color: "var(--green)", bg: "rgba(17,24,17,0.5)", border: "1px solid rgba(22,30,22,0.3)" },
          ].map((item) => (
            <div key={item.label} style={{ padding: "8px 12px", borderRadius: 8, textAlign: "center", background: item.bg, border: item.border }}>
              <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>{item.label}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "var(--text)", whiteSpace: "pre-wrap", lineHeight: 1.7, maxHeight: 160, overflowY: "auto" }}>
          {analysis.analysis}
        </div>
      </div>
    </motion.div>
  );
}
