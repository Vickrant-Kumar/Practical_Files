// Import express
const express = require("express");
const app = express();

// Use JSON parser middleware (for reading JSON bodies)
app.use(express.json());

//////////////////////////////////////////////////////////////
// 1️⃣ Logging Middleware - Applied Globally
//////////////////////////////////////////////////////////////
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next(); // move to next middleware or route
});

//////////////////////////////////////////////////////////////
// 2️⃣ Authentication Middleware - For Protected Routes
//////////////////////////////////////////////////////////////
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]; // Get the header
  if (!authHeader) {
    return res.status(401).json({ message: "❌ Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  if (token === "mysecrettoken") {
    next(); // Token is valid → move to the route
  } else {
    res.status(403).json({ message: "🚫 Invalid or missing Bearer token" });
  }
}

//////////////////////////////////////////////////////////////
// 3️⃣ Public Route - No Token Required
//////////////////////////////////////////////////////////////
app.get("/public", (req, res) => {
  res.json({ message: "🌐 Public route accessed successfully!" });
});

//////////////////////////////////////////////////////////////
// 4️⃣ Protected Route - Token Required
//////////////////////////////////////////////////////////////
app.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "🔒 Access granted to protected route!" });
});

//////////////////////////////////////////////////////////////
// 5️⃣ Start Server
//////////////////////////////////////////////////////////////
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
