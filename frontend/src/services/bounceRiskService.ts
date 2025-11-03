interface BounceRiskResult {
  probability: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  reasons: string[];
  color: string;
}

interface PaymentForRisk {
  id: string;
  amount: number;
  issuedBy: string;
  bankName: string;
  postDatedDate?: string;
  date: string;
  status: string;
  type: string;
}



const calculateBounceRisk = (
  payment: PaymentForRisk,
  allPayments: PaymentForRisk[]
): BounceRiskResult => {
  if (
    payment.status !== "pending" ||
    payment.type !== "cheque" ||
    !payment.postDatedDate
  ) {
    return {
      probability: 0,
      riskLevel: "Low",
      reasons: ["Not applicable for non-PDC or cleared cheques"],
      color: "text-gray-500",
    };
  }

  let riskScore = 10; 
  const reasons: string[] = [];

  if (payment.amount > 500000) {
    riskScore += 35;
    reasons.push("Very high amount (>₹5L)");
  } else if (payment.amount > 200000) {
    riskScore += 25;
    reasons.push("High amount (>₹2L)");
  } else if (payment.amount > 100000) {
    riskScore += 15;
    reasons.push("Moderate amount (>₹1L)");
  }

  const payerHistoryData = getPayerHistory(payment.issuedBy, allPayments);
  if (payerHistoryData.bouncedCheques > 0) {
    const bounceRate =
      (payerHistoryData.bouncedCheques / payerHistoryData.totalCheques) * 100;
    if (bounceRate > 50) {
      riskScore += 40;
      reasons.push(`Payer has ${bounceRate.toFixed(0)}% bounce rate`);
    } else if (bounceRate > 25) {
      riskScore += 25;
      reasons.push(`Payer has ${bounceRate.toFixed(0)}% bounce rate`);
    } else if (bounceRate > 10) {
      riskScore += 15;
      reasons.push(`Payer has ${bounceRate.toFixed(0)}% bounce rate`);
    }
  } else if (payerHistoryData.totalCheques === 1) {
    riskScore += 10;
    reasons.push("New payer - no history");
  }

  const pdcDays = getDaysUntilPDC(payment.postDatedDate);
  if (pdcDays > 90) {
    riskScore += 20;
    reasons.push("Long-term PDC (>90 days)");
  } else if (pdcDays > 30) {
    riskScore += 10;
    reasons.push("Medium-term PDC (>30 days)");
  } else if (pdcDays < 0) {
    riskScore += 25;
    reasons.push("Overdue PDC");
  }

  const bankData = getBankReliability(payment.bankName, allPayments);
  if (bankData.bounceRate > 20) {
    riskScore += 15;
    reasons.push("Bank has high bounce rate");
  } else if (bankData.avgClearingDays > 5) {
    riskScore += 10;
    reasons.push("Bank has slow clearing");
  }

  const pendingPDCsFromPayer = allPayments.filter(
    (p) =>
      p.issuedBy === payment.issuedBy &&
      p.status === "pending" &&
      p.type === "cheque" &&
      p.postDatedDate &&
      p.id !== payment.id
  ).length;

  if (pendingPDCsFromPayer > 3) {
    riskScore += 20;
    reasons.push(`${pendingPDCsFromPayer + 1} pending PDCs from same payer`);
  } else if (pendingPDCsFromPayer > 1) {
    riskScore += 10;
    reasons.push(`${pendingPDCsFromPayer + 1} pending PDCs from same payer`);
  }

  const probability = Math.min(riskScore, 95);

  let riskLevel: "Low" | "Medium" | "High" | "Critical";
  let color: string;

  if (probability >= 70) {
    riskLevel = "Critical";
    color = "text-red-600";
  } else if (probability >= 50) {
    riskLevel = "High";
    color = "text-red-500";
  } else if (probability >= 30) {
    riskLevel = "Medium";
    color = "text-yellow-600";
  } else {
    riskLevel = "Low";
    color = "text-green-600";
  }

  if (reasons.length === 0) {
    reasons.push("Low risk factors detected");
  }

  return {
    probability,
    riskLevel,
    reasons,
    color,
  };
};

const getPayerHistory = (payerName: string, allPayments: PaymentForRisk[]) => {
  const payerPayments = allPayments.filter(
    (p) => p.issuedBy === payerName && p.type === "cheque"
  );
  const bouncedCheques = payerPayments.filter(
    (p) => p.status === "bounced"
  ).length;

  return {
    totalCheques: payerPayments.length,
    bouncedCheques,
    lastBounce: payerPayments.find((p) => p.status === "bounced")?.date,
  };
};

const getDaysUntilPDC = (postDatedDate: string): number => {
  const pdcDate = new Date(postDatedDate);
  const today = new Date();
  return Math.ceil(
    (pdcDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
};

const getBankReliability = (
  bankName: string,
  allPayments: PaymentForRisk[]
) => {
  const bankPayments = allPayments.filter(
    (p) => p.bankName === bankName && p.type === "cheque"
  );
  const bouncedCount = bankPayments.filter(
    (p) => p.status === "bounced"
  ).length;
  const bounceRate =
    bankPayments.length > 0 ? (bouncedCount / bankPayments.length) * 100 : 0;

  return {
    avgClearingDays: 3, // Simulated - would be calculated from actual clearing data
    bounceRate,
  };
};

const getRiskIcon = (riskLevel: string): string => {
  switch (riskLevel) {
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

export const BounceRiskService = {
  calculateBounceRisk,
  getRiskIcon,
};
