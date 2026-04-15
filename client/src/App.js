import React, { useEffect, useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);

  const API = process.env.REACT_APP_API_URL;

  // Fetch files
  const getFiles = async () => {
    const res = await fetch(API + "/files");
    const data = await res.json();
    setFiles(data);
  };

  useEffect(() => {
    getFiles();
  }, []);

  // Upload file
  const uploadFile = async () => {
    if (!file) return alert("Select a file");

    const formData = new FormData();
    formData.append("file", file);

    await fetch(API + "/upload", {
      method: "POST",
      body: formData,
    });

    alert("File uploaded!");
    getFiles();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h1>Privacy Locker</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={uploadFile}>Upload</button>

      <h2>Uploaded Files</h2>
<ul>
  {files.map((f, i) => (
    <li key={i}>
      {f}
      <br />

      <a
        href={process.env.REACT_APP_API_URL + "/view/" + f}
        target="_blank"
        rel="noreferrer"
      >
        View
      </a>

      <br />

      <a
        href={process.env.REACT_APP_API_URL + "/download/" + f}
        target="_blank"
        rel="noreferrer"
      >
        Download
      </a>

      <br />

      <button
        onClick={async () => {
          await fetch(
            process.env.REACT_APP_API_URL + "/delete/" + f,
            { method: "DELETE" }
          );
          alert("File deleted!");
          window.location.reload();
        }}
      >
        Delete
      </button>
    </li>
  ))}
</ul>
    </div>
  );
}

export default App;