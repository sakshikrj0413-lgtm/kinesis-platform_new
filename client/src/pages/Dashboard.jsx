import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import API from "../api/axios";
import socket from "../socket";

export default function DashboardLayout({ children, fullWidth = false }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 1024);
  const [globalStats, setGlobalStats] = useState({
    tradersOnline: 0,
    totalVolume: 0,
    activeMarkets: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth <= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get("/markets/");
      const markets = res.data;
      const volume = markets.reduce((s, m) => s + (m.volume_24h || 0), 0);
      const open = markets.filter((m) => m.status === "OPEN").length;
      setGlobalStats({
        tradersOnline: Math.max(open * 3, markets.length),
        totalVolume: volume,
        activeMarkets: open,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    socket.on("live_activity", fetchStats);
    socket.on("bet_matched", fetchStats);
    return () => {
      clearInterval(interval);
      socket.off("live_activity", fetchStats);
      socket.off("bet_matched", fetchStats);
    };
  }, []);

  return (
    <div style={{ display: 'flex', background: 'var(--black)', color: 'var(--text)', minHeight: '100vh' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '6px 24px', flexShrink: 0, background: 'var(--surface2)', borderBottom: '1px solid var(--green-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', animation: 'kn-pulse 2s ease-in-out infinite' }} />
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>{globalStats.tradersOnline}</span>
                <span style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>online</span>
              </div>
              <span style={{ color: 'var(--surface3)' }}>|</span>
              <span style={{ color: 'var(--muted)' }}>VOL</span>
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>${globalStats.totalVolume.toLocaleString()}</span>
              <span style={{ color: 'var(--surface3)' }}>|</span>
              <span style={{ color: 'var(--muted)' }}>MKTS</span>
              <span style={{ color: 'var(--text)', fontWeight: 700 }}>{globalStats.activeMarkets}</span>
            </div>
            <span style={{ color: 'var(--green)', fontWeight: 700, letterSpacing: '0.2em', fontSize: '9px', opacity: 0.8 }}>KINESIS EXCHANGE</span>
          </div>
        </div>

        <Navbar />

        <div style={{ padding: fullWidth ? '12px' : '24px', flex: 1, minHeight: 0, overflow: fullWidth ? 'hidden' : 'auto', maxWidth: fullWidth ? 'none' : '1440px', width: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
}