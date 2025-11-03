import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import {
  Payment,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentFilter,
} from "../types";

export class PaymentService {
  private payments: Payment[] = [];
  private dataFile: string;

  constructor() {
    this.dataFile = path.join(__dirname, "../../data/payments.json");
    this.loadPayments();
  }

  private loadPayments(): void {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, "utf-8");
        this.payments = JSON.parse(data);
      } else {
        // Create data directory if it doesn't exist
        const dataDir = path.dirname(this.dataFile);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        this.savePayments();
      }
    } catch (error) {
      console.error("Error loading payments:", error);
      this.payments = [];
    }
  }

  private savePayments(): void {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.payments, null, 2));
    } catch (error) {
      console.error("Error saving payments:", error);
    }
  }

  getPayments(filters?: PaymentFilter): Payment[] {
    let filteredPayments = [...this.payments];

    if (filters) {
      if (filters.type) {
        filteredPayments = filteredPayments.filter(
          (p) => p.type === filters.type
        );
      }
      if (filters.status) {
        filteredPayments = filteredPayments.filter(
          (p) => p.status === filters.status
        );
      }
      if (filters.dateFrom) {
        filteredPayments = filteredPayments.filter(
          (p) => p.date >= filters.dateFrom!
        );
      }
      if (filters.dateTo) {
        filteredPayments = filteredPayments.filter(
          (p) => p.date <= filters.dateTo!
        );
      }
      if (filters.amountMin !== undefined) {
        filteredPayments = filteredPayments.filter(
          (p) => p.amount >= filters.amountMin!
        );
      }
      if (filters.amountMax !== undefined) {
        filteredPayments = filteredPayments.filter(
          (p) => p.amount <= filters.amountMax!
        );
      }
    }

    return filteredPayments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getPaymentById(id: string): Payment | undefined {
    return this.payments.find((p) => p.id === id);
  }

  createPayment(
    data: CreatePaymentRequest,
    file?: Express.Multer.File
  ): Payment {
    const now = new Date().toISOString();

    const payment: Payment = {
      id: uuidv4(),
      type: data.type,
      amount: data.amount,
      date: data.date,
      status: "pending",
      direction: data.direction || "incoming",
      description: data.description,
      createdAt: now,
      updatedAt: now,
      imageUrl: file ? `/uploads/${file.filename}` : undefined,
    };

    // Add type-specific fields
    if (data.type === "cheque") {
      payment.chequeNumber = data.chequeNumber;
      payment.bankName = data.bankName;
      payment.accountNumber = data.accountNumber;
      payment.postDatedDate = data.postDatedDate;
      payment.issuedBy = data.issuedBy;

      // Set reminder date for post-dated cheques
      if (data.postDatedDate) {
        const reminderDate = new Date(data.postDatedDate);
        reminderDate.setDate(reminderDate.getDate() - 1); // Remind 1 day before
        payment.reminderDate = reminderDate.toISOString().split("T")[0];
      }
    } else if (data.type === "cash") {
      payment.receivedBy = data.receivedBy;
      payment.denominationBreakdown = data.denominationBreakdown;
      payment.status = "deposited"; // Cash is usually deposited immediately
    }

    this.payments.push(payment);
    this.savePayments();

    return payment;
  }

  updatePayment(id: string, data: UpdatePaymentRequest): Payment | null {
    const paymentIndex = this.payments.findIndex((p) => p.id === id);
    if (paymentIndex === -1) {
      return null;
    }

    const payment = this.payments[paymentIndex];
    const updatedPayment: Payment = {
      ...payment,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.payments[paymentIndex] = updatedPayment;
    this.savePayments();

    return updatedPayment;
  }

  deletePayment(id: string): boolean {
    const paymentIndex = this.payments.findIndex((p) => p.id === id);
    if (paymentIndex === -1) {
      return false;
    }

    this.payments.splice(paymentIndex, 1);
    this.savePayments();

    return true;
  }

  getDueReminders(): Payment[] {
    const today = new Date().toISOString().split("T")[0];
    return this.payments.filter(
      (p) => p.reminderDate && p.reminderDate <= today && p.status === "pending"
    );
  }

  getPaymentStats() {
    const stats = {
      total: this.payments.length,
      totalAmount: this.payments.reduce((sum, p) => sum + p.amount, 0),
      byType: {
        cheque: {
          count: 0,
          amount: 0,
        },
        cash: {
          count: 0,
          amount: 0,
        },
      },
      byStatus: {
        pending: { count: 0, amount: 0 },
        cleared: { count: 0, amount: 0 },
        bounced: { count: 0, amount: 0 },
        deposited: { count: 0, amount: 0 },
      },
      dueReminders: this.getDueReminders().length,
    };

    this.payments.forEach((payment) => {
      // By type
      stats.byType[payment.type].count++;
      stats.byType[payment.type].amount += payment.amount;

      // By status
      stats.byStatus[payment.status].count++;
      stats.byStatus[payment.status].amount += payment.amount;
    });

    return stats;
  }
}
