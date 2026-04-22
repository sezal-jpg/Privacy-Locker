import React, { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL;

// ================= PREMIUM STYLES =================

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #1e3c72, #2a5298)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontFamily: "Segoe UI"
};

const cardStyle = {
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(12px)",
  padding: 30,
  borderRadius: 15,
  width: 350,
  color: "#fff",
  boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
  textAlign: "center"
};

const dashboardCard = {
  ...cardStyle,
  width: 650
};

const inputStyle = {
  width: "100%",
  padding: 12,
  margin: "10px 0",
  borderRadius: 8,
  border: "none",
  outline: "none"
};

const primaryBtn = {
  width: "100%",
  padding: 12,
  marginTop: 10,
  background: "#00c6ff",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: "bold"
};

const secondaryBtn = {
  ...primaryBtn,
  background: "#7f00ff"
};

const dangerBtn = {
  padding: "8px 12px",
  marginLeft: 10,
  background: "#ff4b2b",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};

const logoutBtn = {
  position: "absolute",
  top: 20,
  right: 20,
  background: "#000",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer"
};

const fileCard = {
  background: "rgba(255,255,255,0.15)",
  padding: 15,
  marginTop: 10,
  borderRadius: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const spinner = {
  width: "30px",
  height: "30px",
  border: "4px solid #ccc",
  borderTop: "4px solid #00c6ff",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "10px auto"
};

// ================= APP =================

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState("");

  // ================= AUTH =================

  const signup = async () => {
    setLoading("Signing up...");
    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message);
      alert("Signup successful!");
    } finally {
      setLoading("");
    }
  };

  const login = async () => {
    setLoading("Logging in...");
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
    } finally {
      setLoading("");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setFiles([]);
  };

  // ================= FILES =================

  const getFiles = async () => {
    const res = await fetch(`${API}/files`, {
      headers: { Authorization: token },
    });
    const data = await res.json();
    setFiles(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (token) getFiles();
  }, [token]);

  // ================= UPLOAD =================

  const uploadFile = async () => {
    if (!file) return alert("Select file");
    setLoading("Uploading...");

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
    } finally {
      setLoading("");
    }
  };

  // ================= DELETE =================

  const deleteFile = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;

    setLoading("Deleting...");

    try {
      await fetch(`${API}/delete?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      getFiles();
    } finally {
      setLoading("");
    }
  };

  // ================= DOWNLOAD =================

  const downloadFile = async (url, name) => {
    try {
      let fileName = name;
      if (!fileName.endsWith(".txt")) fileName += ".txt";

      const res = await fetch(url);
      const blob = await res.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = blobUrl;
      a.download = fileName;
      a.click();

      window.URL.revokeObjectURL(blobUrl);
    } catch {
      alert("Download failed");
    }
  };

  // ================= LOGIN UI =================

  if (!token) {
    return (
      <div style={pageStyle}>
        <style>{`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>

        <div style={cardStyle}>
          <h2>🔐 Privacy Locker</h2>

          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type={showPassword ? "text" : "password"} placeholder="Password" onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

          <button onClick={() => setShowPassword(!showPassword)} style={{ color: "#fff", background: "none", border: "none" }}>
            {showPassword ? "Hide Password" : "Show Password"}
          </button>

          <button onClick={signup} style={primaryBtn}>Signup</button>
          <button onClick={login} style={secondaryBtn}>Login</button>

          {loading && <div><div style={spinner}></div><p>{loading}</p></div>}
        </div>
      </div>
    );
  }

  // ================= DASHBOARD =================

  return (
    <div style={pageStyle}>
      <button onClick={logout} style={logoutBtn}>Logout</button>

      <div style={dashboardCard}>
        <h2>Privacy Locker</h2>
        <p>🔐 Encrypted storage</p>

        {loading && <div><div style={spinner}></div><p>{loading}</p></div>}

        <input id="fileInput" type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={uploadFile} style={primaryBtn}>Upload</button>

        <h3>Your Files</h3>

        {files.map((f, i) => (
          <div key={i} style={fileCard}>
            <span>{f.originalName}</span>

            <div>
              <button onClick={() => downloadFile(f.url, f.originalName)} style={primaryBtn}>
                Download 🔐
              </button>

              <button onClick={() => deleteFile(f.public_id, f.originalName)} style={dangerBtn}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;