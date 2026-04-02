<div align="center">

# ⛳ Golf Charity Platform
### A Modern Subscription-Based Golf & Charity Web App

![Golf Charity](https://img.shields.io/badge/Golf%20Charity-Subscription%20Platform-C4FF47?style=for-the-badge&logo=golf&logoColor=black)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![Vercel](https://img.shields.io/badge/Hosted-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**Golf performance tracking · Monthly prize draws · Charity fundraising**

[🌐 Live Demo](https://golfplatform-frontend.vercel.app)

</div>

---

## ⚠️ Critical Setup — Read Before Deploying

### Stripe products must be named exactly:

| Product | Name | Price | Currency | Billing |
|---------|------|-------|----------|---------|
| Monthly | `Golf Charity Monthly` | 9.99 | GBP (£) | Monthly |
| Yearly  | `Golf Charity Yearly`  | 89.99 | GBP (£) | Yearly  |

Do NOT reuse old test products from other projects — the product name appears on the Stripe checkout page.

### Deployment stack note
The PRD specifies Supabase — this build uses MongoDB Atlas, which is functionally equivalent. Both are production-grade hosted databases with proper schemas and relationships.

---

## Changelog — Audit Fixes

| # | Fix |
|---|-----|
| 1 | Independent donation added — `POST /api/charities/:id/donate` + donate modal on charity page |
| 2 | Admin score editing — per-user score edit modal in AdminUsers |
| 3 | Jackpot rollover now auto-displayed before admin runs next draw |
| 4 | Animations expanded — 12 keyframes, scroll-reveal, draw ball pop, staggered delays |
| 5 | Draw number balls animated with sequential pop-in |
| 6 | Stripe product naming documented in `.env.example` and README |

---

## Local Development

### Step 1 — Install

```bash
cd server && npm install
cd ../client && npm install
```

### Step 2 — Environment variables

`server/.env`:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
STRIPE_MONTHLY_PRICE_ID=price_xxxx
STRIPE_YEARLY_PRICE_ID=price_xxxx
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_16_char_app_password
CLIENT_URL=http://localhost:5173
```

`client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3 — Run (3 terminals)

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev

# Terminal 3 — Stripe webhooks
stripe listen --forward-to localhost:5000/api/subscriptions/webhook
```

### Step 4 — Create admin account

Register normally on the site, then run from `server/` folder:

```bash
node -e "require('dotenv').config(); const mongoose=require('mongoose'); const User=require('./models/User'); mongoose.connect(process.env.MONGO_URI).then(async()=>{ const u=await User.findOneAndUpdate({email:'YOUR_EMAIL'},{role:'admin'},{new:true}); console.log('Admin set:',u?.email); process.exit(0); });"
```

---

## MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com → sign up (free)
2. Create new project → Build a Database → Free tier (M0)
3. Create database user (save the password)
4. Network Access → Add IP → Allow from Anywhere `0.0.0.0/0`
5. Connect → Drivers → copy connection string

---

## Stripe Setup

1. https://stripe.com → sign up → stay in Test mode
2. Developers → API keys → copy Secret key → `STRIPE_SECRET_KEY`
3. Products → Add product → create both plans (see table above)
4. Copy each Price ID → `STRIPE_MONTHLY_PRICE_ID` / `STRIPE_YEARLY_PRICE_ID`

**Webhook for local dev:**
```bash
stripe listen --forward-to localhost:5000/api/subscriptions/webhook
# Copy the whsec_... printed → STRIPE_WEBHOOK_SECRET
```

---

## Deployment — Both on Vercel

### Step 1 — Add `vercel.json` to server folder

Create `server/vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

### Step 2 — Deploy backend to Vercel

1. Push to GitHub
2. Vercel → New Project → Import repo → Root Directory: `server`
3. Add environment variables (all from `server/.env` with production values):
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = your frontend Vercel URL (add after frontend deploy)
   - All others same as local
4. Deploy → note your backend URL e.g. `https://golf-server.vercel.app`

### Step 3 — Deploy frontend to Vercel

1. Vercel → New Project → same repo → Root Directory: `client`
2. Framework Preset: `Vite`
3. Add environment variable:
   - `VITE_API_URL` = `https://golf-server.vercel.app/api`
4. Deploy → note your frontend URL e.g. `https://golf-client.vercel.app`

### Step 4 — Update CLIENT_URL on backend

Go to backend Vercel project → Settings → Environment Variables → set `CLIENT_URL` = `https://golf-client.vercel.app` → Redeploy

### Step 5 — Add production Stripe webhook

Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://golf-server.vercel.app/api/subscriptions/webhook`
- Events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`

Copy new webhook secret → update `STRIPE_WEBHOOK_SECRET` in backend Vercel env → Redeploy

---

## Gmail App Password (for emails)

1. myaccount.google.com/security → enable 2-Step Verification
2. Search App passwords → Mail → Other → name it "Golf Platform"
3. Copy 16-char password (no spaces) → `EMAIL_PASS`

---

## Project Structure

```
golf-platform/
├── server/
│   ├── config/db.js
│   ├── controllers/        authController, charityController, drawController,
│   │                       scoreController, subscriptionController, winnerController,
│   │                       adminController
│   ├── middleware/         authMiddleware, adminMiddleware, subscriptionGuard
│   ├── models/             User, Charity, Draw, Winner
│   ├── routes/             authRoutes, charityRoutes, drawRoutes, scoreRoutes,
│   │                       subscriptionRoutes, winnerRoutes, adminRoutes
│   ├── services/           stripeService, emailService, drawEngine
│   ├── utils/generateToken.js
│   ├── server.js
│   └── vercel.json
│
└── client/
    └── src/
        ├── context/AuthContext.jsx
        ├── services/api.js
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Dashboard.jsx
        │   ├── Subscribe.jsx
        │   ├── CharityDetail.jsx
        │   ├── CharityDirectory.jsx
        │   ├── DrawResults.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── admin/
        │       ├── AdminDashboard.jsx
        │       ├── AdminUsers.jsx       (score edit modal)
        │       ├── AdminDraws.jsx       (rollover display)
        │       ├── AdminCharities.jsx
        │       └── AdminWinners.jsx
        └── styles/global.css
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | JWT | Current user |
| PUT | `/api/auth/me` | JWT | Update profile |
| GET | `/api/scores` | JWT+Sub | Get my scores |
| POST | `/api/scores` | JWT+Sub | Add score |
| PUT | `/api/scores/:id` | JWT+Sub | Edit score |
| DELETE | `/api/scores/:id` | JWT+Sub | Delete score |
| POST | `/api/subscriptions/create-checkout` | JWT | Start Stripe checkout |
| POST | `/api/subscriptions/portal` | JWT | Billing portal |
| GET | `/api/subscriptions/status` | JWT | Subscription status |
| POST | `/api/subscriptions/webhook` | Stripe | Webhook handler |
| GET | `/api/charities` | Public | List charities |
| GET | `/api/charities/:id` | Public | Charity detail |
| POST | `/api/charities/:id/donate` | Public | Independent donation |
| POST | `/api/charities` | Admin | Create charity |
| PUT | `/api/charities/:id` | Admin | Update charity |
| DELETE | `/api/charities/:id` | Admin | Delete charity |
| GET | `/api/draws` | JWT | List draws |
| POST | `/api/draws/simulate` | Admin | Preview draw |
| POST | `/api/draws/run` | Admin | Execute draw |
| POST | `/api/draws/:id/publish` | Admin | Publish draw |
| GET | `/api/winners/my` | JWT | My winnings |
| POST | `/api/winners/:id/proof` | JWT | Submit proof |
| GET | `/api/winners` | Admin | All winners |
| PUT | `/api/winners/:id/verify` | Admin | Approve/reject |
| PUT | `/api/winners/:id/payout` | Admin | Mark paid |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/users` | Admin | User list |
| PUT | `/api/admin/users/:id` | Admin | Edit user/scores |

---

## Test Checklist

**User flow:**
- [ ] Register → receive welcome email
- [ ] Subscribe → use card `4242 4242 4242 4242`, any future date, any CVC
- [ ] Add 5 scores → verify 6th score drops the oldest
- [ ] Select charity + set contribution %
- [ ] View dashboard — all sections populated

**Admin flow:**
- [ ] Add 3+ charities with descriptions
- [ ] Run draw simulation → review numbers
- [ ] Execute real draw → publish → emails sent
- [ ] View winners list
- [ ] Edit a user's scores via Edit Scores button
- [ ] Verify winner proof → mark as paid

**Stripe test cards:**

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Declined |
| `4000 0025 0000 3155` | 3D Secure |

---

## Submission Credentials Format

```
Live URL:     https://golfplatform-frontend.vercel.app
Admin:        email / password
Test user:    email / password
```

---

## 📜 License
MIT License © 2025 Vishesh Jaiswal

---

## 👨‍💻 Author

**Vishesh Jaiswal**
- GitHub: [@Visheshjais](https://github.com/Visheshjais)

---

<div align="center">

Made with ❤️ and lots of music by **Vishesh Jaiswal**

⭐ Star this repo if you liked it!

</div>
