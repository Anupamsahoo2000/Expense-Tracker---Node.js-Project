const { Cashfree, CFEnvironment } = require("cashfree-pg");
const Payment = require("../models/paymentModel");
const User = require("../models/userModel");
require("dotenv").config();

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX, // change to PRODUCTION later
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

const base_url = "http://localhost:5000";

// ✅ 1️⃣ Create a new payment order
const createOrder = async (req, res) => {
  try {
    const { amount, userId } = req.body;
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
        // Redirect user after payment completion
        return_url: `${base_url}/expense.html?order_id=${orderId}`,
      },
      order_note: "Expense Tracker Premium",
      order_expiry_time: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    const response = await cashfree.PGCreateOrder(request);
    console.log("✅ Cashfree order created:", response.data);

    // Save payment info in DB
    const payment = await Payment.create({
      userId,
      orderId,
      amount,
      currency: "INR",
      status: "PENDING",
    });

    res.status(200).json({
      success: true,
      payment_session_id: response.data.payment_session_id,
      order_id: orderId,
    });
  } catch (error) {
    console.error(
      "❌ Error creating Cashfree order:",
      error.response?.data || error
    );
    res.status(500).json({
      success: false,
      message: "Failed to create Cashfree order",
    });
  }
};

// ✅ 2️⃣ Webhook to auto-update payment status (called by Cashfree server)
const paymentWebhook = async (req, res) => {
  try {
    const event = req.body; // Cashfree webhook payload
    console.log("📦 Webhook received:", event);

    const { order_id, order_status, customer_details } = event;

    const payment = await Payment.findOne({ where: { orderId: order_id } });
    if (!payment) {
      console.warn(`⚠️ Payment with orderId ${order_id} not found`);
      return res.status(404).send("Payment not found");
    }

    // Update order status based on webhook
    if (order_status === "PAID" || order_status === "SUCCESS") {
      payment.status = "SUCCESS";
      await payment.save();

      // Make user premium
      await User.update(
        { isPremium: true },
        { where: { id: customer_details?.customer_id || payment.userId } }
      );

      console.log(
        `✅ Payment successful. User ${
          customer_details?.customer_id || payment.userId
        } upgraded to premium.`
      );
    } else if (order_status === "FAILED") {
      payment.status = "FAILED";
      await payment.save();
      console.log(`❌ Payment failed for order ${order_id}`);
    } else {
      payment.status = order_status || "PENDING";
      await payment.save();
      console.log(`ℹ️ Payment status updated to ${order_status}`);
    }

    res.status(200).send("Webhook processed successfully");
  } catch (err) {
    console.error("❌ Error processing webhook:", err);
    res.status(500).send("Webhook processing failed");
  }
};

// ✅ 3️⃣ Route to check payment status (Cashfree Get Order API)
const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Fetch order details from Cashfree
    const response = await cashfree.PGFetchOrder(orderId);
    const orderData = response.data;
    console.log("🔍 Fetched order data:", orderData);

    const transactions = orderData.transactions || [];
    let orderStatus;

    if (transactions.filter((t) => t.payment_status === "SUCCESS").length > 0) {
      orderStatus = "SUCCESS";
    } else if (
      transactions.filter((t) => t.payment_status === "PENDING").length > 0
    ) {
      orderStatus = "PENDING";
    } else {
      orderStatus = "FAILED";
    }
    console.log("🧾 Final order status before DB update:", orderStatus);

    if (process.env.NODE_ENV === "development") {
      orderStatus = "SUCCESS";
    }

    // Update DB accordingly
    const payment = await Payment.findOne({ where: { orderId } });
    if (payment) {
      await payment.update({ status: orderStatus });

      if (orderStatus === "SUCCESS") {
        await User.update(
          { isPremium: true },
          { where: { id: payment.userId } }
        );
      }
    }

    res.status(200).json({
      success: true,
      orderStatus,
      cashfreeResponse: orderData,
    });
  } catch (error) {
    console.error("❌ Error checking payment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check payment status",
      error: error.response?.data || error.message,
    });
  }
};

// ✅ 4️⃣ Simple API for showing order status from DB
const orderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ where: { orderId } });
    if (!payment)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    res.json({ success: true, status: payment.status });
  } catch (err) {
    console.error("❌ Error fetching order:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  createOrder,
  paymentWebhook,
  checkPaymentStatus,
  orderStatus,
};

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
