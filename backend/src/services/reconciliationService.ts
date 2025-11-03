import { PaymentService } from "./paymentServiceMongo";
import {
  BankStatementService,
  NormalizedTransaction,
  BankTransaction,
} from "./bankStatementService";
import { Payment } from "../models/Payment";

export interface ReconciliationMatch {
  appTransactionId: string;
  bankTransaction: NormalizedTransaction;
  matchScore: number;
  matchType: "exact" | "fuzzy" | "manual";
  matchReasons: string[];
}

export interface ReconciliationResult {
  matches: ReconciliationMatch[];
  unmatchedAppTransactions: any[];
  unmatchedBankTransactions: NormalizedTransaction[];
  summary: {
    totalAppTransactions: number;
    totalBankTransactions: number;
    matchedCount: number;
    unmatchedAppCount: number;
    unmatchedBankCount: number;
    matchPercentage: number;
  };
}

export class ReconciliationService {
  private paymentService: PaymentService;
  private bankStatementService: BankStatementService;

  constructor() {
    this.paymentService = new PaymentService();
    this.bankStatementService = new BankStatementService();
  }

  /**
   * Reconcile app transactions with bank statement
   */
  async reconcileTransactions(
    bankTransactions: NormalizedTransaction[],
    dateFrom?: string,
    dateTo?: string
  ): Promise<ReconciliationResult> {
    try {
      // Get app transactions for the date range
      const appTransactionsResult = await this.paymentService.getPayments(
        {
          dateFrom,
          dateTo,
        },
        1,
        10000 // Get all transactions
      );

      const appTransactions = appTransactionsResult.payments;

      // Perform matching
      const matches: ReconciliationMatch[] = [];
      const unmatchedBankTransactions = [...bankTransactions];
      const unmatchedAppTransactions = [...appTransactions];

      // Phase 1: Exact matches (amount + date + reference)
      for (const appTxn of appTransactions) {
        const exactMatch = this.findExactMatch(
          appTxn,
          unmatchedBankTransactions
        );
        if (exactMatch) {
          matches.push({
            appTransactionId: (appTxn as any)._id.toString(),
            bankTransaction: exactMatch.transaction,
            matchScore: 100,
            matchType: "exact",
            matchReasons: exactMatch.reasons,
          });

          // Remove from unmatched lists
          const bankIndex = unmatchedBankTransactions.indexOf(
            exactMatch.transaction
          );
          const appIndex = unmatchedAppTransactions.indexOf(appTxn);
          if (bankIndex > -1) unmatchedBankTransactions.splice(bankIndex, 1);
          if (appIndex > -1) unmatchedAppTransactions.splice(appIndex, 1);
        }
      }

      // Phase 2: Fuzzy matches (amount + date with tolerance)
      for (const appTxn of [...unmatchedAppTransactions]) {
        const fuzzyMatch = this.findFuzzyMatch(
          appTxn,
          unmatchedBankTransactions
        );
        if (fuzzyMatch && fuzzyMatch.score >= 70) {
          // 70% confidence threshold
          matches.push({
            appTransactionId: (appTxn as any)._id.toString(),
            bankTransaction: fuzzyMatch.transaction,
            matchScore: fuzzyMatch.score,
            matchType: "fuzzy",
            matchReasons: fuzzyMatch.reasons,
          });

          // Remove from unmatched lists
          const bankIndex = unmatchedBankTransactions.indexOf(
            fuzzyMatch.transaction
          );
          const appIndex = unmatchedAppTransactions.indexOf(appTxn);
          if (bankIndex > -1) unmatchedBankTransactions.splice(bankIndex, 1);
          if (appIndex > -1) unmatchedAppTransactions.splice(appIndex, 1);
        }
      }

      // Calculate summary
      const summary = {
        totalAppTransactions: appTransactions.length,
        totalBankTransactions: bankTransactions.length,
        matchedCount: matches.length,
        unmatchedAppCount: unmatchedAppTransactions.length,
        unmatchedBankCount: unmatchedBankTransactions.length,
        matchPercentage:
          appTransactions.length > 0
            ? Math.round((matches.length / appTransactions.length) * 100)
            : 0,
      };

      return {
        matches,
        unmatchedAppTransactions,
        unmatchedBankTransactions,
        summary,
      };
    } catch (error) {
      console.error("Error during reconciliation:", error);
      throw new Error(`Reconciliation failed: ${error}`);
    }
  }

