import { Button } from "../ui/Button";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportFormat: "excel" | "tally";
  onFormatChange: (format: "excel" | "tally") => void;
  exportDateRange: {
    from: string;
    to: string;
  };
  onDateRangeChange: (dateRange: { from: string; to: string }) => void;
  filters: {
    type?: string;
    status?: string;
    direction?: string;
  };
  totalCount: number;
  loading: boolean;
  onExport: () => void;
}

export default function ExportModal({
  isOpen,
  onClose,
  exportFormat,
  onFormatChange,
  exportDateRange,
  onDateRangeChange,
  filters,
  totalCount,
  loading,
  onExport,
}: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            📊 Export Payment Data
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">
              📂 Export Options
            </h4>
            <p className="text-green-700 text-sm">
              Export your payment data for accounting, analysis, or backup
              purposes.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="excel"
                  checked={exportFormat === "excel"}
                  onChange={(e) =>
                    onFormatChange(e.target.value as "excel" | "tally")
                  }
                  className="mr-2"
                />
                <span>
                  📊 Excel (.xlsx) - Detailed spreadsheet with multiple sheets
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="tally"
                  checked={exportFormat === "tally"}
                  onChange={(e) =>
                    onFormatChange(e.target.value as "excel" | "tally")
                  }
                  className="mr-2"
                />
                <span>
                  💼 Tally (.xml) - Import directly into Tally accounting
                  software
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date (Optional)
              </label>
              <input
                type="date"
                value={exportDateRange.from}
                onChange={(e) =>
                  onDateRangeChange({
                    ...exportDateRange,
                    from: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date (Optional)
              </label>
              <input
                type="date"
                value={exportDateRange.to}
                onChange={(e) =>
                  onDateRangeChange({
                    ...exportDateRange,
                    to: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <h5 className="font-medium text-gray-800 mb-2">
              Current Filters Applied:
            </h5>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Type: {filters.type || "All Types"}</div>
              <div>Status: {filters.status || "All Statuses"}</div>
              <div>Direction: {filters.direction || "All Directions"}</div>
              <div>Total Payments to Export: {totalCount}</div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onExport} disabled={loading}>
              {loading
                ? "Exporting..."
                : `Export as ${exportFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
