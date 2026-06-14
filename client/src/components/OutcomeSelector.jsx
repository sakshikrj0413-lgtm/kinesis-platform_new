import { useState } from "react";

export default function OutcomeSelector({ outcomes, setOutcomes }) {
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const addOutcome = () => {
    setOutcomes([...outcomes, { id: Date.now(), title: "", odds: 0.5 }]);
  };

  const removeOutcome = (id) => {
    if (outcomes.length <= 2) {
      setError("Minimum 2 outcomes required");
      setTimeout(() => setError(""), 2000);
      return;
    }
    setOutcomes(outcomes.filter((o) => o.id !== id));
  };

  const updateOutcome = (id, field, value) => {
    setOutcomes(outcomes.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`.kinesis-placeholder::placeholder { color: #6b8a6b; }`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 700,
            color: "#e8f5e8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Outcomes
        </label>
        {error && <span style={{ color: "#ff4444", fontSize: 14 }}>{error}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {outcomes.map((outcome, index) => {
          const titleFieldId = `title-${outcome.id}`;
          const oddsFieldId = `odds-${outcome.id}`;
          return (
            <div
              key={outcome.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                backgroundColor: "rgba(11,15,11,0.5)",
                border: "1px solid rgba(22,30,22,0.5)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6b8a6b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    value={outcome.title}
                    onChange={(e) =>
                      updateOutcome(outcome.id, "title", e.target.value)
                    }
                    placeholder={`Outcome ${index + 1}`}
                    onFocus={() => setFocusedField(titleFieldId)}
                    onBlur={() => setFocusedField(null)}
                    className="kinesis-placeholder"
                    style={{
                      marginTop: 4,
                      width: "100%",
                      backgroundColor: "#0b0f0b",
                      border: `1px solid ${
                        focusedField === titleFieldId
                          ? "rgba(0,255,136,0.5)"
                          : "rgba(22,30,22,0.5)"
                      }`,
                      borderRadius: 8,
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 10,
                      paddingBottom: 10,
                      color: "#e8f5e8",
                      outline: "none",
                      boxShadow:
                        focusedField === titleFieldId
                          ? "0 0 0 1px rgba(0,255,136,0.2)"
                          : "none",
                      transition: "all 0.2s",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      color: "#6b8a6b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Odds (0-1)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.99"
                    value={outcome.odds}
                    onChange={(e) =>
                      updateOutcome(
                        outcome.id,
                        "odds",
                        parseFloat(e.target.value) || 0.5
                      )
                    }
                    placeholder="0.50"
                    onFocus={() => setFocusedField(oddsFieldId)}
                    onBlur={() => setFocusedField(null)}
                    className="kinesis-placeholder"
                    style={{
                      marginTop: 4,
                      width: "100%",
                      backgroundColor: "#0b0f0b",
                      border: `1px solid ${
                        focusedField === oddsFieldId
                          ? "rgba(0,255,136,0.5)"
                          : "rgba(22,30,22,0.5)"
                      }`,
                      borderRadius: 8,
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 10,
                      paddingBottom: 10,
                      color: "#e8f5e8",
                      outline: "none",
                      boxShadow:
                        focusedField === oddsFieldId
                          ? "0 0 0 1px rgba(0,255,136,0.2)"
                          : "none",
                      transition: "all 0.2s",
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => removeOutcome(outcome.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255,68,68,0.2)";
                  e.currentTarget.style.borderColor =
                    "rgba(255,68,68,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255,68,68,0.1)";
                  e.currentTarget.style.borderColor =
                    "rgba(255,68,68,0.3)";
                }}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "rgba(255,68,68,0.1)",
                  color: "#ff4444",
                  transition: "all 0.2s",
                  border: "1px solid rgba(255,68,68,0.3)",
                  cursor: "pointer",
                }}
              >
                <svg
                  style={{ width: 20, height: 20 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
      <button
        onClick={addOutcome}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            "rgba(0,255,136,0.2)";
          e.currentTarget.style.borderColor =
            "rgba(0,255,136,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor =
            "rgba(0,255,136,0.1)";
          e.currentTarget.style.borderColor =
            "rgba(0,255,136,0.3)";
        }}
        style={{
          width: "100%",
          paddingTop: 12,
          paddingBottom: 12,
          borderRadius: 12,
          backgroundColor: "rgba(0,255,136,0.1)",
          color: "#00ff88",
          fontWeight: 600,
          transition: "all 0.2s",
          border: "1px solid rgba(0,255,136,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <svg
          style={{ width: 20, height: 20 }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Outcome
      </button>
    </div>
  );
}
