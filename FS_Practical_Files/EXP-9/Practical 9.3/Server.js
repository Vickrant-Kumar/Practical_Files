// server.js
// Full Stack Demo App for AWS Load Balancing
// Run: node server.js

const express = require("express");
const path = require("path");
const os = require("os");
const app = express();

// Middleware to parse JSON
app.use(express.json());

// 🔹 Serve Frontend (simulated React build folder)
app.use(express.static(path.join(__dirname, "frontend")));

// 🔹 Sample API route for backend
app.get("/api/info", (req, res) => {
  const instanceInfo = {
    message: "Hello from AWS EC2 instance!",
    instance: os.hostname(), // identifies which EC2 instance served the request
    time: new Date().toISOString(),
  };
  res.json(instanceInfo);
});

// 🔹 Fallback route to serve frontend for all other paths
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// 🔹 Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT} | Instance: ${os.hostname()}`)
);
