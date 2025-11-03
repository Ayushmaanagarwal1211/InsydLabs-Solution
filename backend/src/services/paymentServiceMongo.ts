import { Payment, IPayment } from "../models/Payment";
import {
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentFilter,
} from "../types";
import { connectDB } from "../db/connection";

export class PaymentService {
  constructor() {
    this.initializeDB();
  }

  private async initializeDB() {
    await connectDB();
  }

  async getPayments(
    filters?: PaymentFilter,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    payments: IPayment[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    await connectDB();

    const query: any = {};

    if (filters) {
      if (filters.type) {
        query.type = filters.type;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.direction) {
        query.direction = filters.direction;
      }
      if (filters.dateFrom || filters.dateTo) {
        query.date = {};
        if (filters.dateFrom) {
          query.date.$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          query.date.$lte = filters.dateTo;
        }
      }
      if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
        query.amount = {};
        if (filters.amountMin !== undefined) {
          query.amount.$gte = filters.amountMin;
        }
        if (filters.amountMax !== undefined) {
          query.amount.$lte = filters.amountMax;
        }
      }
    }

    const skip = (page - 1) * limit;
    const totalCount = await Payment.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      payments,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getPaymentById(id: string): Promise<IPayment | null> {
    await connectDB();
    return await Payment.findById(id);
  }

  async createPayment(data: CreatePaymentRequest): Promise<IPayment> {
    await connectDB();

    const paymentData: any = {
      type: data.type,
      amount: data.amount,
      date: data.date,
      status: data.status || "pending",
      direction: data.direction,
      description: data.description,
      imageUrl: data.imageUrl,
    };

    // Add type-specific fields
    if (data.type === "cheque") {
      paymentData.chequeNumber = data.chequeNumber;
      paymentData.bankName = data.bankName;
      paymentData.accountNumber = data.accountNumber;
      paymentData.postDatedDate = data.postDatedDate;
      paymentData.issuedBy = data.issuedBy;

      // Set reminder date for post-dated cheques
      if (data.postDatedDate) {
        const reminderDate = new Date(data.postDatedDate);
        reminderDate.setDate(reminderDate.getDate() - 1); // Remind 1 day before
        paymentData.reminderDate = reminderDate.toISOString().split("T")[0];
      }
    } else if (data.type === "cash") {
      paymentData.receivedBy = data.receivedBy;
      paymentData.denominationBreakdown = data.denominationBreakdown;
      paymentData.status = "deposited"; // Cash is usually deposited immediately
    }

    const payment = new Payment(paymentData);
    return await payment.save();
  }

  async updatePayment(
    id: string,
    data: UpdatePaymentRequest
  ): Promise<IPayment | null> {
    await connectDB();
    return await Payment.findByIdAndUpdate(id, data, { new: true });
  }

  async deletePayment(id: string): Promise<boolean> {
    await connectDB();
    const result = await Payment.findByIdAndDelete(id);
    return !!result;
  }

  async getDueReminders(): Promise<IPayment[]> {
    await connectDB();
    const today = new Date().toISOString().split("T")[0];
    return await Payment.find({
      reminderDate: { $lte: today },
      status: "pending",
    });
  }

  async getPaymentStats() {
    await connectDB();

    const [
      totalStats,
      typeStats,
      statusStats,
      directionStats,
      pendingByDirectionStats,
      clearedDepositedStats,
      dueReminders,
    ] = await Promise.all([
      Payment.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
      Payment.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      Payment.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      Payment.aggregate([
        {
          $group: {
            _id: "$direction",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: { status: "pending" },
        },
        {
          $group: {
            _id: "$direction",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            $or: [{ status: "cleared" }, { status: "deposited" }],
          },
        },
        {
          $group: {
            _id: "$direction",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      this.getDueReminders(),
    ]);

    const stats = {
      total: totalStats[0]?.total || 0,
      totalAmount: totalStats[0]?.totalAmount || 0,
      byType: {
        cheque: { count: 0, amount: 0 },
        cash: { count: 0, amount: 0 },
      },
      byStatus: {
        pending: { count: 0, amount: 0 },
        cleared: { count: 0, amount: 0 },
        bounced: { count: 0, amount: 0 },
        deposited: { count: 0, amount: 0 },
      },
      byDirection: {
        incoming: { count: 0, amount: 0 },
        outgoing: { count: 0, amount: 0 },
      },
      pendingByDirection: {
        incoming: { count: 0, amount: 0 },
        outgoing: { count: 0, amount: 0 },
      },
      netAmount: 0,
      totalBounced: 0,
      totalProfit: 0,
      dueReminders: dueReminders.length,
    };

    // Populate type stats
    typeStats.forEach(
      (stat: { _id: string; count: number; amount: number }) => {
        const type = stat._id as "cheque" | "cash";
        if (type === "cheque" || type === "cash") {
          stats.byType[type] = { count: stat.count, amount: stat.amount };
        }
      }
    );

    // Populate status stats
    statusStats.forEach(
      (stat: { _id: string; count: number; amount: number }) => {
        const status = stat._id as
          | "pending"
          | "cleared"
          | "bounced"
          | "deposited";
        if (
          status === "pending" ||
          status === "cleared" ||
          status === "bounced" ||
          status === "deposited"
        ) {
          stats.byStatus[status] = { count: stat.count, amount: stat.amount };
        }
      }
    );

    // Populate direction stats and calculate net amount
    directionStats.forEach(
      (stat: { _id: string; count: number; amount: number }) => {
        const direction = stat._id as "incoming" | "outgoing";
        if (direction === "incoming" || direction === "outgoing") {
          stats.byDirection[direction] = {
            count: stat.count,
            amount: stat.amount,
          };
        }
      }
    );

    // Populate pending direction stats
    pendingByDirectionStats.forEach(
      (stat: { _id: string; count: number; amount: number }) => {
        const direction = stat._id as "incoming" | "outgoing";
        if (direction === "incoming" || direction === "outgoing") {
          stats.pendingByDirection[direction] = {
            count: stat.count,
            amount: stat.amount,
          };
        }
      }
    );

    // Calculate total bounced amount
    stats.totalBounced = stats.byStatus.bounced.amount;

    // Calculate total profit using cleared/deposited amounts by direction
    let clearedIncoming = 0;
    let clearedOutgoing = 0;

    clearedDepositedStats.forEach(
      (stat: { _id: string; count: number; amount: number }) => {
        if (stat._id === "incoming") {
          clearedIncoming = stat.amount;
        } else if (stat._id === "outgoing") {
          clearedOutgoing = stat.amount;
        }
      }
    );

    // Total Profit = Cleared/Deposited Incoming - Cleared/Deposited Outgoing
    stats.totalProfit = clearedIncoming - clearedOutgoing;

    // Calculate net amount (incoming - outgoing)
    stats.netAmount =
      stats.byDirection.incoming.amount - stats.byDirection.outgoing.amount;

    return stats;
  }
}
