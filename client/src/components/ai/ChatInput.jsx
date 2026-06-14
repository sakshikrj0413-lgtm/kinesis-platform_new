import { useState } from "react";
import { motion } from "framer-motion";

export default function ChatInput({ value, onChange, onSend, disabled }) {
  const [isFocused, setIsFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = !disabled && value.trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        padding: "12px 24px 16px",
        borderTop: "1px solid rgba(17,24,17,0.5)",
        background: "rgba(5,8,5,0.6)",
        backdropFilter: "blur(12px)",
      }}
    >
      <style>{`.chat-ph::placeholder { color: #4a6b4a; }`}</style>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask AGENTEX about markets, odds, or betting strategy..."
            rows={1}
            className="chat-ph"
            style={{
              width: "100%",
              background: "rgba(17,24,17,0.6)",
              border: `1px solid ${isFocused ? "var(--green-border)" : "rgba(22,30,22,0.4)"}`,
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 14,
              color: "#ffffff",
              outline: "none",
              boxShadow: isFocused ? "0 0 0 1px rgba(0,255,136,0.2), 0 0 16px rgba(0,255,136,0.05)" : "none",
              resize: "none",
              transition: "all 0.25s",
              minHeight: 48,
              maxHeight: 120,
              boxSizing: "border-box",
            }}
            disabled={disabled}
          />
        </div>
        <motion.button
          whileHover={canSend ? { scale: 1.05 } : {}}
          whileTap={canSend ? { scale: 0.95 } : {}}
          onClick={onSend}
          disabled={!canSend}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            height: 48,
            width: 48,
            borderRadius: 12,
            background: canSend ? (hovered ? "linear-gradient(135deg, #33ff99, #00ff88)" : "linear-gradient(135deg, #00ff88, #00cc66)") : "rgba(0,255,136,0.15)",
            opacity: canSend ? 1 : 0.3,
            cursor: canSend ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            transition: "all 0.2s",
            boxShadow: canSend ? "0 4px 16px rgba(0,255,136,0.25)" : "none",
            flexShrink: 0,
          }}
        >
          <svg style={{ width: 20, height: 20, color: canSend ? "#050805" : "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </motion.button>
      </div>
      <p style={{ fontSize: 10, color: "#2a4a2a", marginTop: 8, textAlign: "center" }}>
        AGENTEX AI provides analysis only. Not financial advice. Always bet responsibly.
      </p>
    </motion.div>
  );
}
