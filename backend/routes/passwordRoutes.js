const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  verifyResetLink,
  resetPassword,
} = require("../controllers/passwordController");

router.post("/forgotpassword", forgotPassword);
router.get("/resetpassword/:id", verifyResetLink);
router.post("/resetpassword/:id", resetPassword);

module.exports = router;
