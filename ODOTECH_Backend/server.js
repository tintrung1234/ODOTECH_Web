require("dotenv").config();

const app = require("./app");
const { connectPostgres, disconnectPostgres } = require("./config/postgres");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectPostgres();
    console.log("✅ Connected to PostgreSQL");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    const shutdown = async () => {
      server.close(async () => {
        try {
          await disconnectPostgres();
        } finally {
          process.exit(0);
        }
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("PostgreSQL connection error:", err);
    process.exit(1);
  }
}

start();
