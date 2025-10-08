require("dotenv").config();
const express = require("express");
const app = express();
const db = require("./utils/db");
const cors = require("cors");
const path = require("path");

app.use(cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const paymentRoutes = require("./routes/paymentRoutes.js");

// Routes
app.use("/user", userRoutes);
app.use("/expense", expenseRoutes);
app.use("/payment", paymentRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
