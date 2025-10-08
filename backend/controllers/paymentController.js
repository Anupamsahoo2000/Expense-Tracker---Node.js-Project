const { Cashfree, CFEnvironment } = require("cashfree-pg");
const Payment = require("../models/paymentModel");
require("dotenv").config();
const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);
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
    await Payment.create({
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
      "Error creating Cashfree order:",
      error.response?.data || error
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to create Cashfree order" });
  }
};
module.exports = { createOrder };

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
