import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import cron from "node-cron";
import { connectDB } from "./db/connection";
import paymentRoutes from "./routes/payments";
import settingsRoutes from "./routes/settings";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

app.use("/api/payments", paymentRoutes);
app.use("/api/settings", settingsRoutes);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log(
      "MongoDB connection failed, falling back to local mode:",
      error
    );
  }

  const enableReminders = process.env.ENABLE_EMAIL_REMINDERS === "true";
  const cronSchedule = process.env.REMINDER_CRON_SCHEDULE || "0 9 * * *";

  if (enableReminders) {
    cron.schedule(cronSchedule, async () => {
      console.log(
        "🔔 Running daily reminder check at",
        new Date().toISOString()
      );
      try {
        const { emailService } = await import("./services/emailService");
        await emailService.checkAndSendReminders();
        console.log("Daily reminder check completed");
      } catch (error) {
        console.error("Error in daily reminder check:", error);
      }
    });
    console.log(
      `Daily email reminders scheduled: ${cronSchedule} (${
        enableReminders ? "ENABLED" : "DISABLED"
      })`
    );
  } else {
    console.log(
      "Email reminders are disabled. Set ENABLE_EMAIL_REMINDERS=true to enable."
    );
  }

  console.log(`Server running on port ${PORT}`);
  console.log(
    `Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
});
