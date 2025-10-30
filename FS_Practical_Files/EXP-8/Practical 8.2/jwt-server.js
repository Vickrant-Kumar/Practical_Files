// Import dependencies
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

// Create app
const app = express();
app.use(bodyParser.json());

// Secret key (keep safe in real apps)
const SECRET_KEY = "mysecretkey123";

// Hardcoded demo user
const user = {
  username: "vickrant",
  password: "12345"
};

// 🟢 LOGIN ROUTE - issues JWT token
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === user.username && password === user.password) {
    // Generate token valid for 1 hour
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({
      message: "Login successful! Use this token for protected routes.",
      token
    });
  } else {
    res.status(401).json({ message: "Invalid username or password." });
  }
});

// 🔒 Middleware to verify JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // store user info in request
    next(); // allow request to continue
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

// 🧱 PROTECTED ROUTE
app.get("/protected", verifyToken, (req, res) => {
  res.json({
    message: "✅ Access granted to protected route!",
    user: req.user
  });
});

// 🏁 START SERVER
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
