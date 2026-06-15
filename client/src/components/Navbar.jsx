import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import WalletConnect from "./WalletConnect";
import AddFundsModal from "./AddFundsModal";
import API from "../api/axios";
import socket from "../socket";

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [balance, setBalance] = useState(null);

  // Load Razorpay script once
  useEffect(() => {
    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch balance
  const fetchBalance = async () => {
    if (!token) return;
    try {
      const res = await API.get("/portfolio/summary");
      setBalance(res.data.wallet_balance);
    } catch {}
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    // Update balance in real time when wallet_updated fires
    const handleWalletUpdated = (data) => {
      if (data.balance !== undefined) setBalance(data.balance);
    };
    socket.on("wallet_updated", handleWalletUpdated);
    return () => {
      clearInterval(interval);
      socket.off("wallet_updated", handleWalletUpdated);
    };
  }, [token]);

  return (
    <>
      <div className="kn-navbar" style={{ height: '64px', background: 'var(--surface)', borderBottom: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', gap: 12 }}>
        <div className="kn-navbar-welcome" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <img src="/logo-kinesis.png" alt="Kinesis" style={{ width: '28px', height: '28px', flexShrink: 0 }} />
          <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Welcome {user?.username || 'Trader'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

          {/* Balance + Add Funds */}
          {token && (
            <div className="kn-navbar-balance-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="kn-navbar-balance" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)',
                borderRadius: 10, padding: '6px 14px',
              }}>
                <span style={{ color: '#6b8a6b', fontSize: 11, fontFamily: "'Space Mono', monospace" }}>BAL</span>
                <span style={{ color: '#00ff88', fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
                  ₹{balance !== null ? balance.toFixed(2) : "—"}
                </span>
              </div>
              <button
                onClick={() => setShowAddFunds(true)}
                className="kn-navbar-addfunds"
                style={{
                  padding: '7px 16px', borderRadius: 10,
                  background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.4)',
                  color: '#00ff88', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Space Mono', monospace",
                  letterSpacing: '0.05em', whiteSpace: 'nowrap',
                }}
              >
                + Add Funds
              </button>
            </div>
          )}

          <div className="kn-navbar-wallet">
            <WalletConnect />
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
              className="kn-navbar-avatar-btn"
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#000', fontWeight: 900, fontSize: '0.85rem' }}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </button>

            {showDropdown && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '240px', maxWidth: '90vw', background: 'var(--surface)', border: '1px solid var(--green-border)', borderRadius: '12px', overflow: 'hidden', zIndex: 50 }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--green-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#000', fontWeight: 900 }}>{user?.username?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username}</p>
                      {role === "admin" && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(255,215,0,0.12)', color: 'var(--yellow)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>ADMIN</span>
                      )}
                    </div>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                  {balance !== null && (
                    <p style={{ color: '#00ff88', fontSize: '0.75rem', fontFamily: "'Space Mono', monospace", marginTop: 4 }}>
                      Balance: ₹{balance.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Mobile-only quick actions */}
                <div className="kn-navbar-mobile-actions">
                  <button
                    onClick={() => { setShowAddFunds(true); setShowDropdown(false); }}
                    style={{ width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', color: '#00ff88', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--green-border)' }}
                  >
                    + Add Funds
                  </button>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--green-border)' }}>
                    <WalletConnect />
                  </div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowDropdown(false)}
                  style={{ width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text)', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                  className="kn-navbar-profile-btn"
                >
                  <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile Settings
                </Link>
                <button
                  onClick={logout}
                  style={{ width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', color: '#ff4466', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
                  className="kn-navbar-logout-btn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddFunds && (
        <AddFundsModal
          onClose={() => setShowAddFunds(false)}
          onSuccess={(newBalance) => {
            setBalance(newBalance);
            setShowAddFunds(false);
          }}
        />
      )}

      <style>{`
        .kn-navbar-avatar-btn:hover { background: var(--green-glow); }
        .kn-navbar-logout-btn:hover { background: rgba(255,68,102,0.08); }
        .kn-navbar-profile-btn:hover { background: var(--green-glow); }
        .kn-navbar-mobile-actions { display: none; }

        @media (max-width: 768px) {
          .kn-navbar { padding: 0 12px !important; gap: 8px !important; }
          .kn-navbar-welcome h1 { font-size: 0.8rem !important; }
          .kn-navbar-balance-group { gap: 4px !important; }
          .kn-navbar-balance { padding: 5px 8px !important; }
          .kn-navbar-balance span:first-child { display: none; }
          .kn-navbar-addfunds { display: none !important; }
          .kn-navbar-wallet { display: none !important; }
          .kn-navbar-mobile-actions { display: block; }
        }

        @media (max-width: 480px) {
          .kn-navbar-welcome h1 { display: none; }
          .kn-navbar-balance { padding: 5px 10px !important; }
        }
      `}</style>
    </>
  );
}
