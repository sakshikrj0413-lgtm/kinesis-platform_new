import { useState } from "react";
import API from "../api/axios";
import socket from "../socket";

export default function AddFundsModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const presets = [100, 250, 500, 1000];

  const handlePay = async () => {
    const amt = parseInt(amount);
    if (!amt || amt < 10) {
      setError("Minimum amount is ₹10");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Step 1 — create Razorpay order on backend
      const { data } = await API.post("/wallet/create-order", { amount: amt });

      // Step 2 — open Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "KINESIS Exchange",
        description: "Wallet Top-up",
        order_id: data.order_id,
        handler: async (response) => {
          // Step 3 — verify payment on backend and credit wallet
          try {
            const verify = await API.post("/wallet/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amt,
            });
            onSuccess(verify.data.new_balance);
            onClose();
          } catch {
            setError("Payment verification failed. Contact support.");
          }
        },
        prefill: {},
        theme: { color: "#00ff88" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create order");
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#050805", border: "1px solid rgba(0,255,136,0.3)",
        borderRadius: 16, padding: 32, width: 380, maxWidth: "95vw",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#e8f5e8", fontFamily: "'Space Mono', monospace", fontSize: 18, margin: 0 }}>
            Add Funds
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b8a6b", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        {/* Preset amounts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {presets.map((p) => (
            <button key={p}
              onClick={() => setAmount(String(p))}
              style={{
                padding: "8px 0", borderRadius: 8, border: "1px solid",
                borderColor: amount === String(p) ? "#00ff88" : "rgba(0,255,136,0.2)",
                background: amount === String(p) ? "rgba(0,255,136,0.1)" : "transparent",
                color: amount === String(p) ? "#00ff88" : "#6b8a6b",
                cursor: "pointer", fontSize: 13, fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
              }}
            >
              ₹{p}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "#6b8a6b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Custom Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="10"
            style={{
              width: "100%", marginTop: 8, padding: "12px 16px",
              background: "rgba(11,15,11,0.8)", border: "1px solid rgba(0,255,136,0.2)",
              borderRadius: 8, color: "#e8f5e8", fontSize: 16,
              fontFamily: "'Space Mono', monospace", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <p style={{ color: "#ff4444", fontSize: 12, marginBottom: 12, fontFamily: "'Space Mono', monospace" }}>
            {error}
          </p>
        )}

        <button
          onClick={handlePay}
          disabled={loading || !amount}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 10,
            background: loading || !amount ? "rgba(0,255,136,0.1)" : "rgba(0,255,136,0.2)",
            border: "1px solid rgba(0,255,136,0.4)",
            color: loading || !amount ? "#6b8a6b" : "#00ff88",
            fontSize: 14, fontWeight: 700, cursor: loading || !amount ? "not-allowed" : "pointer",
            fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em",
          }}
        >
          {loading ? "Opening Payment..." : `Pay ₹${amount || "0"} via Razorpay`}
        </button>

        <p style={{ color: "#6b8a6b", fontSize: 10, textAlign: "center", marginTop: 12, fontFamily: "'Space Mono', monospace" }}>
          UPI · Cards · Net Banking · Wallets · OTP verified
        </p>
      </div>
    </div>
  );
}
