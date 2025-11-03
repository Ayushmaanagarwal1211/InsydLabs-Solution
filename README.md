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
│   │   ├── lib/          # Utilities and services
│   │   ├── pages/        # Next.js pages
│   │   ├── styles/       # CSS and Tailwind
│   │   └── types/        # TypeScript interfaces
└── problem_solving_document.md  # Business analysis
```

## 📊 API Endpoints

### Payments

- `GET /api/payments` - List all payments (with filters)
- `POST /api/payments` - Create new payment
- `GET /api/payments/:id` - Get payment by ID
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

### Analytics

- `GET /api/payments/stats/summary` - Get payment statistics
- `GET /api/payments/reminders/due` - Get due reminders

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

## 🚀 Deployment Options

### Option 1: Vercel + Railway/Render (Recommended)

**Frontend (Vercel):**

1. Push code to GitHub
2. Connect repository to Vercel
3. Set build settings:
   ```
   Build Command: cd frontend && npm run build
   Output Directory: frontend/.next
   Install Command: npm run install:all
   ```
4. Add environment variable: `NEXT_PUBLIC_API_URL=<your-backend-url>`

**Backend (Railway/Render):**

1. Connect repository to Railway or Render
2. Set build command: `cd backend && npm run build`
3. Set start command: `cd backend && npm start`
4. Set environment variables:
   ```
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=<your-frontend-url>
   ```

### Option 2: Docker Deployment

Create `Dockerfile` in root:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
COPY backend/ ./backend/
COPY frontend/ ./frontend/

RUN npm install
RUN npm run build

EXPOSE 3000 3001

CMD ["npm", "start"]
```

### Option 3: VPS/Cloud Server

1. Upload code to server
2. Install Node.js and dependencies
3. Set up PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   ```
4. Configure Nginx reverse proxy
5. Set up SSL certificates

## 🔧 Environment Variables

**Backend (.env):**

```
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend (.env.local):**

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🔒 Security Considerations

- File upload validation (images and PDFs only)
- CORS configuration for allowed origins
- Input validation using express-validator
- File size limits (5MB max)
- Helmet.js for security headers

## 🚧 Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication and multi-tenancy
- [ ] Email/SMS notifications for reminders
- [ ] Advanced reporting and exports
- [ ] Bank integration for automatic status updates
- [ ] Mobile app (React Native)
- [ ] Bulk payment import (CSV/Excel)

## 📝 Business Problem Solved

This system addresses critical pain points for AEC businesses:

1. **Payment Tracking**: Centralized system for cheques and cash
2. **Reminder System**: Automated alerts for post-dated cheques
3. **Status Management**: Clear visibility into payment stages
4. **Documentation**: Digital record-keeping with image attachments
5. **Compliance**: Proper bookkeeping for audits and tax purposes

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For questions or support, contact: [your-email@domain.com]

---

**Built with ❤️ for AEC businesses by Insyd Labs**
