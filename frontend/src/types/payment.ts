export interface Payment {
  _id?: string;
  id?: string;
  type: "cheque" | "cash";
  amount: number;
  date: string;
  status: "pending" | "cleared" | "bounced" | "deposited";
  direction: "incoming" | "outgoing";
  description?: string;

  chequeNumber?: string;
  bankName?: string;
  accountNumber?: string;
  postDatedDate?: string;
  issuedBy?: string;

  receivedBy?: string;
  denominationBreakdown?: { [key: string]: number };

  reminderDate?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentRequest {
  type: "cheque" | "cash";
  amount: number;
  date: string;
  direction: "incoming" | "outgoing";
  description?: string;

  chequeNumber?: string;
  bankName?: string;
  accountNumber?: string;
  postDatedDate?: string;
  issuedBy?: string;

  receivedBy?: string;
  denominationBreakdown?: { [key: string]: number };
}

export interface UpdatePaymentRequest {
  status?: "pending" | "cleared" | "bounced" | "deposited";
  direction?: "incoming" | "outgoing";
  reminderDate?: string;
  description?: string;
}

export interface PaymentFilter {
  type?: "cheque" | "cash";
  status?: "pending" | "cleared" | "bounced" | "deposited";
  direction?: "incoming" | "outgoing";
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface PaymentStats {
  total: number;
  totalAmount: number;
  byType: {
    cheque: { count: number; amount: number };
    cash: { count: number; amount: number };
  };
  byStatus: {
    pending: { count: number; amount: number };
    cleared: { count: number; amount: number };
    bounced: { count: number; amount: number };
    deposited: { count: number; amount: number };
  };
  byDirection: {
    incoming: { count: number; amount: number };
    outgoing: { count: number; amount: number };
  };
  netAmount: number;
  dueReminders: number;
}
