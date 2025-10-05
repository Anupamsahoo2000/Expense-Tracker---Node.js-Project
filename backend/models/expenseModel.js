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

User.hasMany(Expense);
Expense.belongsTo(User);

module.exports = Expense;
