import app from "./app.js";
import { testDatabaseConnection } from "./config/db.js";
import { env } from "./config/env.js";

async function startServer() {
  try {
    const dbStatus = await testDatabaseConnection();
    console.log("Database connected:", dbStatus.connected_at);

    app.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server because the database connection failed.");
    console.error(error);
    process.exit(1);
  }
}

startServer();
