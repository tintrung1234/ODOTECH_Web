const express = require("express");
const cors = require("cors");

const salesRoutes = require("./routes/salesRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Routes

app.use("/api/sales", salesRoutes);

app.use((req, res) => {
	res.status(404).json({ message: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
