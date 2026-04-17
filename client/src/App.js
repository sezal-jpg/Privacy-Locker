import React, { useState, useEffect } from "react";

function App() {
  const API = process.env.REACT_APP_API_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [token, setToken] = useState(localStorage.getItem("token"));

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);

  // ================= AUTH =================

  const signup = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim() || !password.trim()) {
      alert("Email and password are required");
      return;
    }

    if (!emailRegex.test(email)) {
      alert("Enter a valid email");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      const res = await fetch(API + "/signup", {
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
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    }
  };

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Enter email and password");
      return;
    }

    try {
      const res = await fetch(API + "/login", {
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
    } catch (err) {
      console.error(err);
      alert("Login error");
    }
  };

  // ================= FILES =================

  const getFiles = async () => {
    try {
      const res = await fetch(API + "/files", {
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

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(API + "/upload", {
        method: "POST",
        headers: { Authorization: token },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) return alert(data.message || "Upload failed");

      alert(data.message);

      getFiles();
    } catch (err) {
      console.error(err);
      alert("Upload error");
    }
  };

  // ================= DELETE (FINAL FIX) =================

  const deleteFile = async (id) => {
    try {
      console.log("Deleting file:", id); // 🔍 debug

      const res = await fetch(API + "/delete/" + id, {
        method: "DELETE",
        headers: { Authorization: token },
      });

      const data = await res.json();

      console.log("Delete response:", data); // 🔍 debug

      if (!res.ok) {
        alert(data.message || "Delete failed");
        return;
      }

      alert(data.message || "Deleted successfully");

      getFiles(); // refresh UI

    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed");
    }
  };

  // ================= VIEW =================

  const viewFile = async (id) => {
    const res = await fetch(API + "/view/" + id, {
      headers: { Authorization: token },
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url);
  };

  // ================= DOWNLOAD =================

  const downloadFile = async (id) => {
    const res = await fetch(API + "/download/" + id, {
      headers: { Authorization: token },
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "file";
    a.click();
  };

  // ================= UI =================

  if (!token) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Privacy Locker 🔐</h1>

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
          {showPassword ? "Hide Password" : "Show Password"}
        </button>

        <br /><br />

        <button onClick={signup}>Signup</button>
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h1>Privacy Locker</h1>

      <button
        onClick={() => {
          localStorage.removeItem("token");
          setToken(null);
        }}
      >
        Logout
      </button>

      <br /><br />

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={uploadFile}>Upload</button>

      <h2>Your Files</h2>

      <ul>
        {files.length === 0 ? (
          <p>No files uploaded yet</p>
        ) : (
          files.map((f, i) => (
            <li key={i}>
              {f.originalName}
              <br />

              <button onClick={() => viewFile(f.public_id)}>
                View
              </button>
              <br />

              <button onClick={() => downloadFile(f.public_id)}>
                Download
              </button>
              <br />

              <button onClick={() => {
                console.log("Clicked delete:", f.public_id);
                deleteFile(f.public_id);
              }}>
                Delete
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default App;