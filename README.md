# 💰 Family Money Tracker
## కుటుంబ మని ట్రాకర్

A full-stack bilingual (Telugu + English) family finance tracker.

---

## 🔐 Login Credentials
- **Username:** `admin`
- **Password:** `FamilyTracker@2024`

---

## 🚀 Quick Start

### Step 1 — Backend Setup
```bash
cd backend
npm install
# .env is already configured with your MongoDB
npm start
```

### Step 2 — Frontend Setup
```bash
cd frontend
npm install
npm start
```

Open: **http://localhost:3000**

---

## 📁 Folder Structure
```
family-money-tracker/
├── backend/
│   ├── server.js          ← Express entry point
│   ├── .env               ← ⭐ MongoDB + JWT config (ready!)
│   ├── config/db.js       ← MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   └── Transaction.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── transactions.js
│   └── middleware/auth.js
│
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── index.css
        ├── context/AppContext.js
        ├── i18n/translations.js
        ├── components/
        │   ├── Layout.js
        │   └── TransactionForm.js
        └── pages/
            ├── Login.js
            ├── Dashboard.js
            ├── AddTransaction.js
            ├── EditTransaction.js
            ├── TransactionHistory.js
            └── Settings.js
```

---

## ✨ Features
- ✅ JWT Authentication + bcrypt password encryption
- ✅ Telugu + English language toggle
- ✅ Dark mode / Light mode
- ✅ Add / Edit / Delete transactions
- ✅ Search + Filter + Sort transactions
- ✅ Dashboard with live balance + charts
- ✅ Monthly income vs expense charts
- ✅ Export to Excel (.xlsx)
- ✅ Payment methods: PhonePe, Google Pay, Cash, Bank Transfer
- ✅ Permanent MongoDB Atlas cloud storage
- ✅ Mobile + Tablet + Desktop responsive
- ✅ Rate limiting + Helmet security

---

## 🌐 Deploy to Production

### Backend → Railway / Render
1. Push backend folder to GitHub
2. Deploy on Railway or Render
3. Set environment variables from `.env`

### Frontend → Vercel / Netlify
1. Set `REACT_APP_API_URL=https://your-backend-url.com/api`
2. Deploy frontend folder

---

## 📱 Example Transactions
- "Basha – Mobile Purchase – ₹9400 – Google Pay" → Debit
- "Father – Cash received – ₹10000 – Cash" → Credit
- "నాన్న – అప్పు – ₹5000 – PhonePe" → Debit
