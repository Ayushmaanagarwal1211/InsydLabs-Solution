import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Payment, CreatePaymentRequest } from "@/types/payment";

interface PaymentFormProps {
  payment?: Payment | null;
  onSubmit: (data: CreatePaymentRequest & { image?: File }) => void;
  onClose: () => void;
}

export default function PaymentForm({
  payment,
  onSubmit,
  onClose,
}: PaymentFormProps) {
  const [paymentType, setPaymentType] = useState<"cheque" | "cash">("cheque");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreatePaymentRequest>({
    defaultValues: payment
      ? {
          type: payment.type,
          amount: payment.amount,
          date: payment.date,
          description: payment.description,
          chequeNumber: payment.chequeNumber,
          bankName: payment.bankName,
          accountNumber: payment.accountNumber,
          postDatedDate: payment.postDatedDate,
          issuedBy: payment.issuedBy,
          receivedBy: payment.receivedBy,
        }
      : {
          type: "cheque",
          date: new Date().toISOString().split("T")[0],
        },
  });

  useEffect(() => {
    if (payment) {
      setPaymentType(payment.type);
      reset({
        type: payment.type,
        amount: payment.amount,
        date: payment.date,
        description: payment.description,
        chequeNumber: payment.chequeNumber,
        bankName: payment.bankName,
        accountNumber: payment.accountNumber,
        postDatedDate: payment.postDatedDate,
        issuedBy: payment.issuedBy,
        receivedBy: payment.receivedBy,
      });
    }
  }, [payment, reset]);

  const watchedType = watch("type");

  useEffect(() => {
    setPaymentType(watchedType);
  }, [watchedType]);

  const handleFormSubmit = (data: CreatePaymentRequest) => {
    const submitData: CreatePaymentRequest & { image?: File } = { ...data };
    if (imageFile) {
      submitData.image = imageFile;
    }
    onSubmit(submitData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {payment ? "Edit Payment" : "Add New Payment"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Payment Type */}
            <div>
              <label className="form-label">Payment Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="cheque"
                    {...register("type", {
                      required: "Payment type is required",
                    })}
                    className="mr-2"
                  />
                  Cheque
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="cash"
                    {...register("type", {
                      required: "Payment type is required",
                    })}
                    className="mr-2"
                  />
                  Cash
                </label>
              </div>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("amount", {
                    required: "Amount is required",
                    min: {
                      value: 0.01,
                      message: "Amount must be greater than 0",
                    },
                  })}
                  className="form-input"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  {...register("date", { required: "Date is required" })}
                  className="form-input"
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                {...register("description")}
                className="form-input"
                rows={3}
                placeholder="Optional description or notes"
              />
            </div>

            {/* Cheque Specific Fields */}
            {paymentType === "cheque" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Cheque Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Cheque Number</label>
                    <input
                      type="text"
                      {...register("chequeNumber")}
                      className="form-input"
                      placeholder="e.g., 123456"
                    />
                  </div>

                  <div>
                    <label className="form-label">Bank Name</label>
                    <input
                      type="text"
                      {...register("bankName", {
                        required: "Bank name is required",
                      })}
                      className="form-input"
                      placeholder="e.g., HDFC Bank"
                    />
                    {errors.bankName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.bankName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Account Number</label>
                    <input
                      type="text"
                      {...register("accountNumber")}
                      className="form-input"
                      placeholder="Last 4 digits for privacy"
                    />
                  </div>

                  <div>
                    <label className="form-label">Post-Dated Date</label>
                    <input
                      type="date"
                      {...register("postDatedDate")}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Issued By</label>
                  <input
                    type="text"
                    {...register("issuedBy", {
                      required: "Issued By is required",
                    })}
                    className="form-input"
                    placeholder="Name of person/company who issued the cheque"
                  />
                  {errors.issuedBy && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.issuedBy.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Cash Specific Fields */}
            {paymentType === "cash" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Cash Details
                </h3>

                <div>
                  <label className="form-label">Received By</label>
                  <input
                    type="text"
                    {...register("receivedBy")}
                    className="form-input"
                    placeholder="Name of person who received the cash"
                  />
                </div>
              </div>
            )}

            {/* File Upload */}
            <div>
              <label className="form-label">
                Upload Image (Optional)
                <span className="text-sm text-gray-500 ml-2">
                  - Cheque photo, receipt, or other proof
                </span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleImageChange}
                className="form-input"
              />
              {imageFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {imageFile.name}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {payment ? "Update Payment" : "Add Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
