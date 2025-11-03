import React from "react";
import { Payment } from "@/types/payment";

interface PaymentStatsProps {
  payments: Payment[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

export default function PaymentStats({ payments }: PaymentStatsProps) {
  const stats = React.useMemo(() => {
    const total = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    const byType = {
      cheque: { count: 0, amount: 0 },
      cash: { count: 0, amount: 0 },
    };

    const byStatus = {
      pending: { count: 0, amount: 0 },
      cleared: { count: 0, amount: 0 },
      bounced: { count: 0, amount: 0 },
      deposited: { count: 0, amount: 0 },
    };

    const today = new Date().toISOString().split("T")[0];
    let dueReminders = 0;

    payments.forEach((payment) => {
      // By type
      byType[payment.type].count++;
      byType[payment.type].amount += payment.amount;

      // By status
      byStatus[payment.status].count++;
      byStatus[payment.status].amount += payment.amount;

      // Due reminders
      if (
        payment.reminderDate &&
        payment.reminderDate <= today &&
        payment.status === "pending"
      ) {
        dueReminders++;
      }
    });

    return { total, totalAmount, byType, byStatus, dueReminders };
  }, [payments]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">#</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Total Payments</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">₹</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Total Amount</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(stats.totalAmount)}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">By Type</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Cheques:</span>
              <span className="font-medium">
                {stats.byType.cheque.count} (
                {formatCurrency(stats.byType.cheque.amount)})
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cash:</span>
              <span className="font-medium">
                {stats.byType.cash.count} (
                {formatCurrency(stats.byType.cash.amount)})
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">Status Overview</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="badge badge-pending">Pending</span>
              <span>{stats.byStatus.pending.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="badge badge-cleared">Cleared</span>
              <span>{stats.byStatus.cleared.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="badge badge-bounced">Bounced</span>
              <span>{stats.byStatus.bounced.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="badge badge-deposited">Deposited</span>
              <span>{stats.byStatus.deposited.count}</span>
            </div>
          </div>
          {stats.dueReminders > 0 && (
            <div className="mt-2 p-2 bg-yellow-50 rounded-md">
              <p className="text-xs text-yellow-800">
                <span className="font-medium">{stats.dueReminders}</span>{" "}
                reminder(s) due
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
