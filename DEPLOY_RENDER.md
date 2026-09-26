# 🚀 Complete Deployment Guide: Render.com (Backend + Database + Frontend)

This project contains:
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL (Prisma schema with full ERP data)
- **Frontend**: Vite + React 19 Single Page Application (SPA)

---

## ⚡ Method 1: 1-Click Blueprint (Recommended)

Render provides automatic Blueprint deployment using the included [`render.yaml`](./render.yaml).

1. Push your latest code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure Render deployment"
   git push origin <your-branch>
   ```
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** (top right) ➔ **Blueprint**.
4. Connect your GitHub repository (`odoo-urban-furniture`).
5. Render will automatically detect `render.yaml` and configure:
   - PostgreSQL Database (`urban-furniture-db`)
   - Backend Web Service (`urban-furniture-backend`)
   - Frontend Static Site (`urban-furniture-frontend`)
6. Click **Apply**.
7. Once deployed:
   - Copy the Backend URL (e.g., `https://urban-furniture-backend.onrender.com`).
   - Copy the Frontend URL (e.g., `https://urban-furniture-frontend.onrender.com`).
   - In Frontend environment variables, ensure `VITE_API_URL` is set to `https://urban-furniture-backend.onrender.com/api`.
   - In Backend environment variables, ensure `FRONTEND_URL` is set to your Frontend URL.

---

## 🛠️ Method 2: Manual Dashboard Setup (Step-by-Step)

If you prefer deploying step-by-step using the Render Web UI:

### Step 1: Create PostgreSQL Database on Render

1. On [Render Dashboard](https://dashboard.render.com), click **New +** ➔ **PostgreSQL**.
2. Fill in the details:
   - **Name**: `urban-furniture-db`
   - **Database**: `urban_furniture_db`
   - **User**: `urban_user`
   - **Region**: Choose closest to you (e.g., Singapore, Frankfurt, Oregon)
   - **Plan**: Free
3. Click **Create Database**.
4. Once created, scroll down to **Connections**:
   - Find and copy the **Internal Database URL** (e.g., `postgresql://urban_user:...@dpg-...-a:5432/urban_furniture_db`).
   *(The Internal URL is faster and free from bandwidth fees inside Render).*

---

### Step 2: Deploy Backend Web Service

1. Click **New +** ➔ **Web Service**.
2. Select **Build and deploy from a Git repository** and pick your repo (`odoo-urban-furniture`).
3. Configure the service:
   - **Name**: `urban-furniture-backend`
   - **Region**: Same region as your database
   - **Branch**: `feature-authentication` (or `main`)
   - **Root Directory**: `urban-furniture/backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma db push && node prisma/seed.js
     ```
     > **Why this build command?**
     > - `npm install`: Installs backend dependencies.
     > - `npx prisma generate`: Generates Prisma ORM client.
     > - `npx prisma db push`: Creates all database tables directly in your Render Postgres.
     > - `node prisma/seed.js`: Seeds 50+ Chart of Accounts, products, contacts, and ERP defaults.
   - **Start Command**:
     ```bash
     node src/server.js
     ```
   - **Plan**: Free
4. Scroll down to **Environment Variables** and add:

   | Key | Value | Description |
   |---|---|---|
   | `DATABASE_URL` | *Paste the Internal Database URL from Step 1* | PostgreSQL connection string |
   | `NODE_ENV` | `production` | Production mode |
   | `JWT_SECRET` | `uf_render_production_jwt_secret_key_2026_xyz` | Any long secret key (min 32 chars) |
   | `JWT_EXPIRES_IN` | `24h` | Token expiration |
   | `OTP_EXPIRY_MINUTES` | `5` | OTP timeout |
   | `OTP_MAX_ATTEMPTS` | `3` | OTP max tries |
   | `ADMIN_EMAIL` | `admin123@gmail.com` | Default admin email |
   | `ADMIN_PASSWORD` | `Admin123-` | Default admin password |
   | `ADMIN_NAME` | `Admin` | Default admin name |
   | `FRONTEND_URL` | `http://localhost:5173` *(Update with actual frontend URL after Step 3)* | CORS allowed origin |
   | `SMTP_HOST` | `smtp.gmail.com` | (Optional) Email SMTP |
   | `SMTP_PORT` | `587` | (Optional) SMTP Port |
   | `SMTP_USER` | `kanimozhi301006@gmail.com` | (Optional) Gmail address |
   | `SMTP_PASSWORD` | `gipx rqnc gawe ovkq` | (Optional) Gmail App Password |
   | `SMTP_FROM` | `kanimozhi301006@gmail.com` | (Optional) Sender email |

5. Click **Create Web Service**.
6. Wait for deployment to complete. Check the logs: you should see:
   ```
   ✅ Products: 40 records ready
   ✅ Seed complete!
   ✅ Server running on port ...
   👤 Official Admin verified / Initial Admin account bootstrapped: admin123@gmail.com
   ```
7. Copy your backend service URL at the top left (e.g., `https://urban-furniture-backend.onrender.com`).
   Test it in your browser: `https://urban-furniture-backend.onrender.com/api/health`
   Should return: `{"success":true,"message":"Urban Furniture API is running."}`

---

### Step 3: Deploy Frontend Static Site

1. Click **New +** ➔ **Static Site**.
2. Select your Git repository (`odoo-urban-furniture`).
3. Configure the frontend:
   - **Name**: `urban-furniture-frontend`
   - **Branch**: `feature-authentication` (or `main`)
   - **Root Directory**: `urban-furniture/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL`: `https://urban-furniture-backend.onrender.com/api`
     *(Replace with your actual backend URL from Step 2, and make sure to include `/api` at the end!)*
5. Click **Create Static Site**.

---

### Step 4: Configure SPA Routing (Crucial!)

Because React Router is used for client-side navigation, refreshing pages like `/login` or `/dashboard` will return a 404 error unless you add a rewrite rule:

1. In your **Frontend Static Site** on Render, go to **Redirects / Rewrites** in the left sidebar.
2. Click **Add Rule**:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
3. Click **Save Changes**.

---

### Step 5: Link Frontend URL to Backend CORS

1. Copy your live Frontend URL (e.g., `https://urban-furniture-frontend.onrender.com`).
2. Go back to your **Backend Web Service** ➔ **Environment**.
3. Edit `FRONTEND_URL` and set it to:
   `https://urban-furniture-frontend.onrender.com`
4. Click **Save Changes** (Render will automatically redeploy the backend).

---

## 🔑 Default Login Credentials

Once deployed, you can immediately log in:

- **URL**: `https://urban-furniture-frontend.onrender.com/login`
- **Role**: Admin
- **Email**: `admin123@gmail.com`
- **Password**: `Admin123-`
- **OTP**: Sent to configured email, or accessible via admin flow.

---

## 💡 Troubleshooting & Tips

1. **Free Tier Cold Starts**: Render's free Web Services spin down after 15 minutes of inactivity. The first request after sleep may take ~30-50 seconds to respond. Subsequent requests are instant.
2. **Prisma Schema changes**: If you ever update `schema.prisma`, simply pushing to git triggers `npx prisma db push` during build, which automatically updates the PostgreSQL schema without downtime.
3. **Database Inspection**: You can use Render's built-in **psql shell** under your Database dashboard tab, or use tools like DBeaver / TablePlus with the **External Database URL**.
