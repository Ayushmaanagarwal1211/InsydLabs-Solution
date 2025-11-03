import express from "express";
import { connectDB } from "../db/connection";
import { Setting } from "../models/Setting";

const router = express.Router();

// GET /api/settings/email - Get saved email
router.get("/email", async (req: express.Request, res: express.Response) => {
  try {
    await connectDB();
    const emailSetting = await Setting.findOne({ type: "notification_email" });

    if (emailSetting) {
      res.json({ email: emailSetting.value });
    } else {
      res.json({ email: null });
    }
  } catch (error) {
    console.error("Error fetching email setting:", error);
    res.status(500).json({ error: "Failed to fetch email setting" });
  }
});

// POST /api/settings/email - Save email
router.post("/email", async (req: express.Request, res: express.Response) => {
  try {
    await connectDB();
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Update or create email setting
    await Setting.findOneAndUpdate(
      { type: "notification_email" },
      { type: "notification_email", value: email, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, email });
  } catch (error) {
    console.error("Error saving email setting:", error);
    res.status(500).json({ error: "Failed to save email setting" });
  }
});

// POST /api/settings/check-reminders - Manually trigger reminder check
router.post(
  "/check-reminders",
  async (req: express.Request, res: express.Response) => {
    try {
      const { emailService } = await import("../services/emailService");
      await emailService.checkAndSendReminders();
      res.json({ success: true, message: "Reminder check completed" });
    } catch (error) {
      console.error("Error checking reminders:", error);
      res.status(500).json({ error: "Failed to check reminders" });
    }
  }
);

export default router;
