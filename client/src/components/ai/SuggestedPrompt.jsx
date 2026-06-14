import { motion } from "framer-motion";

export default function SuggestedPrompt({ text, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, borderColor: "var(--green-border)", color: "var(--green)" }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        padding: "7px 14px",
        background: "rgba(17,24,17,0.6)",
        border: "1px solid rgba(22,30,22,0.4)",
        borderRadius: 8,
        fontSize: 12,
        color: "var(--text)",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.2s",
      }}
    >
      {text}
    </motion.button>
  );
}
