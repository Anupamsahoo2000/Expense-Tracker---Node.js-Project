require("dotenv").config();
const express = require("express");
const app = express();
const db = require("./utils/db");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
//const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
app.use(express.static(path.join(__dirname, "../frontend")));

const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const paymentRoutes = require("./routes/paymentRoutes.js");
const premiumRoutes = require("./routes/premiumRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

// const accessLogStream = fs.createWriteStream(
//   path.join(__dirname, "access.log"),
//   { flags: "a" }
// );

// Middleware
app.use(cors());
//app.use(helmet());
app.use(compression());
//app.use(morgan("combined"));

app.use(express.json());

// Routes
app.use("/user", userRoutes);
app.use("/expense", expenseRoutes);
app.use("/payment", paymentRoutes);
app.use("/premium", premiumRoutes);
app.use("/password", passwordRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);
