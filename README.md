# 💼 ITILITE Lite - Corporate Travel & Expense Management

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=nodedotjs)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)

### 🚀 [Live Demo](https://txm-one.vercel.app/) | 📖 [Documentation](#features)

*A comprehensive SaaS platform for managing corporate travel bookings, expense reporting, and policy compliance with real-time analytics.*

</div>

---

## 🌟 Overview

ITILITE Lite is a robust, full-stack travel and expense management system designed to streamline corporate workflows. It connects employees, managers, and finance teams in a unified platform, automating policy checks, approval chains, and spending insights. Built with a decoupled architecture (Next.js Frontend + Node/Express Backend), it ensures scalability and performance.

### 💡 Why ITILITE Lite?

- **Policy-Driven**: Automatically flags expenses that exceed company limits
- **Role-Based Workflows**: Distinct portals for Employees, Managers, and Admins
- **Real-Time Analytics**: Visual insights into spending trends and policy violations
- **Seamless Approvals**: One-click approvals for managers and finance teams
- **Modern UI**: Clean, responsive interface built with Tailwind and Shadcn UI

---

## ✨ Key Features

### 🛫 Travel Management
- **Request Workflow**: Draft, submit, and track travel requests
- **Mock Booking Engine**: Browse flights and hotels with simulated inventory
- **Idempotency**: Prevents duplicate bookings with robust backend logic
- **Cost Estimation**: Predictive budgeting for trips

### 💸 Expense Reporting
- **Receipt Upload**: Drag-and-drop receipt scanning
- **Auto-Flagging**: Real-time detection of policy violations (e.g., spending over daily limit)
- **Finance Reconciliation**: Review queue for finance teams to approve/reject claims
- **Audit Trails**: Full history of actions and status changes

### 🛡️ Admin & Policy Engine
- **Dynamic Policy Builder**: Configure rules for flights, hotels, and daily allowances
- **Violation Analytics**: Track top spenders and frequent policy violators
- **User Management**: Role assignment and access control
- **Manager Performance**: Track approval turnaround times

### 📊 Analytics Dashboard
- **Spend Trends**: Interactive line charts showing monthly expenditure
- **Category Breakdown**: Visualize spend by flight, hotel, food, etc.
- **Top Spenders**: Identify high-spending employees
- **Metric Cards**: At-a-glance summary of total approved/rejected amounts

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS, Lucide Icons
- **Components**: Custom UI library (Cards, Modals, Badges)
- **Charts**: Recharts
- **State**: React Context + Hooks

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Auth**: JWT (JSON Web Tokens) with Secure Cookies strategy
- **Validation**: Joi / Zod
- **Security**: Helmet, CORS, Rate Limiting

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (Local or Atlas)
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Start-Up-Incubator/itilite-lite.git
   cd itilite-lite
   ```

2. **Install Dependencies**
   ```bash
   # Install Backend
   npm install

   # Install Frontend
   cd frontend
   npm install
   ```

3. **Environment Setup**

   **Backend (.env)**
   ```env
   PORT=3001
   MONGO_URI=mongodb://localhost:27017/itilite
   JWT_ACCESS_SECRET=your_secret_key
   JWT_REFRESH_SECRET=your_refresh_key
   ```

   **Frontend (.env.local)**
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
   ```

4. **Run Locally**

   **Terminal 1 (Backend)**
   ```bash
   npm start
   ```

   **Terminal 2 (Frontend)**
   ```bash
   cd frontend
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
itilite-lite/
├── src/                        # Backend Source
│   ├── controllers/            # Request handlers
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API endpoints
│   ├── services/               # Business logic
│   └── middlewares/            # Auth & Validation
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/                # App Router Pages
│   │   ├── components/         # Reusable UI
│   │   ├── lib/                # API Client & Utils
│   │   └── types/              # TypeScript Definitions
└── package.json                # Project config
```

---

## 🔐 Credentials (Demo)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@test.com | Test123 |
| **Manager** | manager@test.com | Test123 |
| **Employee** | employee@test.com | Test123 |

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for efficiency and compliance.**

[⬆ Back to Top](#-itilite-lite---corporate-travel--expense-management)

</div>
