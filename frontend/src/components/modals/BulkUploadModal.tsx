import { Button } from "../ui/Button";

interface BulkExtractedItem {
  id: string;
  fileName: string;
  thumbnail: string;
  status: "processing" | "ready" | "error" | "incomplete";
  error?: string;
  extracted?: {
    issuedBy?: string;
    amount?: string;
    date?: string;
    chequeNumber?: string;
    bankName?: string;
    direction?: string;
    postDatedDate?: string;
  };
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulkProcessingStep: "upload" | "processing" | "review";
  bulkUploadFiles: File[];
  bulkProcessingProgress: number;
  bulkExtractedData: BulkExtractedItem[];
  selectedCheques: Set<string>;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onChequeSelection: (id: string, selected: boolean) => void;
  onDataEdit: (id: string, field: string, value: string) => void;
  onAddSelected: () => void;
  validateItem: (item: BulkExtractedItem) => string[];
  loading: boolean;
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  bulkProcessingStep,
  bulkUploadFiles,
  bulkProcessingProgress,
  bulkExtractedData,
  selectedCheques,
  onFileUpload,
  onSelectAll,
  onClearSelection,
  onChequeSelection,
  onDataEdit,
  onAddSelected,
  validateItem,
  loading,
}: BulkUploadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Bulk Upload Cheques</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Step 1: File Upload */}
          {bulkProcessingStep === "upload" && (
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  Upload Cheque Images
                </h3>
                <p className="text-gray-500 mb-6">
                  Drag & drop cheque images here or click to select and add data
                  automatically using AI
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFileUpload}
                  className="hidden"
                  id="bulk-file-input"
                />
                <label
                  htmlFor="bulk-file-input"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Select Images
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Processing */}
          {bulkProcessingStep === "processing" && (
            <div className="text-center">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-xl font-medium text-gray-700 mb-4">
                Processing Cheques...
              </h3>
              <div className="max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${bulkProcessingProgress}%` }}
                  />
                </div>
                <p className="text-gray-600">
                  Processing {bulkUploadFiles.length} cheques with OCR...
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review & Select */}
          {bulkProcessingStep === "review" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">
                  Review Extracted Data ({bulkExtractedData.length} cheques)
                </h3>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={onSelectAll}>
                    Select All
                  </Button>
                  <Button variant="secondary" onClick={onClearSelection}>
                    Clear Selection
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <input
                          type="checkbox"
                          checked={
                            selectedCheques.size ===
                            bulkExtractedData.filter(
                              (item) => item.status === "ready"
                            ).length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              onSelectAll();
                            } else {
                              onClearSelection();
                            }
                          }}
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Image
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Issued By *
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount *
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date *
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Cheque No. *
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Bank Name *
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Direction
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Post Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Validation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bulkExtractedData.map((item) => (
                      <tr
                        key={item.id}
                        className={
                          selectedCheques.has(item.id) ? "bg-blue-50" : ""
                        }
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedCheques.has(item.id)}
                            onChange={(e) =>
                              onChequeSelection(item.id, e.target.checked)
                            }
                            disabled={item.status !== "ready"}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <img
                            src={item.thumbnail}
                            alt={item.fileName}
                            className="w-12 h-8 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                            title={`Click to view ${item.fileName}`}
                            onClick={() => {
                              const newWindow = window.open();
                              if (newWindow) {
                                newWindow.document.write(
                                  `<img src="${item.thumbnail}" style="width: 100%; height: auto;" />`
                                );
                              }
                            }}
                          />
                        </td>

                        <td className="px-3 py-2">
                          {item.status === "ready" ? (
                            <input
                              type="text"
                              value={item.extracted?.issuedBy || ""}
                              onChange={(e) =>
                                onDataEdit(item.id, "issuedBy", e.target.value)
                              }
                              className={`w-full px-2 py-1 text-sm border rounded ${
                                !item.extracted?.issuedBy?.trim()
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                              placeholder="Enter issuer name *"
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          {item.status === "ready" ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.extracted?.amount || ""}
                              onChange={(e) =>
                                onDataEdit(item.id, "amount", e.target.value)
                              }
                              className={`w-full px-2 py-1 text-sm border rounded ${
                                !item.extracted?.amount ||
                                isNaN(Number(item.extracted.amount)) ||
                                Number(item.extracted.amount) <= 0
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                              placeholder="Amount *"
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {item.status === "ready" ? (
                            <input
                              type="date"
                              value={item.extracted?.date || ""}
                              onChange={(e) =>
                                onDataEdit(item.id, "date", e.target.value)
                              }
                              className={`w-full px-2 py-1 text-sm border rounded ${
                                !item.extracted?.date
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {item.status === "ready" ? (
                            <input
                              type="text"
                              value={item.extracted?.chequeNumber || ""}
                              onChange={(e) =>
                                onDataEdit(
                                  item.id,
                                  "chequeNumber",
                                  e.target.value
                                )
                              }
                              className={`w-full px-2 py-1 text-sm border rounded ${
                                !item.extracted?.chequeNumber?.trim()
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                              placeholder="Enter cheque number *"
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {item.status === "ready" ? (
                            <input
                              type="text"
                              value={item.extracted?.bankName || ""}
                              onChange={(e) =>
                                onDataEdit(item.id, "bankName", e.target.value)
                              }
                              className={`w-full px-2 py-1 text-sm border border-gray-300 rounded ${
                                !item.extracted?.bankName ||
                                item.extracted?.bankName.trim() === ""
                                  ? "border-red-300 bg-red-50"
                                  : "border-gray-300"
                              }`}
                              placeholder="Bank name"
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {item.status === "ready" ? (
                            <select
                              value={item.extracted?.direction || "incoming"}
                              onChange={(e) =>
                                onDataEdit(item.id, "direction", e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="incoming">Incoming</option>
                              <option value="outgoing">Outgoing</option>
                            </select>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {item.status === "ready" ? (
                            <input
                              type="date"
                              value={item.extracted?.postDatedDate || ""}
                              onChange={(e) =>
                                onDataEdit(
                                  item.id,
                                  "postDatedDate",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Post dated date"
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === "ready"
                                ? "bg-green-100 text-green-800"
                                : item.status === "incomplete"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.status === "ready" && "✅ Ready"}
                            {item.status === "incomplete" && "⚠️ Incomplete"}
                            {item.status === "error" && "❌ Error"}
                          </span>
                          {item.error && (
                            <div
                              className="text-xs text-red-600 mt-1"
                              title={item.error}
                            >
                              {item.error.length > 30
                                ? `${item.error.substring(0, 30)}...`
                                : item.error}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          {item.status === "ready" && (
                            <div className="space-y-1">
                              {(() => {
                                const errors = validateItem(item);
                                const requiredErrors = errors.filter(
                                  (e) =>
                                    e.includes("Amount is required") ||
                                    e.includes("Issued By is required") ||
                                    e.includes("Date is required") ||
                                    e.includes("Cheque Number is required") ||
                                    e.includes("Bank Name is required")
                                );
                                const warningErrors = errors.filter((e) =>
                                  e.includes("recommended")
                                );

                                return (
                                  <>
                                    {requiredErrors.length === 0 &&
                                      warningErrors.length === 0 && (
                                        <span className="inline-flex items-center text-xs text-green-600">
                                          ✅ Valid
                                        </span>
                                      )}
                                    {requiredErrors.length > 0 && (
                                      <span
                                        className="inline-flex items-center text-xs text-red-600 cursor-help"
                                        title={requiredErrors.join(", ")}
                                      >
                                        ❌ {requiredErrors.length} errors
                                      </span>
                                    )}
                                    {requiredErrors.length === 0 &&
                                      warningErrors.length > 0 && (
                                        <span
                                          className="inline-flex items-center text-xs text-yellow-600 cursor-help"
                                          title={warningErrors.join(", ")}
                                        >
                                          ⚠️ {warningErrors.length} warnings
                                        </span>
                                      )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {selectedCheques.size} cheques selected for import
                  </p>
                  <p className="text-xs text-gray-500">
                    Only successfully processed cheques can be selected
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    disabled={selectedCheques.size === 0 || loading}
                    onClick={onAddSelected}
                  >
                    {loading
                      ? "Adding..."
                      : `Add Selected Payments (${selectedCheques.size})`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
