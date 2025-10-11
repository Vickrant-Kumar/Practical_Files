// Import required modules
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Secret key for JWT signing (in real apps, store in .env)
const SECRET_KEY = "myjwtsecret";

// Hardcoded user credentials for demo
const USER = {
  username: "vickrant",
  password: "12345"
};

// Simulated account balance (in real case, this comes from DB)
let accountBalance = 1000;

//////////////////////////////////////////////////////////////
// 1️⃣ LOGIN ROUTE - Generates JWT Token
//////////////////////////////////////////////////////////////
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === USER.username && password === USER.password) {
    // Generate token (expires in 1 hour)
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({
      message: "✅ Login successful!",
      token: token
    });
  } else {
    res.status(401).json({ message: "❌ Invalid username or password" });
  }
});

//////////////////////////////////////////////////////////////
// 2️⃣ MIDDLEWARE - Verify JWT Token
//////////////////////////////////////////////////////////////
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ message: "❌ Missing Authorization header" });

  const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "🚫 Invalid or expired token" });
    req.user = user; // store user info for next routes
    next();
  });
}

//////////////////////////////////////////////////////////////
// 3️⃣ PROTECTED ROUTES
//////////////////////////////////////////////////////////////

// View account balance
app.get("/balance", verifyToken, (req, res) => {
  res.json({ message: "🏦 Your account balance", balance: accountBalance });
});

// Deposit money
app.post("/deposit", verifyToken, (req, res) => {
  const { amount } = req.body;

  if (amount <= 0)
    return res.status(400).json({ message: "⚠️ Deposit amount must be positive" });

  accountBalance += amount;
  res.json({
    message: `💰 Deposited ₹${amount} successfully`,
    newBalance: accountBalance
  });
});

// Withdraw money
app.post("/withdraw", verifyToken, (req, res) => {
  const { amount } = req.body;

  if (amount <= 0)
    return res.status(400).json({ message: "⚠️ Withdrawal amount must be positive" });

  if (amount > accountBalance)
    return res.status(400).json({ message: "🚫 Insufficient balance" });

  accountBalance -= amount;
  res.json({
    message: `🏧 Withdrawn ₹${amount} successfully`,
    newBalance: accountBalance
  });
});

//////////////////////////////////////////////////////////////
// 4️⃣ START SERVER
//////////////////////////////////////////////////////////////
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running securely on port ${PORT}`);
});
