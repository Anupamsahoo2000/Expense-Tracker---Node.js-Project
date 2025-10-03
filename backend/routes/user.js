const express = require("express");
const router = express.Router();
const { signup } = require("../controllers/usercontroller");

// POST /user/signup
router.post("/signup", signup);

module.exports = router;
