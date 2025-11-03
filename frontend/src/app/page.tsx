"use client";

import { useState, useEffect } from "react";
import { Payment } from "@/types/payment";
import { ocrService } from "@/services/ocrService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Bell,
  Plus,
  Upload,
  Download,
  Sparkles,
  Zap,
  FileText,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui";
import { PaymentForm } from "@/components/forms";
import {
  PaymentDetailsModal,
  EmailNotificationModal,
  ExportModal,
  BulkUploadModal,
  BounceRiskModal,
} from "@/components/modals";
import { Filters, DashboardStats, PaymentTable } from "@/components/dashboard";
import { API_BASE_URL } from "@/lib/apiConfig";

export default function PaymentTracker() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    direction: "",
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"excel" | "tally">("excel");
  const [exportDateRange, setExportDateRange] = useState({
    from: "",
    to: "",
  });

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadFiles, setBulkUploadFiles] = useState<File[]>([]);
  const [bulkProcessingStep, setBulkProcessingStep] = useState<
    "upload" | "processing" | "review"
  >("upload");
  const [bulkExtractedData, setBulkExtractedData] = useState<any[]>([]);
  const [bulkProcessingProgress, setBulkProcessingProgress] = useState(0);
  const [selectedCheques, setSelectedCheques] = useState<Set<string>>(
    new Set()
  );

  const [showBounceRiskModal, setShowBounceRiskModal] = useState(false);
  const [bounceRiskData, setBounceRiskData] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/stats`);
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadAllPayments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments?limit=10000`);
      if (response.ok) {
        const data = await response.json();
        setAllPayments(data.payments || []);
      }
    } catch (error) {
      console.error("Error loading all payments for analysis:", error);
    }
  };

  const loadPayments = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });

      if (filters.type) queryParams.append("type", filters.type);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.direction) queryParams.append("direction", filters.direction);

      const response = await fetch(`${API_BASE_URL}/payments?${queryParams}`);

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setCurrentPage(data.currentPage || 1);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setHasNextPage(data.hasNextPage || false);
        setHasPrevPage(data.hasPrevPage || false);
      } else {
        console.error("Failed to fetch payments");
        setPayments([]);
      }
    } catch (error) {
      console.error("Error loading payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedEmail = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/email`);
      if (response.ok) {
        const data = await response.json();
        if (data.email) {
          setSavedEmail(data.email);
          setNotificationEmail(data.email);
          localStorage.setItem("notificationEmail", data.email);
          return;
        }
      }
    } catch (error) {
      console.error("Error loading saved email from API:", error);
    }

    const saved = localStorage.getItem("notificationEmail");
    if (saved) {
      setSavedEmail(saved);
      setNotificationEmail(saved);
    }
  };

  useEffect(() => {
    loadPayments(1);
    loadStats();
  }, [filters.type, filters.status, filters.direction, itemsPerPage]);

  useEffect(() => {
    const initializeData = async () => {
      await loadStats();
      await loadSavedEmail();
      await loadAllPayments();
    };
    initializeData();
  }, []);

  const handleAddPayment = async (paymentData: any, imageFile?: File) => {
    try {
      setLoading(true);
      const formData = new FormData();

      Object.keys(paymentData).forEach((key) => {
        if (
          paymentData[key] !== undefined &&
          paymentData[key] !== null &&
          paymentData[key] !== ""
        ) {
          formData.append(key, paymentData[key]);
        }
      });

      if (imageFile) {
        formData.append("chequeImage", imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Payment added successfully!");
        setShowForm(false);
        await loadPayments(currentPage);
        await loadStats();
        await loadAllPayments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to add payment");
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Error adding payment");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPayment = async (paymentData: any, imageFile?: File) => {
    if (!editingPayment) return;

    try {
      setLoading(true);
      const formData = new FormData();

      Object.keys(paymentData).forEach((key) => {
        if (
          paymentData[key] !== undefined &&
          paymentData[key] !== null &&
          paymentData[key] !== ""
        ) {
          formData.append(key, paymentData[key]);
        }
      });

      if (imageFile) {
        formData.append("chequeImage", imageFile);
      }

      const response = await fetch(
        `${API_BASE_URL}/payments/${editingPayment._id || editingPayment.id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Payment updated successfully!");
        setEditingPayment(null);
        await loadPayments(currentPage);
        await loadStats();
        await loadAllPayments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update payment");
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Error updating payment");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (
      !paymentId ||
      !confirm("Are you sure you want to delete this payment?")
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Payment deleted successfully!");
        await loadPayments(currentPage);
        await loadStats();
        await loadAllPayments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete payment");
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Error deleting payment");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSave = async () => {
    if (!notificationEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/settings/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: notificationEmail }),
      });

      if (response.ok) {
        localStorage.setItem("notificationEmail", notificationEmail);
        setSavedEmail(notificationEmail);
        setShowEmailModal(false);
        toast.success(
          "Email saved successfully! You'll receive daily reminders for pending payments."
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to save email");
      }
    } catch (error) {
      console.error("Error saving email:", error);
      toast.error("Error saving email");
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      const requestBody = {
        format: exportFormat,
        dateRange: exportDateRange,
        filters: {
          ...(filters.type && { type: filters.type }),
          ...(filters.status && { status: filters.status }),
          ...(filters.direction && { direction: filters.direction }),
        },
      };

      const response = await fetch(`${API_BASE_URL}/payments/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `payments_${exportFormat}_${
          new Date().toISOString().split("T")[0]
        }.${exportFormat === "excel" ? "xlsx" : "xml"}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(
          `${exportFormat.toUpperCase()} export completed successfully!`
        );
        setShowExportModal(false);
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.message || `Failed to export ${exportFormat.toUpperCase()}`
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setBulkUploadFiles(files);
    setBulkProcessingStep("processing");
    setBulkProcessingProgress(0);

    processBulkFiles(files);
  };

  const processBulkFiles = async (files: File[]) => {
    const extractedData = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = ((i + 1) / files.length) * 100;
      setBulkProcessingProgress(progress);

      try {
        const result = await ocrService.processImage(file);
        const thumbnail = await createThumbnail(file);

        extractedData.push({
          id: `bulk_${Date.now()}_${i}`,
          fileName: file.name,
          thumbnail,
          status: "ready",
          extracted: {
            issuedBy: result.data?.issuedBy || "",
            amount: result.data?.amount || "",
            date: result.data?.date || "",
            chequeNumber: result.data?.chequeNumber || "",
            bankName: result.data?.bankName || "",
            direction: "incoming",
            postDatedDate: "",
          },
        });
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        extractedData.push({
          id: `bulk_${Date.now()}_${i}`,
          fileName: file.name,
          thumbnail: "",
          status: "error",
          error: `Failed to process: ${error}`,
        });
      }
    }

    setBulkExtractedData(extractedData);
    setBulkProcessingStep("review");
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const validateBulkItem = (item: any) => {
    const errors = [];

    if (
      !item.extracted?.amount ||
      isNaN(Number(item.extracted.amount)) ||
      Number(item.extracted.amount) <= 0
    ) {
      errors.push("Amount is required and must be greater than 0");
    }

    if (!item.extracted?.issuedBy?.trim()) {
      errors.push("Issued By is required");
    }

    if (!item.extracted?.date) {
      errors.push("Date is required");
    }

    if (!item.extracted?.chequeNumber?.trim()) {
      errors.push("Cheque Number is required");
    }

    if (!item.extracted?.bankName?.trim()) {
      errors.push("Bank Name is required");
    }

    return errors;
  };

  const handleBulkExtractedDataEdit = (
    id: string,
    field: string,
    value: string
  ) => {
    setBulkExtractedData((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              extracted: {
                ...item.extracted,
                [field]: value,
              },
            }
          : item
      )
    );
  };

  const handleChequeSelection = (id: string, selected: boolean) => {
    setSelectedCheques((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleBulkAddSelected = async () => {
    const selectedItems = bulkExtractedData.filter((item) =>
      selectedCheques.has(item.id)
    );

    try {
      setLoading(true);

      for (const item of selectedItems) {
        const paymentData = {
          type: "cheque",
          amount: item.extracted.amount,
          date: item.extracted.date,
          direction: item.extracted.direction,
          status: "pending",
          issuedBy: item.extracted.issuedBy,
          chequeNumber: item.extracted.chequeNumber,
          bankName: item.extracted.bankName,
          postDatedDate: item.extracted.postDatedDate,
        };

        await handleAddPayment(paymentData);
      }

      toast.success(`Successfully added ${selectedItems.length} payments!`);
      setShowBulkUpload(false);
      setBulkExtractedData([]);
      setSelectedCheques(new Set());
      setBulkProcessingStep("upload");
    } catch (error) {
      console.error("Error adding bulk payments:", error);
      toast.error("Error adding bulk payments");
    } finally {
      setLoading(false);
    }
  };

  const closeBulkUpload = () => {
    setShowBulkUpload(false);
    setBulkUploadFiles([]);
    setBulkExtractedData([]);
    setSelectedCheques(new Set());
    setBulkProcessingStep("upload");
    setBulkProcessingProgress(0);
  };

  const handleShowBounceRisk = (riskData: any) => {
    setBounceRiskData(riskData);
    setShowBounceRiskModal(true);
  };

  const closeBounceRiskModal = () => {
    setShowBounceRiskModal(false);
    setBounceRiskData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-full mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-2 animate-pulse">
                🤖 AI Payments Tracker
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Manage cheque and cash payments efficiently using AI-powered
                automation ✨
              </p>
            </div>
            <div className="flex gap-4 flex-wrap justify-center lg:justify-end items-center">
              <Button
                onClick={() => setShowForm(true)}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 border-0 relative overflow-hidden"
              >
                <Sparkles className="w-5 h-5 animate-pulse group-hover:animate-spin transition-all duration-300" />
                <span className="relative z-10">AI Add Single Payment</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Button>
              <Button
                onClick={() => setShowBulkUpload(true)}
                className="group bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 border-0 relative overflow-hidden"
              >
                <Zap className="w-5 h-5 animate-pulse group-hover:animate-bounce transition-all duration-300" />
                <span className="relative z-10">AI Bulk Upload Cheques</span>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Button>
              <Button
                onClick={() => setShowExportModal(true)}
                className="group bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 border-0 relative overflow-hidden"
              >
                <Download className="w-5 h-5 group-hover:animate-pulse transition-all duration-300" />
                <span className="relative z-10">Export Data</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Button>
              <Button
                onClick={() => setShowEmailModal(true)}
                className="group bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 border-0 relative overflow-hidden"
              >
                <Mail className="w-5 h-5 group-hover:animate-pulse transition-all duration-300" />
                <span className="relative z-10">
                  {savedEmail ? "Update Email" : "Add Email Alerts"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Button>
            </div>
          </div>

          <DashboardStats stats={stats} totalCount={totalCount} />

          <Filters filters={filters} onFiltersChange={setFilters} />
        </div>

        <PaymentTable
          payments={payments}
          allPayments={allPayments}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          hasPrevPage={hasPrevPage}
          hasNextPage={hasNextPage}
          onViewPayment={setViewingPayment}
          onEditPayment={setEditingPayment}
          onDeletePayment={handleDeletePayment}
          onShowBounceRisk={handleShowBounceRisk}
          onPageChange={(page) => {
            setCurrentPage(page);
            loadPayments(page);
          }}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage);
            setCurrentPage(1);
          }}
        />

        {(showForm || editingPayment) && (
          <PaymentForm
            payment={editingPayment}
            onSubmit={editingPayment ? handleEditPayment : handleAddPayment}
            onClose={() => {
              setShowForm(false);
              setEditingPayment(null);
            }}
          />
        )}

        {viewingPayment && (
          <PaymentDetailsModal
            payment={viewingPayment}
            onClose={() => setViewingPayment(null)}
          />
        )}

        <EmailNotificationModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          notificationEmail={notificationEmail}
          onEmailChange={setNotificationEmail}
          onSave={handleEmailSave}
          savedEmail={savedEmail}
        />

        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          exportFormat={exportFormat}
          onFormatChange={setExportFormat}
          exportDateRange={exportDateRange}
          onDateRangeChange={setExportDateRange}
          filters={filters}
          totalCount={totalCount}
          loading={loading}
          onExport={handleExport}
        />

        <BulkUploadModal
          isOpen={showBulkUpload}
          onClose={closeBulkUpload}
          bulkProcessingStep={bulkProcessingStep}
          bulkUploadFiles={bulkUploadFiles}
          bulkProcessingProgress={bulkProcessingProgress}
          bulkExtractedData={bulkExtractedData}
          selectedCheques={selectedCheques}
          onFileUpload={handleBulkFileUpload}
          onSelectAll={() =>
            setSelectedCheques(
              new Set(
                bulkExtractedData
                  .filter((item) => item.status === "ready")
                  .map((item) => item.id)
              )
            )
          }
          onClearSelection={() => setSelectedCheques(new Set())}
          onChequeSelection={handleChequeSelection}
          onDataEdit={handleBulkExtractedDataEdit}
          onAddSelected={handleBulkAddSelected}
          validateItem={validateBulkItem}
          loading={loading}
        />

        <BounceRiskModal
          isOpen={showBounceRiskModal}
          onClose={closeBounceRiskModal}
          riskData={bounceRiskData}
        />
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
