import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useAIStore from "../../store/aiStore";

export default function RecentChats() {
  const { chats, activeChat, loadChatHistory, selectChat, resetChat } = useAIStore();

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  const [hoveredNew, setHoveredNew] = useState(false);

  return (
    <div style={{ width: 256, height: "100%", background: "rgba(5,8,5,0.6)", borderLeft: "1px solid rgba(17,24,17,0.5)", display: "flex", flexDirection: "column", backdropFilter: "blur(8px)" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(17,24,17,0.5)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent Chats</span>
        <button onClick={resetChat} style={{ fontSize: 10, color: hoveredNew ? "var(--green)" : "var(--green)", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.2s", fontWeight: 700, opacity: 0.7 }}
          onMouseEnter={() => setHoveredNew(true)}
          onMouseLeave={() => setHoveredNew(false)}
        >
          + New
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingTop: 8, paddingBottom: 8 }}>
        {chats.length === 0 ? (
          <p style={{ padding: "24px 16px", fontSize: 12, color: "#2a4a2a", textAlign: "center" }}>No conversations yet</p>
        ) : (
          chats.map((chat) => (
            <motion.button
              key={chat.id}
              whileHover={{ backgroundColor: "rgba(22,30,22,0.5)" }}
              onClick={() => selectChat(chat.id)}
              style={{
                width: "100%", padding: "10px 16px", textAlign: "left",
                background: activeChat?.id === chat.id ? "rgba(17,24,17,0.6)" : "transparent",
                borderLeft: activeChat?.id === chat.id ? "2px solid var(--green)" : "2px solid transparent",
                transition: "background 0.2s, border-color 0.2s",
                borderTop: "none", borderRight: "none", borderBottom: "none",
                cursor: "pointer", fontFamily: "inherit", fontSize: "inherit",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.title}</p>
              <p style={{ fontSize: 10, color: "#2a4a2a", marginTop: 2 }}>{chat.message_count} messages</p>
            </motion.button>
          ))
        )}
      </div>

      <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(17,24,17,0.5)" }}>
        <p style={{ fontSize: 10, color: "#2a4a2a", textAlign: "center" }}>AGENTEX AI v1.0</p>
      </div>
    </div>
  );
}
