# Insyd Payment Tracker

A comprehensive Cheque & Cash Payment Tracking System built for AEC (Architecture, Engineering, Construction) businesses to manage their offline payments efficiently.

## 🚀 Features

- **Payment Management**: Log and track both cheque and cash payments
- **Status Tracking**: Monitor payment status (pending, cleared, bounced, deposited)
- **Automated Reminders**: Get alerts for post-dated cheques and due payments
- **Visual Dashboard**: Real-time statistics and payment overviews
- **File Uploads**: Attach cheque images or receipts for record-keeping
- **Advanced Filtering**: Search and filter payments by type, status, date, amount
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

**Backend:**

- Express.js with TypeScript
- File-based JSON storage (easily upgradeable to database)
- Multer for file uploads
- CORS and security middleware

**Frontend:**

- Next.js 14 with TypeScript
- React Hook Form for form management
- Tailwind CSS for styling
- Axios for API calls
- Date-fns for date formatting

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Git (for version control)

## 🏃‍♂️ Quick Start

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd insyd-payment-tracker
npm run install:all
```

### 2. Development Mode

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually:
npm run dev:backend   # Backend on http://localhost:3001
npm run dev:frontend  # Frontend on http://localhost:3000
```

### 3. Production Build

```bash
npm run build
npm run start
```

## 🗂️ Project Structure

```
insyd-payment-tracker/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── types.ts        # TypeScript interfaces
│   │   └── server.ts       # Express app setup
│   ├── data/              # JSON data storage
│   └── uploads/           # Uploaded files
├── frontend/              # Next.js React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities
│   │   ├── app/        # Next.js app router
│   │   ├── services/       # services
│   │   └── types/        # TypeScript interfaces
└── problem_solving_document.md  # Business analysis
```

## 🎯 Usage Guide

### Adding a Cheque Payment

1. Click "Add Payment" button
2. Select "Cheque" type
3. Fill in amount, date, and cheque details
4. Optionally add post-dated date for automatic reminders
5. Upload cheque image if available
6. Submit to save

### Adding a Cash Payment

1. Click "Add Payment" button
2. Select "Cash" type
3. Fill in amount, date, and receiver details
4. Upload receipt if available
5. Submit to save (automatically marked as "deposited")

### Managing Payment Status

- Use the status dropdown in the payment list to update statuses
- Pending → Cleared: When cheque clears successfully
- Pending → Bounced: When cheque bounces
- Click "Edit" to modify payment details

### Viewing Analytics

- Dashboard shows real-time statistics
- Filter payments by type, status, date range, or amount
- Monitor due reminders for post-dated cheques

## 📝 Business Problem Solved

This system addresses critical pain points for AEC businesses:

1. **Payment Tracking**: Centralized system for cheques and cash
2. **Reminder System**: Automated alerts for post-dated cheques
3. **Status Management**: Clear visibility into payment stages
4. **Documentation**: Digital record-keeping with image attachments

---
