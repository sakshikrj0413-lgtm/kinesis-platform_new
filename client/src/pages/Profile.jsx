import { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import useAuthStore from "../store/authStore";
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

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  background: C.surface2, border: `1px solid ${C.border}`,
  color: C.text, fontSize: 13, fontFamily: "'Space Mono',monospace",
  outline: "none", transition: "border-color 0.2s",
};

const labelStyle = {
  fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em",
  color: C.muted, fontFamily: "'Space Mono',monospace", fontWeight: 700,
  marginBottom: 6, display: "block",
};

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const token = useAuthStore((state) => state.token);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: "", email: "", phone: "", bio: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (message, color = C.green) => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    try {
      const res = await API.get("/auth/profile");
      setProfile(res.data);
      setForm({
        username: res.data.username || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        bio: res.data.bio || "",
      });
      setAvatarPreview(res.data.avatar_url || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      showToast("Image too large. Please choose an image under 1.5MB.", C.red);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        username: form.username,
        email: form.email,
        phone: form.phone,
        bio: form.bio,
      };
      if (avatarPreview && avatarPreview !== profile?.avatar_url) {
        payload.avatar_url = avatarPreview;
      }
      const res = await API.put("/auth/profile", payload);
      showToast("Profile updated successfully");
      setProfile((prev) => ({ ...prev, ...res.data.user }));
      if (user) {
        login({ ...user, ...res.data.user }, token);
      }
    } catch (e) {
      showToast(e.response?.data?.error || "Failed to update profile", C.red);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      showToast("Please fill in all password fields", C.red);
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast("New passwords do not match", C.red);
      return;
    }
    setSavingPassword(true);
    try {
      await API.put("/auth/profile", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      showToast("Password changed successfully");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (e) {
      showToast(e.response?.data?.error || "Failed to change password", C.red);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ width: 40, height: 40, border: "2px solid rgba(0,255,136,0.25)", borderTopColor: C.green, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow { 0%,100%{opacity:.6} 50%{opacity:1} }
        .profile-input:focus { border-color: ${C.green} !important; box-shadow: 0 0 0 2px rgba(0,255,136,0.1); }
        .save-btn:hover { box-shadow: 0 0 24px rgba(0,255,136,0.5) !important; transform: translateY(-1px); }
        .avatar-edit:hover { opacity: 1 !important; }
        .stat-card { transition: all 0.2s; }
        .stat-card:hover { transform: translateY(-2px); }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:9999, padding:"12px 20px", borderRadius:10,
          background:"rgba(5,8,5,0.97)", border:`1px solid ${toast.color}`, color:toast.color,
          fontFamily:"'Space Mono',monospace", fontSize:13, fontWeight:"bold",
          boxShadow:`0 0 32px ${toast.color}44`, animation:"fadeUp 0.2s ease", maxWidth:340 }}>
          {toast.message}
        </div>
      )}

      <div style={{ maxWidth:1000, marginLeft:"auto", marginRight:"auto", display:"flex", flexDirection:"column", gap:20 }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <div style={{ width:3, height:28, background:`linear-gradient(to bottom, ${C.green}, transparent)`, borderRadius:2 }} />
              <h1 style={{ fontSize:26, fontWeight:900, color:C.text, fontFamily:"'Syne',sans-serif", margin:0, letterSpacing:"-0.02em" }}>Profile Settings</h1>
            </div>
            <p style={{ color:C.muted, fontSize:12, margin:0, paddingLeft:13 }}>Manage your account, avatar, and security</p>
          </div>
          {profile?.role === "admin" && (
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"rgba(255,215,0,0.06)", border:`1px solid rgba(255,215,0,0.3)`, borderRadius:20 }}>
              <span style={{ color:C.yellow, fontSize:10, fontWeight:700, letterSpacing:"0.1em", fontFamily:"'Space Mono',monospace" }}>ADMIN</span>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div style={{ background:`linear-gradient(135deg, ${C.surface} 0%, ${C.surface2} 100%)`,
          border:`1px solid ${C.border}`, borderRadius:14, padding:24, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
            background:`linear-gradient(to right, ${C.green}, transparent)`, borderRadius:"14px 14px 0 0" }}/>

          <div style={{ display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
            {/* Avatar */}
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{
                width:88, height:88, borderRadius:"50%",
                background: avatarPreview ? `url(${avatarPreview}) center/cover` : `linear-gradient(135deg, ${C.green}, ${C.greenDim})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 0 24px ${C.greenGlow}`, border:`2px solid ${C.border}`,
              }}>
                {!avatarPreview && (
                  <span style={{ color:"#050805", fontWeight:900, fontSize:32, fontFamily:"'Syne',sans-serif" }}>
                    {form.username?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="avatar-edit"
                style={{
                  position:"absolute", bottom:-2, right:-2, width:30, height:30, borderRadius:"50%",
                  background:C.green, border:`2px solid ${C.surface}`, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  opacity:0.9, transition:"opacity 0.2s",
                }}
                title="Change avatar"
              >
                <svg style={{ width:14, height:14, color:"#050805" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:"none" }} />
            </div>

            <div style={{ flex:1, minWidth:180 }}>
              <div style={{ fontSize:20, fontWeight:700, color:C.text, fontFamily:"'Syne',sans-serif", marginBottom:4 }}>
                {form.username || "Unnamed Trader"}
              </div>
              <div style={{ fontSize:12, color:C.muted, fontFamily:"'Space Mono',monospace", marginBottom:8 }}>
                {form.email}
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <span style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", background:"rgba(0,255,136,0.06)", border:`1px solid ${C.border}`, borderRadius:20 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:C.green, animation:"glow 2s ease-in-out infinite" }} />
                  <span style={{ color:C.green, fontSize:10, fontWeight:700, letterSpacing:"0.05em", fontFamily:"'Space Mono',monospace" }}>ACTIVE</span>
                </span>
                {profile?.created_at && (
                  <span style={{ padding:"4px 12px", background:C.surface3, borderRadius:20, fontSize:10, color:C.muted, fontFamily:"'Space Mono',monospace" }}>
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                )}
                {profile?.wallet_address && (
                  <span style={{ padding:"4px 12px", background:"rgba(68,136,255,0.08)", border:"1px solid rgba(68,136,255,0.2)", borderRadius:20, fontSize:10, color:C.blue, fontFamily:"'Space Mono',monospace" }}>
                    {profile.wallet_address.slice(0,6)}...{profile.wallet_address.slice(-4)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>👤</span>
            <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", color:C.muted, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>Personal Information</span>
            <div style={{ flex:1, height:1, background:`linear-gradient(to right, ${C.green}22, transparent)` }}/>
          </div>

          <div style={{ padding:20, display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:16 }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input
                className="profile-input"
                style={inputStyle}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Your display name"
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                className="profile-input"
                style={inputStyle}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                className="profile-input"
                style={inputStyle}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 00000 00000"
              />
            </div>
            <div style={{ gridColumn:"span 2" }}>
              <label style={labelStyle}>Bio</label>
              <textarea
                className="profile-input"
                style={{ ...inputStyle, resize:"vertical", minHeight:80, fontFamily:"'Space Mono',monospace" }}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 300) })}
                placeholder="Tell us a bit about your trading style..."
                maxLength={300}
              />
              <div style={{ fontSize:9, color:C.muted, fontFamily:"'Space Mono',monospace", marginTop:4, textAlign:"right" }}>
                {form.bio.length}/300
              </div>
            </div>
          </div>

          <div style={{ padding:"0 20px 20px", display:"flex", justifyContent:"flex-end" }}>
            <button
              className="save-btn"
              onClick={handleSaveProfile}
              disabled={saving}
              style={{
                padding:"10px 28px", borderRadius:10, border:"none",
                background:C.green, color:"#050805", fontSize:12, fontWeight:700,
                fontFamily:"'Space Mono',monospace", letterSpacing:"0.05em",
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
                boxShadow:"0 0 16px rgba(0,255,136,0.3)", transition:"all 0.2s",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Security Card */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14 }}>🔒</span>
            <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em", color:C.muted, fontFamily:"'Space Mono',monospace", fontWeight:700 }}>Security</span>
            <div style={{ flex:1, height:1, background:`linear-gradient(to right, ${C.yellow}22, transparent)` }}/>
          </div>

          <div style={{ padding:20, display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:16 }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <input
                className="profile-input"
                style={inputStyle}
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                className="profile-input"
                style={inputStyle}
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                className="profile-input"
                style={inputStyle}
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div style={{ padding:"0 20px 20px", display:"flex", justifyContent:"flex-end" }}>
            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              style={{
                padding:"10px 28px", borderRadius:10,
                background:"rgba(255,215,0,0.1)", border:`1px solid ${C.yellow}`,
                color:C.yellow, fontSize:12, fontWeight:700,
                fontFamily:"'Space Mono',monospace", letterSpacing:"0.05em",
                cursor: savingPassword ? "not-allowed" : "pointer", opacity: savingPassword ? 0.6 : 1,
                transition:"all 0.2s",
              }}
            >
              {savingPassword ? "Updating..." : "Change Password"}
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
