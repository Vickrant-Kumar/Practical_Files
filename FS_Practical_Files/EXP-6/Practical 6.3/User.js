const mongoose = require("mongoose");

// Define User schema
const userSchema = new mongoose.Schema({
  name: String,
  balance: Number
});

module.exports = mongoose.model("User", userSchema);
