import React from "react";
import { Button, Badge } from "../ui";
import { Payment } from "../../types/payment";

interface PaymentDetailsModalProps {
  payment: Payment;
  onClose: () => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  payment,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Payment Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Type
                </label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    payment.type === "cheque"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {payment.type}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Amount
                </label>
                <p className="text-lg font-bold text-gray-900">
                  ₹{payment.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Status
                </label>
                <Badge status={payment.status}>{payment.status}</Badge>
              </div>
            </div>
          </div>

          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Date
              </label>
              <p className="text-gray-900">{payment.date}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Direction
              </label>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  payment.direction === "incoming"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {payment.direction === "incoming"
                  ? "⬇ Incoming (Money In)"
                  : "⬆ Outgoing (Money Out)"}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Description
              </label>
              <p className="text-gray-900">
                {payment.description || "No description"}
              </p>
            </div>
          </div>

          {/* Cheque Specific Details */}
          {payment.type === "cheque" && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Cheque Details
              </h4>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Cheque Number
                    </label>
                    <p className="text-gray-900">
                      {payment.chequeNumber || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Bank Name
                    </label>
                    <p className="text-gray-900">
                      {payment.bankName || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Issued By
                    </label>
                    <p className="text-gray-900">
                      {payment.issuedBy || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Post Dated Date
                    </label>
                    <p className="text-gray-900">
                      {payment.postDatedDate || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cash Specific Details */}
          {payment.type === "cash" && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Cash Details
              </h4>
              <div className="bg-green-50 rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Received By
                  </label>
                  <p className="text-gray-900">
                    {payment.receivedBy || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Image Section */}
          {payment.imageUrl && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Attached Image
              </h4>
              <div className="border rounded-lg p-4">
                <img
                  src={payment.imageUrl}
                  alt="Payment attachment"
                  className="max-w-full h-auto rounded-md shadow-sm border"
                  style={{ maxHeight: "400px" }}
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => window.open(payment.imageUrl, "_blank")}
                  >
                    🔍 View Full Size
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = payment.imageUrl!;
                      link.download = `payment-${
                        payment._id || payment.id
                      }-image`;
                      link.click();
                    }}
                  >
                    💾 Download
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          {(payment.createdAt || payment.updatedAt) && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Record Information
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {payment.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Created
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(payment.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {payment.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Last Updated
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(payment.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;