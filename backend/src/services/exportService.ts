import * as ExcelJS from "exceljs";
import { PaymentService } from "./paymentServiceMongo";
import { PaymentFilter } from "../types";
import * as fs from "fs";
import * as path from "path";

export interface ExportOptions {
  format: "excel" | "tally";
  dateFrom?: string;
  dateTo?: string;
  includeImages?: boolean;
  filters?: PaymentFilter;
  groupBy?: "date" | "type" | "status" | "none";
}

export interface TallyExportData {
  vouchers: TallyVoucher[];
  summary: {
    totalVouchers: number;
    totalDebit: number;
    totalCredit: number;
  };
}

export interface TallyVoucher {
  voucherType: string;
  voucherNumber: string;
  date: string;
  reference: string;
  ledgerEntries: TallyLedgerEntry[];
}

export interface TallyLedgerEntry {
  ledgerName: string;
  amount: number;
  isDebit: boolean;
  narration: string;
}

export class ExportService {
  private paymentService: PaymentService;
  private tempDir: string;

  constructor() {
    this.paymentService = new PaymentService();
    this.tempDir = path.join(__dirname, "../../temp-exports");

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Export payments to Excel format
   */
  async exportToExcel(options: ExportOptions): Promise<string> {
    try {
      console.log("Starting Excel export with options:", options);

      // Get payments data
      const paymentsResult = await this.paymentService.getPayments(
        options.filters,
        1,
        10000 // Get all payments
      );

      const payments = paymentsResult.payments;
      console.log(`Retrieved ${payments.length} payments`);

      // Filter by date range if specified
      const filteredPayments = this.filterByDateRange(
        payments,
        options.dateFrom,
        options.dateTo
      );

      console.log(`Filtered to ${filteredPayments.length} payments`);

      // Limit to reasonable number to avoid memory issues
      const limitedPayments = filteredPayments.slice(0, 5000);
      if (limitedPayments.length < filteredPayments.length) {
        console.log(`Limited to ${limitedPayments.length} payments for export`);
      }

      // Check data structure for potential column issues
      if (limitedPayments.length > 0) {
        const sampleData = limitedPayments[0];
        const columnCount = Object.keys(sampleData).length;
        console.log(`Sample payment object has ${columnCount} columns`);

        if (columnCount > 50) {
          console.log(`⚠️  Large number of columns detected: ${columnCount}`);
          console.log(
            "Column names:",
            Object.keys(sampleData).slice(0, 10).join(", "),
            "..."
          );
        }
      }

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();

      try {
        // Add summary sheet
        console.log("Adding summary sheet...");
        await this.addSummarySheet(workbook, limitedPayments);

        // Add detailed transactions sheet
        console.log("Adding transactions sheet...");
        await this.addTransactionsSheet(workbook, limitedPayments, options);
      } catch (sheetError) {
        console.error("Error adding sheets:", sheetError);
        throw new Error(
          `Failed to create Excel sheets: ${
            sheetError instanceof Error ? sheetError.message : "Unknown error"
          }`
        );
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `payments-export-${timestamp}.xlsx`;
      const filePath = path.join(this.tempDir, filename);

      // Write file
      console.log("Writing Excel file...");
      await workbook.xlsx.writeFile(filePath);
      console.log("Excel export completed successfully");

      return filePath;
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Excel export failed: ${errorMessage}`);
    }
  }

  /**
   * Export payments to Tally format
   */
  async exportToTally(options: ExportOptions): Promise<string> {
    try {
      // Get payments data
      const paymentsResult = await this.paymentService.getPayments(
        options.filters,
        1,
        10000
      );

      const payments = paymentsResult.payments;
      const filteredPayments = this.filterByDateRange(
        payments,
        options.dateFrom,
        options.dateTo
      );

      // Convert to Tally format
      const tallyData = this.convertToTallyFormat(filteredPayments);

      // Generate XML for Tally
      const xmlContent = this.generateTallyXML(tallyData);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `tally-import-${timestamp}.xml`;
      const filePath = path.join(this.tempDir, filename);

      // Write file
      fs.writeFileSync(filePath, xmlContent, "utf8");

      return filePath;
    } catch (error) {
      console.error("Error exporting to Tally:", error);
      throw new Error(`Tally export failed: ${error}`);
    }
  }

  /**
   * Add summary sheet to workbook
   */
  private async addSummarySheet(
    workbook: ExcelJS.Workbook,
    payments: any[]
  ): Promise<void> {
    try {
      const worksheet = workbook.addWorksheet("Summary");

      // Calculate summary statistics
      const stats = this.calculateSummaryStats(payments);

      // Add headers using array format for better control
      worksheet.addRow(["Metric", "Value", "Details"]);

      // Add summary data using array format
      const summaryData = [
        ["Total Transactions", stats.totalCount || 0, "All payment records"],
        ["Total Amount", stats.totalAmount || 0, "Sum of all payments"],
        ["Cheques Count", stats.chequeCount || 0, "Number of cheque payments"],
        ["Cash Count", stats.cashCount || 0, "Number of cash payments"],
        [
          "Pending Amount",
          stats.pendingAmount || 0,
          "Amount pending clearance",
        ],
        [
          "Cleared Amount",
          stats.clearedAmount || 0,
          "Successfully cleared amount",
        ],
        ["Bounced Amount", stats.bouncedAmount || 0, "Bounced cheques amount"],
        [
          "Incoming Total",
          stats.incomingAmount || 0,
          "Total incoming payments",
        ],
        [
          "Outgoing Total",
          stats.outgoingAmount || 0,
          "Total outgoing payments",
        ],
        [
          "Date Range",
          `${stats.dateRange?.from || "N/A"} to ${
            stats.dateRange?.to || "N/A"
          }`,
          "Transaction period",
        ],
      ];

      // Limit to maximum 50 rows to prevent memory issues
      const limitedData = summaryData.slice(0, 50);
      limitedData.forEach((row) => {
        worksheet.addRow(row);
      });

      // Style the summary sheet
      this.styleSummarySheet(worksheet);
    } catch (error) {
      console.error("Error creating summary sheet:", error);
      // Continue without summary sheet if there's an error
    }
  }

  /**
   * Check if data exceeds Excel column limits and split into multiple sheets
   */
  private checkColumnLimits(data: any[]): {
    needsSplit: boolean;
    columnCount: number;
  } {
    if (!data || data.length === 0) {
      return { needsSplit: false, columnCount: 0 };
    }

    const columnCount = Object.keys(data[0]).length;
    console.log(`Data has ${columnCount} columns`);

    const EXCEL_MAX_COLUMNS = 16384;
    const needsSplit = columnCount > EXCEL_MAX_COLUMNS;

    if (needsSplit) {
      console.log(
        `⚠️  Data has ${columnCount} columns, which exceeds Excel limit of ${EXCEL_MAX_COLUMNS}. Will split into multiple sheets.`
      );
    }

    return { needsSplit, columnCount };
  }

  /**
   * Split data into chunks that fit Excel column limits
   */
  private splitDataByColumns(data: any[], maxColumns: number = 16384): any[][] {
    if (!data || data.length === 0) return [];

    const allKeys = Object.keys(data[0]);
    const chunks: any[][] = [];

    for (let i = 0; i < allKeys.length; i += maxColumns) {
      const keysChunk = allKeys.slice(i, i + maxColumns);
      const dataChunk = data.map((item) => {
        const chunkItem: any = {};
        keysChunk.forEach((key) => {
          chunkItem[key] = item[key];
        });
        return chunkItem;
      });
      chunks.push(dataChunk);
    }

    return chunks;
  }

  /**
   * Add transactions sheet to workbook
   */
  private async addTransactionsSheet(
    workbook: ExcelJS.Workbook,
    payments: any[],
    options: ExportOptions
  ): Promise<void> {
    try {
      // Transform payments to row format
      const transformedData = payments.map((payment) => ({
        date: this.formatDate(payment.date),
        type: payment.type?.toUpperCase() || "UNKNOWN",
        direction: payment.direction?.toUpperCase() || "UNKNOWN",
        description: payment.description || "",
        debit: payment.direction === "outgoing" ? payment.amount : "",
        credit: payment.direction === "incoming" ? payment.amount : "",
        status: payment.status?.toUpperCase() || "PENDING",
        reference:
          payment.chequeNumber || payment._id?.toString().substring(0, 8) || "",
        bankName: payment.bankName || "",
        chequeNumber: payment.chequeNumber || "",
        postDatedDate: payment.postDatedDate
          ? this.formatDate(payment.postDatedDate)
          : "",
        createdAt: this.formatDateTime(payment.createdAt),
        // Include only essential fields to avoid column overflow
        id: payment._id?.toString() || "",
        amount: payment.amount || 0,
      }));

      // Check if we need to split due to column limits
      const { needsSplit, columnCount } =
        this.checkColumnLimits(transformedData);

      if (needsSplit) {
        // Split data into multiple sheets
        console.log(`Splitting ${columnCount} columns into multiple sheets...`);
        const dataChunks = this.splitDataByColumns(transformedData, 16000); // Leave some margin

        dataChunks.forEach((chunk, index) => {
          const sheetName = `Transactions_${index + 1}`;
          console.log(
            `Creating sheet: ${sheetName} with ${
              Object.keys(chunk[0] || {}).length
            } columns`
          );
          this.createTransactionSheet(workbook, chunk, sheetName);
        });
      } else {
        // Standard single sheet approach
        console.log(
          `Creating single transactions sheet with ${columnCount} columns`
        );
        this.createTransactionSheet(workbook, transformedData, "Transactions");
      }
    } catch (error) {
      console.error("Error in addTransactionsSheet:", error);
      // Create an error sheet instead of throwing to allow partial export
      try {
        const errorSheet = workbook.addWorksheet("Transactions_Error");
        errorSheet.addRow(["Export Error", "Details"]);
        errorSheet.addRow([
          "Failed to create transactions sheet",
          error instanceof Error ? error.message : "Unknown error",
        ]);
        errorSheet.addRow(["Payment count", payments?.length || 0]);
        console.log("Created error sheet due to export failure");
      } catch (errorSheetError) {
        console.error("Could not create error sheet:", errorSheetError);
        throw error; // Only throw if we can't create any sheet at all
      }
    }
  }

  /**
   * Create a single transaction sheet with the given data
   */
  private createTransactionSheet(
    workbook: ExcelJS.Workbook,
    data: any[],
    sheetName: string
  ): void {
    try {
      console.log(
        `Creating sheet: ${sheetName} with ${data?.length || 0} rows`
      );

      const worksheet = workbook.addWorksheet(sheetName);

      if (!data || data.length === 0) {
        console.log(`No data to add to sheet: ${sheetName}`);
        // Add a simple "No data available" message
        worksheet.addRow(["No data available"]);
        return;
      }

      // Get all columns from the first row - be defensive
      const firstRow = data[0];
      if (!firstRow || typeof firstRow !== "object") {
        console.warn(`Invalid data structure in sheet ${sheetName}`);
        worksheet.addRow(["Invalid data structure"]);
        return;
      }

      const columns = Object.keys(firstRow);
      const columnCount = columns.length;

      console.log(
        `Sheet ${sheetName} will have ${columnCount} columns:`,
        columns.slice(0, 5).join(", ") + (columnCount > 5 ? "..." : "")
      );

      // Limit columns to prevent Excel bounds issues
      const safeColumns = columns.slice(0, Math.min(columnCount, 16000));
      console.log(
        `Using ${safeColumns.length} columns (limited from ${columnCount})`
      );

      // Add headers
      worksheet.addRow(safeColumns);

      // Add data rows (limit to prevent memory issues)
      const limitedData = data.slice(0, 1000);
      console.log(`Adding ${limitedData.length} data rows`);

      limitedData.forEach((row, index) => {
        try {
          const rowValues = safeColumns.map((col) => {
            const value = row[col];
            // Handle various data types safely
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return JSON.stringify(value);
            return String(value);
          });
          worksheet.addRow(rowValues);
        } catch (rowError) {
          console.warn(
            `Error adding row ${index + 1} in sheet ${sheetName}:`,
            rowError
          );
          // Add a placeholder row to maintain structure
          worksheet.addRow(safeColumns.map(() => "Error"));
        }
      });

      console.log(
        `Sheet ${sheetName} created successfully with ${worksheet.actualRowCount} rows`
      );

      // Style the sheet
      this.styleTransactionsSheet(worksheet);
    } catch (error) {
      console.error(`Error creating sheet ${sheetName}:`, error);
      // Don't throw - create a minimal error sheet instead
      try {
        const errorSheet = workbook.addWorksheet(`${sheetName}_Error`);
        errorSheet.addRow([
          "Error creating sheet",
          error instanceof Error ? error.message : "Unknown error",
        ]);
      } catch (errorSheetError) {
        console.error("Could not create error sheet:", errorSheetError);
      }
    }
  }

  /**
   * Convert payments to Tally format
   */
  private convertToTallyFormat(payments: any[]): TallyExportData {
    const vouchers: TallyVoucher[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const payment of payments) {
      const voucherType = this.getTallyVoucherType(payment);
      const voucherNumber =
        payment.chequeNumber || `PAY${payment._id.toString().substring(0, 8)}`;

      const ledgerEntries: TallyLedgerEntry[] = [];

      if (payment.direction === "incoming") {
        // Credit to appropriate account
        ledgerEntries.push({
          ledgerName:
            payment.type === "cheque" ? "Bank Account" : "Cash Account",
          amount: payment.amount,
          isDebit: true,
          narration: payment.description || `${payment.type} received`,
        });

        // Debit to income/receivables
        ledgerEntries.push({
          ledgerName: "Income Account",
          amount: payment.amount,
          isDebit: false,
          narration: payment.description || `${payment.type} received`,
        });

        totalCredit += payment.amount;
      } else {
        // Debit to expense/payables
        ledgerEntries.push({
          ledgerName: "Expense Account",
          amount: payment.amount,
          isDebit: true,
          narration: payment.description || `${payment.type} payment`,
        });

        // Credit from appropriate account
        ledgerEntries.push({
          ledgerName:
            payment.type === "cheque" ? "Bank Account" : "Cash Account",
          amount: payment.amount,
          isDebit: false,
          narration: payment.description || `${payment.type} payment`,
        });

        totalDebit += payment.amount;
      }

      vouchers.push({
        voucherType,
        voucherNumber,
        date: this.formatDate(payment.date),
        reference: payment.description || "",
        ledgerEntries,
      });
    }

    return {
      vouchers,
      summary: {
        totalVouchers: vouchers.length,
        totalDebit,
        totalCredit,
      },
    };
  }

  /**
   * Generate Tally XML format
   */
  private generateTallyXML(data: TallyExportData): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
`;

    for (const voucher of data.vouchers) {
      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${voucher.voucherType}" ACTION="Create">
            <DATE>${voucher.date.replace(/-/g, "")}</DATE>
            <VOUCHERTYPENAME>${voucher.voucherType}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${voucher.voucherNumber}</VOUCHERNUMBER>
            <REFERENCE>${voucher.reference}</REFERENCE>
`;

      for (const entry of voucher.ledgerEntries) {
        xml += `            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${entry.ledgerName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>${
                entry.isDebit ? "Yes" : "No"
              }</ISDEEMEDPOSITIVE>
              <AMOUNT>${entry.isDebit ? entry.amount : -entry.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
`;
      }

      xml += `          </VOUCHER>
        </TALLYMESSAGE>
`;
    }

    xml += `      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    return xml;
  }

  /**
   * Filter payments by date range
   */
  private filterByDateRange(
    payments: any[],
    dateFrom?: string,
    dateTo?: string
  ): any[] {
    if (!dateFrom && !dateTo) return payments;

    return payments.filter((payment) => {
      const paymentDate = new Date(payment.date);

      if (dateFrom && paymentDate < new Date(dateFrom)) return false;
      if (dateTo && paymentDate > new Date(dateTo)) return false;

      return true;
    });
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummaryStats(payments: any[]) {
    const stats = {
      totalCount: payments.length,
      totalAmount: 0,
      chequeCount: 0,
      cashCount: 0,
      pendingAmount: 0,
      clearedAmount: 0,
      bouncedAmount: 0,
      incomingAmount: 0,
      outgoingAmount: 0,
      dateRange: { from: "", to: "" },
    };

    const dates: Date[] = [];

    for (const payment of payments) {
      stats.totalAmount += payment.amount;

      if (payment.type === "cheque") stats.chequeCount++;
      if (payment.type === "cash") stats.cashCount++;

      if (payment.status === "pending") stats.pendingAmount += payment.amount;
      if (payment.status === "cleared") stats.clearedAmount += payment.amount;
      if (payment.status === "bounced") stats.bouncedAmount += payment.amount;

      if (payment.direction === "incoming")
        stats.incomingAmount += payment.amount;
      if (payment.direction === "outgoing")
        stats.outgoingAmount += payment.amount;

      dates.push(new Date(payment.date));
    }

    // Calculate date range
    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      stats.dateRange.from = dates[0].toISOString().split("T")[0];
      stats.dateRange.to = dates[dates.length - 1].toISOString().split("T")[0];
    }

    return stats;
  }

  /**
   * Get Tally voucher type based on payment
   */
  private getTallyVoucherType(payment: any): string {
    if (payment.direction === "incoming") {
      return payment.type === "cheque" ? "Receipt" : "Receipt";
    } else {
      return payment.type === "cheque" ? "Payment" : "Payment";
    }
  }

  /**
   * Style summary sheet
   */
  private styleSummarySheet(worksheet: ExcelJS.Worksheet): void {
    try {
      // Header row styling
      const headerRow = worksheet.getRow(1);
      if (headerRow) {
        headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "366092" },
        };
      }

      // Auto-fit columns (limit to reasonable number)
      const columnCount = Math.min(worksheet.columnCount, 10);
      for (let i = 1; i <= columnCount; i++) {
        const column = worksheet.getColumn(i);
        if (column && column.header) {
          const headerLength = column.header.toString().length;
          column.width = Math.max(10, Math.min(headerLength + 2, 50));
        }
      }
    } catch (error) {
      console.error("Error styling summary sheet:", error);
      // Continue without styling if there's an error
    }
  }

  /**
   * Style transactions sheet
   */
  private styleTransactionsSheet(worksheet: ExcelJS.Worksheet): void {
    try {
      // Header row styling
      const headerRow = worksheet.getRow(1);
      if (headerRow) {
        headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "366092" },
        };
      }

      // Format amount columns (only if they exist)
      const debitColumn = worksheet.getColumn("debit");
      const creditColumn = worksheet.getColumn("credit");
      if (debitColumn && debitColumn.letter) {
        debitColumn.numFmt = "#,##0.00";
      }
      if (creditColumn && creditColumn.letter) {
        creditColumn.numFmt = "#,##0.00";
      }

      // Add borders - limit to actual data range and be defensive about column count
      const borderStyle = { style: "thin" as const, color: { argb: "000000" } };
      const actualRowCount = Math.min(worksheet.actualRowCount || 1, 1000);
      const actualColumnCount = Math.min(worksheet.columnCount || 12, 50); // Safe upper limit

      console.log(
        `Styling sheet: ${actualRowCount} rows, ${actualColumnCount} columns`
      );

      for (let rowNum = 1; rowNum <= actualRowCount; rowNum++) {
        const row = worksheet.getRow(rowNum);
        for (let colNum = 1; colNum <= actualColumnCount; colNum++) {
          try {
            const cell = row.getCell(colNum);
            if (cell) {
              cell.border = {
                top: borderStyle,
                left: borderStyle,
                bottom: borderStyle,
                right: borderStyle,
              };
            }
          } catch (cellError) {
            console.warn(
              `Warning: Could not style cell at row ${rowNum}, col ${colNum}:`,
              cellError
            );
            // Continue with other cells
          }
        }
      }
    } catch (error) {
      console.error("Error styling transactions sheet:", error);
      // Continue without styling if there's an error
    }
  }

  /**
   * Format date for display
   */
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split("T")[0];
    } catch {
      return dateStr;
    }
  }

  /**
   * Format datetime for display
   */
  private formatDateTime(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toISOString().replace("T", " ").substring(0, 19);
    } catch {
      return dateStr;
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(olderThanMinutes: number = 60): Promise<void> {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        const ageMinutes = (now - stats.mtime.getTime()) / (1000 * 60);

        if (ageMinutes > olderThanMinutes) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old export file: ${file}`);
        }
      }
    } catch (error) {
      console.error("Error cleaning up temp files:", error);
    }
  }
}
