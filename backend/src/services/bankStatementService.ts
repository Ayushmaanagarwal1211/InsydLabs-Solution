const pdf = require("pdf-parse");
import csv from "csv-parser";
import * as fs from "fs";
import { Readable } from "stream";

export interface BankTransaction {
  date: string;
  amount: number;
  description: string;
  reference: string;
  type: "debit" | "credit";
  balance?: number;
  bank?: string;
}

export interface NormalizedTransaction {
  date: string; // ISO format YYYY-MM-DD
  amount: number;
  reference: string;
  description: string;
  type: "debit" | "credit";
  bank: string;
  originalData: BankTransaction;
}

export class BankStatementService {
  /**
   * Parse bank statement file (PDF or CSV)
   */
  async parseStatement(
    filePath: string,
    fileType: "pdf" | "csv",
    bankName: string
  ): Promise<BankTransaction[]> {
    try {
      if (fileType === "pdf") {
        return await this.parsePDF(filePath, bankName);
      } else if (fileType === "csv") {
        return await this.parseCSV(filePath, bankName);
      } else {
        throw new Error(
          "Unsupported file type. Only PDF and CSV are supported."
        );
      }
    } catch (error) {
      console.error("Error parsing bank statement:", error);
      throw new Error(`Failed to parse bank statement: ${error}`);
    }
  }

