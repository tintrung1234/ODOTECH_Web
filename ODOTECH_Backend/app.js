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

const app = express();

// CORS configuration to allow credentials (cookies)
const rawCorsOrigins = String(process.env.CORS_ORIGIN || "").trim();
const allowList = rawCorsOrigins
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean);

const isLocalhostOrigin = (origin) => {
	if (!origin) return false;
	return (
		/^https?:\/\/localhost:\d+$/i.test(origin) ||
		/^https?:\/\/127\.0\.0\.1:\d+$/i.test(origin)
	);
};

app.use(
	cors({
		origin: (origin, callback) => {
			// Allow non-browser requests (no Origin header)
			if (!origin) return callback(null, true);

			// Explicit allow-list via env (comma-separated)
			if (allowList.length > 0) {
				return callback(null, allowList.includes(origin));
			}

			// Dev default: allow any localhost/127.0.0.1 port
			return callback(null, isLocalhostOrigin(origin));
		},
		credentials: true,
	})
);

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
