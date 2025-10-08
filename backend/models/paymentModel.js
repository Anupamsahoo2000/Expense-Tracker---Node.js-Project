const { DataTypes } = require("sequelize");
const sequelize = require("../utils/db");
const User = require("./userModel");

const Payment = sequelize.define("Payment", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: "INR",
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "PENDING",
  },
});

Payment.belongsTo(User, { foreignKey: "userId", allowNull: false });
User.hasMany(Payment, { foreignKey: "userId" });
module.exports = Payment;
