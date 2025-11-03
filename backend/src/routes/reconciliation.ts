import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { BankStatementService } from "../services/bankStatementService";
import { ReconciliationService } from "../services/reconciliationService";
import { ExportService } from "../services/exportService";

const router = express.Router();

const bankStatementService = new BankStatementService();
const reconciliationService = new ReconciliationService();
const exportService = new ExportService();

// Multer configuration for bank statement uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../temp-uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "bank-statement-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|csv|xlsx?$/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype =
      file.mimetype === "application/pdf" ||
      file.mimetype === "text/csv" ||
      file.mimetype.includes("sheet");

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, CSV, and Excel files are allowed"));
    }
  },
});

/**
 * POST /api/reconciliation/upload-statement
 * Upload and parse bank statement
 */
router.post(
  "/upload-statement",
  upload.single("statement"),
  async (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { bankName } = req.body;
      if (!bankName) {
        return res.status(400).json({ error: "Bank name is required" });
      }

      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      let fileType: "pdf" | "csv";
      if (fileExtension === ".pdf") {
        fileType = "pdf";
      } else if (fileExtension === ".csv") {
        fileType = "csv";
      } else {
        return res
          .status(400)
          .json({
            error: "Unsupported file type. Only PDF and CSV are supported.",
          });
      }

      // Process the statement file
      const result = await reconciliationService.processStatementFile(
        filePath,
        fileType,
        bankName
      );

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        transactions: result.transactions,
        summary: result.summary,
      });
    } catch (error) {
      console.error("Error processing bank statement:", error);

      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        error: "Failed to process bank statement",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * POST /api/reconciliation/auto-match
 * Perform automatic reconciliation matching
 */
router.post(
  "/auto-match",
  async (req: express.Request, res: express.Response) => {
    try {
      const { bankTransactions, dateFrom, dateTo } = req.body;

      if (!bankTransactions || !Array.isArray(bankTransactions)) {
        return res
          .status(400)
          .json({ error: "Bank transactions array is required" });
      }

      // Perform reconciliation
      const result = await reconciliationService.reconcileTransactions(
        bankTransactions,
        dateFrom,
        dateTo
      );

      res.json({
        success: true,
        reconciliation: result,
      });
    } catch (error) {
      console.error("Error during reconciliation:", error);
      res.status(500).json({
        error: "Reconciliation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/reconciliation/export/excel
 * Export payments to Excel format
 */
router.get(
  "/export/excel",
  async (req: express.Request, res: express.Response) => {
    try {
      const options = {
        format: "excel" as const,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        filters: {
          type: req.query.type as any,
          status: req.query.status as any,
          direction: req.query.direction as any,
        },
        groupBy: (req.query.groupBy as any) || "none",
      };

      // Clean filters - remove empty values
      Object.keys(options.filters).forEach((key) => {
        if (!options.filters[key as keyof typeof options.filters]) {
          delete options.filters[key as keyof typeof options.filters];
        }
      });

      const filePath = await exportService.exportToExcel(options);

      // Send file for download
      res.download(filePath, path.basename(filePath), (err) => {
        if (err) {
          console.error("Error sending file:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Failed to send file" });
          }
        }

        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000); // Delete after 5 seconds
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      res.status(500).json({
        error: "Excel export failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/reconciliation/export/tally
 * Export payments to Tally format
 */
router.get(
  "/export/tally",
  async (req: express.Request, res: express.Response) => {
    try {
      const options = {
        format: "tally" as const,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        filters: {
          type: req.query.type as any,
          status: req.query.status as any,
          direction: req.query.direction as any,
        },
      };

      // Clean filters
      Object.keys(options.filters).forEach((key) => {
        if (!options.filters[key as keyof typeof options.filters]) {
          delete options.filters[key as keyof typeof options.filters];
        }
      });

      const filePath = await exportService.exportToTally(options);

      // Send file for download
      res.download(filePath, path.basename(filePath), (err) => {
        if (err) {
          console.error("Error sending file:", err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Failed to send file" });
          }
        }

        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 5000);
      });
    } catch (error) {
      console.error("Error exporting to Tally:", error);
      res.status(500).json({
        error: "Tally export failed",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * POST /api/reconciliation/manual-match
 * Manually match an app transaction with a bank transaction
 */
router.post(
  "/manual-match",
  async (req: express.Request, res: express.Response) => {
    try {
      const { appTransactionId, bankTransaction, notes } = req.body;

      if (!appTransactionId || !bankTransaction) {
        return res
          .status(400)
          .json({
            error: "App transaction ID and bank transaction are required",
          });
      }

      // Here you would update your payment record to mark it as reconciled
      // This is a simplified version - you might want to create a separate reconciliation table
      const paymentService =
        new (require("../services/paymentServiceMongo").PaymentService)();

      await paymentService.updatePayment(appTransactionId, {
        status: "cleared", // or add a new field for reconciliation status
        // You might want to add reconciliation metadata
      });

      res.json({
        success: true,
        message: "Manual match recorded successfully",
      });
    } catch (error) {
      console.error("Error recording manual match:", error);
      res.status(500).json({
        error: "Failed to record manual match",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/reconciliation/supported-banks
 * Get list of supported banks for statement parsing
 */
router.get(
  "/supported-banks",
  (req: express.Request, res: express.Response) => {
    const supportedBanks = [
      { code: "hdfc", name: "HDFC Bank", formats: ["PDF", "CSV"] },
      { code: "sbi", name: "State Bank of India", formats: ["PDF", "CSV"] },
      { code: "icici", name: "ICICI Bank", formats: ["PDF", "CSV"] },
      { code: "axis", name: "Axis Bank", formats: ["PDF", "CSV"] },
      { code: "kotak", name: "Kotak Mahindra Bank", formats: ["PDF", "CSV"] },
      { code: "pnb", name: "Punjab National Bank", formats: ["PDF", "CSV"] },
      { code: "bob", name: "Bank of Baroda", formats: ["PDF", "CSV"] },
      { code: "canara", name: "Canara Bank", formats: ["PDF", "CSV"] },
      { code: "union", name: "Union Bank of India", formats: ["PDF", "CSV"] },
      {
        code: "other",
        name: "Other Bank (Generic Parser)",
        formats: ["PDF", "CSV"],
      },
    ];

    res.json({
      success: true,
      banks: supportedBanks,
    });
  }
);

/**
 * DELETE /api/reconciliation/cleanup-temp
 * Clean up temporary files
 */
router.delete(
  "/cleanup-temp",
  async (req: express.Request, res: express.Response) => {
    try {
      await exportService.cleanupTempFiles(60); // Clean files older than 60 minutes

      res.json({
        success: true,
        message: "Temporary files cleaned up successfully",
      });
    } catch (error) {
      console.error("Error cleaning up temp files:", error);
      res.status(500).json({
        error: "Failed to clean up temporary files",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
