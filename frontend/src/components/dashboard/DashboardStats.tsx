interface StatsData {
  total: number;
  totalAmount: number;
  byStatus?: {
    pending?: { amount: number };
  };
  byDirection?: {
    incoming?: { amount: number };
    outgoing?: { amount: number };
  };
  netAmount: number;
  pendingByDirection?: {
    incoming?: { amount: number };
    outgoing?: { amount: number };
  };
  totalBounced: number;
  totalProfit: number;
}


interface DashboardStatsProps {
  stats: StatsData | null;
  totalCount: number;
}

export default function DashboardStats({
  stats,
  totalCount,
}: DashboardStatsProps) {
  const totalPayments = stats?.total || totalCount || 0;
  const totalAmount = stats?.totalAmount || 0;
  const incomingAmount = stats?.byDirection?.incoming?.amount || 0;
  const outgoingAmount = stats?.byDirection?.outgoing?.amount || 0;

  const pendingIncomingAmount =
    stats?.pendingByDirection?.incoming?.amount || 0;
  const pendingOutgoingAmount =
    stats?.pendingByDirection?.outgoing?.amount || 0;

  const totalBounced = stats?.totalBounced || 0;
  const totalProfit = stats?.totalProfit || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-8 gap-4 mb-6 ">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-1">
          Total Payments
        </h3>
        <p className="text-xl font-bold text-blue-600">{totalPayments}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-1">Total Amount</h3>
        <p className="text-xl font-bold text-purple-600">
          ₹{totalAmount.toLocaleString()}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-1">Incoming</h3>
        <p className="text-xl font-bold text-green-600">
          ₹{incomingAmount.toLocaleString()}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-1">Outgoing</h3>
        <p className="text-xl font-bold text-red-600">
          ₹{outgoingAmount.toLocaleString()}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-1">
          Pending PDC's Incoming
        </h3>
        <p className="text-xl font-bold text-green-500">
          ₹{pendingIncomingAmount.toLocaleString()}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-1">
          Pending PDC's Outgoing
        </h3>
        <p className="text-xl font-bold text-orange-600">
          ₹{pendingOutgoingAmount.toLocaleString()}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-1">
          Total Bounced Payments
        </h3>
        <p className="text-xl font-bold text-red-500">
          ₹{totalBounced.toLocaleString()}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-1">
          Current Profit
        </h3>
        <p
          className={`text-xl font-bold ${
            totalProfit >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          ₹{totalProfit.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
