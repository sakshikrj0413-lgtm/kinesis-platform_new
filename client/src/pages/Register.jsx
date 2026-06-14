import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import API from "../api/axios";
import useAuthStore from "../store/authStore";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=Space+Mono:wght@400;700&display=swap');

  :root {
    --green: #00ff88;
    --green-dim: #00cc6a;
    --green-glow: rgba(0,255,136,0.18);
    --green-border: rgba(0,255,136,0.25);
    --black: #050805;
    --surface: #0b0f0b;
    --surface2: #111811;
    --surface3: #161e16;
    --text: #e8f5e8;
    --muted: #6b8a6b;
    --white: #ffffff;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'Space Mono', monospace;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root { height: 100%; }

  body {
    background: var(--black);
    color: var(--text);
    font-family: var(--font-display);
  }

  .kn-auth-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background: var(--black);
  }

  .kn-auth-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(var(--green-border) 1px, transparent 1px),
      linear-gradient(90deg, var(--green-border) 1px, transparent 1px);
    background-size: 48px 48px;
    opacity: 0.15;
    pointer-events: none;
  }

  .kn-auth-glow {
    position: fixed;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .kn-auth-card {
    position: relative;
    width: 100%;
    max-width: 440px;
    margin: 20px;
    background: var(--surface);
    border: 1px solid var(--green-border);
    border-radius: 16px;
    padding: 48px 40px;
  }

  .kn-auth-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 17px;
    background: linear-gradient(135deg, var(--green-border), transparent 50%, var(--green-border));
    z-index: -1;
    opacity: 0.3;
  }

  .kn-auth-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-decoration: none;
    color: var(--text);
    font-weight: 900;
    font-size: 1.4rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .kn-auth-logo-mark {
    width: 28px; height: 28px;
    flex-shrink: 0;
  }

  .kn-auth-subtitle {
    text-align: center;
    font-size: 0.78rem;
    color: var(--muted);
    font-family: var(--font-mono);
    margin-bottom: 32px;
    letter-spacing: 0.05em;
  }

  .kn-auth-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    margin-bottom: 24px;
    background: rgba(255,68,102,0.08);
    border: 1px solid rgba(255,68,102,0.25);
    border-radius: 8px;
    font-size: 0.8rem;
    color: #ff4466;
    font-family: var(--font-mono);
  }

  .kn-auth-field {
    margin-bottom: 20px;
  }

  .kn-auth-label {
    display: block;
    font-size: 0.7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin-bottom: 8px;
  }

  .kn-auth-input {
    width: 100%;
    padding: 14px 16px;
    background: var(--surface2);
    border: 1px solid var(--green-border);
    border-radius: 8px;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .kn-auth-input::placeholder {
    color: var(--muted);
    opacity: 0.5;
  }

  .kn-auth-input:focus {
    border-color: var(--green);
    box-shadow: 0 0 12px var(--green-glow);
  }

  .kn-auth-submit {
    width: 100%;
    padding: 14px 20px;
    margin-top: 8px;
    background: var(--green);
    color: #000;
    border: none;
    border-radius: 8px;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 0.82rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.2s, box-shadow 0.2s;
  }

  .kn-auth-submit:hover {
    background: #00ff99;
    box-shadow: 0 0 24px var(--green-glow);
  }

  .kn-auth-role-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .kn-auth-role-btn {
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px solid var(--green-border);
    background: var(--surface2);
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
    font-family: var(--font-display);
  }

  .kn-auth-role-btn:hover {
    border-color: var(--green);
    background: var(--surface3);
  }

  .kn-auth-role-btn.active {
    border-color: var(--green);
    background: rgba(0,255,136,0.08);
  }

  .kn-auth-role-btn-label {
    font-size: 0.85rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text);
  }

  .kn-auth-role-btn-desc {
    font-size: 0.65rem;
    color: var(--muted);
    margin-top: 4px;
    font-family: var(--font-mono);
  }

  .kn-auth-role-btn.active .kn-auth-role-btn-label {
    color: var(--green);
  }

  .kn-auth-footer {
    text-align: center;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--green-border);
  }

  .kn-auth-footer p {
    font-size: 0.78rem;
    color: var(--muted);
  }

  .kn-auth-footer a {
    color: var(--green);
    text-decoration: none;
    font-weight: 700;
    transition: opacity 0.2s;
  }

  .kn-auth-footer a:hover {
    opacity: 0.8;
  }
`;

export default function Register() {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await API.post("/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      loginStore(res.data.user, res.data.access_token);

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/markets");
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="kn-auth-wrap">
        <div className="kn-auth-bg-grid" />
        <div className="kn-auth-glow" />

        <div className="kn-auth-card">
          <Link to="/" className="kn-auth-logo">
            <img className="kn-auth-logo-mark" src="/logo-kinesis.png" alt="Kinesis" />
            Kinesis
          </Link>
          <p className="kn-auth-subtitle">Create your KINESIS account</p>

          {error && (
            <div className="kn-auth-error">
              <span>▲</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="kn-auth-field">
              <label className="kn-auth-label">Username</label>
              <input
                type="text"
                placeholder="Choose a username"
                className="kn-auth-input"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div className="kn-auth-field">
              <label className="kn-auth-label">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="kn-auth-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="kn-auth-field">
              <label className="kn-auth-label">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                className="kn-auth-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div className="kn-auth-field">
              <label className="kn-auth-label">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                className="kn-auth-input"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                required
              />
            </div>

            <div className="kn-auth-field">
              <label className="kn-auth-label">Account Type</label>
              <div className="kn-auth-role-grid">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "user" })}
                  className={`kn-auth-role-btn ${
                    form.role === "user" ? "active" : ""
                  }`}
                >
                  <div className="kn-auth-role-btn-label">User</div>
                  <div className="kn-auth-role-btn-desc">Place bets & trade</div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "admin" })}
                  className={`kn-auth-role-btn ${
                    form.role === "admin" ? "active" : ""
                  }`}
                >
                  <div className="kn-auth-role-btn-label">Admin</div>
                  <div className="kn-auth-role-btn-desc">Create markets</div>
                </button>
              </div>
            </div>

            <button type="submit" className="kn-auth-submit">
              Create Account →
            </button>
          </form>

          <div className="kn-auth-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
