// models/ForgotPasswordRequest.js
const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../utils/db"); 
const User = require("../models/userModel"); 


const ForgotPasswordRequest = sequelize.define("ForgotPasswordRequest", {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER, // match your User model primary key type
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

ForgotPasswordRequest.belongsTo(User, { foreignKey: "userId" }); // Many to One
User.hasMany(ForgotPasswordRequest, { foreignKey: "userId" });

module.exports = ForgotPasswordRequest;
