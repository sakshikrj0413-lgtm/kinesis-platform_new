import { useEffect, useState, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import useWalletStore from "../store/walletStore";
import useAuthToken from "../hooks/useAuthToken";
import API from "../api/axios";

// ─── Add Money Button (Razorpay) ───────
export function AddMoneyButton({ onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const handlePayment = async () => {
    if (!amount || amount <= 0) return alert('Enter a valid amount');
    setLoading(true);

    try {
      // Step 1: Create order
      const res = await fetch('/api/wallet/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseInt(amount) })
      });
      const order = await res.json();

      // Step 2: Open Razorpay popup
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'KINESIS',
        description: 'Add funds to Wallet',
        order_id: order.order_id,
        handler: async function (response) {
         
          // Step 3: Verify payment
          const verify = await fetch('/api/wallet/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: parseInt(amount)
            })
          });
          const result = await verify.json();
          if (result.new_balance !== undefined) {
            alert(`✅ Payment successful! New balance: ₹${result.new_balance}`);
            if (onSuccess) onSuccess(result.new_balance);

            window.dispatchEvent(new Event('balance-updated'));
          }
        },
        theme: { color: '#6366f1' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
      <input
        type="number"
        placeholder="Enter amount (₹)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #333',
          background: '#0a0a0f',
          color: 'white',
          width: '160px'
        }}
      />
      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading ? 'Processing...' : '+ Add Money'}
      </button>
    </div>
  );
}

// ─── Wallet Connect Button ─────────────────────────────────────────────────
export default function WalletConnect() {
  const { address, isConnected, chainId } = useAccount();
  const { setWallet, clearWallet } = useWalletStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [connectHovered, setConnectHovered] = useState(false);
  const [wrongNetHovered, setWrongNetHovered] = useState(false);
  const [accountHovered, setAccountHovered] = useState(false);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (isConnected && address && chainId && !hasSynced.current) {
      hasSynced.current = true;
      setWallet(address, chainId);
      setIsModalOpen(false);
      setSyncing(true);
      setSyncError(null);

      API.post("/wallet/connect", {
        wallet_address: address,
        chain_id: chainId,
      })
        .then((res) => {
          console.log("Wallet synced to backend:", res.data);
          setSyncing(false);
        })
        .catch((err) => {
          console.error("Failed to sync wallet:", err);
          setSyncError(err.response?.data?.error || "Failed to sync wallet");
          setSyncing(false);
          hasSynced.current = false;
        });
    } else if (!isConnected) {
      clearWallet();
      hasSynced.current = false;
      setSyncError(null);
    }
  }, [isConnected, address, chainId, setWallet, clearWallet]);

  return (
    <div style={{ position: "relative" }}>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
              })}
            >
              {!connected ? (
                <button
                  onClick={() => { setIsModalOpen(true); openConnectModal(); }}
                  onMouseEnter={() => setConnectHovered(true)}
                  onMouseLeave={() => setConnectHovered(false)}
                  style={{
                    padding: "10px 20px",
                    background: connectHovered
                      ? "linear-gradient(to right, #33ff99, var(--green))"
                      : "linear-gradient(to right, var(--green), #00cc66)",
                    color: "var(--black)",
                    borderRadius: "12px",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    transition: "all 0.3s ease",
                    boxShadow: connectHovered ? "0 0 20px var(--green-glow)" : "0 0 14px var(--green-glow)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Connect Wallet
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {chain?.id !== 11155111 && (
                    <button
                      onClick={() => { setIsModalOpen(true); openChainModal(); }}
                      onMouseEnter={() => setWrongNetHovered(true)}
                      onMouseLeave={() => setWrongNetHovered(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 12px",
                        backgroundColor: wrongNetHovered ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.2)",
                        color: "rgba(248,113,113,1)",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        border: "1px solid rgba(239,68,68,0.5)",
                        cursor: "pointer",
                      }}
                    >
                      Wrong Network
                    </button>
                  )}
                  <button
                    onClick={() => { setIsModalOpen(true); openAccountModal(); }}
                    onMouseEnter={() => setAccountHovered(true)}
                    onMouseLeave={() => setAccountHovered(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 16px",
                      background: accountHovered
                        ? "linear-gradient(to right, color-mix(in srgb, var(--green) 30%, transparent), color-mix(in srgb, #00cc66 30%, transparent))"
                        : "linear-gradient(to right, color-mix(in srgb, var(--green) 20%, transparent), color-mix(in srgb, #00cc66 20%, transparent))",
                      border: "1px solid color-mix(in srgb, var(--green) 50%, transparent)",
                      borderRadius: "12px",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "linear-gradient(to bottom right, var(--green), #00cc66)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: "var(--black)", fontSize: "0.75rem", fontWeight: 700 }}>
                        {account.displayName?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <span style={{ color: "var(--text)", fontSize: "0.875rem", fontWeight: 700 }}>
                        {account.displayName}
                      </span>
                      {syncing && <span style={{ color: "var(--green)", fontSize: "0.75rem" }}>Syncing...</span>}
                      {syncError && <span style={{ color: "rgba(248,113,113,1)", fontSize: "0.75rem" }}>Sync failed</span>}
                      {account.displayBalance && !syncing && !syncError && (
                        <span style={{ color: "var(--green)", fontSize: "0.75rem" }}>{account.displayBalance}</span>
                      )}
                    </div>
                  </button>
                </div>
              )}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
