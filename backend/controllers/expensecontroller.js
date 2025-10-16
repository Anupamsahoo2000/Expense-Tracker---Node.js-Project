const sequelize = require("../utils/db"); // make sure this exports your sequelize instance
const Expense = require("../models/expenseModel");
const User = require("../models/userModel");
const { getCategoryFromAI } = require("../utils/ai");
const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// 🧠 Upload file to AWS S3
const uploadToS3 = (fileContent, filename) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    Body: fileContent,
    ACL: "public-read",
    ContentType: "text/csv",
  };

  return s3.upload(params).promise();
};

// 📦 Download Expenses — Premium Only
const downloadExpenses = async (req, res) => {
  try {
    // 1️⃣ Check if user is premium
    const user = await User.findByPk(req.user.id);
    if (!user.isPremium) {
      return res
        .status(401)
        .json({ message: "Unauthorized. Premium users only." });
    }

    // 2️⃣ Fetch all expenses of this user
    const expenses = await Expense.findAll({ where: { userId: req.user.id } });
    if (!expenses || expenses.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No expenses found." });
    }

    // 3️⃣ Prepare CSV content
    const header = "ID,Amount,Description,Category,Created At\n";
    const csvData = expenses
      .map(
        (exp) =>
          `${exp.id},${exp.amount},${exp.description},${exp.category},${exp.createdAt}`
      )
      .join("\n");

    const fileContent = header + csvData;
    const filename = `expenses-${req.user.id}-${Date.now()}.csv`;

    // 4️⃣ Upload to S3
    const s3Response = await uploadToS3(fileContent, filename);

    console.log("✅ S3 File Uploaded:", s3Response.Location);

    // 5️⃣ Return file URL to frontend
    res.status(200).json({
      success: true,
      message: "Expense file uploaded successfully!",
      fileURL: s3Response.Location,
    });
  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🧾 Add Expense (with AI category + transaction)
const addExpense = async (req, res) => {
  const t = await sequelize.transaction(); // start transaction
  try {
    const { amount, description, category } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (!amount || !description) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Amount and description required" });
    }

    // 🤖 Let Gemini AI decide the category if missing
    let finalCategory = category;
    if (!finalCategory || finalCategory.trim() === "") {
      finalCategory = await getCategoryFromAI(description);
    }

    // 1️⃣ Create expense
    const newExpense = await Expense.create(
      {
        amount,
        description,
        category: finalCategory,
        UserId: userId,
      },
      { transaction: t }
    );

    // 2️⃣ Update user's totalExpenses
    user.totalExpenses += parseFloat(amount);
    await user.save({ transaction: t });

    // ✅ Commit
    await t.commit();

    res.status(201).json({ success: true, expense: newExpense });
  } catch (err) {
    console.error("Error adding expense:", err);
    await t.rollback();
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 📜 Get Expenses (no transaction for read-only)
const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenses = await Expense.findAll({
      where: { UserId: userId },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ success: true, expenses });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ❌ Delete Expense (with transaction)
const deleteExpense = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    const expense = await Expense.findOne({
      where: { id: expenseId, UserId: userId },
      transaction: t,
    });

    if (!expense) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Expense not found or not owned by user",
      });
    }

    // Deduct its amount from user's total
    const user = await User.findByPk(userId, { transaction: t });
    user.totalExpenses -= Number(expense.amount);
    if (user.totalExpenses < 0) user.totalExpenses = 0;
    await user.save({ transaction: t });

    // Delete expense
    await Expense.destroy({
      where: { id: expenseId, UserId: userId },
      transaction: t,
    });

    await t.commit();
    res
      .status(200)
      .json({ success: true, message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    await t.rollback();
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addExpense, getExpenses, deleteExpense, downloadExpenses };
