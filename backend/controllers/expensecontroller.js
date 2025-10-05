const Expense = require("../models/expenseModel");

const addExpense = async (req, res) => {
  try {
    const { amount, description, category, userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID required" });
    }

    const newExpense = await Expense.create({
      amount,
      description,
      category,
      UserId: userId,
    });

    res.status(201).json({ success: true, expense: newExpense });
  } catch (err) {
    console.error("Error adding expense:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getExpenses = async (req, res) => {
  try {
    const { userId } = req.query;

    const expenses = await Expense.findAll({ where: { UserId: userId } });
    res.status(200).json({ success: true, expenses });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const deleted = await Expense.destroy({ where: { id: expenseId } });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addExpense, getExpenses, deleteExpense };
