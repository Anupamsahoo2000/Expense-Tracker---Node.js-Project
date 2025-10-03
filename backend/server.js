const express = require("express");
const app = express();
const db = require("./utils/db");
const userRoutes = require("./routes/user");
const cors = require("cors");
app.use(cors());

app.use(express.json());

// Routes
app.use("/user", userRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
