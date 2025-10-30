// ===== IMPORT REQUIRED PACKAGES =====
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

// ===== APP SETUP =====
const app = express();
app.use(bodyParser.json());
const SECRET_KEY = "mysecretkey123";

// ===== FRONTEND (HTML PAGE) =====
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Role-Based Access Control</title>
      <style>
        body { font-family: Arial; background: #f5f5f5; padding: 40px; }
        .box { max-width: 400px; margin: auto; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        input, select { width: 100%; padding: 10px; margin: 8px 0; }
        button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .msg { margin-top: 10px; font-size: 0.9em; }
        .error { color: red; }
        .success { color: green; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>Role-Based Login</h2>
        <input type="text" id="username" placeholder="Enter Username" />
        <input type="password" id="password" placeholder="Enter Password" />
        <select id="role">
          <option value="User">User</option>
          <option value="Moderator">Moderator</option>
          <option value="Admin">Admin</option>
        </select>
        <button onclick="login()">Login</button>
        <button onclick="access('user')">Access User Route</button>
        <button onclick="access('moderator')">Access Moderator Route</button>
        <button onclick="access('admin')">Access Admin Route</button>
        <p id="msg" class="msg"></p>
      </div>

      <script>
        let token = "";

        async function login() {
          const username = document.getElementById("username").value;
          const password = document.getElementById("password").value;
          const role = document.getElementById("role").value;
          const msg = document.getElementById("msg");

          const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role })
          });

          const data = await res.json();
          if (res.ok) {
            token = data.token;
            msg.textContent = "✅ Login successful as " + role + ". Token saved!";
            msg.className = "msg success";
          } else {
            msg.textContent = "❌ " + data.message;
            msg.className = "msg error";
          }
        }

        async function access(route) {
          const msg = document.getElementById("msg");
          const res = await fetch("/" + route, {
            headers: { Authorization: "Bearer " + token }
          });
          const data = await res.json();

          if (res.ok) {
            msg.textContent = "✅ " + data.message + " | Role: " + data.role;
            msg.className = "msg success";
          } else {
            msg.textContent = "❌ " + data.message;
            msg.className = "msg error";
          }
        }
      </script>
    </body>
    </html>
  `);
});

// ===== DEMO USERS (Hardcoded for Testing) =====
const users = [
  { username: "admin", password: "admin123", role: "Admin" },
  { username: "mod", password: "mod123", role: "Moderator" },
  { username: "user", password: "user123", role: "User" }
];

// ===== LOGIN ROUTE =====
app.post("/login", (req, res) => {
  const { username, password, role } = req.body;

  const foundUser = users.find(
    (u) => u.username === username && u.password === password && u.role === role
  );

  if (!foundUser) {
    return res.status(401).json({ message: "Invalid username, password, or role" });
  }

  const token = jwt.sign(
    { username: foundUser.username, role: foundUser.role },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.json({ message: "Login successful", token });
});

// ===== TOKEN VERIFICATION MIDDLEWARE =====
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(403).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ===== ROLE CHECK MIDDLEWARE =====
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: " + req.user.role + " not authorized"
      });
    }
    next();
  };
}

// ===== PROTECTED ROUTES =====
app.get("/user", verifyToken, authorizeRoles("User", "Moderator", "Admin"), (req, res) => {
  res.json({ message: "Welcome to the User Profile!", role: req.user.role });
});

app.get("/moderator", verifyToken, authorizeRoles("Moderator", "Admin"), (req, res) => {
  res.json({ message: "Welcome to the Moderator Management Page!", role: req.user.role });
});

app.get("/admin", verifyToken, authorizeRoles("Admin"), (req, res) => {
  res.json({ message: "Welcome to the Admin Dashboard!", role: req.user.role });
});

// ===== START SERVER =====
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
