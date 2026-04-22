import React, { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL;

// ===== GLOBAL STYLES =====
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #07080d;
      font-family: 'Raleway', sans-serif;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #111; }
    ::-webkit-scrollbar-thumb { background: #c9a84c; border-radius: 2px; }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }

    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.3); }
      50%       { box-shadow: 0 0 0 8px rgba(201,168,76,0); }
    }

    @keyframes fileDrop {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .vault-card { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }

    .gold-btn {
      position: relative;
      overflow: hidden;
      transition: all 0.25s ease;
    }
    .gold-btn::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
      background-size: 400px 100%;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .gold-btn:hover::after { opacity: 1; animation: shimmer 0.7s linear; }
    .gold-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
    .gold-btn:active { transform: translateY(0px); }

    .file-row {
      animation: fileDrop 0.35s cubic-bezier(0.22,1,0.36,1) both;
    }
    .file-row:hover { background: rgba(201,168,76,0.07) !important; }

    .input-field:focus {
      outline: none;
      border-color: #c9a84c !important;
      box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
    }

    .upload-zone {
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .upload-zone:hover {
      border-color: #c9a84c !important;
      background: rgba(201,168,76,0.05) !important;
    }

    .logout-btn:hover {
      background: rgba(255,255,255,0.1) !important;
      border-color: rgba(201,168,76,0.5) !important;
    }

    .tab-link {
      transition: color 0.2s, border-color 0.2s;
    }
    .tab-link:hover { color: #e8c96a !important; }
  `}</style>
);

// ===== ICONS =====
const LockIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const EyeIcon = ({ open }) => open
  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

// ===== SPINNER =====
const Spinner = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", padding: "12px 0", color: "#c9a84c", fontSize: 13, letterSpacing: 1 }}>
    <div style={{ width: 18, height: 18, border: "2px solid rgba(201,168,76,0.2)", borderTop: "2px solid #c9a84c", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    {label}
  </div>
);

// ===== DIVIDER =====
const Divider = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
    <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3))" }} />
    <div style={{ width: 5, height: 5, background: "#c9a84c", borderRadius: "50%", opacity: 0.6 }} />
    <div style={{ flex: 1, height: 1, background: "linear-gradient(270deg, transparent, rgba(201,168,76,0.3))" }} />
  </div>
);

// ===== MAIN APP =====
export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState("login");

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // ===== AUTH =====
  const signup = async () => {
    setLoading("Creating vault…");
    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message);
      alert("Vault created! You can now log in.");
      setActiveTab("login");
    } finally { setLoading(""); }
  };

  const login = async () => {
    setLoading("Unlocking…");
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) return alert("Login failed");
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } finally { setLoading(""); }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setFiles([]);
  };

  // ===== FILES =====
  const getFiles = async () => {
    const res = await fetch(`${API}/files`, { headers: { Authorization: token } });
    const data = await res.json();
    setFiles(Array.isArray(data) ? data : []);
  };

  useEffect(() => { if (token) getFiles(); }, [token]);

  const uploadFile = async () => {
    if (!file) return alert("Select a file first");
    setLoading("Encrypting & uploading…");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        headers: { Authorization: token },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message);
      setFile(null);
      document.getElementById("fileInput").value = "";
      getFiles();
    } finally { setLoading(""); }
  };

  const deleteFile = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"?`)) return;
    setLoading("Deleting…");
    try {
      await fetch(`${API}/delete?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      getFiles();
    } finally { setLoading(""); }
  };

  const downloadFile = async (url, name) => {
    try {
      let fileName = name;
      if (!fileName.endsWith(".txt")) fileName += ".txt";
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = fileName; a.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch { alert("Download failed"); }
  };

  // ===== LOGIN PAGE =====
  if (!token) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#07080d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        position: "relative",
        overflow: "hidden",
      }}>
        <GlobalStyles />

        {/* Background decoration */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "15%", left: "10%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: "10%", right: "8%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(100,120,200,0.07) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.04)" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.05)" }} />
        </div>

        <div className="vault-card" style={{
          width: "100%",
          maxWidth: 420,
          background: "linear-gradient(145deg, rgba(18,20,30,0.95), rgba(12,13,20,0.98))",
          border: "1px solid rgba(201,168,76,0.18)",
          borderRadius: 20,
          padding: "44px 40px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.1)",
          position: "relative",
          zIndex: 1,
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
              border: "1px solid rgba(201,168,76,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 18px",
              color: "#c9a84c",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}>
              <LockIcon size={26} />
            </div>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 600, color: "#e8d5a0", letterSpacing: 3, textTransform: "uppercase" }}>
              Privacy Locker
            </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Encrypted File Vault
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 28 }}>
            {["login","signup"].map(tab => (
              <button key={tab} className="tab-link" onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: "10px 0", background: "none", border: "none", cursor: "pointer",
                fontFamily: "'Raleway', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: 1.5,
                textTransform: "uppercase",
                color: activeTab === tab ? "#c9a84c" : "rgba(255,255,255,0.35)",
                borderBottom: activeTab === tab ? "2px solid #c9a84c" : "2px solid transparent",
                marginBottom: -1,
                transition: "all 0.2s ease",
              }}>
                {tab === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 7 }}>
                Email Address
              </label>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: "100%", padding: "12px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, color: "#fff",
                  fontSize: 14, fontFamily: "'Raleway', sans-serif",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 7 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="input-field"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (activeTab === "login" ? login() : signup())}
                  style={{
                    width: "100%", padding: "12px 44px 12px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, color: "#fff",
                    fontSize: 14, fontFamily: "'Raleway', sans-serif",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
                <button onClick={() => setShowPassword(p => !p)} style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center",
                }}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>
          </div>

          <Divider />

          {loading
            ? <Spinner label={loading} />
            : <button className="gold-btn" onClick={activeTab === "login" ? login : signup} style={{
                width: "100%", padding: "13px 0",
                background: "linear-gradient(135deg, #c9a84c, #a87c2a)",
                color: "#07080d", border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, letterSpacing: 2,
                textTransform: "uppercase", cursor: "pointer",
                fontFamily: "'Raleway', sans-serif",
              }}>
                {activeTab === "login" ? "Unlock Vault" : "Create Vault"}
              </button>
          }

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
            {activeTab === "login" ? "Don't have a vault? " : "Already have a vault? "}
            <span onClick={() => setActiveTab(activeTab === "login" ? "signup" : "login")}
              style={{ color: "#c9a84c", cursor: "pointer", textDecoration: "underline" }}>
              {activeTab === "login" ? "Create one" : "Sign in"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD =====
  return (
    <div style={{ minHeight: "100vh", background: "#07080d", padding: "32px 20px", position: "relative" }}>
      <GlobalStyles />

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(80,100,200,0.05) 0%, transparent 65%)" }} />
      </div>

      {/* Top bar */}
      <div style={{ maxWidth: 720, margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: "#c9a84c" }}><LockIcon size={22} /></div>
          <div>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 600, color: "#e8d5a0", letterSpacing: 2, textTransform: "uppercase" }}>Privacy Locker</h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>{files.length} encrypted file{files.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} style={{
          padding: "8px 18px", background: "transparent",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
          color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600,
          letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer",
          fontFamily: "'Raleway', sans-serif", transition: "all 0.2s",
        }}>
          Sign Out
        </button>
      </div>

      {/* Upload card */}
      <div className="vault-card" style={{
        maxWidth: 720, margin: "0 auto 24px",
        background: "linear-gradient(145deg, rgba(18,20,30,0.95), rgba(12,13,20,0.98))",
        border: "1px solid rgba(201,168,76,0.15)",
        borderRadius: 18, padding: "30px 32px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 600, color: "rgba(201,168,76,0.8)", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 20 }}>
          Upload File
        </h2>

        {/* Drop zone */}
        <div
          className="upload-zone"
          onClick={() => document.getElementById("fileInput").click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) setFile(dropped);
          }}
          style={{
            border: `1.5px dashed ${dragOver ? "#c9a84c" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 12, padding: "28px 20px",
            textAlign: "center", cursor: "pointer",
            background: dragOver ? "rgba(201,168,76,0.05)" : "rgba(255,255,255,0.02)",
            transition: "all 0.2s",
          }}
        >
          <input
            id="fileInput" type="file"
            onChange={e => setFile(e.target.files[0])}
            style={{ display: "none" }}
          />
          <div style={{ color: "rgba(255,255,255,0.25)", marginBottom: 10 }}><UploadIcon /></div>
          {file
            ? <p style={{ color: "#c9a84c", fontSize: 14, fontWeight: 500 }}>📎 {file.name}</p>
            : <>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Drop file here, or <span style={{ color: "#c9a84c", textDecoration: "underline" }}>browse</span></p>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 5 }}>All file types supported</p>
              </>
          }
        </div>

        <div style={{ marginTop: 16 }}>
          {loading
            ? <Spinner label={loading} />
            : <button className="gold-btn" onClick={uploadFile} style={{
                width: "100%", padding: "12px 0",
                background: file ? "linear-gradient(135deg, #c9a84c, #a87c2a)" : "rgba(255,255,255,0.05)",
                color: file ? "#07080d" : "rgba(255,255,255,0.25)",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, letterSpacing: 2,
                textTransform: "uppercase", cursor: file ? "pointer" : "not-allowed",
                fontFamily: "'Raleway', sans-serif",
              }}>
                Encrypt &amp; Upload
              </button>
          }
        </div>
      </div>

      {/* Files list */}
      <div className="vault-card" style={{
        maxWidth: 720, margin: "0 auto",
        background: "linear-gradient(145deg, rgba(18,20,30,0.95), rgba(12,13,20,0.98))",
        border: "1px solid rgba(201,168,76,0.15)",
        borderRadius: 18, padding: "30px 32px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 600, color: "rgba(201,168,76,0.8)", letterSpacing: 2.5, textTransform: "uppercase" }}>
            Vault Contents
          </h2>
          <span style={{
            background: "rgba(201,168,76,0.12)", color: "#c9a84c",
            borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600,
          }}>
            {files.length} files
          </span>
        </div>

        {files.length === 0
          ? <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🗄️</div>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>Your vault is empty</p>
              <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, marginTop: 5 }}>Upload files above to get started</p>
            </div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {files.map((f, i) => (
                <div key={i} className="file-row" style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  animationDelay: `${i * 0.05}s`,
                  transition: "background 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{ flexShrink: 0 }}><FileIcon /></div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: "#e8e8e8", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 280 }}>
                        {f.originalName}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 2 }}>
                        Encrypted · Secure
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="gold-btn" onClick={() => downloadFile(f.url, f.originalName)} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "7px 14px",
                      background: "rgba(201,168,76,0.12)",
                      border: "1px solid rgba(201,168,76,0.25)",
                      borderRadius: 7, color: "#c9a84c",
                      fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
                      cursor: "pointer", fontFamily: "'Raleway', sans-serif",
                    }}>
                      <DownloadIcon /> Download
                    </button>
                    <button className="gold-btn" onClick={() => deleteFile(f.public_id, f.originalName)} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "7px 14px",
                      background: "rgba(255,70,50,0.08)",
                      border: "1px solid rgba(255,70,50,0.2)",
                      borderRadius: 7, color: "rgba(255,100,80,0.8)",
                      fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
                      cursor: "pointer", fontFamily: "'Raleway', sans-serif",
                    }}>
                      <TrashIcon /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "rgba(255,255,255,0.15)", letterSpacing: 1.5, textTransform: "uppercase" }}>
        End-to-end encrypted · Privacy Locker
      </p>
    </div>
  );
}
