import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  type: "cheque" | "cash";
  amount: number;
  date: string;
  status: "pending" | "cleared" | "bounced" | "deposited";
  direction: "incoming" | "outgoing";
  description?: string;

  // Cheque specific fields
  chequeNumber?: string;
  bankName?: string;
  accountNumber?: string;
  postDatedDate?: string;
  issuedBy?: string;

  // Cash specific fields
  receivedBy?: string;
  denominationBreakdown?: { [key: string]: number };

  // Common fields
  reminderDate?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["cheque", "cash"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "cleared", "bounced", "deposited"],
      default: "pending",
    },
    direction: {
      type: String,
      required: true,
      enum: ["incoming", "outgoing"],
    },
    description: {
      type: String,
      trim: true,
    },

    // Cheque specific fields
    chequeNumber: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    postDatedDate: {
      type: String,
    },
    issuedBy: {
      type: String,
      trim: true,
    },

    // Cash specific fields
    receivedBy: {
      type: String,
      trim: true,
    },
    denominationBreakdown: {
      type: Map,
      of: Number,
    },

    // Common fields
    reminderDate: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
PaymentSchema.index({ type: 1, status: 1, direction: 1, date: -1 });

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
