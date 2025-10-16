const express = require("express");
const router = express.Router();
const {
  addExpense,
  getExpenses,
  deleteExpense,
  downloadExpenses,
} = require("../controllers/expensecontroller");
const authenticate = require("../middleware/auth");

router.post("/add-expense", authenticate, addExpense);
router.get("/get-expenses", authenticate, getExpenses);
router.get("/download-expenses", authenticate, downloadExpenses);
router.delete("/delete-expense/:id", authenticate, deleteExpense);

module.exports = router;
