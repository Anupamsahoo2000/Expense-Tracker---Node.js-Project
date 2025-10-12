const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db");
const User = require("./userModel");

const Expense = sequelize.define("Expense", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Make foreign key nullable if using SET NULL
Expense.belongsTo(User, {
  foreignKey: { name: "UserId", allowNull: true },
  onDelete: "SET NULL",
});
User.hasMany(Expense, { foreignKey: "UserId" });

module.exports = Expense;
