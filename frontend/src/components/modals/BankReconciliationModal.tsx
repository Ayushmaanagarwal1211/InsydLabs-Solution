import { Button } from "../ui/Button";

interface BankTransaction {
  date: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  reference: string;
}

interface ReconciliationResults {
  summary: {
    totalAppTransactions: number;
    matchedCount: number;
    unmatchedAppCount: number;
    matchPercentage: number;
  };
  matches: Array<{
    bankTransaction: BankTransaction;
    matchScore: number;
    matchReasons: string[];
  }>;
  unmatchedAppTransactions: Array<{
    amount: number;
    description: string;
    date: string;
  }>;
}

interface SupportedBank {
  code: string;
  name: string;
  formats: string[];
}

interface BankReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reconciliationStep: "upload" | "review" | "results";
  onStepChange: (step: "upload" | "review" | "results") => void;
  selectedBank: string;
  onBankChange: (bank: string) => void;
  bankStatementFile: File | null;
  onFileChange: (file: File | null) => void;
  bankTransactions: BankTransaction[];
  reconciliationResults: ReconciliationResults | null;
  supportedBanks: SupportedBank[];
  loading: boolean;
  onUpload: () => void;
  onAutoReconciliation: () => void;
}

export default function BankReconciliationModal({
  isOpen,
  onClose,
  reconciliationStep,
  onStepChange,
  selectedBank,
  onBankChange,
  bankStatementFile,
  onFileChange,
  bankTransactions,
  reconciliationResults,
  supportedBanks,
  loading,
  onUpload,
  onAutoReconciliation,
}: BankReconciliationModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    onStepChange("upload");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            🏦 Bank Statement Reconciliation
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Step 1: Upload Bank Statement */}
        {reconciliationStep === "upload" && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">
                📄 Upload Bank Statement
              </h4>
              <p className="text-blue-700 text-sm">
                Upload your bank statement (PDF or CSV) to automatically match
                transactions with your payment records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Bank *
                </label>
                <select
                  value={selectedBank}
                  onChange={(e) => onBankChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose your bank...</option>
                  {supportedBanks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name} ({bank.formats.join(", ")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Statement File *
                </label>
                <input
                  type="file"
                  accept=".pdf,.csv,.xlsx,.xls"
                  onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, CSV, Excel
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={onUpload}
                disabled={!bankStatementFile || !selectedBank || loading}
              >
                {loading ? "Processing..." : "Parse Statement"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Review Parsed Transactions */}
        {reconciliationStep === "review" && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">
                ✅ Statement Parsed Successfully
              </h4>
              <p className="text-green-700 text-sm">
                Found {bankTransactions.length} transactions. Review them below
                and click "Auto-Match" to reconcile.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bankTransactions.slice(0, 10).map((txn, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm">{txn.date}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <span
                          className={
                            txn.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {txn.type === "credit" ? "+" : "-"}₹
                          {txn.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            txn.type === "credit"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{txn.description}</td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {txn.reference}
                      </td>
                    </tr>
                  ))}
                  {bankTransactions.length > 10 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-3 text-center text-gray-500 italic"
                      >
                        ... and {bankTransactions.length - 10} more transactions
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => onStepChange("upload")}
              >
                Back
              </Button>
              <Button onClick={onAutoReconciliation} disabled={loading}>
                {loading ? "Matching..." : "🎯 Auto-Match Transactions"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Reconciliation Results */}
        {reconciliationStep === "results" && reconciliationResults && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">
                🎯 Reconciliation Results
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total App Transactions:</span>
                  <span className="ml-2 text-blue-700">
                    {reconciliationResults.summary.totalAppTransactions}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Matched:</span>
                  <span className="ml-2 text-green-600">
                    {reconciliationResults.summary.matchedCount}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Unmatched App:</span>
                  <span className="ml-2 text-orange-600">
                    {reconciliationResults.summary.unmatchedAppCount}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Match Rate:</span>
                  <span className="ml-2 text-blue-700">
                    {reconciliationResults.summary.matchPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Matched Transactions */}
            {reconciliationResults.matches.length > 0 && (
              <div>
                <h5 className="font-semibold text-green-800 mb-3">
                  ✅ Matched Transactions (
                  {reconciliationResults.matches.length})
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          App Transaction
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Bank Transaction
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Match Score
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          Reasons
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reconciliationResults.matches
                        .slice(0, 5)
                        .map((match: any, index: number) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm">
                              <div className="font-medium">
                                ₹{match.bankTransaction.amount.toLocaleString()}
                              </div>
                              <div className="text-gray-500">
                                {match.bankTransaction.date}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <div className="font-medium">
                                {match.bankTransaction.description}
                              </div>
                              <div className="text-gray-500">
                                Ref: {match.bankTransaction.reference}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  match.matchScore >= 90
                                    ? "bg-green-100 text-green-800"
                                    : match.matchScore >= 70
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {match.matchScore}%
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {match.matchReasons.slice(0, 2).join(", ")}
                              {match.matchReasons.length > 2 && "..."}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Unmatched App Transactions */}
            {reconciliationResults.unmatchedAppTransactions.length > 0 && (
              <div>
                <h5 className="font-semibold text-orange-800 mb-3">
                  ⚠️ Unmatched App Transactions (
                  {reconciliationResults.unmatchedAppTransactions.length})
                </h5>
                <div className="text-sm text-orange-700 mb-2">
                  These transactions in your app don't have corresponding
                  entries in the bank statement.
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {reconciliationResults.unmatchedAppTransactions
                    .slice(0, 5)
                    .map((txn: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between p-2 bg-orange-50 rounded"
                      >
                        <span>
                          ₹{txn.amount.toLocaleString()} -{" "}
                          {txn.description || "No description"}
                        </span>
                        <span className="text-orange-600">{txn.date}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => onStepChange("upload")}
              >
                Start Over
              </Button>
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
