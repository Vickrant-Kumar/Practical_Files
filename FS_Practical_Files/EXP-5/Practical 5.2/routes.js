const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");

// Routes connected to controller functions
router.post("/", studentController.createStudent);     // Create
router.get("/", studentController.getStudents);        // Read
router.put("/:id", studentController.updateStudent);   // Update
router.delete("/:id", studentController.deleteStudent); // Delete

module.exports = router;