  /**
   * Find exact match for app transaction
   */
  private findExactMatch(
    appTxn: any,
    bankTransactions: NormalizedTransaction[]
  ): { transaction: NormalizedTransaction; reasons: string[] } | null {
    for (const bankTxn of bankTransactions) {
      const reasons: string[] = [];
      let isMatch = true;

      // Check amount (exact match)
      if (Math.abs(appTxn.amount - bankTxn.amount) < 0.01) {
        reasons.push("Exact amount match");
      } else {
        isMatch = false;
      }

      // Check date (exact match or +/- 1 day for processing delays)
      const appDate = new Date(appTxn.date);
      const bankDate = new Date(bankTxn.date);
      const daysDiff = Math.abs(
        (appDate.getTime() - bankDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 1) {
        reasons.push(`Date match (${daysDiff} day difference)`);
      } else {
        isMatch = false;
      }

      // Check reference (if available)
      if (appTxn.chequeNumber || appTxn.description) {
        const appRef = (appTxn.chequeNumber || appTxn.description || "")
          .toString()
          .toUpperCase();
        const bankRef = bankTxn.reference.toUpperCase();

        if (
          appRef &&
          bankRef &&
          (appRef.includes(bankRef) || bankRef.includes(appRef))
        ) {
          reasons.push("Reference number match");
        } else if (appTxn.chequeNumber) {
          // For cheques, reference is more critical
          isMatch = false;
        }
      }

      // Check transaction direction
      const expectedBankType =
        appTxn.direction === "incoming" ? "credit" : "debit";
      if (bankTxn.type === expectedBankType) {
        reasons.push("Transaction direction match");
      } else {
        // Direction mismatch is critical
        isMatch = false;
      }

      if (isMatch && reasons.length >= 2) {
        return { transaction: bankTxn, reasons };
      }
    }

    return null;
  }

  /**
   * Find fuzzy match for app transaction
   */
  private findFuzzyMatch(
    appTxn: any,
    bankTransactions: NormalizedTransaction[]
  ): {
    transaction: NormalizedTransaction;
    score: number;
    reasons: string[];
  } | null {
    let bestMatch: {
      transaction: NormalizedTransaction;
      score: number;
      reasons: string[];
    } | null = null;

    for (const bankTxn of bankTransactions) {
      const score = this.calculateMatchScore(appTxn, bankTxn);

      if (score > 50 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          transaction: bankTxn,
          score: score,
          reasons: this.getMatchReasons(appTxn, bankTxn, score),
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate match score between app transaction and bank transaction
   */
  private calculateMatchScore(
    appTxn: any,
    bankTxn: NormalizedTransaction
  ): number {
    let score = 0;
    const weights = {
      amount: 40,
      date: 30,
      reference: 20,
      direction: 10,
    };

    // Amount similarity (exact match = full points, 1% diff = 90% points, etc.)
    const amountDiff = Math.abs(appTxn.amount - bankTxn.amount);
    const amountPercentDiff = (amountDiff / appTxn.amount) * 100;

    if (amountPercentDiff <= 0.1) {
      score += weights.amount;
    } else if (amountPercentDiff <= 1) {
      score += weights.amount * 0.9;
    } else if (amountPercentDiff <= 5) {
      score += weights.amount * 0.7;
    } else if (amountPercentDiff <= 10) {
      score += weights.amount * 0.5;
    }

    // Date similarity (same day = full points, 1 day diff = 80% points, etc.)
    const appDate = new Date(appTxn.date);
    const bankDate = new Date(bankTxn.date);
    const daysDiff = Math.abs(
      (appDate.getTime() - bankDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 0) {
      score += weights.date;
    } else if (daysDiff <= 1) {
      score += weights.date * 0.8;
    } else if (daysDiff <= 3) {
      score += weights.date * 0.6;
    } else if (daysDiff <= 7) {
      score += weights.date * 0.4;
    }

    // Reference similarity
    if (appTxn.chequeNumber || appTxn.description) {
      const appRef = (appTxn.chequeNumber || appTxn.description || "")
        .toString()
        .toUpperCase();
      const bankRef = bankTxn.reference.toUpperCase();

      if (appRef && bankRef) {
        if (appRef === bankRef) {
          score += weights.reference;
        } else if (appRef.includes(bankRef) || bankRef.includes(appRef)) {
          score += weights.reference * 0.8;
        } else {
          // Check for partial matches (last 4 digits, etc.)
          const appNumbers = appRef.match(/\d+/g) || [];
          const bankNumbers = bankRef.match(/\d+/g) || [];

          for (const appNum of appNumbers) {
            for (const bankNum of bankNumbers) {
              if (appNum.length >= 4 && bankNum.length >= 4) {
                if (appNum === bankNum) {
                  score += weights.reference * 0.6;
                } else if (
                  appNum.endsWith(bankNum.slice(-4)) ||
                  bankNum.endsWith(appNum.slice(-4))
                ) {
                  score += weights.reference * 0.4;
                }
              }
            }
          }
        }
      }
    }

    // Direction match
    const expectedBankType =
      appTxn.direction === "incoming" ? "credit" : "debit";
    if (bankTxn.type === expectedBankType) {
      score += weights.direction;
    }

    return Math.round(score);
  }

  /**
   * Get human-readable match reasons
   */
  private getMatchReasons(
    appTxn: any,
    bankTxn: NormalizedTransaction,
    score: number
  ): string[] {
    const reasons: string[] = [];

    // Amount check
    const amountDiff = Math.abs(appTxn.amount - bankTxn.amount);
    if (amountDiff < 0.01) {
      reasons.push("Exact amount match");
    } else if (amountDiff < appTxn.amount * 0.01) {
      reasons.push("Very close amount match");
    } else if (amountDiff < appTxn.amount * 0.05) {
      reasons.push("Close amount match");
    }

    // Date check
    const appDate = new Date(appTxn.date);
    const bankDate = new Date(bankTxn.date);
    const daysDiff = Math.abs(
      (appDate.getTime() - bankDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 0) {
      reasons.push("Same date");
    } else if (daysDiff <= 1) {
      reasons.push("1 day difference");
    } else if (daysDiff <= 3) {
      reasons.push(`${Math.round(daysDiff)} days difference`);
    }

    // Reference check
    if (
      appTxn.chequeNumber &&
      bankTxn.reference.includes(appTxn.chequeNumber)
    ) {
      reasons.push("Cheque number match");
    }

    // Direction check
    const expectedBankType =
      appTxn.direction === "incoming" ? "credit" : "debit";
    if (bankTxn.type === expectedBankType) {
      reasons.push("Transaction direction match");
    }

    reasons.push(`Match confidence: ${score}%`);

    return reasons;
  }

  /**
   * Process uploaded bank statement file
   */
  async processStatementFile(
    filePath: string,
    fileType: "pdf" | "csv",
    bankName: string
  ): Promise<{
    transactions: NormalizedTransaction[];
    summary: {
      totalParsed: number;
      creditCount: number;
      debitCount: number;
      totalCreditAmount: number;
      totalDebitAmount: number;
      dateRange: { from: string; to: string };
    };
  }> {
    try {
      // Parse the statement file
      const rawTransactions = await this.bankStatementService.parseStatement(
        filePath,
        fileType,
        bankName
      );

      // Normalize transactions
      const normalizedTransactions =
        this.bankStatementService.normalizeTransactions(
          rawTransactions,
          bankName
        );

      // Calculate summary
      const creditTransactions = normalizedTransactions.filter(
        (t) => t.type === "credit"
      );
      const debitTransactions = normalizedTransactions.filter(
        (t) => t.type === "debit"
      );

      const totalCreditAmount = creditTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );
      const totalDebitAmount = debitTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );

      // Find date range
      const dates = normalizedTransactions
        .map((t) => new Date(t.date))
        .sort((a, b) => a.getTime() - b.getTime());
      const dateRange = {
        from: dates.length > 0 ? dates[0].toISOString().split("T")[0] : "",
        to:
          dates.length > 0
            ? dates[dates.length - 1].toISOString().split("T")[0]
            : "",
      };

      const summary = {
        totalParsed: normalizedTransactions.length,
        creditCount: creditTransactions.length,
        debitCount: debitTransactions.length,
        totalCreditAmount,
        totalDebitAmount,
        dateRange,
      };

      return {
        transactions: normalizedTransactions,
        summary,
      };
    } catch (error) {
      console.error("Error processing statement file:", error);
      throw new Error(`Failed to process statement file: ${error}`);
    }
  }
}
