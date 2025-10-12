const User = require("../models/userModel");
const Expense = require("../models/expenseModel");
const { Sequelize } = require("sequelize");

const premium = async (req, res) => {
  try {
    // Query all users with their total expenses
    const leaderboard = await Expense.findAll({
      attributes: [
        "userId",
        [Sequelize.fn("SUM", Sequelize.col("amount")), "totalExpenses"],
      ],
      include: [
        {
          model: User,
          attributes: ["name"],
        },
      ],
      group: ["userId", "User.id"],
      order: [[Sequelize.literal("totalExpenses"), "DESC"]],
      raw: true,
      nest: true,
    });

    res.status(200).json({ success: true, leaderboard });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch leaderboard" });
  }
};

module.exports = { premium };
