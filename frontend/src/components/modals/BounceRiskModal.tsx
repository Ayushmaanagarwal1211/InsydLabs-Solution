import { Button } from "../ui";

interface BounceRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskData: {
    probability: number;
    riskLevel: string;
    reasons: string[];
    paymentId: string;
    paymentAmount: number;
    issuedBy: string;
  } | null;
}

export default function BounceRiskModal({
  isOpen,
  onClose,
  riskData,
}: BounceRiskModalProps) {
  if (!isOpen || !riskData) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "High":
        return "text-red-500 bg-red-50 border-red-200";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "Critical":
        return "🚨";
      case "High":
        return "⚠️";
      case "Medium":
        return "⚡";
      case "Low":
        return "✅";
      default:
        return "❓";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            AI Bounce Risk Analysis
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Payment Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Amount: ₹{riskData.paymentAmount.toLocaleString()}</div>
            <div>Issued By: {riskData.issuedBy}</div>
          </div>
        </div>

        {/* Risk Score */}
        <div
          className={`mb-6 p-4 rounded-lg border ${getRiskColor(
            riskData.riskLevel
          )}`}
        >
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">{getRiskIcon(riskData.riskLevel)}</span>
            <div>
              <div className="text-lg font-semibold">
                {riskData.probability}% Bounce Risk
              </div>
              <div className="text-sm font-medium">
                Risk Level: {riskData.riskLevel}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">
            Risk Factors Identified:
          </h4>
          <div className="space-y-2">
            {riskData.reasons.map((reason, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-orange-500 mt-1">•</span>
                <span className="text-sm text-gray-700">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Methodology */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            How AI Calculates Risk:
          </h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>• Payment amount analysis (25% weight)</div>
            <div>• Payer's historical bounce rate (40% weight)</div>
            <div>• Post-dated duration risk (15% weight)</div>
            <div>• Bank reliability metrics (10% weight)</div>
            <div>• Multiple PDCs from same payer (10% weight)</div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
          <div className="text-sm text-gray-600">
            {riskData.riskLevel === "Critical" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                🚨 <strong>High Alert:</strong> Consider requesting cash payment
                or additional guarantees before depositing this cheque.
              </div>
            )}
            {riskData.riskLevel === "High" && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                ⚠️ <strong>Caution:</strong> Monitor this payment closely and
                consider depositing closer to the PDC date.
              </div>
            )}
            {riskData.riskLevel === "Medium" && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                ⚡ <strong>Watch:</strong> Standard monitoring recommended.
                Follow up if payment delays occur.
              </div>
            )}
            {riskData.riskLevel === "Low" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                ✅ <strong>Safe:</strong> Low risk detected. Proceed with normal
                processing.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Close Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}
