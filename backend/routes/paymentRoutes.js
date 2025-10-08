const express = require("express");
const { createOrder } = require("../controllers/paymentController.js");

const router = express.Router();

router.post("/create-order", createOrder);

module.exports = router;
