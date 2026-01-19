require("dotenv").config();

process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("🔥 Unhandled Rejection:", reason);
});

const app = require("./app");
const { connectPostgres, disconnectPostgres } = require("./config/postgres");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectPostgres();
    console.log("Connected to PostgreSQL");

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown – KHÔNG đóng server khi lỗi runtime
    const shutdown = async () => {
      console.log("Shutting down server...");
      server.close(async () => {
        try {
          await disconnectPostgres();
        } catch (err) {
          console.error("Error disconnecting PostgreSQL:", err.message);
        } finally {
          process.exit(0);
        }
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("PostgreSQL connection error:", err.message);
    // Không exit cứng để tránh container restart loop
    setTimeout(() => process.exit(1), 1000);
  }
}

start();
