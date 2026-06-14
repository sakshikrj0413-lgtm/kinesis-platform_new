import { useEffect, useState, useRef } from "react";

export default function OddsCard({
  title,
  odds,
  onClick,
  change = "stable",
  showLive = false,
  marketDepth = null,
  showDecimal = false
}) {
  const [flashStyle, setFlashStyle] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const prevOddsRef = useRef(odds);
  const flashTimeoutRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (change !== "stable") {
      setFlashStyle(
        change === "up"
          ? { boxShadow: "0 0 0 2px rgba(0,255,136,0.5), 0 0 30px rgba(0,255,136,0.4)" }
          : { boxShadow: "0 0 0 2px rgba(239,68,68,0.5), 0 0 30px rgba(239,68,68,0.4)" }
      );
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlashStyle({}), 600);
    }
    prevOddsRef.current = odds;
  }, [odds, change]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const displayOdds = showDecimal ? odds : (odds * 100).toFixed(1);
  const displaySuffix = showDecimal ? "" : "%";
  const decimalOdds = showDecimal ? odds : (1 / odds).toFixed(2);

  const cardStyle = {
    position: "relative",
    backgroundColor: "color-mix(in srgb, var(--surface) 80%, transparent)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    border: "1px solid color-mix(in srgb, var(--surface3) 50%, transparent)",
    borderRadius: "16px",
    padding: "20px",
    cursor: onClick ? "pointer" : undefined,
    transition: "box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease, background-color 0.3s ease",
    ...(isHovered && onClick
      ? {
          borderColor: "color-mix(in srgb, var(--green) 50%, transparent)",
          boxShadow: "0 0 30px rgba(0,255,136,0.15)",
          transform: "translateY(-2px)",
          backgroundColor: "var(--surface2)",
        }
      : {}),
    ...flashStyle,
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {change !== "stable" && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "4px 8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: change === "up" ? "var(--green)" : "rgba(239,68,68,1)",
            color: change === "up" ? "var(--black)" : "#fff",
          }}
        >
          <span>{change === "up" ? "\u2191" : "\u2193"}</span>
          <span>{Math.abs((odds - prevOddsRef.current) * 100).toFixed(1)}%</span>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ color: "var(--muted)", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{title}</span>
        {showLive && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--green)", animation: "kinesis-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
            <span style={{ color: "var(--green)", fontSize: "0.75rem", fontWeight: 700 }}>LIVE</span>
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: "2.25rem",
          fontWeight: 700,
          letterSpacing: "-0.025em",
          transition: "all 0.3s ease",
          color: change === "down" ? "rgba(239,68,68,1)" : "var(--green)",
          transform: change === "up" ? "scale(1.03)" : change === "down" ? "scale(0.97)" : "scale(1)",
        }}
      >
        {displayOdds}{displaySuffix}
      </div>

      {showDecimal && (
        <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
          Decimal: {decimalOdds}
        </div>
      )}

      {marketDepth && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid color-mix(in srgb, var(--surface3) 50%, transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "8px" }}>
            <span style={{ color: "var(--muted)" }}>Back Depth</span>
            <span style={{ color: "var(--green)", fontFamily: "var(--font-mono)" }}>{marketDepth.backDepth || 0}%</span>
          </div>
          <div style={{ height: "6px", backgroundColor: "color-mix(in srgb, var(--surface3) 50%, transparent)", borderRadius: "9999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: "linear-gradient(to right, #00cc6a, var(--green))",
                borderRadius: "9999px",
                transition: "width 0.5s ease",
                width: `${marketDepth.backDepth || 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {showLive && (
        <div style={{ position: "absolute", bottom: "8px", left: "16px", right: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              width: "100%",
              height: "2px",
              background: "linear-gradient(to right, transparent, color-mix(in srgb, var(--green) 30%, transparent), transparent)",
              animation: "kinesis-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              borderRadius: "9999px",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes kinesis-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
