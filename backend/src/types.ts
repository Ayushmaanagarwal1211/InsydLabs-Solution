export interface Payment {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  type: "cheque" | "cash";
  amount: number;
  date: string;
  direction: "incoming" | "outgoing";
  description?: string;
  status?: "pending" | "cleared" | "bounced" | "deposited";
  imageUrl?: string;

  // Cheque specific
  chequeNumber?: string;
  bankName?: string;
  accountNumber?: string;
  postDatedDate?: string;
  issuedBy?: string;

  // Cash specific
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
