import React, { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
const API = process.env.REACT_APP_API_URL;

// ===== GLOBAL STYLES =====
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:wght@300;400;500;600&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: #07080d;
      font-family: 'Raleway', sans-serif;
      overflow-x: hidden;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes pulse-glow {
      0%,100% {
        box-shadow:
          0 0 40px rgba(201,168,76,0.5),
          0 0 100px rgba(201,168,76,0.2);
      }

      50% {
        box-shadow:
          0 0 70px rgba(201,168,76,0.8),
          0 0 160px rgba(201,168,76,0.35);
      }
    }

    @keyframes floatOrb {
      0%,100% {
        transform: translateY(0px);
      }

      50% {
        transform: translateY(-18px);
      }
    }

    @keyframes authAppear {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }

      to {
        opacity: 1;
        transform: translateY(0px) scale(1);
      }
    }

    .input-field:focus {
      outline: none;
      border-color: #c9a84c !important;
      box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
    }

    .gold-btn {
      transition: 0.3s;
    }

    .gold-btn:hover {
      transform: translateY(-2px);
      filter: brightness(1.05);
    }
  `}</style>
);

// ===== ICONS =====
const LockIcon = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const Spinner = ({ label }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      padding: 10,
      color: "#c9a84c",
    }}
  >
    <div
      style={{
        width: 18,
        height: 18,
        border: "2px solid rgba(201,168,76,0.2)",
        borderTop: "2px solid #c9a84c",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />

    {label}
  </div>
);

export default function App() {
  // ===== STATES =====
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [token, setToken] = useState(localStorage.getItem("token"));

  const [activeTab, setActiveTab] = useState("login");
  const [showAuth, setShowAuth] = useState(false);

  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState("");
  const [showVerifyScreen, setShowVerifyScreen] = useState(false);
  // ===== AUTH =====
  const signup = async () => {
    setLoading("Creating vault...");

    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

     if (!res.ok) {
  alert(data.message);
  return;
}

setShowVerifyScreen(true);
    } catch {
      alert("Signup failed");
    } finally {
      setLoading("");
    }
  };
  const resendOtp = async () => {
  try {
    const res = await fetch(
      `${API}/resend-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      }
    );

    const data = await res.json();

    alert(data.message);

  } catch {
    alert(
      "Failed to resend verification email"
    );
  }
};

  const login = async () => {
  setLoading("Unlocking vault...");

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
      alert(data.message || "Login failed");
      return;
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);

  } catch {
    alert("Login failed");
  } finally {
    setLoading("");
  }
};

