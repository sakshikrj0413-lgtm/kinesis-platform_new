import { useCallback, useState, useEffect } from "react";
import useAuthToken from "../hooks/useAuthToken";
import useAuthenticatedPolling, { PORTFOLIO_SOCKET_EVENTS } from "../hooks/useAuthenticatedPolling";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, RadialBarChart, RadialBar, CartesianGrid,
} from "recharts";
import API from "../api/axios";
import socket from "../socket";
import DashboardLayout from "../layouts/DashboardLayout";

const C = {
  green: "#00ff88", greenDim: "#00cc6a", greenGlow: "rgba(0,255,136,0.15)",
  yellow: "#ffd700", yellowGlow: "rgba(255,215,0,0.15)",
  red: "#ff4466", redGlow: "rgba(255,68,102,0.15)",
  blue: "#4488ff", blueGlow: "rgba(68,136,255,0.15)",
  purple: "#aa44ff", purpleGlow: "rgba(170,68,255,0.15)",
  muted: "#6b8a6b", surface: "#0b0f0b", surface2: "#111811", surface3: "#161e16",
  text: "#e8f5e8", border: "rgba(0,255,136,0.12)",
};

const tt = {
  contentStyle: { background: "#050805", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, fontFamily: "'Space Mono', monospace", color: C.text },
  cursor: { stroke: "rgba(0,255,136,0.2)" },
};

