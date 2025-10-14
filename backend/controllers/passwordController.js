// controllers/passwordController.js
const SibApiV3Sdk = require("sib-api-v3-sdk");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const ForgotPasswordRequest = require("../models/forgetPassword");
require("dotenv").config();

// ------------------ Create Forgot Password Request & Send Email ------------------
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Create forgot password request
    const forgotRequest = await ForgotPasswordRequest.create({
      userId: user.id,
    });

    const resetLink = `http://localhost:5000/reset-password.html?id=${forgotRequest.id}`;

    // Send email via Brevo API
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = {
      email: process.env.BREVO_SENDER_EMAIL,
      name: "Expense Tracker",
    };
    sendSmtpEmail.to = [{ email: user.email, name: user.name || "User" }];
    sendSmtpEmail.subject = "Password Reset Request";
    sendSmtpEmail.htmlContent = `
      <h3>Password Reset</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}" style="color: blue;">Reset Password</a>
      <p>If you didn’t request this, you can ignore this email.</p>
    `;

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.status(200).json({ message: "Password reset link sent!" });
  } catch (error) {
    console.error(
      "Forgot Password Error:",
      error.response?.body || error.message
    );
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

// ------------------ Verify Reset Link ------------------
const verifyResetLink = async (req, res) => {
  try {
    const { id } = req.params; // UUID from URL

    const request = await ForgotPasswordRequest.findOne({ where: { id } });
    if (!request || !request.isActive) {
      return res.status(400).json({ message: "Invalid or expired link" });
    }

    res.status(200).json({ message: "Link valid", userId: request.userId });
  } catch (error) {
    console.error("Verify Reset Link Error:", error);
    res
      .status(500)
      .json({ message: "Error verifying link", error: error.message });
  }
};

// ------------------ Reset Password ------------------
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params; // UUID from URL
    const { password } = req.body;

    const request = await ForgotPasswordRequest.findOne({ where: { id } });
    if (!request || !request.isActive) {
      return res.status(400).json({ message: "Invalid or expired link" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await User.update(
      { password: hashedPassword },
      { where: { id: request.userId } }
    );

    // Mark request as inactive
    request.isActive = false;
    await request.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res
      .status(500)
      .json({ message: "Error resetting password", error: error.message });
  }
};
module.exports = {
  forgotPassword,
  verifyResetLink,
  resetPassword,
};
