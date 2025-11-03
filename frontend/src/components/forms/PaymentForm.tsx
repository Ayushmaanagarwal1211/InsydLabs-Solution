import React, { useState, useEffect } from "react";
import { Button, Input, Select } from "../ui";
import { ocrService, OCRResult } from "../../services/ocrService";
import { toast } from "react-toastify";

interface PaymentFormProps {
  payment?: any;
  onSubmit: (formData: any, selectedImage?: File) => void;
  onClose: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  payment,
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    type: payment?.type || "cheque",
    amount: payment?.amount || "",
    date: payment?.date || new Date().toISOString().split("T")[0],
    direction: payment?.direction || "incoming",
    status:
      payment?.status || (payment?.type === "cheque" ? "pending" : "deposited"),
    description: payment?.description || "",
    chequeNumber: payment?.chequeNumber || "",
    bankName: payment?.bankName || "",
    issuedBy: payment?.issuedBy || "",
    postDatedDate: payment?.postDatedDate || "",
    receivedBy: payment?.receivedBy || "",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // OCR states
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [showOCRPreview, setShowOCRPreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation for required fields
    const errors = [];

    if (
      !formData.amount ||
      isNaN(Number(formData.amount)) ||
      Number(formData.amount) <= 0
    ) {
      errors.push("Amount is required and must be greater than 0");
    }

    if (!formData.date) {
      errors.push("Date is required");
    }

    // Validation based on payment type
    if (formData.type === "cheque") {
      if (!formData.issuedBy?.trim()) {
        errors.push("Issued By is required for cheque payments");
      }
      if (!formData.bankName?.trim()) {
        errors.push("Bank Name is required for cheque payments");
      }
    } else if (formData.type === "cash") {
      if (!formData.receivedBy?.trim()) {
        errors.push("Received By is required for cash payments");
      }
    }

    if (errors.length > 0) {
      // Show validation errors using toast
      errors.forEach((error) => {
        toast.error(error, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });
      return;
    }

    onSubmit(formData, selectedImage || undefined);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear file input when switching to cash
    if (field === "type" && value === "cash") {
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (input) input.value = "";
    }
  };

  // Clear irrelevant fields when payment type changes
  useEffect(() => {
    if (formData.type === "cheque") {
      // Clear cash-specific fields
      setFormData((prev) => ({
        ...prev,
        receivedBy: "",
        status: prev.postDatedDate ? "pending" : "cleared",
      }));
    } else if (formData.type === "cash") {
      // Clear cheque-specific fields
      setFormData((prev) => ({
        ...prev,
        chequeNumber: "",
        bankName: "",
        issuedBy: "",
        postDatedDate: "",
        status: "deposited",
      }));
      // Clear image and OCR data for cash payments
      setSelectedImage(null);
      setImagePreview(null);
      setOcrResult(null);
      setShowOCRPreview(false);
    }
  }, [formData.type]);

  // Automatic status management based on post-dated date
  useEffect(() => {
    if (formData.type === "cheque") {
      if (!formData.postDatedDate || formData.postDatedDate === "") {
        // No post-dated date selected - set status to cleared
        setFormData((prev) => ({ ...prev, status: "cleared" }));
      } else {
        // Post-dated date selected - set status to pending
        setFormData((prev) => ({ ...prev, status: "pending" }));
      }
    }
  }, [formData.postDatedDate, formData.type]);

  // OCR Processing Functions
  const processImageOCR = async (file: File) => {
    if (formData.type !== "cheque") {
      alert("OCR is only available for cheque payments");
      return;
    }

    setIsProcessingOCR(true);
    setOcrResult(null);

    try {
      const result = await ocrService.processImage(file);
      setOcrResult(result);

      if (result.success && result.data) {
        setShowOCRPreview(true);
      } else {
        alert(`OCR failed: ${result.error}`);
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const applyOCRData = () => {
    if (ocrResult?.success && ocrResult.data) {
      const newData = { ...formData };
      console.log(ocrResult, "OCR");
      if (ocrResult.data.chequeNumber)
        newData.chequeNumber = ocrResult.data.chequeNumber;
      if (ocrResult.data.bankName) newData.bankName = ocrResult.data.bankName;
      if (ocrResult.data.amount) newData.amount = ocrResult.data.amount;
      if (ocrResult.data.date) newData.date = ocrResult.data.date;
      if (ocrResult.data.issuedBy) newData.issuedBy = ocrResult.data.issuedBy;

      setFormData(newData);
      setShowOCRPreview(false);
      alert("Cheque data auto-filled successfully!");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);

      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Auto-process OCR for cheque images
      if (formData.type === "cheque") {
        processImageOCR(file);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {payment ? "Edit Payment" : "Add New Payment"}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Image Upload for Cheque with OCR - Only show for cheque payments */}
          {formData.type === "cheque" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cheque Image (Auto-fill enabled)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />

              {isProcessingOCR && (
                <div className="mt-2 flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm">Processing cheque with OCR...</span>
                </div>
              )}

              {formData.type === "cheque" && !isProcessingOCR && (
                <p className="mt-1 text-xs text-gray-500">
                  ✨ Upload a cheque image to auto-fill fields
                </p>
              )}
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-32 object-cover rounded-md border"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        setOcrResult(null);
                        setShowOCRPreview(false);
                        // Reset file input
                        const input = document.querySelector(
                          'input[type="file"]'
                        ) as HTMLInputElement;
                        if (input) input.value = "";
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove Image
                    </button>

                    {formData.type === "cheque" &&
                      selectedImage &&
                      !isProcessingOCR && (
                        <button
                          type="button"
                          onClick={() => processImageOCR(selectedImage)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          🔍 Process Again
                        </button>
                      )}
                  </div>
                </div>
              )}
            </div>
          )}

          <Select
            label="Payment Type"
            value={formData.type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleChange("type", e.target.value)
            }
            options={[
              { value: "cheque", label: "Cheque" },
              { value: "cash", label: "Cash" },
            ]}
            required
          />

          <Input
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange("amount", e.target.value)
            }
            placeholder="Enter amount"
            required
          />

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange("date", e.target.value)
            }
            placeholder=""
            required
          />

          <Select
            label="Direction"
            value={formData.direction}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleChange("direction", e.target.value)
            }
            options={[
              { value: "incoming", label: "Incoming (Money In)" },
              { value: "outgoing", label: "Outgoing (Money Out)" },
            ]}
            required
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleChange("status", e.target.value)
            }
            options={[
              { value: "pending", label: "Pending" },
              { value: "cleared", label: "Cleared" },
              { value: "bounced", label: "Bounced" },
              { value: "deposited", label: "Deposited" },
            ]}
            required
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange("description", e.target.value)
            }
            placeholder="Enter description"
          />

          {formData.type === "cheque" && (
            <>
              <Input
                label="Cheque Number"
                value={formData.chequeNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange("chequeNumber", e.target.value)
                }
                placeholder="Enter cheque number"
                required
              />
              <Input
                label="Bank Name"
                value={formData.bankName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange("bankName", e.target.value)
                }
                placeholder="Enter bank name"
                required
              />
              <Input
                label="Issued By"
                value={formData.issuedBy}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange("issuedBy", e.target.value)
                }
                placeholder="Enter issuer name"
                required
              />
              <Input
                label="Post Dated Date"
                type="date"
                value={formData.postDatedDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange("postDatedDate", e.target.value)
                }
                placeholder=""
              />
            </>
          )}

          {formData.type === "cash" && (
            <Input
              label="Received By"
              value={formData.receivedBy}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange("receivedBy", e.target.value)
              }
              placeholder="Enter receiver name"
              required
            />
          )}

          {/* OCR Preview Modal */}
          {showOCRPreview && ocrResult?.success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-3 flex items-center">
                <span className="mr-2">🤖</span>
                OCR Extraction Results
              </h4>

              <div className="space-y-2 text-sm">
                {ocrResult.data?.chequeNumber && (
                  <div>
                    <strong>Cheque Number:</strong>{" "}
                    {ocrResult.data.chequeNumber}
                  </div>
                )}
                {ocrResult.data?.bankName && (
                  <div>
                    <strong>Bank:</strong> {ocrResult.data.bankName}
                  </div>
                )}
                {ocrResult.data?.amount && (
                  <div>
                    <strong>Amount:</strong> ₹{ocrResult.data.amount}
                  </div>
                )}
                {ocrResult.data?.date && (
                  <div>
                    <strong>Date:</strong> {ocrResult.data.date}
                  </div>
                )}
                {ocrResult.data?.issuedBy && (
                  <div>
                    <strong>Issued By:</strong> {ocrResult.data.issuedBy}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={applyOCRData}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  ✓ Apply Data
                </button>
                <button
                  type="button"
                  onClick={() => setShowOCRPreview(false)}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  ✗ Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary">
              {payment ? "Update" : "Add"} Payment
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