const handleGoogleLogin = async (response) => {
  try {
    const res = await fetch(`${API}/google-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential: response.credential,
      }),
    });

    const data = await res.json();

    if (!data.token) {
      alert("Google login failed");
      return;
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);

  } catch {
    alert("Google login failed");
  }
};

const logout = () => {
  localStorage.removeItem("token");
  setToken(null);
  setFiles([]);
};

  // ===== FILES =====
  const getFiles = async () => {
    try {
      const res = await fetch(`${API}/files`, {
        headers: {
          Authorization: token,
        },
      });

      const data = await res.json();

      setFiles(Array.isArray(data) ? data : []);
    } catch {
      alert("Failed to load files");
    }
  };

  useEffect(() => {
    if (token) {
      getFiles();
    }
  }, [token]);

  const uploadFile = async () => {
    if (!file) {
      alert("Select a file");
      return;
    }

    setLoading("Encrypting & uploading...");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const res = await fetch(`${API}/upload`, {
        method: "POST",
        headers: {
          Authorization: token,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      setFile(null);

      document.getElementById("fileInput").value = "";

      getFiles();
    } catch {
      alert("Upload failed");
    } finally {
      setLoading("");
    }
  };

  const deleteFile = async (id, name) => {
    const confirmDelete = window.confirm(
      `Delete "${name}"?`
    );

    if (!confirmDelete) return;

    try {
      await fetch(`${API}/delete?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      });

      getFiles();
    } catch {
      alert("Delete failed");
    }
  };

  const downloadFile = async (url, name) => {
    try {
      let fileName = name;

      if (!fileName.endsWith(".txt")) {
        fileName += ".txt";
      }

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
if (showVerifyScreen) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        background: "#05060a",
      }}
    >
      <h2>Check Your Email</h2>

      <p>
        A verification email has been sent to:
      </p>

      <strong>{email}</strong>

      <br />
      <br />

      <button onClick={resendOtp}>
        Resend Verification Email
      </button>

      <br />
      <br />

      <button
        onClick={() => {
          setShowVerifyScreen(false);
          setActiveTab("login");
        }}
      >
        Go To Login
      </button>
    </div>
  );
}
  // ===== LOGIN PAGE =====
  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #101827 0%, #05060a 70%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <GlobalStyles />

        {/* Background Glow */}
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(201,168,76,0.08), transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Orb */}
        <div
          onClick={() => setShowAuth(true)}
          style={{
            width: 130,
            height: 130,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%, #f5d97a, #c9a84c 60%, #8a6a20)",
            cursor: "pointer",
            animation:
              "floatOrb 4s ease-in-out infinite, pulse-glow 3s ease-in-out infinite",
            zIndex: 2,
          }}
        />

        {/* Auth Card */}
        {showAuth && (
          <div
            style={{
              width: 420,
              padding: "42px 38px",
              borderRadius: 24,
              background: "rgba(15,18,28,0.88)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.65)",
              color: "#fff",
              position: "relative",
              animation: "authAppear 0.4s ease",
              zIndex: 3,
            }}
          >
            {/* Close */}
            <button
              onClick={() => setShowAuth(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  color: "#c9a84c",
                  marginBottom: 10,
                }}
              >
                <LockIcon size={32} />
              </div>

              <h1
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 24,
                  color: "#f4deb3",
                  letterSpacing: 3,
                }}
              >
                Privacy Locker
              </h1>

              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  marginTop: 8,
                  fontSize: 12,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Secure Encrypted Vault
              </p>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                marginBottom: 24,
                borderBottom:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {["login", "signup"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color:
                      activeTab === tab
                        ? "#c9a84c"
                        : "rgba(255,255,255,0.35)",
                    borderBottom:
                      activeTab === tab
                        ? "2px solid #c9a84c"
                        : "2px solid transparent",
                    fontWeight: 600,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  {tab === "login"
                    ? "Sign In"
                    : "Register"}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="input-field"
                style={{
                  padding: "14px",
                  borderRadius: 10,
                  border:
                    "1px solid rgba(255,255,255,0.1)",
                  background:
                    "rgba(255,255,255,0.04)",
                  color: "#fff",
                }}
              />

              <div
                style={{
                  position: "relative",
                }}
              >
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="input-field"
                  style={{
                    width: "100%",
                    padding:
                      "14px 42px 14px 14px",
                    borderRadius: 10,
                    border:
                      "1px solid rgba(255,255,255,0.1)",
                    background:
                      "rgba(255,255,255,0.04)",
                    color: "#fff",
                  }}
                />

                <button
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

   {/* Submit */}
<div
  style={{
    marginTop: 24,
  }}
>
  {loading ? (
    <Spinner label={loading} />
  ) : (
    <button
      className="gold-btn"
      onClick={
        activeTab === "login"
          ? login
          : signup
      }
      style={{
        width: "100%",
        padding: "14px 0",
        borderRadius: 10,
        border: "none",
        background:
          "linear-gradient(135deg, #d8b55b, #a87c2a)",
        color: "#07080d",
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {activeTab === "login"
        ? "Unlock Vault"
        : "Create Vault"}
    </button>
  )}
</div>

{/* OR Divider */}
<div
  style={{
    marginTop: 20,
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
  }}
>
  ───── OR ─────
</div>

{/* Google Login */}
<div
  style={{
    marginTop: 20,
    display: "flex",
    justifyContent: "center",
  }}
>
  <GoogleLogin
    onSuccess={handleGoogleLogin}
    onError={() => alert("Google Login Failed")}
  />
</div>
</div>

)}

</div>

);
}

  // ===== DASHBOARD =====
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0f1724 0%, #05060a 70%)",
        overflow: "hidden",
        position: "relative",
        padding: 30,
        color: "#fff",
      }}
    >
      <GlobalStyles />

      {/* Background Lights */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(201,168,76,0.08), transparent 70%)",
          top: -200,
          left: -150,
          filter: "blur(50px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(90,120,255,0.08), transparent 70%)",
          bottom: -200,
          right: -150,
          filter: "blur(50px)",
        }}
      />

      <div
        style={{
          maxWidth: 1250,
          margin: "0 auto",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 36,
                fontFamily: "'Cinzel', serif",
                color: "#f4deb3",
                letterSpacing: 4,
              }}
            >
              Privacy Locker
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,0.35)",
                marginTop: 8,
              }}
            >
              Quantum Secure Vault
            </p>
          </div>

          <button
            onClick={logout}
            style={{
              padding: "12px 24px",
              borderRadius: 16,
              border:
                "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(260px,1fr))",
            gap: 22,
            marginBottom: 40,
          }}
        >
          {[
            {
              title: "Encrypted Files",
              value: files.length,
              icon: "🔒",
            },
            {
              title: "Vault Status",
              value: "Protected",
              icon: "🛡️",
            },
            {
              title: "Encryption",
              value: "AES Active",
              icon: "⚡",
            },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background:
                  "rgba(255,255,255,0.04)",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24,
                padding: 28,
                backdropFilter: "blur(16px)",
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  marginBottom: 16,
                }}
              >
                {card.icon}
              </div>

              <p
                style={{
                  color:
                    "rgba(255,255,255,0.4)",
                  marginBottom: 10,
                }}
              >
                {card.title}
              </p>

              <h2
                style={{
                  color: "#f4deb3",
                  fontSize: 30,
                }}
              >
                {card.value}
              </h2>
            </div>
          ))}
        </div>

        {/* Upload Section */}
        <div
          style={{
            background:
              "rgba(255,255,255,0.04)",
            border:
              "1px solid rgba(255,255,255,0.08)",
            borderRadius: 28,
            padding: 40,
            marginBottom: 40,
          }}
        >
          <h2
            style={{
              fontSize: 26,
              marginBottom: 28,
              color: "#f4deb3",
            }}
          >
            Secure Upload Gateway
          </h2>

          <div
            onClick={() =>
              document
                .getElementById("fileInput")
                .click()
            }
            style={{
              border:
                "2px dashed rgba(201,168,76,0.35)",
              borderRadius: 24,
              padding: 60,
              textAlign: "center",
              cursor: "pointer",
              background:
                "rgba(201,168,76,0.03)",
            }}
          >
            <input
              id="fileInput"
              type="file"
              style={{
                display: "none",
              }}
              onChange={(e) =>
                setFile(e.target.files[0])
              }
            />

            <div
              style={{
                fontSize: 60,
                marginBottom: 20,
              }}
            >
              🔐
            </div>

            {file ? (
              <p
                style={{
                  color: "#f4deb3",
                  fontSize: 20,
                }}
              >
                {file.name}
              </p>
            ) : (
              <>
                <p
                  style={{
                    fontSize: 20,
                    color: "#fff",
                  }}
                >
                  Drop Secure File Here
                </p>

                <p
                  style={{
                    marginTop: 10,
                    color:
                      "rgba(255,255,255,0.35)",
                  }}
                >
                  AES encryption applied automatically
                </p>
              </>
            )}
          </div>

          <div
            style={{
              marginTop: 24,
            }}
          >
            {loading ? (
              <Spinner label={loading} />
            ) : (
              <button
                onClick={uploadFile}
                style={{
                  width: "100%",
                  padding: "16px 0",
                  borderRadius: 18,
                  border: "none",
                  background:
                    "linear-gradient(135deg,#d8b55b,#a87c2a)",
                  color: "#05060a",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                }}
              >
                Encrypt & Upload
              </button>
            )}
          </div>
        </div>

        {/* Files */}
        <div>
          <h2
            style={{
              marginBottom: 24,
              fontSize: 26,
              color: "#f4deb3",
            }}
          >
            Encrypted Vault Files
          </h2>

          {files.length === 0 ? (
            <div
              style={{
                padding: 50,
                borderRadius: 24,
                textAlign: "center",
                background:
                  "rgba(255,255,255,0.03)",
                color:
                  "rgba(255,255,255,0.35)",
              }}
            >
              No encrypted files stored
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(320px,1fr))",
                gap: 24,
              }}
            >
              {files.map((f, i) => (
                <div
                  key={i}
                  style={{
                    background:
                      "rgba(255,255,255,0.04)",
                    border:
                      "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 24,
                    padding: 28,
                  }}
                >
                  <div
                    style={{
                      fontSize: 46,
                      marginBottom: 18,
                    }}
                  >
                    🔒
                  </div>

                  <h3
                    style={{
                      color: "#fff",
                      marginBottom: 12,
                      wordBreak: "break-word",
                    }}
                  >
                    {f.originalName}
                  </h3>

                  <p
                    style={{
                      color:
                        "rgba(255,255,255,0.4)",
                      marginBottom: 24,
                    }}
                  >
                    AES Encrypted • Cloud Protected
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                    }}
                  >
                    <button
                      onClick={() =>
                        downloadFile(
                          f.url,
                          f.originalName
                        )
                      }
                      style={{
                        flex: 1,
                        padding: "12px 0",
                        borderRadius: 14,
                        border: "none",
                        background:
                          "rgba(201,168,76,0.15)",
                        color: "#f4deb3",
                        cursor: "pointer",
                      }}
                    >
                      Download
                    </button>

                    <button
                      onClick={() =>
                        deleteFile(
                          f.public_id,
                          f.originalName
                        )
                      }
                      style={{
                        flex: 1,
                        padding: "12px 0",
                        borderRadius: 14,
                        border: "none",
                        background:
                          "rgba(255,80,80,0.12)",
                        color: "#ff8080",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}