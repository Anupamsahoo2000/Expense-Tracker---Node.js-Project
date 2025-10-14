const sequelize = require("../utils/db"); // make sure this exports your sequelize instance
const Expense = require("../models/expenseModel");
const User = require("../models/userModel");
const { getCategoryFromAI } = require("../utils/ai");

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

module.exports = { addExpense, getExpenses, deleteExpense };
