import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import OutcomeSelector from "../components/OutcomeSelector";

export default function CreateMarket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "BINARY",
    outcomes: [
      { id: 1, title: "YES", odds: 0.5 },
      { id: 2, title: "NO", odds: 0.5 },
    ],
  });

  const isBinary = form.type === "BINARY";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }
    if (form.outcomes.some((o) => !o.title.trim())) {
      setError("All outcomes must have titles");
      return;
    }
    if (isBinary && form.outcomes.length !== 2) {
      setError("Binary markets must have exactly YES and NO");
      return;
    }
    if (!isBinary && form.outcomes.length < 2) {
      setError("At least 2 outcomes required");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        outcomes: form.outcomes.map((o) => ({ title: o.title, odds: o.odds, betting_price: 0.001 })),
      };
      await API.post("/admin/markets/create", payload);
      navigate("/markets");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create market");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (newType) => {
    setForm({
      ...form,
      type: newType,
      outcomes: newType === "BINARY"
        ? [
            { id: 1, title: "YES", odds: 0.5 },
            { id: 2, title: "NO", odds: 0.5 },
          ]
        : [
            { id: 1, title: "", odds: 0.5 },
            { id: 2, title: "", odds: 0.5 },
          ],
    });
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 'bold' }}>Create Market</h1>
          <p style={{ color: '#6b8a6b', marginTop: 8 }}>Build a new prediction market</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{
            backgroundColor: 'rgba(11,15,11,0.6)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(22,30,22,0.5)',
            borderRadius: 24,
            padding: 32,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>Market Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#e8f5e8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Will Bitcoin exceed $100,000 by end of 2025?"
                  style={{
                    width: '100%',
                    backgroundColor: '#0b0f0b',
                    border: '1px solid rgba(22,30,22,0.5)',
                    borderRadius: 12,
                    padding: '12px 20px',
                    color: '#e8f5e8',
                    outline: 'none',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(0,255,136,0.5)';
                    e.target.style.boxShadow = '0 0 0 1px rgba(0,255,136,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(22,30,22,0.5)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#e8f5e8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="This market resolves to YES if Bitcoin (BTC) trades above $100,000 USD on any major exchange before December 31, 2025 23:59 UTC."
                  rows={4}
                  style={{
                    width: '100%',
                    backgroundColor: '#0b0f0b',
                    border: '1px solid rgba(22,30,22,0.5)',
                    borderRadius: 12,
                    padding: '12px 20px',
                    color: '#e8f5e8',
                    outline: 'none',
                    transition: 'all 0.3s',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(0,255,136,0.5)';
                    e.target.style.boxShadow = '0 0 0 1px rgba(0,255,136,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(22,30,22,0.5)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#e8f5e8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Market Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <button
                    type="button"
                    onClick={() => handleTypeChange("BINARY")}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderStyle: 'solid',
                      borderColor: isBinary ? '#00ff88' : 'rgba(22,30,22,0.5)',
                      backgroundColor: isBinary ? 'rgba(0,255,136,0.1)' : 'rgba(11,15,11,0.5)',
                      color: isBinary ? '#00ff88' : '#6b8a6b',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isBinary) e.target.style.borderColor = 'rgba(22,30,22,0.8)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isBinary) e.target.style.borderColor = 'rgba(22,30,22,0.5)';
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>Binary</div>
                    <div style={{ fontSize: 14, color: '#6b8a6b', marginTop: 4 }}>Yes / No outcome</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange("MULTI_OUTCOME")}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderStyle: 'solid',
                      borderColor: !isBinary ? '#00ff88' : 'rgba(22,30,22,0.5)',
                      backgroundColor: !isBinary ? 'rgba(0,255,136,0.1)' : 'rgba(11,15,11,0.5)',
                      color: !isBinary ? '#00ff88' : '#6b8a6b',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      if (isBinary) e.target.style.borderColor = 'rgba(22,30,22,0.8)';
                    }}
                    onMouseLeave={(e) => {
                      if (isBinary) e.target.style.borderColor = 'rgba(22,30,22,0.5)';
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>Multi-Outcome</div>
                    <div style={{ fontSize: 14, color: '#6b8a6b', marginTop: 4 }}>Custom outcomes</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(11,15,11,0.6)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(22,30,22,0.5)',
            borderRadius: 24,
            padding: 32,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>Outcomes &amp; Odds</h2>
            <OutcomeSelector
              outcomes={form.outcomes}
              setOutcomes={(outcomes) => setForm({ ...form, outcomes })}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(255,68,68,0.1)',
              border: '1px solid rgba(255,68,68,0.3)',
              borderRadius: 12,
              padding: 16,
            }}>
              <p style={{ color: '#ff4444' }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
            <button
              type="button"
              onClick={() => navigate("/markets")}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                color: '#6b8a6b',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.3s',
              }}
              onMouseEnter={(e) => { e.target.style.color = '#e8f5e8'; }}
              onMouseLeave={(e) => { e.target.style.color = '#6b8a6b'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 32px',
                borderRadius: 12,
                backgroundColor: '#00ff88',
                color: '#050805',
                fontWeight: 'bold',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#00cc6a';
                  e.target.style.boxShadow = '0 0 30px rgba(0,255,136,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#00ff88';
                e.target.style.boxShadow = 'none';
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 20,
                    height: 20,
                    border: '2px solid rgba(5,8,5,0.3)',
                    borderTopColor: '#050805',
                    borderRadius: '50%',
                  }} />
                  Creating...
                </>
              ) : (
                <>
                  <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Market
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
