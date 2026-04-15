import React, { useState, useEffect } from "react";

function App() {
  const API = process.env.REACT_APP_API_URL;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);

  // ================= AUTH =================

  const signup = async () => {
    await fetch(API + "/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    alert("Signup successful!");
  };

  const login = async () => {
    const res = await fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!data.token) {
      alert("Login failed");
      return;
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);
  };

  // ================= FILES =================

  const getFiles = async () => {
    const res = await fetch(API + "/files", {
      headers: { Authorization: token },
    });
    const data = await res.json();
    setFiles(data);
  };

  useEffect(() => {
    if (token) getFiles();
  }, [token]);

  const uploadFile = async () => {
    if (!file) return alert("Select a file");

    const formData = new FormData();
    formData.append("file", file);

    await fetch(API + "/upload", {
      method: "POST",
      headers: { Authorization: token },
      body: formData,
    });

    alert("Uploaded!");
    getFiles();
  };

  const deleteFile = async (f) => {
    await fetch(API + "/delete/" + f, {
      method: "DELETE",
      headers: { Authorization: token },
    });

    getFiles();
  };

  // ================= UI =================

  if (!token) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Privacy Locker 🔐</h1>

        <input
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />

        <button onClick={signup}>Signup</button>
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h1>Privacy Locker</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={uploadFile}>Upload</button>

      <h2>Your Files</h2>
      <ul>
        {files.map((f, i) => (
          <li key={i}>
            {f}
            <br />

            <a
              href={API + "/view/" + f}
              target="_blank"
              rel="noreferrer"
            >
              View
            </a>

            <br />

            <a
              href={API + "/download/" + f}
              target="_blank"
              rel="noreferrer"
            >
              Download
            </a>

            <br />

            <button onClick={() => deleteFile(f)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;