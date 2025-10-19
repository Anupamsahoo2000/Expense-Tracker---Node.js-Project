const sequelize = require("../utils/db");
const Expense = require("../models/expenseModel");
const User = require("../models/userModel");
const { getCategoryFromAI } = require("../utils/ai");
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
    const user = await User.findByPk(req.user.id);
    if (!user.isPremium) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Premium users only.",
      });
    }

    const expenses = await Expense.findAll({ where: { UserId: req.user.id } });
    if (!expenses || expenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No expenses found.",
      });
    }

    const header = "ID,Amount,Description,Category,Created At\n";
    const csvData = expenses
      .map(
        (exp) =>
          `${exp.id},${exp.amount},${exp.description},${exp.category},${exp.createdAt}`
      )
      .join("\n");

    const fileContent = header + csvData;
    const filename = `expenses-${req.user.id}-${Date.now()}.csv`;

    const s3Response = await uploadToS3(fileContent, filename);

    console.log("✅ S3 File Uploaded:", s3Response.Location);

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

// 🧾 Add Expense (Normal)
const addExpense = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { amount, description, category } = req.body;
    const userId = req.user.id;

    // Basic validation
    if (!amount || !description || !category) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Amount, description, and category are required.",
      });
    }

    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const safeAmount = parseFloat(amount);
    if (isNaN(safeAmount) || safeAmount <= 0) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    // Create expense manually
    const newExpense = await Expense.create(
      {
        amount: safeAmount,
        description,
        category,
        UserId: userId,
      },
      { transaction: t }
    );

    // Update user total
    user.totalExpenses += safeAmount;
    await user.save({ transaction: t });

    await t.commit();
    res.status(201).json({ success: true, expense: newExpense });
  } catch (err) {
    console.error("🔥 Error adding expense:", err.stack || err);
    await t.rollback();
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🤖 Add Expense Using Gemini AI (Premium Users Only)
const addExpenseUsingAI = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { amount, description } = req.body;
    const userId = req.user.id;

    if (!description) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Description is required" });
    }

    const user = await User.findByPk(userId, { transaction: t });
    if (!user || !user.isPremium) {
      await t.rollback();
      return res
        .status(403)
        .json({ success: false, message: "Premium access required" });
    }

    const safeAmount = parseFloat(amount);

    // Use AI to get category
    const category = (await getCategoryFromAI(description)) || "Other";

    const newExpense = await Expense.create(
      {
        amount: safeAmount,
        description,
        category,
        UserId: userId,
      },
      { transaction: t }
    );

    user.totalExpenses += safeAmount;
    await user.save({ transaction: t });
    await t.commit();

    res.status(201).json({ success: true, expense: newExpense });
  } catch (err) {
    console.error("Error adding expense with AI:", err.stack || err);
    await t.rollback();
    res
      .status(500)
      .json({ success: false, message: "Error adding expense with AI" });
  }
};

// 📜 Get Expenses
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

// ❌ Delete Expense
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

    const user = await User.findByPk(userId, { transaction: t });
    user.totalExpenses -= Number(expense.amount);
    if (user.totalExpenses < 0) user.totalExpenses = 0;
    await user.save({ transaction: t });

    await Expense.destroy({
      where: { id: expenseId, UserId: userId },
      transaction: t,
    });

    await t.commit();
    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting expense:", err);
    await t.rollback();
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  addExpense,
  getExpenses,
  deleteExpense,
  downloadExpenses,
  addExpenseUsingAI, // 👈 Added new export
};
