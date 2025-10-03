const express = require("express");
const db = require("./utils/db");
const userRoutes = require("./routes/user");

const app = express();
app.use(express.json());

// Routes
app.use("/user", userRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
