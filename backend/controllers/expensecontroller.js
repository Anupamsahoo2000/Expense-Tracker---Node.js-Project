const Expense = require("../models/expenseModel");

const addExpense = async (req, res) => {
  try {
    const { amount, description, category } = req.body;
    const userId = req.user.id; // set by auth middleware

    if (!amount || !description || !category) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
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

    // ensure the expense belongs to the user before deleting
    const expense = await Expense.findOne({
      where: { id: expenseId, UserId: userId },
    });
    if (!expense) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Expense not found or not owned by user",
        });
    }

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
