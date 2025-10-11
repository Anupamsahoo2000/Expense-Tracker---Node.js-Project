const express = require("express");
const {
  createOrder,
  paymentWebhook,
  orderStatus,
  handleWebhook,
} = require("../controllers/paymentController.js");

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/webhook", paymentWebhook);
router.post("/webhook", handleWebhook);

router.get("/order-status/:orderId", orderStatus);

module.exports = router;
