import nodemailer from "nodemailer";
import { connectDB } from "../db/connection";
import { Payment } from "../models/Payment";
import { Setting } from "../models/Setting";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter (using Gmail as example)
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your Gmail app password
      },
    });
  }

  async sendChequeReminder(email: string, cheques: any[]) {
    const chequeList = cheques
      .map(
        (cheque) =>
          `• Cheque #${
            cheque.chequeNumber || "N/A"
          } - ₹${cheque.amount.toLocaleString()} (${
            cheque.bankName || "Unknown Bank"
          })`
      )
      .join("\n");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🔔 Cheque Due Tomorrow - Payment Tracker Reminder",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📋 Cheque Reminder</h2>
          <p>Hello,</p>
          <p>This is a reminder that the following post-dated cheques are due <strong>tomorrow</strong>:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <pre style="margin: 0; font-family: inherit; white-space: pre-wrap;">${chequeList}</pre>
          </div>
          
          <p>Please make sure to:</p>
          <ul>
            <li>Verify the cheques are ready for deposit/clearance</li>
            <li>Update their status in the Payment Tracker system</li>
            <li>Take any necessary action for these payments</li>
          </ul>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is an automated reminder from your Payment Tracker system.<br>
            Total cheques due tomorrow: <strong>${cheques.length}</strong><br>
            Total amount: <strong>₹${cheques
              .reduce((sum, c) => sum + c.amount, 0)
              .toLocaleString()}</strong>
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(
        `Reminder email sent to ${email} for ${cheques.length} cheques`
      );
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  async checkAndSendReminders() {
    try {
      await connectDB();

      // Get notification email from settings
      const emailSetting = await Setting.findOne({
        type: "notification_email",
      });
      if (!emailSetting) {
        console.log("No notification email configured");
        return;
      }

      // Calculate tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD format

      // Find post-dated cheques due tomorrow
      const dueChequesRaw = await Payment.find({
        type: "cheque",
        status: "pending",
        postDatedDate: tomorrowStr,
      });

      // Convert to plain objects and filter out null/undefined values
      const dueCheques = dueChequesRaw
        .map((cheque) => cheque.toObject())
        .filter((cheque) => cheque.postDatedDate);

      if (dueCheques.length > 0) {
        console.log(`Found ${dueCheques.length} cheques due tomorrow`);
        const emailSent = await this.sendChequeReminder(
          emailSetting.value,
          dueCheques
        );

        if (emailSent) {
          console.log("✅ Reminder emails sent successfully");
        } else {
          console.log("❌ Failed to send reminder emails");
        }
      } else {
        console.log("No cheques due tomorrow");
      }
    } catch (error) {
      console.error("Error in checkAndSendReminders:", error);
    }
  }
}

export const emailService = new EmailService();
