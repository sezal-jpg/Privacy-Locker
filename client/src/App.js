import React, { useState, useEffect } from "react";

console.log("🔥 NEW FRONTEND LOADED");

const API = process.env.REACT_APP_API_URL;

// ================= STYLES =================

const inputStyle = {
  width: "100%",
  padding: 10,
  margin: "10px 0",
  borderRadius: 5,
  border: "1px solid #ccc"
};

const primaryBtn = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  background: "#4CAF50",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor: "pointer"
};

const secondaryBtn = {
  ...primaryBtn,
  background: "#2196F3"
};

const dangerBtn = {
  padding: 8,
  marginLeft: 10,
  background: "#f44336",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor: "pointer"
};

const logoutBtn = {
  float: "right",
  background: "#333",
  color: "#fff",
  border: "none",
  padding: "5px 10px",
  borderRadius: 5,
  cursor: "pointer"
};

const linkBtn = {
  background: "none",
  border: "none",
  color: "#2196F3",
  cursor: "pointer",
  marginBottom: 10
};

const fileCard = {
  background: "#fafafa",
  padding: 15,
  marginTop: 10,
  borderRadius: 8,
  border: "1px solid #eee"
};

// 🔄 SPINNER STYLE
const spinner = {
  width: "30px",
  height: "30px",
  border: "4px solid #ccc",
  borderTop: "4px solid #4CAF50",
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
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) return alert(data.message);

      alert("Signup successful!");
    } catch {
      alert("Signup failed");
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
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        return alert(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
    } catch {
      alert("Login failed");
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
    try {
      const res = await fetch(`${API}/files`, {
        headers: { Authorization: token },
      });

      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) getFiles();
  }, [token]);

  // ================= UPLOAD =================

  const uploadFile = async () => {
    if (!file) return alert("Select a file");

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

      alert(data.message);

      setFile(null);
      document.getElementById("fileInput").value = "";

      getFiles();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading("");
    }
  };

  // ================= DELETE =================

  const deleteFile = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;

    setLoading("Deleting...");

    try {
      const res = await fetch(`${API}/delete?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });

      const data = await res.json();

      if (!res.ok) return alert(data.message);

      alert("Deleted successfully");
      getFiles();
    } catch {
      alert("Delete failed");
    } finally {
      setLoading("");
    }
  };

  // ================= DOWNLOAD =================

  const downloadFile = async (url, name) => {
  try {
    let fileName = name;

    // Ensure extension exists
    if (!fileName.includes(".")) {
      fileName += ".txt";
    }

    console.log("Downloading as:", fileName);

    const res = await fetch(url);
    const blob = await res.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);

  } catch (err) {
    console.error("Download error:", err);
    alert("Download failed");
  }
};

  // ================= LOGIN UI =================

  if (!token) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f4f6f8"
      }}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>

        <div style={{
          padding: 30,
          width: 320,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <h2>🔐 Privacy Locker</h2>

          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <input type={showPassword ? "text" : "password"} placeholder="Password" onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

          <button onClick={() => setShowPassword(!showPassword)} style={linkBtn}>
            {showPassword ? "Hide Password" : "Show Password"}
          </button>

          <button onClick={signup} style={primaryBtn}>Signup</button>
          <button onClick={login} style={secondaryBtn}>Login</button>

          {loading && (
            <div>
              <div style={spinner}></div>
              <p>{loading}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================= DASHBOARD =================

  return (
    <div style={{ padding: 30, background: "#f4f6f8", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        maxWidth: 600,
        margin: "auto",
        background: "#fff",
        padding: 25,
        borderRadius: 10,
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
      }}>

        <h2 style={{ textAlign: "center" }}>Privacy Locker</h2>
        <p style={{ textAlign: "center", color: "gray" }}>
          🔐 Files are encrypted. Download to access.
        </p>

        <button onClick={logout} style={logoutBtn}>Logout</button>

        {loading && (
          <div style={{ textAlign: "center" }}>
            <div style={spinner}></div>
            <p>{loading}</p>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <input id="fileInput" type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button onClick={uploadFile} style={primaryBtn}>Upload</button>
        </div>

        <h3 style={{ marginTop: 20 }}>Your Files</h3>

        {files.length === 0 ? (
          <p>No files uploaded</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {files.map((f, i) => (
              <li key={i} style={fileCard}>
                <b>{f.originalName}</b>

                <div style={{ marginTop: 10 }}>
                  <button onClick={() => downloadFile(f.url, f.originalName)} style={primaryBtn}>
                    Download 🔐
                  </button>

                  <button onClick={() => deleteFile(f.public_id, f.originalName)} style={dangerBtn}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;