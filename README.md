# POS Serbajaya 🛍️

**A modern Point-of-Sale system built to help my father streamline his retail business operations.**

---

## 📋 Project Overview

**Status:** Self-initiated, Individual Project  
**Live Demo:** [pos-serbajaya.vercel.app](https://pos-serbajaya.vercel.app)  
**Built With:** Next.js 15 • TypeScript • Supabase • Tailwind CSS

### One-Liner
A user-friendly POS system designed to handle daily retail operations with real-time inventory tracking and sales reporting.

---

## 🎯 The Story: Why I Built This

My father runs a retail business and was managing transactions and inventory manually on paper. This was inefficient, error-prone, and didn't provide visibility into sales trends. I decided to build a digital solution to solve this real problem.

**Impact:** This system is now used daily in his store, helping him:
- Process transactions faster
- Track inventory in real-time
- Generate sales reports
- Reduce operational errors

---

## ✨ Key Features

- **👤 Passcode Authentication** - Secure login for cashiers
- **🛒 Transaction Management** - Add products, apply discounts, process payments
- **📦 Inventory Tracking** - Real-time stock updates
- **📊 Sales Reports** - Daily/weekly/monthly transaction history
- **💰 Payment Handling** - Support for cash and other payment methods
- **🔐 Row-Level Security** - Database-level access control with Supabase RLS

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, React |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Deployment** | Vercel |
| **Auth** | Passcode-based session management |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ini-Amin/pos-serbajaya.git
cd pos-serbajaya

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

See [supabase/README.md](./supabase/README.md) for detailed database setup instructions.

---

## 📁 Project Structure

```
pos-serbajaya/
├── app/
│   ├── page.tsx           # Dashboard
│   ├── transactions/      # Transaction management
│   ├── products/          # Product catalog
│   ├── reports/           # Sales reports
│   └── api/               # API routes
├── components/            # Reusable React components
├── lib/
│   ├── supabase/         # Database client
│   └── utils.ts          # Utility functions
├── supabase/
│   ├── schema.sql        # Database schema
│   └── seed.sql          # Demo data
└── .env.example          # Environment template
```

---

## 🎓 What I Learned

### Technical Growth
- **Full-stack development** - Building both frontend and backend with Next.js
- **Database design** - Creating normalized schemas for retail operations
- **Real-time updates** - Handling concurrent transactions and inventory changes
- **Authentication & security** - Implementing session management and row-level security
- **Deployment** - Deploying production applications to Vercel

### Soft Skills
- **User empathy** - Understanding real user needs (my father as the end user)
- **Feedback loops** - Getting daily feedback led to rapid iterations
- **Problem-solving** - Translating business requirements into technical solutions
- **The importance of UX** - A feature is only valuable if users can use it

### What I'd Do Differently Now
- ✅ Add comprehensive error handling and validation
- ✅ Implement unit and integration tests
- ✅ Use better state management (Context API or Redux)
- ✅ Create API documentation
- ✅ Add role-based access control (manager, cashier, admin)
- ✅ Optimize database queries with proper indexing

---

## 🔍 How to Test

1. **Access the app:** [pos-serbajaya.vercel.app](https://pos-serbajaya.vercel.app)
2. **Login:** Use the passcode (ask me for demo credentials)
3. **Try transactions:** Add products to cart, apply discounts, complete sale
4. **Check inventory:** See real-time stock updates
5. **View reports:** Navigate to reports section to see sales history

---

## 🚧 Future Improvements

- [ ] Mobile app version for on-the-go transactions
- [ ] Advanced analytics and business intelligence
- [ ] Integration with payment gateways
- [ ] Multi-store support
- [ ] Receipt printing
- [ ] Barcode scanning
- [ ] Employee management and commission tracking

---

## 📚 Key Files to Review

- **Database Schema:** [supabase/schema.sql](./supabase/schema.sql)
- **API Routes:** [app/api/](./app/api/)
- **Transaction Component:** [components/TransactionForm.tsx](./components/TransactionForm.tsx)

---

## 💡 Reflection

This project taught me that **good software isn't about perfect code—it's about solving real problems for real people.** Seeing my father use this system daily and benefit from it was more rewarding than any perfect architecture. It showed me why fundamentals like testing, documentation, and code organization matter: they make it easier to maintain and improve software that real users depend on.

---

## 📞 Contact

Have questions about this project? Reach out!

- **GitHub:** [@Ini-Amin](https://github.com/Ini-Amin)
- **Email:** [your-email@example.com]

---

**Last Updated:** 2026-06-04  
**Status:** Active (in daily use)
