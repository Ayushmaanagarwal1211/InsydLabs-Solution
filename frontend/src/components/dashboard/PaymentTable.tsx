import { Button, Badge } from "../ui";
import { Payment } from "../../types/payment";
import { BounceRiskService } from "../../services/bounceRiskService";

interface PaymentTableProps {
  payments: Payment[];
  allPayments: Payment[]; // For historical analysis in bounce risk calculation
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onViewPayment: (payment: Payment) => void;
  onEditPayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onShowBounceRisk?: (riskData: any) => void;
}

export default function PaymentTable({
  payments,
  allPayments,
  loading,
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  hasPrevPage,
  hasNextPage,
  onViewPayment,
  onEditPayment,
  onDeletePayment,
  onPageChange,
  onItemsPerPageChange,
  onShowBounceRisk,
}: PaymentTableProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Payment List</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Direction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                AI Risk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map((payment: Payment) => (
              <tr key={payment._id || payment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.type === "cheque"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {payment.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₹{payment.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge status={payment.status}>{payment.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      payment.direction === "incoming"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {payment.direction === "incoming"
                      ? "⬇ Incoming"
                      : "⬆ Outgoing"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {(() => {
                    if (
                      payment.status === "pending" &&
                      payment.type === "cheque" &&
                      payment.postDatedDate
                    ) {
                      const riskResult = BounceRiskService.calculateBounceRisk(
                        {
                          id: payment._id || payment.id || "",
                          amount: payment.amount,
                          issuedBy: payment.issuedBy || "",
                          bankName: payment.bankName || "",
                          postDatedDate: payment.postDatedDate,
                          date: payment.date,
                          status: payment.status,
                          type: payment.type,
                        },
                        allPayments.map((p) => ({
                          id: p._id || p.id || "",
                          amount: p.amount,
                          issuedBy: p.issuedBy || "",
                          bankName: p.bankName || "",
                          postDatedDate: p.postDatedDate,
                          date: p.date,
                          status: p.status,
                          type: p.type,
                        }))
                      );
                      return (
                        <button
                          onClick={() =>
                            onShowBounceRisk &&
                            onShowBounceRisk({
                              ...riskResult,
                              paymentId: payment._id || payment.id || "",
                              paymentAmount: payment.amount,
                              issuedBy: payment.issuedBy || "",
                            })
                          }
                          className="flex items-center space-x-1 hover:bg-gray-50 p-1 rounded transition-colors"
                          title="Click for detailed AI risk analysis"
                        >
                          <span className="text-sm">
                            {BounceRiskService.getRiskIcon(
                              riskResult.riskLevel
                            )}
                          </span>
                          <div>
                            <div
                              className={`text-sm font-medium ${riskResult.color}`}
                            >
                              {riskResult.probability}% {riskResult.riskLevel}
                            </div>
                            <div className="text-xs text-gray-400">
                              AI Analysis
                            </div>
                          </div>
                        </button>
                      );
                    } else {
                      return (
                        <div className="text-xs text-gray-400 italic">N/A</div>
                      );
                    }
                  })()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>
                    {payment.type === "cheque"
                      ? `Cheque: ${payment.chequeNumber} (${payment.bankName})`
                      : `Received by: ${payment.receivedBy}`}
                  </div>
                  {payment.imageUrl && (
                    <div className="mt-1">
                      <a
                        href={payment.imageUrl}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                      >
                        View Image
                      </a>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => onViewPayment(payment)}
                    >
                      View
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => onEditPayment(payment)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() =>
                        onDeletePayment(payment._id || payment.id || "")
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {payments.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No payments found</p>
          </div>
        )}

        {loading && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">Loading payments...</p>
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalCount)} of{" "}
                {totalCount} results
              </span>
              <div className="ml-4 flex items-center">
                <label className="mr-2">Items per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    onItemsPerPageChange(Number(e.target.value))
                  }
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                disabled={!hasPrevPage}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, currentPage - 2) + i;
                  if (pageNumber > totalPages) return null;

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => onPageChange(pageNumber)}
                      className={`px-3 py-1 text-sm rounded ${
                        pageNumber === currentPage
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="secondary"
                disabled={!hasNextPage}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
