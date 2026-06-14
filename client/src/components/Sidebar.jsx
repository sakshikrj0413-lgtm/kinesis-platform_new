import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Sidebar({ collapsed, onToggle }) {
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === "admin";

  const links = [
    { to: "/markets", label: "Markets", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
    { to: "/trending", label: "Trending", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> },
    { to: "/arbitrage", label: "Arbitrage", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /> },
    { to: "/portfolio", label: "Portfolio", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
    { to: "/agents", label: "AGENTEX", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
    { to: "/marketplace", label: "Marketplace", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /> },
    { to: "/ai-builder", label: "AI Builder", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> },
    { to: "/assistant", label: "AI Assistant", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /> },
  ];

  if (isAdmin) {
    links.push({ to: "/admin", label: "Admin", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> });
  }

  return (
    <div
      style={{
        width: collapsed ? '72px' : '220px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface2)',
        borderRight: '1px solid var(--green-border)',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: collapsed ? '16px 0' : '20px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: '8px' }}>
        <Link to="/markets" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo-kinesis.png" alt="Kinesis" style={{ width: '24px', height: '24px', flexShrink: 0 }} />
          {!collapsed && (
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Kinesis
            </span>
          )}
        </Link>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: collapsed ? '4px' : '0 8px' }}>
        {links.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '12px',
              padding: collapsed ? '10px 0' : '10px 16px', borderRadius: '8px',
              color: 'var(--muted)', textDecoration: 'none',
              fontSize: '0.8rem', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
              minHeight: '40px',
            }}
            className="kn-sidebar-link"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, width: collapsed ? '22px' : '20px', height: collapsed ? '22px' : '20px' }}>{icon}</svg>
            {!collapsed && label}
          </Link>
        ))}
      </div>

      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px 0', margin: collapsed ? '8px auto' : '8px 12px',
          borderRadius: '8px', border: '1px solid var(--green-border)',
          background: 'transparent', color: 'var(--muted)', cursor: 'pointer',
          transition: 'all 0.2s', width: collapsed ? '40px' : 'auto',
        }}
        className="kn-sidebar-toggle"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        {!collapsed && <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', marginLeft: '8px' }}>COLLAPSE</span>}
      </button>

      <style>{`
        .kn-sidebar-link:hover {
          color: var(--green);
          background: var(--green-glow);
        }
        .kn-sidebar-toggle:hover {
          color: var(--green);
          background: var(--green-glow);
          border-color: var(--green);
        }
      `}</style>
    </div>
  );
}