export default function Portfolio() {
  const token = useAuthToken();
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [history, setHistory] = useState([]);
  const [positions, setPositions] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(!!token);
  const [toast, setToast] = useState(null);

  const showToast = (message, color = C.green) => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const handleBetSettled = (data) => {
      const isWon = data.status === "WON";
      showToast(
        isWon ? `✓ Won $${data.payout?.toFixed(2)} on ${data.market_title}` : `✗ Lost on ${data.market_title}`,
        isWon ? C.green : C.red
      );
    };
    const handleTransactionAdded = (data) => {
      setPerformance((prev) => prev ? { ...prev, transactions: [data, ...(prev.transactions || [])] } : prev);
    };
    socket.on("bet_settled", handleBetSettled);
    socket.on("transaction_added", handleTransactionAdded);
    return () => { socket.off("bet_settled", handleBetSettled); socket.off("transaction_added", handleTransactionAdded); };
  }, []);

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const [s, p, h, pos] = await Promise.all([
        API.get("/portfolio/summary"), API.get("/portfolio/performance"),
        API.get("/portfolio/history"), API.get("/portfolio/open-positions"),
      ]);
      setSummary(s.data); setPerformance(p.data);
      setHistory(h.data.history || []); setPositions(pos.data.positions || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useAuthenticatedPolling(load, 15000, PORTFOLIO_SOCKET_EVENTS);

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ width: 40, height: 40, border: "2px solid rgba(0,255,136,0.25)", borderTopColor: C.green, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </DashboardLayout>
  );

  const pnl = summary?.total_pnl || 0;
  const pnlColor = pnl >= 0 ? C.green : C.red;
  const winLoss = performance?.win_loss_ratio || { wins: 0, losses: 0 };
  const totalBets = winLoss.wins + winLoss.losses || 1;
  const winRate = Math.round((winLoss.wins / totalBets) * 100);

  const winLossData = [
    { name: "Wins", value: winLoss.wins, fill: C.green },
    { name: "Losses", value: winLoss.losses, fill: C.red },
  ];

  const radialData = [
    { name: "Win Rate", value: winRate, fill: C.green },
    { name: "ROI", value: Math.min(Math.abs(summary?.roi_percent || 0), 100), fill: C.yellow },
  ];

  const TABS = ["overview", "positions", "history", "wallet"];

  return (
    <DashboardLayout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow { 0%,100%{opacity:.6} 50%{opacity:1} }
        .stat-card { transition: all 0.2s; }
        .stat-card:hover { transform: translateY(-2px); }
        .tab-btn:hover { color: ${C.green} !important; }
        .hist-row:hover td { background: rgba(0,255,136,0.04) !important; }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:9999, padding:"12px 20px", borderRadius:10,
          background:"rgba(5,8,5,0.97)", border:`1px solid ${toast.color}`, color:toast.color,
          fontFamily:"'Space Mono',monospace", fontSize:13, fontWeight:"bold",
          boxShadow:`0 0 32px ${toast.color}44`, animation:"fadeUp 0.2s ease", maxWidth:340 }}>
          {toast.message}
        </div>
      )}

      <div style={{ maxWidth:1400, marginLeft:"auto", marginRight:"auto", display:"flex", flexDirection:"column", gap:20 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <div style={{ width:3, height:28, background:`linear-gradient(to bottom, ${C.green}, transparent)`, borderRadius:2 }} />
              <h1 style={{ fontSize:26, fontWeight:900, color:C.text, fontFamily:"'Syne',sans-serif", margin:0, letterSpacing:"-0.02em" }}>Portfolio Analytics</h1>
            </div>
            <p style={{ color:C.muted, fontSize:12, margin:0, paddingLeft:13 }}>Real-time PnL · exposure · settlement tracking</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"rgba(0,255,136,0.06)", border:`1px solid ${C.border}`, borderRadius:20 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, animation:"glow 2s ease-in-out infinite" }} />
            <span style={{ color:C.green, fontSize:10, fontWeight:700, letterSpacing:"0.1em", fontFamily:"'Space Mono',monospace" }}>LIVE</span>
          </div>
        </div>

        {/* Top Stats Grid */}
        {summary && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12 }}>
            {[
              { label:"Total PnL", value:`${pnl>=0?"+":""}$${pnl?.toFixed(2)}`, color:pnlColor, glow:pnl>=0?C.greenGlow:C.redGlow, icon:"◈" },
              { label:"Wallet Balance", value:`$${summary?.wallet_balance?.toFixed(2)}`, color:C.green, glow:C.greenGlow, icon:"◎" },
              { label:"Win Rate", value:`${summary?.win_rate}%`, sub:`${winLoss.wins}W / ${winLoss.losses}L`, color:C.yellow, glow:C.yellowGlow, icon:"◉" },
              { label:"ROI", value:`${summary?.roi_percent}%`, color:summary?.roi_percent>=0?C.green:C.red, glow:summary?.roi_percent>=0?C.greenGlow:C.redGlow, icon:"◆" },
              { label:"Exposure", value:`$${summary?.open_exposure?.toFixed(0)}`, color:C.yellow, glow:C.yellowGlow, icon:"◌" },
              { label:"Available", value:`$${summary?.available_liquidity?.toFixed(0)}`, color:C.blue, glow:C.blueGlow, icon:"◍" },
            ].map((s,i)=>(
              <div key={i} className="stat-card" style={{ background:`linear-gradient(135deg, ${C.surface} 0%, ${C.surface2} 100%)`,
                border:`1px solid ${C.border}`, borderRadius:14, padding:18, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", inset:0, background:s.glow, borderRadius:14, opacity:0.5 }} />
                <div style={{ position:"relative" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <span style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:C.muted, fontFamily:"'Space Mono',monospace" }}>{s.label}</span>
                    <span style={{ fontSize:16, color:s.color, opacity:0.6 }}>{s.icon}</span>
                  </div>
                  <div style={{ fontSize:22, fontWeight:700, fontFamily:"'Space Mono',monospace", color:s.color, lineHeight:1 }}>{s.value}</div>
                  {s.sub && <div style={{ fontSize:9, color:C.muted, marginTop:4, fontFamily:"'Space Mono',monospace" }}>{s.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", gap:2, background:C.surface, borderRadius:10, padding:4, width:"fit-content", border:`1px solid ${C.border}` }}>
          {TABS.map(t=>(
            <button key={t} className="tab-btn" onClick={()=>setTab(t)} style={{
              padding:"8px 20px", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em",
              color: tab===t ? "#050805" : C.muted,
              background: tab===t ? C.green : "transparent",
              border:"none", borderRadius:8, cursor:"pointer", transition:"all 0.2s",
              fontFamily:"'Space Mono',monospace",
              boxShadow: tab===t ? `0 0 20px rgba(0,255,136,0.4)` : "none",
            }}>{t}</button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab==="overview" && performance && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:14 }}>

            {/* PnL Timeline - full width */}
            <ChartCard title="PnL Timeline" icon="📈" accent={C.green} style={{ gridColumn:"span 2" }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={performance.pnl_timeline} margin={{ top:10, right:10, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="pnlG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.green} stopOpacity={0.4}/>
                      <stop offset="50%" stopColor={C.green} stopOpacity={0.1}/>
                      <stop offset="100%" stopColor={C.green} stopOpacity={0}/>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,30,22,0.4)" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:9, fontFamily:"'Space Mono',monospace" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:C.muted, fontSize:9, fontFamily:"'Space Mono',monospace" }} axisLine={false} tickLine={false}/>
                  <Tooltip {...tt}/>
                  <Area type="monotone" dataKey="pnl" stroke={C.green} fill="url(#pnlG)" strokeWidth={2.5} dot={false} filter="url(#glow)" isAnimationActive/>
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Exposure Timeline */}
            <ChartCard title="Exposure Over Time" icon="⚡" accent={C.yellow}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={performance.exposure_timeline} margin={{ top:10, right:10, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.yellow} stopOpacity={0.4}/>
                      <stop offset="100%" stopColor={C.yellow} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,30,22,0.4)" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:9, fontFamily:"'Space Mono',monospace" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:C.muted, fontSize:9, fontFamily:"'Space Mono',monospace" }} axisLine={false} tickLine={false}/>
                  <Tooltip {...tt}/>
                  <Area type="monotone" dataKey="exposure" stroke={C.yellow} fill="url(#expG)" strokeWidth={2.5} dot={false} isAnimationActive/>
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Win Rate Radial */}
            <ChartCard title="Performance Gauges" icon="🎯" accent={C.purple}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-around" }}>
                <div style={{ textAlign:"center" }}>
                  <ResponsiveContainer width={130} height={130}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="90%" data={[{ value: winRate, fill: C.green }]} startAngle={90} endAngle={-270}>
                      <RadialBar dataKey="value" cornerRadius={6} background={{ fill:"rgba(22,30,22,0.5)" }}/>
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{ fontSize:22, fontWeight:700, fontFamily:"'Space Mono',monospace", color:C.green, marginTop:-10 }}>{winRate}%</div>
                  <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>Win Rate</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <ResponsiveContainer width={130} height={130}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="90%" data={[{ value: Math.min(Math.abs(summary?.roi_percent||0),100), fill: summary?.roi_percent>=0?C.yellow:C.red }]} startAngle={90} endAngle={-270}>
                      <RadialBar dataKey="value" cornerRadius={6} background={{ fill:"rgba(22,30,22,0.5)" }}/>
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{ fontSize:22, fontWeight:700, fontFamily:"'Space Mono',monospace", color:summary?.roi_percent>=0?C.yellow:C.red, marginTop:-10 }}>{summary?.roi_percent}%</div>
                  <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>ROI</div>
                </div>
              </div>
            </ChartCard>

            {/* Market Participation */}
            <ChartCard title="Market Participation" icon="📊" accent={C.blue} style={{ gridColumn:"span 2" }}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={performance.market_participation} margin={{ top:10, right:10, left:0, bottom:40 }}>
                  <defs>
                    <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.green} stopOpacity={1}/>
                      <stop offset="100%" stopColor={C.greenDim} stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,30,22,0.4)" horizontal={true} vertical={false}/>
                  <XAxis dataKey="title" tick={{ fill:C.muted, fontSize:8, fontFamily:"'Space Mono',monospace" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50}/>
                  <YAxis tick={{ fill:C.muted, fontSize:9, fontFamily:"'Space Mono',monospace" }} axisLine={false} tickLine={false}/>
                  <Tooltip {...tt}/>
                  <Bar dataKey="volume" fill="url(#barG)" radius={[4,4,0,0]} isAnimationActive/>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Win/Loss Donut */}
            <ChartCard title="Win / Loss Split" icon="🏆" accent={C.green}>
              <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <defs>
                      <filter id="pieShadow">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={C.green} floodOpacity="0.4"/>
                      </filter>
                    </defs>
                    <Pie data={winLossData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} isAnimationActive strokeWidth={0}>
                      {winLossData.map((e,i)=><Cell key={i} fill={e.fill} style={{ filter: `drop-shadow(0 0 6px ${e.fill}88)` }}/>)}
                    </Pie>
                    <Tooltip {...tt}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {winLossData.map((e,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:3, background:e.fill, boxShadow:`0 0 8px ${e.fill}` }}/>
                      <div>
                        <div style={{ fontSize:16, fontWeight:700, fontFamily:"'Space Mono',monospace", color:e.fill }}>{e.value}</div>
                        <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase" }}>{e.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            {/* BACK / LAY Allocation */}
            <ChartCard title="BACK / LAY Allocation" icon="⚖️" accent={C.yellow}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={performance.liquidity_allocation} layout="vertical" margin={{ top:0, right:20, left:20, bottom:0 }}>
                  <defs>
                    <linearGradient id="backG" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.green} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={C.green} stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="layG" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={C.red} stopOpacity={0.8}/>
                      <stop offset="100%" stopColor={C.red} stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <XAxis type="number" tick={{ fill:C.muted, fontSize:9, fontFamily:"'Space Mono',monospace" }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="side" tick={{ fill:C.text, fontSize:11, fontFamily:"'Space Mono',monospace", fontWeight:700 }} axisLine={false} tickLine={false} width={45}/>
                  <Tooltip {...tt}/>
                  <Bar dataKey="amount" radius={[0,6,6,0]} isAnimationActive>
                    {(performance.liquidity_allocation||[]).map((e)=>(
                      <Cell key={e.side} fill={e.side==="BACK"?"url(#backG)":"url(#layG)"}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Best/Worst Markets */}
            {(summary?.best_market || summary?.worst_market) && (
              <div style={{ gridColumn:"span 2", display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
                {summary.best_market && (
                  <div style={{ background:`linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,255,136,0.02))`,
                    border:"1px solid rgba(0,255,136,0.2)", borderRadius:14, padding:20 }}>
                    <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em", color:C.muted, fontFamily:"'Space Mono',monospace", marginBottom:8 }}>🏅 Best Market</div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4, fontFamily:"'Space Mono',monospace" }}>{summary.best_market.title}</div>
                    <div style={{ fontSize:22, fontWeight:700, color:C.green, fontFamily:"'Space Mono',monospace" }}>+${summary.best_market.pnl}</div>
                  </div>
                )}
                {summary.worst_market && (
                  <div style={{ background:`linear-gradient(135deg, rgba(255,68,68,0.06), rgba(255,68,68,0.02))`,
                    border:"1px solid rgba(255,68,68,0.2)", borderRadius:14, padding:20 }}>
                    <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em", color:C.muted, fontFamily:"'Space Mono',monospace", marginBottom:8 }}>📉 Worst Market</div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:4, fontFamily:"'Space Mono',monospace" }}>{summary.worst_market.title}</div>
                    <div style={{ fontSize:22, fontWeight:700, color:C.red, fontFamily:"'Space Mono',monospace" }}>${summary.worst_market.pnl}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* POSITIONS TAB */}
        {tab==="positions" && (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"12px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", color:C.muted, fontFamily:"'Space Mono',monospace" }}>Open Positions</span>
              <span style={{ background:"rgba(0,255,136,0.1)", color:C.green, borderRadius:20, padding:"2px 10px", fontSize:10, fontWeight:700, fontFamily:"'Space Mono',monospace" }}>{positions.length}</span>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", fontSize:11, fontFamily:"'Space Mono',monospace", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ color:C.muted, borderBottom:`1px solid ${C.border}`, background:C.surface2 }}>
                    {["Market","Outcome","Side","Stake","Matched","Exposure","uPnL","Status"].map(h=>(
                      <th key={h} style={{ textAlign:h==="Side"?"center":"left", padding:"10px 14px", fontWeight:700, fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p)=>(
                    <tr key={p.bet_id} className="hist-row" style={{ borderBottom:`1px solid rgba(11,15,11,0.8)` }}>
                      <td style={{ padding:"10px 14px", color:C.text, maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.market_title}</td>
                      <td style={{ padding:"10px 14px", color:C.muted }}>{p.outcome_title}</td>
                      <td style={{ padding:"10px 14px", textAlign:"center" }}>
                        <span style={{ padding:"2px 10px", borderRadius:20, fontSize:9, fontWeight:700,
                          background:p.side==="BACK"?"rgba(0,255,136,0.12)":"rgba(255,68,102,0.12)",
                          color:p.side==="BACK"?C.green:C.red, border:`1px solid ${p.side==="BACK"?"rgba(0,255,136,0.3)":"rgba(255,68,102,0.3)"}` }}>
                          {p.side}
                        </span>
                      </td>
                      <td style={{ padding:"10px 14px" }}>${p.stake?.toFixed(0)}</td>
                      <td style={{ padding:"10px 14px", color:C.green }}>${p.matched_amount?.toFixed(0)}</td>
                      <td style={{ padding:"10px 14px", color:C.yellow }}>${p.exposure?.toFixed(0)}</td>
                      <td style={{ padding:"10px 14px", fontWeight:700, color:p.unrealized_pnl>=0?C.green:C.red }}>
                        {p.unrealized_pnl>=0?"+":""}{p.unrealized_pnl?.toFixed(2)}
                      </td>
                      <td style={{ padding:"10px 14px", color:C.muted }}>{p.status}</td>
                    </tr>
                  ))}
                  {positions.length===0 && (
                    <tr><td colSpan={8} style={{ textAlign:"center", color:C.muted, padding:"40px 0", fontSize:12 }}>No open positions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab==="history" && (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"12px 20px", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", color:C.muted, fontFamily:"'Space Mono',monospace" }}>Bet History</span>
            </div>
            <div style={{ maxHeight:450, overflowY:"auto" }}>
              <table style={{ width:"100%", fontSize:11, fontFamily:"'Space Mono',monospace", borderCollapse:"collapse" }}>
                <thead style={{ position:"sticky", top:0, background:"rgba(5,8,5,0.97)" }}>
                  <tr style={{ color:C.muted, borderBottom:`1px solid ${C.border}` }}>
                    {["Date","Market","Side","Stake","PnL","Status"].map(h=>(
                      <th key={h} style={{ textAlign:"left", padding:"10px 14px", fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h)=>(
                    <tr key={h.bet_id} className="hist-row" style={{ borderBottom:`1px solid rgba(11,15,11,0.8)` }}>
                      <td style={{ padding:"8px 14px", color:C.muted, whiteSpace:"nowrap" }}>{new Date(h.created_at).toLocaleDateString()}</td>
                      <td style={{ padding:"8px 14px", color:C.text, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.market_title}</td>
                      <td style={{ padding:"8px 14px" }}>
                        <span style={{ padding:"2px 8px", borderRadius:20, fontSize:9, fontWeight:700,
                          background:h.side==="BACK"?"rgba(0,255,136,0.12)":"rgba(255,68,102,0.12)",
                          color:h.side==="BACK"?C.green:C.red }}>
                          {h.side}
                        </span>
                      </td>
                      <td style={{ padding:"8px 14px" }}>${h.stake?.toFixed(0)}</td>
                      <td style={{ padding:"8px 14px", fontWeight:700, color:(h.pnl||0)>=0?C.green:C.red }}>
                        {h.pnl!=null ? `${h.pnl>=0?"+":""}$${h.pnl}` : "—"}
                      </td>
                      <td style={{ padding:"8px 14px" }}>
                        <span style={{ padding:"2px 8px", borderRadius:20, fontSize:9, fontWeight:700,
                          color:h.status==="WON"?C.green:h.status==="LOST"?C.red:C.yellow,
                          background:h.status==="WON"?"rgba(0,255,136,0.1)":h.status==="LOST"?"rgba(255,68,102,0.1)":"rgba(255,215,0,0.1)" }}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {history.length===0 && (
                    <tr><td colSpan={6} style={{ textAlign:"center", color:C.muted, padding:"40px 0" }}>No bet history yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WALLET TAB */}
        {tab==="wallet" && performance && summary && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {[
                { label:"Balance", value:`$${summary?.wallet_balance?.toFixed(2)}`, color:C.green, glow:C.greenGlow },
                { label:"Locked in Bets", value:`$${summary?.locked_liquidity?.toFixed(2)}`, color:C.yellow, glow:C.yellowGlow },
                { label:"Available", value:`$${summary?.available_liquidity?.toFixed(2)}`, color:C.blue, glow:C.blueGlow },
              ].map((s,i)=>(
                <div key={i} className="stat-card" style={{ background:`linear-gradient(135deg, ${C.surface}, ${C.surface2})`,
                  border:`1px solid ${C.border}`, borderRadius:14, padding:20, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, background:s.glow, opacity:0.6, borderRadius:14 }}/>
                  <div style={{ position:"relative" }}>
                    <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.12em", color:C.muted, fontFamily:"'Space Mono',monospace", marginBottom:8 }}>{s.label}</div>
                    <div style={{ fontSize:24, fontWeight:700, fontFamily:"'Space Mono',monospace", color:s.color }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"12px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", color:C.muted, fontFamily:"'Space Mono',monospace" }}>Transaction History</span>
              </div>
              {(performance.transactions||[]).map((t)=>(
                <div key={t.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"12px 20px", borderBottom:`1px solid rgba(11,15,11,0.8)`,
                  fontFamily:"'Space Mono',monospace", fontSize:11, transition:"background 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(0,255,136,0.03)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{ padding:"3px 10px", background:"rgba(22,30,22,0.8)", borderRadius:20, fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:"0.05em" }}>{t.type}</span>
                  <span style={{ fontWeight:700, fontSize:14, color:t.amount>=0?C.green:C.red }}>
                    {t.amount>=0?"+":""}${Math.abs(t.amount).toFixed(2)}
                  </span>
                  <span style={{ color:C.muted, fontSize:10 }}>{new Date(t.created_at).toLocaleString()}</span>
                </div>
              ))}
              {!performance.transactions?.length && (
                <p style={{ color:C.muted, textAlign:"center", padding:"32px 0", fontSize:12, margin:0 }}>No transactions yet</p>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

function ChartCard({ title, icon, accent, children, style: customStyle }) {
  return (
    <div style={{ background:`linear-gradient(135deg, ${C.surface} 0%, ${C.surface2} 100%)`,
      border:`1px solid ${C.border}`, borderRadius:14, padding:18, position:"relative", overflow:"hidden", ...customStyle }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(to right, ${accent}, transparent)`, borderRadius:"14px 14px 0 0" }}/>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:14 }}>{icon}</span>
        <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", color:C.muted, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>{title}</span>
        <div style={{ flex:1, height:1, background:`linear-gradient(to right, ${accent}22, transparent)` }}/>
      </div>
      {children}
    </div>
  );
}
