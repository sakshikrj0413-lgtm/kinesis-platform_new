import { motion } from "framer-motion";
import useAIStore from "../store/aiStore";
import ChatWindow from "../components/ai/ChatWindow";
import RecentChats from "../components/ai/RecentChats";
import AnalysisCard from "../components/ai/AnalysisCard";

export default function Assistant() {
  const { analysis, clearAnalysis } = useAIStore();

  return (
    <div className="assistant-root" style={{ display: 'flex', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      {/* Animated grid background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="assistant-grid-bg" />
        <div className="assistant-glow-top" />
      </div>

      {/* Header bar */}
      <div className="assistant-header" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--green-glow)' }}>
            <svg style={{ width: 20, height: 20, color: '#000' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', letterSpacing: '0.05em' }}>AGENTEX</span>
            <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8, fontWeight: 400 }}>AI Betting Copilot</span>
          </div>
        </motion.div>
        {analysis && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={clearAnalysis}
            style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: '1px solid var(--green-border)', background: 'var(--green-glow)', color: 'var(--green)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            Clear Analysis
          </motion.button>
        )}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginTop: 64, position: 'relative', zIndex: 5 }}>
        {analysis && (
          <div style={{ padding: '12px 24px 0 24px', flexShrink: 0 }}>
            <AnalysisCard analysis={analysis} onClose={clearAnalysis} />
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: 0 }}>
          <ChatWindow />
        </div>
      </div>

      <div className="assistant-recent-chats">
        <RecentChats />
      </div>

      <style>{`
        .assistant-grid-bg {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .assistant-glow-top {
          position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
          width: 600px; height: 400px;
          background: radial-gradient(ellipse, rgba(0,255,136,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .assistant-recent-chats { flex-shrink: 0; }
        @media (max-width: 900px) {
          .assistant-recent-chats { display: none; }
        }
        @media (max-width: 640px) {
          .assistant-root .assistant-header { padding: 12px 16px !important; }
          .assistant-root .assistant-header span:first-of-type { font-size: 14px !important; }
          .assistant-root .assistant-header span:last-of-type { display: none; }
        }
      `}</style>
    </div>
  );
}
