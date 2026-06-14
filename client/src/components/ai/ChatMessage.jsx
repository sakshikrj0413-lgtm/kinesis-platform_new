import { motion } from "framer-motion";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        flexDirection: isUser ? "row-reverse" : "row",
      }}
    >
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.05))", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg style={{ width: 15, height: 15, color: "var(--green)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      )}

      <div
        style={{
          maxWidth: isUser ? "75%" : "82%",
          padding: "10px 16px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          fontSize: 14,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          background: isUser
            ? "linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,255,136,0.06))"
            : "rgba(17,24,17,0.5)",
          border: isUser
            ? "1px solid var(--green-border)"
            : "1px solid rgba(22,30,22,0.3)",
          color: "var(--text)",
          backdropFilter: isUser ? "blur(4px)" : "none",
        }}
      >
        {isUser ? (
          message.content
        ) : (
          <FormattedContent content={message.content} />
        )}
      </div>

      {isUser && (
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(22,30,22,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg style={{ width: 15, height: 15, color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

function FormattedContent({ content }) {
  const lines = content.split("\n");
  return (
    <div>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;

        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <p key={i} style={{ fontWeight: 700, color: "var(--green)", marginTop: 8, marginBottom: 4 }}>
              {trimmed.replace(/\*\*/g, "")}
            </p>
          );
        }

        if (trimmed.startsWith("- ")) {
          return (
            <p key={i} style={{ marginLeft: 16, color: "var(--text)", display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color: "var(--green)", marginTop: 4 }}>&bull;</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(2)) }} />
            </p>
          );
        }

        return (
          <p key={i} style={{ color: "var(--text)" }} dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
        );
      })}
    </div>
  );
}

function formatInline(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ffffff;font-weight:600">$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(22,30,22,0.5);padding:2px 6px;border-radius:4px;font-size:12px;color:var(--green);font-family:var(--font-mono)">$1</code>');
}
