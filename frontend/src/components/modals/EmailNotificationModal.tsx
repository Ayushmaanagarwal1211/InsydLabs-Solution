interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationEmail: string;
  onEmailChange: (email: string) => void;
  onSave: () => void;
  savedEmail: string;
}

export default function EmailNotificationModal({
  isOpen,
  onClose,
  notificationEmail,
  onEmailChange,
  onSave,
  savedEmail,
}: EmailNotificationModalProps) {
  if (!isOpen) return null;

  const handleCancel = () => {
    onEmailChange(savedEmail);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          Setup Email Notifications
        </h3>
        <p className="text-gray-600 mb-4">
          Enter your email to receive reminders one day before post-dated
          cheques are due.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">🕘</span>
            <div>
              <p className="text-sm font-medium text-blue-900">
                Automatic Daily Reminders
              </p>
              <p className="text-xs text-blue-700">
                Emails are automatically sent daily at 9:00 AM for due cheques
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={notificationEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Enter your email address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!notificationEmail.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Email
          </button>
        </div>
      </div>
    </div>
  );
}
