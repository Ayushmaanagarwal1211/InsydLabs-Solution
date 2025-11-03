import React, { useState, useRef, useEffect } from "react";

interface StatusBadgeProps {
  status: "pending" | "cleared" | "bounced" | "deposited";
  paymentId: string;
  onStatusChange: (
    paymentId: string,
    newStatus: "pending" | "cleared" | "bounced" | "deposited"
  ) => void;
  disabled?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  paymentId,
  onStatusChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    {
      value: "pending",
      label: "Pending",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "cleared",
      label: "Cleared",
      color: "bg-green-100 text-green-800",
    },
    { value: "bounced", label: "Bounced", color: "bg-red-100 text-red-800" },
    {
      value: "deposited",
      label: "Deposited",
      color: "bg-blue-100 text-blue-800",
    },
  ];

  const currentStatus = statusOptions.find((option) => option.value === status);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleStatusSelect = (
    newStatus: "pending" | "cleared" | "bounced" | "deposited"
  ) => {
    if (!disabled && newStatus !== status) {
      onStatusChange(paymentId, newStatus);
    }
    setIsOpen(false);
  };

  if (disabled) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatus?.color}`}
      >
        {currentStatus?.label}
      </span>
    );
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${currentStatus?.color} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        disabled={disabled}
      >
        {currentStatus?.label}
        <svg
          className={`ml-1 h-3 w-3 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  handleStatusSelect(
                    option.value as
                      | "pending"
                      | "cleared"
                      | "bounced"
                      | "deposited"
                  )
                }
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  option.value === status ? "bg-gray-50 font-medium" : ""
                }`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    option.color.split(" ")[0]
                  }`}
                ></span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusBadge;
