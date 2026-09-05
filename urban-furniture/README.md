# Urban Furniture — Accounting ERP

A web-based Accounting ERP system for Urban Furniture built with React, Node.js, Express, PostgreSQL, Prisma, and JWT/OTP Authentication.

## Project Structure

```
urban-furniture/
├── frontend/             # React + Vite Frontend
│   ├── src/
│   │   ├── app/          # App.jsx, routes.jsx, ProtectedRoute.jsx
│   │   ├── components/   # Shared Layout & UI components
│   │   ├── context/      # AuthContext.jsx
│   │   ├── features/     # Feature modules (auth, admin, accountant, customer)
│   │   ├── services/     # Axios API services
│   │   └── utils/        # Constants & Validators
│   └── .env
├── backend/              # Node.js + Express Backend
│   ├── prisma/           # Database Schema & Seed script
│   ├── src/
│   │   ├── config/       # Env & Database configuration
│   │   ├── middleware/   # Authenticate, Authorize, Error Handling
│   │   ├── modules/      # Auth, Admin, Accountant, Customer modules
│   │   └── utils/        # Code Generator, Nodemailer Email Service
│   └── .env
└── package.json          # Workspace scripts
```

## Setup & Running Locally

### 1. Database Setup (Local PostgreSQL)
Make sure PostgreSQL is installed and running on your system. Update the `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/urban_furniture_db
```

### 2. Initialize Database & Seed
Run Prisma migrations and seed default Admin account:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Run Backend Server
```bash
cd backend
npm run dev
```
Backend will start on `http://localhost:5000`.

### 4. Run Frontend Server
```bash
cd frontend
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## Default Admin Credentials

- **Email**: `admin@urbanfurniture.com`
- **Password**: `Admin@123`

---

## User Roles & Login Flows

1. **ADMIN**
   - Credentials: Email + Password (No OTP)
   - Dashboard: `/admin/dashboard`
   - Actions: Add Accountant, Add User

2. **ACCOUNTANT**
   - Credentials: Email / Accountant Code + Password + OTP (sent via Nodemailer)
   - Types:
     - `SALES` Accountant → `/accountant/sales/dashboard`
     - `PURCHASE` Accountant → `/accountant/purchase/dashboard`

3. **CUSTOMER**
   - Credentials: Customer Code + Registered Email + OTP
   - Dashboard: `/customer/dashboard`
