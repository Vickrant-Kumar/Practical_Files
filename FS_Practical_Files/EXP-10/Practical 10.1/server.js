// server.js
// Full Stack Todo App - Single File Version
// Run: npm install express mongoose && node server.js

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

// 🔹 MongoDB Connection (local or cloud)
mongoose
  .connect("mongodb://127.0.0.1:27017/todoApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 🔹 Schema and Model
const todoSchema = new mongoose.Schema({
  text: String,
  completed: Boolean,
});
const Todo = mongoose.model("Todo", todoSchema);

// 🔹 REST API Routes

// Get all todos
app.get("/api/todos", async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});

// Add new todo
app.post("/api/todos", async (req, res) => {
  const todo = new Todo({ text: req.body.text, completed: false });
  await todo.save();
  res.json(todo);
});

// Update todo
app.put("/api/todos/:id", async (req, res) => {
  const updated = await Todo.findByIdAndUpdate(
    req.params.id,
    { completed: req.body.completed },
    { new: true }
  );
  res.json(updated);
});

// Delete todo
app.delete("/api/todos/:id", async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.json({ message: "Todo deleted" });
});

// Fallback to frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
