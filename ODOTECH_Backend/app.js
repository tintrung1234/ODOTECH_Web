const express = require("express");
const cors = require("cors");

const salesRoutes = require("./routes/salesRoutes");
const projectsRoutes = require("./routes/projectsRoutes");
const accountsRoutes = require("./routes/accountsRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Routes

app.use("/api/auth", authRoutes);

app.use("/api/sales", salesRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/leave-requests", leaveRoutes);

app.use((req, res) => {
	res.status(404).json({ message: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	console.error(err);
	const status = Number(err?.status || err?.statusCode) || 500;
	const message = err?.message || "Internal server error";
	res.status(status).json({ message });
});

module.exports = app;
