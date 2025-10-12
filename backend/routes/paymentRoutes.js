const express = require("express");
const router = express.Router();
const {
  createOrder,
  paymentWebhook,
  checkPaymentStatus,
  orderStatus,
} = require("../controllers/paymentController");

router.post("/create-order", createOrder);
router.post("/webhook", paymentWebhook);
router.get("/status/:orderId", checkPaymentStatus);
router.get("/order-status/:orderId", orderStatus);

module.exports = router;
