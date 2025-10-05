const express = require("express");
const app = express();
const db = require("./utils/db");
const cors = require("cors");

app.use(cors());

app.use(express.json());

const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

// Routes
app.use("/user", userRoutes);
app.use("/expense", expenseRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
