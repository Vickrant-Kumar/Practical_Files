const mongoose = require("mongoose");

// Define schema
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  course: {
    type: String,
    required: true
  }
});

// Export model
module.exports = mongoose.model("Student", studentSchema);
