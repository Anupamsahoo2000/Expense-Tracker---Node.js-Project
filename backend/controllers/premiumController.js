const User = require("../models/userModel");

const premium = async (req, res) => {
  try {
    // Fetch all users ordered by their totalExpenses (pre-calculated)
    const leaderboard = await User.findAll({
      attributes: ["id", "name", "totalExpenses"],
      order: [["totalExpenses", "DESC"]],
    });

    res.status(200).json({ success: true, leaderboard });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch leaderboard" });
  }
};

module.exports = { premium };
