const { Cashfree, CFEnvironment } = require("cashfree-pg");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
require("dotenv").config();
const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);
const createOrder = async (req, res) => {
  try {
    const { amount, userId, status } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const orderId = `order_${Date.now()}`;
    const request = {
      order_amount: amount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: String(userId),
        customer_phone: "9999999999",
        customer_email: "test@example.com",
      },
      order_meta: {
        return_url: `http://127.0.0.1:5500/frontend/expense.html?order_id=${orderId}`,
      },
      order_note: "Expense Tracker Premium",
      order_expiry_time: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(),
    };
    const response = await cashfree.PGCreateOrder(request);
    console.log("Cashfree order created:", response.data);
    // Save payment to DB
    const payment = await Payment.create({
      userId,
      orderId,
      amount,
      currency: "INR",
      status: status || "PENDING",
    });
    res.status(200).json({
      success: true,
      payment_session_id: response.data.payment_session_id,
      order_id: orderId,
      response: payment,
    });
  } catch (error) {
    console.error(
      "Error creating Cashfree order:",
      error.response?.data || error
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to create Cashfree order" });
  }
};
const orderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ where: { orderId } });
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, status: payment.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
const paymentWebhook = async (req, res) => {
  try {
    const event = req.body; // Cashfree webhook payload
    console.log("Webhook received:", event);

    const { order_id, order_status, customer_details } = event;

    // Find payment in DB
    const payment = await Payment.findOne({ where: { orderId: order_id } });
    if (!payment) {
      console.warn(`Payment with orderId ${order_id} not found`);
      return res.status(404).send("Payment not found");
    }

    // Update payment status
    if (order_status === "PAID") {
      payment.status = "SUCCESS";
      await payment.save();

      // Upgrade user to premium
      await User.update(
        { isPremium: true },
        { where: { id: customer_details.customer_id } }
      );

      console.log(
        `Payment successful. User ${customer_details.customer_id} upgraded to premium.`
      );
    } else if (order_status === "FAILED") {
      payment.status = "FAILED";
      await payment.save();
      console.log(`Payment failed for order ${order_id}`);
    } else {
      payment.status = order_status; // Keep other statuses like PENDING
      await payment.save();
      console.log(
        `Payment status updated to ${order_status} for order ${order_id}`
      );
    }

    res.status(200).send("Webhook processed successfully");
  } catch (err) {
    console.error("Error processing webhook:", err);
    res.status(500).send("Webhook processing failed");
  }
};
const handleWebhook = async (req, res) => {
  try {
    const { order_id, order_status } = req.body;

    // Find the payment in DB
    const payment = await Payment.findOne({ where: { orderId: order_id } });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // Update payment status
    await payment.update({ status: order_status });

    // If success, mark user as premium
    if (order_status === "SUCCESS") {
      await User.update({ isPremium: true }, { where: { id: payment.userId } });
    }

    res.status(200).json({ message: "Webhook processed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Webhook error" });
  }
};

module.exports = { createOrder, paymentWebhook, orderStatus, handleWebhook };

//for testing
// const { Cashfree, CFEnvironment } = require("cashfree-pg");
// require("dotenv").config();

// const cashfree = new Cashfree(
//   CFEnvironment.SANDBOX,
//   process.env.CASHFREE_APP_ID,
//   process.env.CASHFREE_SECRET_KEY
// );

// const createOrder = async (req, res) => {
//   try {
//     const { amount } = req.body;

//     if (!amount) {
//       return res.status(400).json({ message: "Amount is required" });
//     }

//     const orderId = `order_${Date.now()}`;

//     const request = {
//       order_amount: amount,
//       order_currency: "INR",
//       order_id: orderId,
//       customer_details: {
//         customer_id: "test_user", // dummy id
//         customer_phone: "9999999999",
//         customer_email: "test@example.com",
//       },
//       order_meta: {
//         return_url: `http://127.0.0.1:5500/frontend/expense.html?order_id={order_id}`,
//       },
//       order_note: "Expense Tracker Premium",
//       order_expiry_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
//     };

//     const response = await cashfree.PGCreateOrder(request);
//     console.log("Cashfree order created:", response.data);

//     res.status(200).json({
//       success: true,
//       payment_session_id: response.data.payment_session_id,
//       order_id: orderId,
//     });
//   } catch (error) {
//     console.error("Error creating Cashfree order:", error.response?.data || error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create Cashfree order",
//     });
//   }
// };

// module.exports = { createOrder };
