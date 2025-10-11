const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./models/User");

const app = express();
app.use(bodyParser.json());

// 1️⃣ Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/bankDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// 2️⃣ Create new user (for testing)
app.post("/create", async (req, res) => {
  try {
    const { name, balance } = req.body;
    const user = new User({ name, balance });
    await user.save();
    res.json({ message: "✅ User created", user });
  } catch (error) {
    res.status(500).json({ message: "❌ Error creating user", error });
  }
});

// 3️⃣ Money transfer route
app.post("/transfer", async (req, res) => {
  const { fromUser, toUser, amount } = req.body;

  // Step 1: Basic validation
  if (!fromUser || !toUser || !amount) {
    return res.status(400).json({ message: "⚠️ Missing required fields" });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: "⚠️ Transfer amount must be positive" });
  }

  try {
    // Step 2: Find both users
    const sender = await User.findOne({ name: fromUser });
    const receiver = await User.findOne({ name: toUser });

    // Step 3: Check if both exist
    if (!sender) return res.status(404).json({ message: "🚫 Sender not found" });
    if (!receiver) return res.status(404).json({ message: "🚫 Receiver not found" });

    // Step 4: Check balance
    if (sender.balance < amount) {
      return res.status(400).json({ message: "❌ Insufficient balance" });
    }

    // Step 5: Perform updates (sequentially, not transactional)
    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    res.json({
      message: `✅ Transfer of ₹${amount} from ${fromUser} to ${toUser} successful`,
      sender: { name: sender.name, newBalance: sender.balance },
      receiver: { name: receiver.name, newBalance: receiver.balance },
    });

  } catch (error) {
    res.status(500).json({ message: "❌ Transfer failed", error: error.message });
  }
});

// 4️⃣ Get all users (for testing)
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// 5️⃣ Start server
app.listen(3000, () => console.log("🚀 Server running on port 3000"));
