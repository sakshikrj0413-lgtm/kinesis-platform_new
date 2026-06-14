import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useAIStore from "../../store/aiStore";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SuggestedPrompt from "./SuggestedPrompt";
import SuggestedBetCard from "./SuggestedBetCard";

const SUGGESTED_PROMPTS = [
  "Best edge markets today",
  "Analyze Arsenal vs Chelsea",
  "Safe bets today",
  "High ROI opportunities",
  "Trending markets",
  "Explain Kelly Criterion",
];

export default function ChatWindow() {
  const { messages, loading, sendMessage, suggestedBets } = useAIStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestedBets]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handlePrompt = (prompt) => {
    sendMessage(prompt);
  };

  return (
    <>
      <style>{`
        .msg-scroll::-webkit-scrollbar { width: 4px; }
        .msg-scroll::-webkit-scrollbar-track { background: transparent; }
        .msg-scroll::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 2px; }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-glow {
          0%, 100% { box-shadow: 0 0 8px var(--green-glow); }
          50% { box-shadow: 0 0 24px var(--green-glow), 0 0 48px rgba(0,255,136,0.1); }
        }
        @keyframes typing-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .typing-dot { animation: typing-bounce 0.6s ease-in-out infinite; }
        .suggested-bets-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 8;
        }
        @media (min-width: 768px) {
          .suggested-bets-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div ref={containerRef} className="msg-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 24px 8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: "100%" }}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  textAlign: "center",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  style={{ maxWidth: 480 }}
                >
                  <motion.div
                    animate={{ boxShadow: ["0 0 8px var(--green-glow)", "0 0 24px var(--green-glow), 0 0 48px rgba(0,255,136,0.1)", "0 0 8px var(--green-glow)"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      width: 72, height: 72, margin: "0 auto 24px",
                      borderRadius: 20,
                      background: "linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.05))",
                      border: "1px solid var(--green-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg style={{ width: 36, height: 36, color: "var(--green)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </motion.div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8, fontFamily: "var(--font-display)" }}>
                    AGENTEX AI
                  </h2>
                  <p style={{ color: "var(--muted)", marginBottom: 32, fontSize: 14, lineHeight: 1.6 }}>
                    Your intelligent betting copilot. Ask about markets, odds, value bets, or risk analysis.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <motion.div key={prompt} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + SUGGESTED_PROMPTS.indexOf(prompt) * 0.05 }}>
                        <SuggestedPrompt text={prompt} onClick={() => handlePrompt(prompt)} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i === messages.length - 1 ? 0.1 : 0 }}
                >
                  <ChatMessage message={msg} />
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && messages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "4px 0" }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.05))", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg style={{ width: 16, height: 16, color: "var(--green)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "12px 16px", background: "rgba(17,24,17,0.5)", borderRadius: 12, border: "1px solid rgba(22,30,22,0.3)" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="typing-dot" style={{ width: 7, height: 7, background: "var(--green)", borderRadius: "50%", animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {suggestedBets && suggestedBets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: "12px 24px", borderTop: "1px solid rgba(17,24,17,0.5)", background: "rgba(5,8,5,0.3)" }}
          >
            <p style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 700 }}>
              Suggested Bets
            </p>
            <div className="suggested-bets-grid" style={{ display: "grid", gap: 8 }}>
              {suggestedBets.map((bet, i) => (
                <SuggestedBetCard key={i} bet={bet} />
              ))}
            </div>
          </motion.div>
        )}

        <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={loading} />
      </div>
    </>
  );
}
