const Expense = require("../models/expenseModel");
const User = require("../models/userModel");
const { getCategoryFromAI } = require("../utils/ai");

const addExpense = async (req, res) => {
  try {
    const { amount, description, category } = req.body;
    const userId = req.user.id; // set by auth middleware

    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (!amount || !description) {
      return res
        .status(400)
        .json({ success: false, message: " amount and description required" });
    }
    //Ai category
    let finalCategory = category;
    if (!finalCategory || finalCategory.trim() === "") {
      finalCategory = await getCategoryFromAI(description);
    }

    // 1️⃣ Create the expense
    const newExpense = await Expense.create({
      amount,
      description,
      category: finalCategory,
      UserId: userId,
    });

    // 2️⃣ Update the user's totalExpenses immediately
    //const user = await User.findByPk(userId);
    user.totalExpenses += parseFloat(amount);
    await user.save();

    res.status(201).json({ success: true, expense: newExpense });
  } catch (err) {
    console.error("Error adding expense:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

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

const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    // 1️⃣ Find expense (ensure it belongs to user)
    const expense = await Expense.findOne({
      where: { id: expenseId, UserId: userId },
    });
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found or not owned by user",
      });
    }

    // 2️⃣ Deduct its amount from user's totalExpenses
    const user = await User.findByPk(userId);
    user.totalExpenses -= Number(expense.amount);
    if (user.totalExpenses < 0) user.totalExpenses = 0; // safety check
    await user.save();

    // 3️⃣ Delete the expense
    await Expense.destroy({ where: { id: expenseId, UserId: userId } });

    res
      .status(200)
      .json({ success: true, message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addExpense, getExpenses, deleteExpense };
