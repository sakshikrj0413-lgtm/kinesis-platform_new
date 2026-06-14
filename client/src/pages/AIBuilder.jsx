import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../layouts/DashboardLayout";
import useAIBuilderStore from "../store/aiBuilderStore";
import useAgentsStore from "../store/agentsStore";

function JsonViewer({ data, onEdit }) {
  const jsonStr = JSON.stringify(data, null, 2);

  return (
    <div style={{ position: "relative" }}>
      <pre
        style={{
          backgroundColor: "rgba(5,8,5,0.6)",
          border: "1px solid var(--green-border)",
          borderRadius: "12px",
          padding: "16px",
          fontSize: "14px",
          fontFamily: "var(--font-mono)",
          color: "var(--text)",
          overflowX: "auto",
          maxHeight: "384px",
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          margin: 0,
        }}
      >
        {jsonStr.split("\n").map((line, i) => {
          let color = { color: "var(--text)" };
          if (line.includes('"')) {
            if (line.includes(":")) color = { color: "var(--green)" };
            else color = { color: "var(--green)" };
          }
          if (line.match(/:\s*(true|false|null)/))
            color = { color: "var(--yellow)" };
          if (line.match(/:\s*\d/)) color = { color: "var(--green)" };

          return (
            <div key={i} style={color}>
              <span
                style={{
                  color: "var(--muted)",
                  userSelect: "none",
                  marginRight: "16px",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {line}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function StreamingText({ text, speed = 20 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && (
        <span
          style={{
            color: "var(--green)",
            animation: "kinesis-pulse 1.5s ease-in-out infinite",
          }}
        >
          ▊
        </span>
      )}
    </span>
  );
}

export default function AIBuilder() {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState("market");
  const {
    result,
    validationErrors,
    isValid,
    loading,
    error,
    generate,
    updateResult,
    deploying,
    setDeploying,
    clear,
  } = useAIBuilderStore();
  const { createAgent } = useAgentsStore();
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editJson, setEditJson] = useState("");
  const [textareaFocused, setTextareaFocused] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setDeploySuccess(false);
    await generate(type, prompt);
  };

  const handleEdit = () => {
    setEditing(true);
    setEditJson(JSON.stringify(result, null, 2));
  };

  const handleSaveEdit = () => {
    try {
      const parsed = JSON.parse(editJson);
      updateResult(parsed);
      setEditing(false);
    } catch {
      alert("Invalid JSON");
    }
  };

  const handleDeploy = async () => {
    if (!isValid) {
      alert("Cannot deploy: validation errors exist");
      return;
    }

    setDeploying(true);

    try {
      if (type === "agent") {
        await createAgent(result);
      }
      setDeploySuccess(true);
      setTimeout(() => setDeploySuccess(false), 3000);
    } catch (err) {
      alert("Deploy failed: " + err.message);
    }

    setDeploying(false);
  };

  const suggestions = {
    market: [
      "Create IPL Finals market",
      "Create Arsenal vs Chelsea match",
      "Create 2026 election prediction",
      "Create Bitcoin price market",
    ],
    agent: [
      "Create a football agent with low risk",
      "Create aggressive momentum bot",
      "Create conservative edge hunter",
      "Create basketball strategy agent",
    ],
    contract: [
      "Create standard prediction market contract",
      "Create binary outcome settlement rules",
    ],
    casino: ["Create dice game rules", "Create coin flip casino game"],
  };

  const typeBtnBase = {
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "1px solid",
  };

  return (
    <DashboardLayout>
      <style>{`
        @keyframes kinesis-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes kinesis-spin {
          to { transform: rotate(360deg); }
        }
        @media (min-width: 1024px) {
          .kinesis-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .kinesis-textarea::placeholder {
          color: var(--muted) !important;
          opacity: 0.6;
        }
        .kinesis-hover-green:hover {
          background: linear-gradient(90deg, rgba(0,255,136,0.3), rgba(255,215,0,0.3)) !important;
        }
        .kinesis-hover-deploy:hover {
          background: linear-gradient(90deg, rgba(0,255,136,0.3), rgba(0,255,136,0.25)) !important;
        }
        .kinesis-hover-surface:hover {
          background-color: var(--surface3) !important;
        }
        .kinesis-hover-text:hover {
          color: var(--text) !important;
        }
        .kinesis-hover-cancel:hover {
          background-color: var(--surface3) !important;
        }
      `}</style>

      <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontFamily: "var(--font-display)",
              color: "var(--text)",
              margin: 0,
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "var(--green)",
                animation: "kinesis-pulse 2s ease-in-out infinite",
                display: "inline-block",
              }}
            />
            NL2KCL — AI Compiler
          </h1>
          <p
            style={{
              color: "var(--muted)",
              marginTop: "4px",
              fontSize: "14px",
            }}
          >
            Natural language to market/agent/contract generation
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "24px",
          }}
          className="kinesis-grid"
        >
          <div>
            <div
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--green-border)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                {["market", "agent", "contract", "casino"].map((t) => {
                  const active = type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      style={{
                        ...typeBtnBase,
                        backgroundColor: active
                          ? "var(--green-glow)"
                          : "var(--surface2)",
                        color: active ? "var(--green)" : "var(--muted)",
                        borderColor: active
                          ? "var(--green-border)"
                          : "rgba(107,138,107,0.25)",
                      }}
                      className={active ? "" : "kinesis-hover-surface"}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setTextareaFocused(true)}
                onBlur={() => setTextareaFocused(false)}
                placeholder="Describe what you want to create..."
                className="kinesis-textarea"
                style={{
                  width: "100%",
                  backgroundColor: "rgba(5,8,5,0.4)",
                  border: `1px solid ${
                    textareaFocused
                      ? "var(--green-border)"
                      : "rgba(107,138,107,0.25)"
                  }`,
                  borderRadius: "12px",
                  padding: "16px",
                  color: "var(--text)",
                  outline: "none",
                  resize: "none",
                  height: "128px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                style={{
                  width: "100%",
                  marginTop: "16px",
                  padding: "12px 0",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(90deg, var(--green-glow), rgba(255,215,0,0.2))",
                  border: "1px solid var(--green-border)",
                  color: "var(--green)",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor:
                    loading || !prompt.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !prompt.trim() ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
                className={
                  loading || !prompt.trim() ? "" : "kinesis-hover-green"
                }
              >
                {loading ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(0,255,136,0.3)",
                        borderTopColor: "var(--green)",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "kinesis-spin 1s linear infinite",
                      }}
                    />
                    Compiling...
                  </span>
                ) : (
                  "Generate"
                )}
              </button>

              <div style={{ marginTop: "16px" }}>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: "12px",
                    marginBottom: "8px",
                  }}
                >
                  Suggestions:
                </p>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                >
                  {suggestions[type].map((s) => (
                    <button
                      key={s}
                      onClick={() => setPrompt(s)}
                      style={{
                        fontSize: "12px",
                        backgroundColor: "var(--surface2)",
                        color: "var(--muted)",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      className="kinesis-hover-surface"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "rgb(248,113,113)",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--green-border)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <h3
                  style={{
                    color: "var(--green)",
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    margin: 0,
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--green)",
                      animation: "kinesis-pulse 2s ease-in-out infinite",
                      display: "inline-block",
                    }}
                  />
                  Generated Output
                </h3>
                {result && !editing && (
                  <button
                    onClick={handleEdit}
                    style={{
                      color: "var(--muted)",
                      fontSize: "12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    className="kinesis-hover-text"
                  >
                    Edit
                  </button>
                )}
              </div>

              {result ? (
                editing ? (
                  <div>
                    <textarea
                      value={editJson}
                      onChange={(e) => setEditJson(e.target.value)}
                      className="kinesis-textarea"
                      style={{
                        width: "100%",
                        backgroundColor: "rgba(5,8,5,0.4)",
                        border: "1px solid rgba(107,138,107,0.25)",
                        borderRadius: "12px",
                        padding: "16px",
                        color: "var(--text)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "14px",
                        height: "256px",
                        resize: "none",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "12px",
                      }}
                    >
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          backgroundColor: "var(--green-glow)",
                          color: "var(--green)",
                          fontSize: "14px",
                          fontWeight: 600,
                          border: "1px solid var(--green-border)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        className="kinesis-hover-green"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          backgroundColor: "var(--surface2)",
                          color: "var(--muted)",
                          fontSize: "14px",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        className="kinesis-hover-cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <JsonViewer data={result} />
                )
              ) : (
                <div
                  style={{
                    color: "var(--muted)",
                    textAlign: "center",
                    padding: "48px 0",
                    fontFamily: "var(--font-mono)",
                    fontSize: "14px",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(0,255,136,0.5)",
                      marginBottom: "8px",
                    }}
                  >
                    {">"}
                  </div>
                  Awaiting input...
                </div>
              )}

              {validationErrors.length > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(255,215,0,0.1)",
                    border: "1px solid var(--yellow-border)",
                  }}
                >
                  <p
                    style={{
                      color: "var(--yellow)",
                      fontSize: "12px",
                      fontWeight: 700,
                      marginBottom: "4px",
                    }}
                  >
                    Validation Errors:
                  </p>
                  {validationErrors.map((e, i) => (
                    <p key={i} style={{ color: "rgba(255,215,0,0.8)", fontSize: "12px" }}>
                      {e}
                    </p>
                  ))}
                </div>
              )}

              {isValid && result && !editing && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(0,255,136,0.1)",
                    border: "1px solid var(--green-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--green)",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      color: "var(--green)",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    VALID — Ready to deploy
                  </span>
                </div>
              )}

              {result && !editing && (
                <button
                  onClick={handleDeploy}
                  disabled={deploying || !isValid}
                  style={{
                    width: "100%",
                    marginTop: "16px",
                    padding: "12px 0",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(90deg, rgba(0,255,136,0.2), rgba(0,255,136,0.15))",
                    border: "1px solid var(--green-border)",
                    color: "var(--green)",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: deploying || !isValid ? "not-allowed" : "pointer",
                    opacity: deploying || !isValid ? 0.5 : 1,
                    transition: "all 0.2s",
                  }}
                  className={
                    deploying || !isValid ? "" : "kinesis-hover-deploy"
                  }
                >
                  {deploying
                    ? "Deploying..."
                    : deploySuccess
                      ? "Deployed!"
                      : "Deploy to AGON"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
