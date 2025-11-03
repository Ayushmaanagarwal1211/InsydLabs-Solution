import React from "react";
import { Payment } from "@/types/payment";
import { format } from "date-fns";
import StatusBadge from "./StatusBadge";

interface PaymentListProps {
  payments: Payment[];
  loading: boolean;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Payment["status"]) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

export default function PaymentList({
  payments,
  loading,
  onEdit,
  onDelete,
  onUpdateStatus,
}: PaymentListProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No payments found
        </h3>
        <p className="text-gray-500">
          Start by adding your first payment record.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type & Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mr-2 ${
                          payment.type === "cheque"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {payment.type.toUpperCase()}
                      </span>
                    </div>
                    {payment.type === "cheque" && payment.chequeNumber && (
                      <div className="text-sm text-gray-500 mt-1">
                        Cheque #{payment.chequeNumber}
                        {payment.bankName && ` - ${payment.bankName}`}
                      </div>
                    )}
                    {payment.type === "cash" && payment.receivedBy && (
                      <div className="text-sm text-gray-500 mt-1">
                        Received by: {payment.receivedBy}
                      </div>
                    )}
                    {payment.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {payment.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{format(new Date(payment.date), "MMM dd, yyyy")}</div>
                  {payment.postDatedDate && (
                    <div className="text-xs text-orange-600">
                      Due:{" "}
                      {format(new Date(payment.postDatedDate), "MMM dd, yyyy")}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge
                    status={payment.status}
                    paymentId={payment.id || payment._id || ""}
                    onStatusChange={(paymentId, newStatus) =>
                      onUpdateStatus(paymentId, newStatus)
                    }
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onEdit(payment)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(payment.id || payment._id || "")}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
