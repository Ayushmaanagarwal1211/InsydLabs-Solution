import express from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentFilter,
} from "../types";
import { PaymentService } from "../services/paymentServiceMongo";
import { CloudinaryService } from "../services/cloudinaryService";
import { ExportService } from "../services/exportService";

const router = express.Router();
const paymentService = new PaymentService();
const cloudinaryService = new CloudinaryService();
const exportService = new ExportService();

// Multer configuration for temporary file storage (will upload to Cloudinary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../temp-uploads");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed"
        )
      );
    }
  },
});

// GET /api/payments - Get all payments with optional filtering and pagination
router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    const filters: PaymentFilter = {
      type: req.query.type as "cheque" | "cash" | undefined,
      status: req.query.status as any,
      direction: req.query.direction as "incoming" | "outgoing" | undefined,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      amountMin: req.query.amountMin ? Number(req.query.amountMin) : undefined,
      amountMax: req.query.amountMax ? Number(req.query.amountMax) : undefined,
    };

    // Parse pagination parameters
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        error:
          "Invalid pagination parameters. Page must be >= 1, limit must be between 1-100",
      });
    }

    const result = await paymentService.getPayments(filters, page, limit);
    res.json(result);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// GET /api/payments/stats - Get payment statistics
router.get("/stats", async (req: express.Request, res: express.Response) => {
  try {
    const stats = await paymentService.getPaymentStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching payment statistics:", error);
    res.status(500).json({ error: "Failed to fetch payment statistics" });
  }
});

// GET /api/payments/:id - Get payment by ID
router.get("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

// POST /api/payments - Create new payment with image upload
router.post(
  "/",
  upload.single("chequeImage"),
  async (req: express.Request, res: express.Response) => {
    let tempFilePath: string | null = null;

    try {
      const paymentData: CreatePaymentRequest = req.body;

      // Validate required fields
      if (!paymentData.type || !paymentData.amount || !paymentData.date) {
        return res
          .status(400)
          .json({ error: "Type, amount, and date are required" });
      }

      let imageUrl: string | undefined = undefined;

      // Handle image upload for cheque payments
      if (req.file && paymentData.type === "cheque") {
        tempFilePath = req.file.path;
        console.log("Uploading image to Cloudinary:", tempFilePath);

        try {
          imageUrl = await cloudinaryService.uploadImage(
            tempFilePath,
            "cheque-images"
          );
          console.log("Image uploaded successfully:", imageUrl);
        } catch (uploadError) {
          console.error("Cloudinary upload failed:", uploadError);
          // Continue without image if upload fails
          imageUrl = undefined;
        } finally {
          // Clean up temporary file
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            tempFilePath = null;
          }
        }
      }

      // Add image URL to payment data
      const paymentWithImage = {
        ...paymentData,
        imageUrl,
      };

      const payment = await paymentService.createPayment(paymentWithImage);
      res.status(201).json(payment);
    } catch (error) {
      // Clean up temporary file if there was an error
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  }
);

// PUT /api/payments/:id - Update payment
router.put("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const updateData: UpdatePaymentRequest = req.body;
    const payment = await paymentService.updatePayment(
      req.params.id,
      updateData
    );

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ error: "Failed to update payment" });
  }
});

// DELETE /api/payments/:id - Delete payment
router.delete("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const deleted = await paymentService.deletePayment(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

// GET /api/payments/reminders/due - Get payments with due reminders
router.get(
  "/reminders/due",
  async (req: express.Request, res: express.Response) => {
    try {
      const dueReminders = await paymentService.getDueReminders();
      res.json(dueReminders);
    } catch (error) {
      console.error("Error fetching due reminders:", error);
      res.status(500).json({ error: "Failed to fetch due reminders" });
    }
  }
);

// GET /api/payments/stats/summary - Get payment statistics
router.get(
  "/stats/summary",
  async (req: express.Request, res: express.Response) => {
    try {
      const stats = await paymentService.getPaymentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
      res.status(500).json({ error: "Failed to fetch payment stats" });
    }
  }
);

// DEV ONLY - Create sample data for testing pagination
router.post(
  "/dev/create-sample-data",
  async (req: express.Request, res: express.Response) => {
    try {
      const samplePayments = [];

      for (let i = 1; i <= 25; i++) {
        const isEven = i % 2 === 0;
        const paymentData = {
          type: isEven ? ("cheque" as const) : ("cash" as const),
          amount: Math.floor(Math.random() * 100000) + 10000,
          date: new Date(2025, 10, Math.floor(Math.random() * 30) + 1)
            .toISOString()
            .split("T")[0],
          direction:
            Math.random() > 0.5 ? ("incoming" as const) : ("outgoing" as const),
          description: `Sample payment ${i}`,
          status: ["pending", "cleared", "deposited", "bounced"][
            Math.floor(Math.random() * 4)
          ] as any,
          ...(isEven
            ? {
                chequeNumber: `CHQ${1000 + i}`,
                bankName: ["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank"][
                  Math.floor(Math.random() * 4)
                ],
                issuedBy: `Company ${i}`,
                postDatedDate: new Date(
                  2025,
                  11,
                  Math.floor(Math.random() * 30) + 1
                )
                  .toISOString()
                  .split("T")[0],
              }
            : {
                receivedBy: `Person ${i}`,
              }),
        };

        const payment = await paymentService.createPayment(paymentData);
        samplePayments.push(payment);
      }

      res.json({
        message: `Created ${samplePayments.length} sample payments`,
        payments: samplePayments,
      });
    } catch (error) {
      console.error("Error creating sample data:", error);
      res.status(500).json({ error: "Failed to create sample data" });
    }
  }
);

// Export payments to Excel or Tally format
router.post("/export", async (req, res) => {
  try {
    const {
      format = "excel",
      includeDetails = true,
      dateRange,
      filters,
    } = req.body;

    console.log("Export request received:", {
      format,
      includeDetails,
      dateRange,
      filters,
    });

    let filePath: string;
    let contentType: string;
    let fileName: string;

    const exportOptions: any = {
      includeDetails,
      sheetName: "Payment Records",
      filters: filters,
    };

    // Apply date range filter if provided
    if (dateRange?.start || dateRange?.end) {
      exportOptions.dateRange = dateRange;
    }

    console.log("Export options:", exportOptions);

    if (format === "excel") {
      filePath = await exportService.exportToExcel(exportOptions);
      contentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      fileName = `payments_export_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
    } else if (format === "tally") {
      filePath = await exportService.exportToTally({
        ...exportOptions,
        companyName: "Your Company Name",
        financialYear: "2024-25",
      });
      contentType = "application/xml";
      fileName = `tally_export_${new Date().toISOString().split("T")[0]}.xml`;
    } else {
      return res
        .status(400)
        .json({ error: 'Invalid export format. Use "excel" or "tally".' });
    }

    console.log("Export file created:", filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("Export file not found:", filePath);
      return res
        .status(500)
        .json({ error: "Export file not created successfully" });
    }

    // Set response headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    // Stream the file
    const fileStream = fs.createReadStream(filePath);

    fileStream.on("error", (error) => {
      console.error("Error streaming export file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming export file" });
      }
    });

    fileStream.on("end", () => {
      console.log("Export file sent successfully");
      // Clean up the temporary file after sending
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("Temporary export file cleaned up:", filePath);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up export file:", cleanupError);
        }
      }, 5000); // Give 5 seconds for the download to complete
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("Export endpoint error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Export failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});

export default router;
