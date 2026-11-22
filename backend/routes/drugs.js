
const express = require("express");
const drugs = require("../data/egyptian-drugs.json");

const router = express.Router();

// GET /api/drugs/all
router.get("/all", (req, res) => {
  try {
    res.json(drugs);
  } catch (error) {
    console.error("Get drugs error:", error);
    res.status(500).json({
      message: "Failed to load drugs",
    });
  }
});

module.exports = router;
