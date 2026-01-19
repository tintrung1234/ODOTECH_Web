const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const salesRoutes = require("./routes/salesRoutes");
const projectsRoutes = require("./routes/projectsRoutes");
const accountsRoutes = require("./routes/accountsRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const authRoutes = require("./routes/authRoutes");
const renewalsRoutes = require("./routes/renewalsRoutes");
const expenseRenewalsRoutes = require("./routes/expenseRenewalsRoutes");
const customersRoutes = require("./routes/customersRoutes");
const websitesRoutes = require("./routes/websitesRoutes");
const virusLogsRoutes = require("./routes/virusLogsRoutes");
const devAssignmentsRoutes = require("./routes/devAssignmentsRoutes");
const customerPortalRoutes = require("./routes/customerPortalRoutes");
const serversRoutes = require("./routes/serversRoutes");
const coursesRoutes = require("./routes/coursesRoutes");
const testsRoutes = require("./routes/testsRoutes");

const app = express();

app.get("/", (req, res) => {
	res.status(200).send("API is running");
});


// ================= CORS CONFIG =================
const rawCorsOrigins = String(process.env.CORS_ORIGIN || "").trim();

const allowList = rawCorsOrigins
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean);

// fallback nếu env chưa set
if (allowList.length === 0) {
	allowList.push(
		"http://103.57.220.131:8080",
		"http://localhost:8080"
	);
}

const isLocalhostOrigin = (origin) => {
	if (!origin) return true; // allow curl / server request
	return (
		/^https?:\/\/localhost:\d+$/i.test(origin) ||
		/^https?:\/\/127\.0\.0\.1:\d+$/i.test(origin)
	);
};

app.use(cors({
	origin: true,
	credentials: true
}));
// =================================================

app.use(cookieParser());
app.use(express.json());

// Routes

app.use("/api/auth", authRoutes);

app.use("/api/sales", salesRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/leave-requests", leaveRoutes);
app.use("/api/renewals", renewalsRoutes);
app.use("/api/expense-renewals", expenseRenewalsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/websites", websitesRoutes);
app.use("/api/virus-logs", virusLogsRoutes);
app.use("/api/dev-assignments", devAssignmentsRoutes);
app.use("/api/customer-portal", customerPortalRoutes);
app.use("/api/notifications", require("./routes/notificationsRoutes"));
app.use("/api/tickets", require("./routes/ticketsRoutes"));
app.use("/api/ticket-categories", require("./routes/ticketCategoriesRoutes"));
app.use("/api/servers", serversRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/tests", testsRoutes);

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
