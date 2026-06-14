import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAccount, useSendTransaction } from "wagmi";
import { motion } from "framer-motion";
import API from "../api/axios";
import DashboardLayout from "../layouts/DashboardLayout";
import useAuthStore from "../store/authStore";
import useAIStore from "../store/aiStore";
import useIntelligenceStore from "../store/intelligenceStore";
import AnalysisCard from "../components/ai/AnalysisCard";

const ADMIN_WALLET = "0x0D8d045854B7a63Cb3A4f21Bf01FC2b58320399D";

function ConfidenceMeter({ confidence }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (confidence / 100) * circumference;

  const getColor = () => {
    if (confidence >= 70) return "var(--green)";
    if (confidence >= 50) return "var(--yellow)";
    return "#ef4444";
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <svg width={96} height={96} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#27272a" strokeWidth="6" />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: getColor() }}>
            {confidence.toFixed(0)}%
          </span>
        </div>
      </div>
      <span style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</span>
    </div>
  );
}

function SentimentBar({ bullish, bearish }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--green)' }}>Bullish {bullish.toFixed(0)}%</span>
        <span style={{ color: '#ef4444' }}>Bearish {bearish.toFixed(0)}%</span>
      </div>
      <div style={{ height: 12, background: 'var(--surface2)', borderRadius: 9999, overflow: 'hidden', display: 'flex' }}>
        <motion.div
          style={{ background: 'linear-gradient(to right, var(--green), var(--green))', height: '100%' }}
          initial={{ width: 0 }}
          animate={{ width: `${bullish}%` }}
          transition={{ duration: 0.8 }}
        />
        <motion.div
          style={{ background: 'linear-gradient(to right, #ef4444, #ef4444)', height: '100%' }}
          initial={{ width: 0 }}
          animate={{ width: `${bearish}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}

function EdgeBadge({ edge }) {
  const isPositive = edge >= 0;
  return (
    <motion.div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 14,
        background: isPositive ? 'var(--green-glow)' : 'rgba(239,68,68,0.2)',
        color: isPositive ? 'var(--green)' : '#ef4444',
        border: isPositive ? '1px solid var(--green-border)' : '1px solid rgba(239,68,68,0.4)'
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: isPositive ? 'var(--green)' : '#ef4444'
      }} />
      {isPositive ? "+" : ""}{edge.toFixed(1)}% EDGE
    </motion.div>
  );
}

function RiskBadge({ risk }) {
  const styles = {
    safe: { bg: 'var(--green-glow)', color: 'var(--green)', border: '1px solid var(--green-border)' },
    balanced: { bg: 'rgba(255,215,0,0.2)', color: 'var(--yellow)', border: '1px solid var(--yellow-border)' },
    risky: { bg: 'rgba(255,215,0,0.2)', color: 'var(--yellow)', border: '1px solid var(--yellow-border)' },
    degen: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' },
  };

  const s = styles[risk] || styles.balanced;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '6px 12px',
      borderRadius: 8,
      fontWeight: 700,
      fontSize: 14,
      background: s.bg,
      color: s.color,
      border: s.border
    }}>
      {risk.toUpperCase()}
    </div>
  );
}

function SharpMoneyAlert({ detected, signals }) {
  if (!detected) return null;

  return (
    <motion.div
      style={{
        background: 'var(--green-glow)',
        border: '1px solid var(--green-border)',
        borderRadius: 12,
        padding: 16
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
        <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sharp Money Detected</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {signals.map((s, i) => (
          <span key={i} style={{
            fontSize: 12,
            background: 'var(--green-glow)',
            color: 'var(--green)',
            padding: '4px 8px',
            borderRadius: 4
          }}>
            {s.type.replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function OutcomeCard({ outcome, marketId, isBinary, onTrade, isConnected, isAdmin, onBettingPriceChange }) {
  const [odds, setOdds] = useState(outcome.odds);
  const [prevOdds, setPrevOdds] = useState(outcome.odds);
  const [flashClass, setFlashClass] = useState("");
  const [bettingPrice, setBettingPrice] = useState(outcome.betting_price || 0.001);
  const [editingPrice, setEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState(bettingPrice);
  const [isHovered, setIsHovered] = useState(false);
  const [isTradeBtnHovered, setIsTradeBtnHovered] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const change = (Math.random() - 0.5) * 0.08;
      const newOdds = Math.max(0.01, Math.min(0.99, odds + change));
      const diff = newOdds - odds;
      setPrevOdds(odds);
      setOdds(newOdds);
      setFlashClass(diff > 0 ? "var(--green)" : diff < 0 ? "#ef4444" : "");
      setTimeout(() => setFlashClass(""), 600);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(intervalRef.current);
  }, [odds]);

  const handleSaveBettingPrice = async () => {
    const newPrice = parseFloat(tempPrice);
    if (newPrice < 0.001 || newPrice > 0.01) {
      alert("Betting price must be between 0.001 and 0.01");
      return;
    }
    
    try {
      await API.patch(`/markets/outcome/${outcome.id}/betting-price`, {
        betting_price: newPrice
      });
      setBettingPrice(newPrice);
      setEditingPrice(false);
      if (onBettingPriceChange) onBettingPriceChange(outcome.id, newPrice);
    } catch (err) {
      console.error("Error updating betting price:", err);
      alert(err.response?.data?.error || "Error updating betting price");
    }
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        backdropFilter: 'blur(4px)',
        border: '1px solid var(--green-border)',
        borderRadius: 16,
        padding: 20,
        transition: 'all 0.3s',
        boxShadow: isHovered ? '0 0 30px var(--green-glow)' : 'none'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--muted)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{outcome.title}</span>
        {isBinary && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
        )}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, transition: 'color 0.3s', color: flashClass || 'var(--green)' }}>
        {(odds * 100).toFixed(1)}%
      </div>
      <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
        {odds >= prevOdds ? "+" : ""}{((odds - prevOdds) * 100).toFixed(2)}%
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--green-border)' }}>
        <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Betting Amount</div>
        {editingPrice && isAdmin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              type="number"
              step="0.0001"
              min="0.001"
              max="0.01"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--surface2)',
                border: '1px solid var(--green-border)',
                borderRadius: 4,
                padding: '4px 8px',
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--green)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--green-border)'}
            />
            <button
              onClick={handleSaveBettingPrice}
              style={{
                padding: '4px 12px',
                background: 'var(--green-glow)',
                color: 'var(--green)',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingPrice(false);
                setTempPrice(bettingPrice);
              }}
              style={{
                padding: '4px 12px',
                background: 'var(--surface2)',
                color: 'var(--muted)',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>{bettingPrice.toFixed(6)} ETH</span>
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingPrice(true);
                  setTempPrice(bettingPrice);
                }}
                style={{
                  color: 'var(--muted)',
                  fontSize: 12,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--text)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--muted)'}
              >
                Edit
              </button>
            )}
          </div>
        )}
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Sepolia Testnet</div>
      </div>

      <button
        onClick={() => onTrade(outcome)}
        disabled={!isConnected}
        style={{
          width: '100%',
          marginTop: 16,
          paddingTop: 10,
          paddingBottom: 10,
          borderRadius: 12,
          background: 'var(--green-glow)',
          color: 'var(--green)',
          fontWeight: 600,
          border: '1px solid var(--green-border)',
          cursor: isConnected ? 'pointer' : 'not-allowed',
          opacity: isConnected ? 1 : 0.5,
          boxShadow: isTradeBtnHovered && isConnected ? '0 0 20px var(--green-glow)' : 'none',
          transition: 'all 0.3s'
        }}
        onMouseEnter={() => setIsTradeBtnHovered(true)}
        onMouseLeave={() => setIsTradeBtnHovered(false)}
      >
        {!isConnected ? "Connect Wallet to Trade" : "Trade"}
      </button>
    </div>
  );
}

export default function MarketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { sendTransaction, isPending } = useSendTransaction();
  const user = useAuthStore((state) => state.user);
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [volume] = useState(() => Math.floor(Math.random() * 50000) + 10000);
  const [liquidity] = useState(() => Math.floor(Math.random() * 100000) + 50000);
  const [traders] = useState(() => Math.floor(Math.random() * 500) + 100);
  const [txStatus, setTxStatus] = useState(null);
  const { analysis, analyzeMarket: aiAnalyze, loading: aiLoading, clearAnalysis } = useAIStore();
  const { marketIntelligence, loadMarketIntelligence, loading: intelLoading } = useIntelligenceStore();
  const [backLinkHovered, setBackLinkHovered] = useState(false);
  const [aiBtnHovered, setAiBtnHovered] = useState(false);

  const isAdmin = user && market && user.id === market.created_by;

  useEffect(() => {
    fetchMarket();
    loadMarketIntelligence(parseInt(id));
  }, [id]);

  const handleTrade = async (outcome) => {
    if (!isConnected) {
      setTxStatus({ type: "error", message: "Please connect your wallet first" });
      return;
    }

    const bettingPrice = outcome.betting_price || 0.001;
    const randomAmount = (Math.random() * (0.0002 - 0.0001) + 0.0001).toFixed(6);
    const totalAmount = (parseFloat(randomAmount) + bettingPrice).toFixed(6);
    const amountInWei = BigInt(Math.floor(parseFloat(totalAmount) * 1e18));

    try {
      setTxStatus({ 
        type: "pending", 
        message: `Please confirm transaction in MetaMask... (Betting fee: ${bettingPrice} ETH)`
      });

      const txHash = await sendTransaction({
        to: ADMIN_WALLET,
        value: amountInWei,
      });

      setTxStatus({
        type: "success",
        message: `Transaction sent! Hash: ${txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}` : "sent (hash unavailable)"}`
      });

      await API.post("/wallet/transfer", {
        from_address: address,
        amount: parseFloat(randomAmount),
        tx_hash: txHash,
        market_id: parseInt(id),
        outcome_id: outcome.id
      });

      setTxStatus({
        type: "success",
        message: `Bet created successfully! Your ${outcome.title} bet of ${randomAmount} ETH has been placed.`
      });

      setTimeout(() => {
        navigate(`/markets/${id}?outcome=${outcome.id}`);
      }, 2000);

    } catch (err) {
      console.error("Transaction failed:", err);
      setTxStatus({ type: "error", message: err.message || "Transaction failed" });
    }
  };

  const fetchMarket = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/markets/${id}`);
      setMarket(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load market");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 384 }}>
          <div style={{ width: 48, height: 48, border: '4px solid rgba(0,255,136,0.3)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
          <p style={{ color: '#ef4444', fontSize: 20 }}>{error}</p>
          <Link to="/markets" style={{ marginTop: 16, display: 'inline-block', color: 'var(--green)', textDecoration: 'none' }}>
            Back to Markets
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isBinary = market.type === "BINARY";
  const intel = marketIntelligence;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>
        {txStatus && (
          <div style={{
            marginBottom: 16,
            padding: 16,
            borderRadius: 12,
            border: txStatus.type === "success" ? '1px solid var(--green-border)' :
                    txStatus.type === "error" ? '1px solid rgba(239,68,68,0.3)' :
                    '1px solid var(--yellow-border)',
            background: txStatus.type === "success" ? 'var(--green-glow)' :
                       txStatus.type === "error" ? 'rgba(239,68,68,0.1)' :
                       'rgba(255,215,0,0.1)',
            color: txStatus.type === "success" ? 'var(--green)' :
                   txStatus.type === "error" ? '#ef4444' :
                   'var(--yellow)'
          }}>
            {txStatus.type === "pending" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,215,0,0.3)', borderTopColor: 'var(--yellow)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                {txStatus.message}
              </div>
            )}
            {txStatus.type === "success" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {txStatus.message}
              </div>
            )}
            {txStatus.type === "error" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {txStatus.message}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Link
            to="/markets"
            style={{
              color: backLinkHovered ? 'var(--text)' : 'var(--muted)',
              transition: 'color 0.2s',
              textDecoration: 'none'
            }}
            onMouseEnter={() => setBackLinkHovered(true)}
            onMouseLeave={() => setBackLinkHovered(false)}
          >
            <svg width={24} height={24} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text)' }}>{market.title}</h1>
              <span style={{
                padding: '4px 12px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: market.status === "OPEN" ? 'var(--green-glow)' : 'var(--surface2)',
                color: market.status === "OPEN" ? 'var(--green)' : 'var(--muted)'
              }}>
                {market.status}
              </span>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 9999,
                background: 'rgba(239,68,68,0.2)',
                color: '#ef4444',
                fontSize: 12,
                fontWeight: 700
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                LIVE
              </span>
              {intel && <EdgeBadge edge={intel.edge} />}
              {intel && <RiskBadge risk={intel.risk} />}
            </div>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>{market.description}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{ background: 'var(--surface)', backdropFilter: 'blur(4px)', border: '1px solid var(--green-border)', borderRadius: 16, padding: 16 }}>
            <div style={{ color: 'var(--muted)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>24h Volume</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', marginTop: 4 }}>${volume.toLocaleString()}</div>
          </div>
          <div style={{ background: 'var(--surface)', backdropFilter: 'blur(4px)', border: '1px solid var(--green-border)', borderRadius: 16, padding: 16 }}>
            <div style={{ color: 'var(--muted)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Liquidity</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', marginTop: 4 }}>${liquidity.toLocaleString()}</div>
          </div>
          <div style={{ background: 'var(--surface)', backdropFilter: 'blur(4px)', border: '1px solid var(--green-border)', borderRadius: 16, padding: 16 }}>
            <div style={{ color: 'var(--muted)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Traders</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', marginTop: 4 }}>{traders}</div>
          </div>
          <div style={{ background: 'var(--surface)', backdropFilter: 'blur(4px)', border: '1px solid var(--green-border)', borderRadius: 16, padding: 16 }}>
            <div style={{ color: 'var(--muted)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Market Type</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{market.type}</div>
          </div>
        </div>

        {intel && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
            <div style={{ background: 'var(--surface)', backdropFilter: 'blur(4px)', border: '1px solid var(--green-border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <ConfidenceMeter confidence={intel.confidence} />
            </div>

            <div style={{ background: 'var(--surface)', backdropFilter: 'blur(4px)', border: '1px solid var(--green-border)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Market Sentiment</h3>
              <SentimentBar bullish={intel.market_sentiment.bullish} bearish={intel.market_sentiment.bearish} />
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 14 }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>Volume Score</div>
                  <div style={{ color: 'var(--green)', fontWeight: 700 }}>{intel.volume_score.toFixed(0)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>Unusual Activity</div>
                  <div style={{ color: 'var(--green)', fontWeight: 700 }}>{intel.market_sentiment.unusual_activity.toFixed(0)}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', backdropFilter: 'blur(4px)', border: '1px solid var(--green-border)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Probability Analysis</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                    <span style={{ color: 'var(--muted)' }}>Market Implied</span>
                    <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{intel.market_probability.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 9999, overflow: 'hidden' }}>
                    <motion.div
                      style={{ background: 'var(--muted)', height: '100%' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${intel.market_probability}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                    <span style={{ color: 'var(--muted)' }}>AGN Estimated</span>
                    <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{intel.estimated_probability.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 9999, overflow: 'hidden' }}>
                    <motion.div
                      style={{ background: 'var(--green)', height: '100%' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${intel.estimated_probability}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {intel && <SharpMoneyAlert detected={intel.sharp_money} signals={intel.sharp_signals || []} />}

        {intel && intel.analysis && (
          <div style={{ marginTop: 24, marginBottom: 32, background: 'var(--surface)', backdropFilter: 'blur(4px)', border: '1px solid var(--green-border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ color: 'var(--green)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
              AGN Intelligence Report
            </h3>
            <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.625 }}>{intel.analysis}</p>
          </div>
        )}

        {analysis && (
          <div style={{ marginBottom: 32 }}>
            <AnalysisCard analysis={analysis} onClose={clearAnalysis} />
          </div>
        )}

        <div style={{ background: 'var(--surface)', backdropFilter: 'blur(4px)', border: '1px solid var(--green-border)', borderRadius: 24, padding: 32, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Current Odds</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>Updating every 3-5 seconds</span>
              <button
                onClick={() => aiAnalyze(parseInt(id))}
                disabled={aiLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  background: aiBtnHovered ? 'linear-gradient(to right, rgba(0,255,136,0.3), rgba(0,255,136,0.3))' : 'linear-gradient(to right, var(--green-glow), var(--green-glow))',
                  border: '1px solid var(--green-border)',
                  borderRadius: 12,
                  color: 'var(--green)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  opacity: aiLoading ? 0.5 : 1,
                  transition: 'all 0.3s'
                }}
                onMouseEnter={() => setAiBtnHovered(true)}
                onMouseLeave={() => setAiBtnHovered(false)}
              >
                <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {aiLoading ? "Analyzing..." : "Analyze with AI"}
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {market.outcomes.map((outcome) => (
              <OutcomeCard 
                key={outcome.id} 
                outcome={outcome} 
                marketId={market.id} 
                isBinary={isBinary} 
                onTrade={handleTrade} 
                isConnected={isConnected}
                isAdmin={isAdmin}
                onBettingPriceChange={(outcomeId, newPrice) => {
                  setMarket(prev => ({
                    ...prev,
                    outcomes: prev.outcomes.map(o => 
                      o.id === outcomeId ? { ...o, betting_price: newPrice } : o
                    )
                  }));
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', backdropFilter: 'blur(4px)', border: '1px solid var(--green-border)', borderRadius: 24, padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>Recent Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { user: "0x7a3...f2e", action: "Bought YES", amount: "$250", time: "2m ago" },
              { user: "0x3b9...a1c", action: "Sold NO", amount: "$100", time: "5m ago" },
              { user: "0x9c2...d4f", action: "Bought YES", amount: "$500", time: "8m ago" },
              { user: "0x1e5...b8g", action: "Sold YES", amount: "$75", time: "12m ago" },
            ].map((tx, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 12,
                paddingBottom: 12,
                borderBottom: i < 3 ? '1px solid var(--green-border)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{tx.user}</span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: tx.action.includes("YES") ? 'var(--green)' : '#ef4444'
                  }}>
                    {tx.action}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{tx.amount}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 14 }}>{tx.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