  /**
   * Parse PDF bank statement
   */
  private async parsePDF(
    filePath: string,
    bankName: string
  ): Promise<BankTransaction[]> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    // Different parsing logic based on bank
    switch (bankName.toLowerCase()) {
      case "hdfc":
        return this.parseHDFCPDF(text);
      case "sbi":
        return this.parseSBIPDF(text);
      case "icici":
        return this.parseICICIPDF(text);
      case "axis":
        return this.parseAxisPDF(text);
      default:
        return this.parseGenericPDF(text);
    }
  }

  /**
   * Parse CSV bank statement
   */
  private async parseCSV(
    filePath: string,
    bankName: string
  ): Promise<BankTransaction[]> {
    return new Promise((resolve, reject) => {
      const transactions: BankTransaction[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row: any) => {
          try {
            const transaction = this.normalizeCSVRow(row, bankName);
            if (transaction) {
              transactions.push(transaction);
            }
          } catch (error) {
            console.warn("Skipping invalid CSV row:", error);
          }
        })
        .on("end", () => {
          resolve(transactions);
        })
        .on("error", (error: any) => {
          reject(error);
        });
    });
  }

  /**
   * Parse HDFC Bank PDF format
   */
  private parseHDFCPDF(text: string): BankTransaction[] {
    const transactions: BankTransaction[] = [];
    const lines = text.split("\n");

    // HDFC statement pattern: Date | Description | Debit | Credit | Balance
    const transactionPattern =
      /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.?\d*|\s+)\s+([\d,]+\.?\d*|\s+)\s+([\d,]+\.?\d*)/;

    for (const line of lines) {
      const match = line.match(transactionPattern);
      if (match) {
        const [, dateStr, description, debitStr, creditStr, balanceStr] = match;

        const debitAmount = this.parseAmount(debitStr);
        const creditAmount = this.parseAmount(creditStr);
        const balance = this.parseAmount(balanceStr);

        if (debitAmount > 0 || creditAmount > 0) {
          transactions.push({
            date: this.formatDate(dateStr, "DD/MM/YYYY"),
            amount: debitAmount > 0 ? debitAmount : creditAmount,
            description: description.trim(),
            reference: this.extractReference(description),
            type: debitAmount > 0 ? "debit" : "credit",
            balance: balance,
            bank: "HDFC",
          });
        }
      }
    }

    return transactions;
  }

  /**
   * Parse SBI Bank PDF format
   */
  private parseSBIPDF(text: string): BankTransaction[] {
    const transactions: BankTransaction[] = [];
    const lines = text.split("\n");

    // SBI statement pattern may vary, implement based on actual format
    const transactionPattern =
      /(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d,]+\.?\d*|\s+)\s+([\d,]+\.?\d*|\s+)/;

    for (const line of lines) {
      const match = line.match(transactionPattern);
      if (match) {
        const [, dateStr, description, debitStr, creditStr] = match;

        const debitAmount = this.parseAmount(debitStr);
        const creditAmount = this.parseAmount(creditStr);

        if (debitAmount > 0 || creditAmount > 0) {
          transactions.push({
            date: this.formatDate(dateStr, "DD-MM-YYYY"),
            amount: debitAmount > 0 ? debitAmount : creditAmount,
            description: description.trim(),
            reference: this.extractReference(description),
            type: debitAmount > 0 ? "debit" : "credit",
            bank: "SBI",
          });
        }
      }
    }

    return transactions;
  }

  /**
   * Parse ICICI Bank PDF format
   */
  private parseICICIPDF(text: string): BankTransaction[] {
    // Implement ICICI-specific parsing logic
    return this.parseGenericPDF(text);
  }

  /**
   * Parse Axis Bank PDF format
   */
  private parseAxisPDF(text: string): BankTransaction[] {
    // Implement Axis-specific parsing logic
    return this.parseGenericPDF(text);
  }

  /**
   * Generic PDF parser for unknown banks
   */
  private parseGenericPDF(text: string): BankTransaction[] {
    const transactions: BankTransaction[] = [];
    const lines = text.split("\n");

    // Generic pattern to match common formats
    const patterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/,
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const [, dateStr, description, amount1, amount2] = match;

          const amt1 = this.parseAmount(amount1);
          const amt2 = this.parseAmount(amount2);

          // Assume first amount is debit, second is credit (common format)
          if (amt1 > 0 || amt2 > 0) {
            transactions.push({
              date: this.formatDate(dateStr, this.detectDateFormat(dateStr)),
              amount: amt1 > 0 ? amt1 : amt2,
              description: description.trim(),
              reference: this.extractReference(description),
              type: amt1 > 0 ? "debit" : "credit",
              bank: "Unknown",
            });
          }
          break;
        }
      }
    }

    return transactions;
  }

  /**
   * Normalize CSV row based on bank format
   */
  private normalizeCSVRow(row: any, bankName: string): BankTransaction | null {
    try {
      // Common CSV headers mapping
      const headerMappings: { [key: string]: any } = {
        hdfc: {
          date: ["Date", "Transaction Date", "Txn Date"],
          description: ["Description", "Particulars", "Narration"],
          debit: ["Debit", "Withdrawal", "Debit Amount"],
          credit: ["Credit", "Deposit", "Credit Amount"],
          balance: ["Balance", "Closing Balance"],
        },
        sbi: {
          date: ["Txn Date", "Date", "Transaction Date"],
          description: ["Description", "Particulars"],
          debit: ["Debit", "Dr"],
          credit: ["Credit", "Cr"],
          balance: ["Balance"],
        },
        icici: {
          date: ["Transaction Date", "Date"],
          description: ["Transaction Remarks", "Description"],
          debit: ["Withdrawal Amount", "Debit"],
          credit: ["Deposit Amount", "Credit"],
          balance: ["Balance"],
        },
      };

      const mapping =
        headerMappings[bankName.toLowerCase()] || headerMappings["hdfc"];

      // Find the correct column names
      const dateCol = this.findColumn(row, mapping.date);
      const descCol = this.findColumn(row, mapping.description);
      const debitCol = this.findColumn(row, mapping.debit);
      const creditCol = this.findColumn(row, mapping.credit);
      const balanceCol = this.findColumn(row, mapping.balance);

      if (!dateCol || !descCol || (!debitCol && !creditCol)) {
        return null;
      }

      const debitAmount = debitCol ? this.parseAmount(row[debitCol] || "0") : 0;
      const creditAmount = creditCol
        ? this.parseAmount(row[creditCol] || "0")
        : 0;

      if (debitAmount === 0 && creditAmount === 0) {
        return null;
      }

      return {
        date: this.formatDate(
          row[dateCol!],
          this.detectDateFormat(row[dateCol!])
        ),
        amount: debitAmount > 0 ? debitAmount : creditAmount,
        description: row[descCol!]?.toString().trim() || "",
        reference: this.extractReference(row[descCol!]?.toString() || ""),
        type: debitAmount > 0 ? "debit" : "credit",
        balance: balanceCol
          ? this.parseAmount(row[balanceCol] || "0")
          : undefined,
        bank: bankName.toUpperCase(),
      };
    } catch (error) {
      console.warn("Error normalizing CSV row:", error);
      return null;
    }
  }

  /**
   * Find column name from possible options
   */
  private findColumn(row: any, possibleNames: string[]): string | null {
    for (const name of possibleNames) {
      if (row[name] !== undefined) {
        return name;
      }
      // Case-insensitive search
      for (const key of Object.keys(row)) {
        if (key.toLowerCase() === name.toLowerCase()) {
          return key;
        }
      }
    }
    return null;
  }

  /**
   * Parse amount string to number
   */
  private parseAmount(amountStr: string): number {
    if (!amountStr || typeof amountStr !== "string") return 0;

    // Remove commas and spaces
    const cleanAmount = amountStr.replace(/[,\s]/g, "");

    // Handle different formats
    if (cleanAmount === "" || cleanAmount === "-") return 0;

    const amount = parseFloat(cleanAmount);
    return isNaN(amount) ? 0 : Math.abs(amount);
  }

  /**
   * Format date to ISO format (YYYY-MM-DD)
   */
  private formatDate(dateStr: string, format: string): string {
    try {
      let date: Date;

      switch (format) {
        case "DD/MM/YYYY":
        case "DD-MM-YYYY":
          const [day, month, year] = dateStr.split(/[\/\-]/);
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          break;
        case "MM/DD/YYYY":
        case "MM-DD-YYYY":
          const [m, d, y] = dateStr.split(/[\/\-]/);
          date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
          break;
        case "YYYY/MM/DD":
        case "YYYY-MM-DD":
          date = new Date(dateStr);
          break;
        default:
          date = new Date(dateStr);
      }

      return date.toISOString().split("T")[0];
    } catch (error) {
      console.warn("Date parsing error:", error);
      return new Date().toISOString().split("T")[0];
    }
  }

  /**
   * Detect date format from sample
   */
  private detectDateFormat(dateStr: string): string {
    if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(dateStr)) {
      return dateStr.includes("/") ? "YYYY/MM/DD" : "YYYY-MM-DD";
    }
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(dateStr)) {
      return dateStr.includes("/") ? "DD/MM/YYYY" : "DD-MM-YYYY";
    }
    return "DD/MM/YYYY"; // Default
  }

  /**
   * Extract reference number from description
   */
  private extractReference(description: string): string {
    // Look for common reference patterns
    const patterns = [
      /CHQ[\/\s]?(\d+)/i, // Cheque number
      /CHEQUE[\/\s]?(\d+)/i, // Cheque number
      /REF[\/\s]?(\d+)/i, // Reference number
      /TXN[\/\s]?(\d+)/i, // Transaction ID
      /UTR[\/\s]?(\w+)/i, // UTR number
      /IMPS[\/\s]?(\d+)/i, // IMPS reference
      /NEFT[\/\s]?(\d+)/i, // NEFT reference
      /(\d{10,})/, // Any long number
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // If no pattern matches, return first word or part of description
    return description.split(/\s+/)[0] || "";
  }

  /**
   * Normalize transactions for matching
   */
  normalizeTransactions(
    transactions: BankTransaction[],
    bankName: string
  ): NormalizedTransaction[] {
    return transactions.map((transaction) => ({
      date: transaction.date,
      amount: Math.round(transaction.amount * 100) / 100, // Round to 2 decimal places
      reference: this.normalizeReference(transaction.reference),
      description: this.normalizeDescription(transaction.description),
      type: transaction.type,
      bank: bankName.toUpperCase(),
      originalData: transaction,
    }));
  }

  /**
   * Normalize reference for better matching
   */
  private normalizeReference(reference: string): string {
    return reference.toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  /**
   * Normalize description for better matching
   */
  private normalizeDescription(description: string): string {
    return description
      .toUpperCase()
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 100); // Limit length
  }
}
