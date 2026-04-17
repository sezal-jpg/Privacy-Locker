import React, { useState, useEffect } from "react";

console.log("🔥 NEW FRONTEND LOADED");

const API = process.env.REACT_APP_API_URL;

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim() || !password.trim()) {
      return alert("Email and password required");
    }

    if (!emailRegex.test(email)) {
      return alert("Invalid email");
    }

    if (password.length < 6) {
      return alert("Password must be 6+ characters");
    }

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
  };

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      return alert("Enter email and password");
    }

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
      console.error(err);
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
      const url = `${API}/delete?id=${encodeURIComponent(id)}`;

      console.log("DELETE URL:", url);

      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: token },
      });

      console.log("STATUS:", res.status);

      const data = await res.json();

      console.log("RESPONSE:", data);

      if (!res.ok) {
        return alert(data.message || "Delete failed");
      }

      alert("Deleted successfully");

      getFiles();

    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert("Delete failed");
    } finally {
      setLoading("");
    }
  };

 

  // ================= DOWNLOAD =================

  const downloadFile = (url, name) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };

  // ================= UI =================

  if (!token) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <h1>🔐 Privacy Locker</h1>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />

        <button onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? "Hide" : "Show"}
        </button>

        <br /><br />

        <button onClick={signup}>Signup</button>
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <h1>Privacy Locker</h1>

      <button onClick={logout}>Logout</button>

      {loading && <p>{loading}</p>}

      <br />

      <input
        id="fileInput"
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={uploadFile}>Upload</button>

      <h2>Your Files</h2>

      {files.length === 0 ? (
        <p>No files</p>
      ) : (
        <ul>
          {files.map((f, i) => (
            <li key={i}>
              {f.originalName}
              <br />

            

              <button onClick={() => downloadFile(f.url, f.originalName)}>
                view/Download 🔒
              </button>

              <button
                onClick={() => {
                  console.log("DELETE BUTTON CLICKED");
                  deleteFile(f.public_id, f.originalName);
                }}
              >
                Delete
              </button>

              <br /><br />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;