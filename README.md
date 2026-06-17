# DealClosedPartner.nl — Backend API ডকুমেন্টেশন (বাংলা)

> Base URL: `http://localhost:5000/api/v1`  
> সব Protected route-এ Header-এ `Authorization: Bearer <accessToken>` পাঠাতে হবে।

---

## পরিবর্তনের সারসংক্ষেপ (কী ছিল → কী হলো)

| বিষয় | আগে ছিল | এখন হয়েছে |
|---|---|---|
| Email Verification | `verified: true` (default) — যে কেউ সাথে সাথে লগইন করতে পারত | `verified: false` — রেজিস্ট্রেশনে OTP পাঠানো হয়, confirm করার পরেই লগইন হবে |
| User Model | `balance`, `referredBy`, `commissionRate`, `tosAcceptedAt`, `tosIp` field ছিল না | সব নতুন field যোগ হয়েছে |
| Referral Code | Field ছিল কিন্তু কোনো logic ছিল না | রেজিস্ট্রেশনে `?ref=CODE` দিলে referrer ট্র্যাক হয়; payment approve হলে referrer-এর balance-এ platform fee-র ২০% যায় |
| Application System | Model-এ array ছিল, কিন্তু কোনো route ছিল না | Freelancer apply করতে পারে, Company দেখতে/accept/reject করতে পারে |
| Payout System | কিছুই ছিল না | সম্পূর্ণ নতুন module — request, admin approve/reject, history |
| Commission Control | ছিল না | Admin যেকোনো user-এর commission rate (0–100%) সেট করতে পারে |
| Freelancer Dashboard | ছিল না | নতুন endpoint — balance, earnings, applied jobs, referral stats |
| Company Dashboard | ছিল না | নতুন endpoint — job stats, applicant count, payment summary |

---

## ১. Auth (লগইন / রেজিস্ট্রেশন)

### POST `/auth/register`
নতুন user রেজিস্ট্রেশন। রেজিস্ট্রেশনের পরে email-এ OTP পাঠানো হবে।

**Query Param:** `?ref=REFERRALCODE` (optional — কেউ রেফার করলে তার code দিন)

**Body:**
```json
{
  "firstName": "Rahim",
  "lastName": "Uddin",
  "email": "rahim@example.com",
  "password": "password123",
  "role": "seles",
  "industry": "<industryId>",
  "kvkVatNumber": "12345678"
}
```
- `role` হতে পারে: `seles` (freelancer), `business` (company), `admin`
- `business` role-এ `businessName` লাগবে

**Response:** `201` — user তৈরি হবে, email-এ OTP যাবে

---

### POST `/auth/verify-email`
রেজিস্ট্রেশনের পর OTP দিয়ে email verify করুন।

**Body:**
```json
{ "email": "rahim@example.com", "otp": "123456" }
```

---

### POST `/auth/login`
**Body:**
```json
{ "email": "rahim@example.com", "password": "password123" }
```
**Response:** `accessToken`, `refreshToken` (cookie-তে), `user`

---

### POST `/auth/refresh-token`
Cookie থেকে refresh token নিয়ে নতুন access token দেবে।

---

### POST `/auth/forgot-password`
**Body:** `{ "email": "rahim@example.com" }`
Email-এ OTP পাঠাবে।

---

### POST `/auth/reset-password`
**Body:** `{ "email": "rahim@example.com", "newPassword": "newpass123" }`

---

### POST `/auth/change-password` (Protected)
**Body:** `{ "oldPassword": "old", "newPassword": "new" }`

---

### POST `/auth/logout` (Protected)
Cookie clear করে logout করবে।

---

## ২. User / প্রোফাইল

### GET `/user/profile` (Protected)
লগইন করা user-এর নিজের profile দেখুন।

### PUT `/user/profile` (Protected)
Profile update করুন। `multipart/form-data` — `profileImage` file optional।

### GET `/user/all-user`
সব user-এর list। Query: `?searchTerm=&role=&status=&page=&limit=`

### GET `/user/:id`
একজন user-এর profile + তার সব assignment + course।

### DELETE `/user/:id` (Protected — Admin)
User delete করুন।

### PUT `/user/status/:id` (Protected — Admin)
**Body:** `{ "status": "approved" }` — `approved` / `rejected` / `pending`

### PUT `/user/commission/:id` (Protected — Admin) — নতুন
Admin যেকোনো user-এর commission rate পরিবর্তন করতে পারবে।

**Body:** `{ "commissionRate": 10 }` — ০ থেকে ১০০ এর মধ্যে

### GET `/user/wallet/balance` (Protected) — নতুন
লগইন করা user-এর wallet balance ও commission rate দেখুন।

**Response:**
```json
{ "balance": 150.50, "commissionRate": 15 }
```

### GET `/user/enrollment-history` (Protected)
User কোন assignment/course-এ enroll হয়েছে তার history।

### POST `/user/create-stripe-account` (Protected)
Stripe Express account তৈরি করুন (onboarding link পাবেন)।

### GET `/user/dashboard-link` (Protected)
Stripe dashboard login link পান।

---

## ৩. Assignment (Job Post)

### POST `/assigment` (Protected — Business)
নতুন job post করুন। `multipart/form-data`।

**Fields:** `banner` (file), `uploadFile` (file, optional), `data` (JSON string):
```json
{
  "title": "Logo Design",
  "description": "Need a logo",
  "budget": "500",
  "priceType": "fixed",
  "deadLine": "2026-12-31"
}
```

### GET `/assigment`
সব job list। Query: `?searchTerm=&status=&page=&limit=`

### GET `/assigment/my-assigments` (Protected — Business)
নিজের সব job post।

### GET `/assigment/:id`
একটি job-এর detail (reviews সহ)।

### PUT `/assigment/:id` (Protected — Business)
Job update করুন।

### DELETE `/assigment/:id` (Protected — Business)
Job delete করুন।

### PUT `/assigment/:id/status` (Protected — Admin)
**Body:** `{ "status": "approved" }`

---

### Application System — নতুন

### POST `/assigment/:id/apply` (Protected — Seles/Freelancer)
Freelancer job-এ apply করবে।

### GET `/assigment/:id/applicants` (Protected — Business)
Job owner সব applicant দেখবে।

### PUT `/assigment/:id/applicants/:freelancerId/accept` (Protected — Business)
একজন freelancer-কে accept করুন।

### PUT `/assigment/:id/applicants/:freelancerId/reject` (Protected — Business)
একজন freelancer-কে reject করুন (application list থেকে সরিয়ে দেবে)।

---

## ৪. Course

### POST `/course` (Protected — Business/Seles)
নতুন course তৈরি। `multipart/form-data` — `courseVideo`, `thumbnail`, `extraFiles[]`।

### GET `/course`
সব course। Query: `?searchTerm=&status=&page=&limit=`

### GET `/course/:id`
Course detail।

### PUT `/course/:id` (Protected)
Course update।

### DELETE `/course/:id` (Protected)
Course delete।

---

## ৫. Payment (Stripe)

### POST `/payment/assignment-checkout` (Protected)
Assignment-এর জন্য Stripe checkout session তৈরি।

**Body:** `{ "assasmtId": "<assignmentId>" }`

### POST `/payment/course-checkout` (Protected)
Course-এর জন্য Stripe checkout session।

**Body:** `{ "courseId": "<courseId>" }`

### PUT `/payment/approve-assignment/:paymentId` (Protected — Business)
Assignment payment approve — টাকা seller-এ transfer হবে (৮৫%), admin fee ১৫%।
Referral: buyer যদি কারো referral code দিয়ে রেজিস্টার করে থাকে, সেই referrer-এর balance-এ platform fee-র ২০% যাবে।

### PUT `/payment/reject-assignment/:paymentId` (Protected — Business)
Reject — buyer-কে refund।

### PUT `/payment/approve-course/:paymentId` (Protected — Business)
Course payment approve।

### PUT `/payment/reject-course/:paymentId` (Protected — Business)
Course payment reject।

### GET `/payment` (Protected — Admin)
সব payment। Query: `?searchTerm=&status=&minAmount=&maxAmount=&page=&limit=`

### GET `/payment/my` (Protected — Business/Seles)
নিজের payment history (seller হিসেবে)।

### GET `/payment/buyer-history` (Protected)
Buyer হিসেবে নিজের payment history।

### GET `/payment/:id` (Protected)
একটি payment-এর detail।

---

## ৬. Payout System — সম্পূর্ণ নতুন

Freelancer/Business তাদের wallet balance থেকে payout request করতে পারবে।
সর্বনিম্ন payout amount: **$20**

### POST `/payout` (Protected — Seles/Business)
Payout request পাঠান।

**Body (IBAN):**
```json
{
  "amount": 100,
  "method": "iban",
  "accountDetails": "NL91ABNA0417164300"
}
```

**Body (PayPal):**
```json
{
  "amount": 50,
  "method": "paypal",
  "accountDetails": "myemail@paypal.com"
}
```

### GET `/payout/my` (Protected — Seles/Business)
নিজের সব payout request history।

### GET `/payout` (Protected — Admin)
সব payout request।

### PUT `/payout/:id/approve` (Protected — Admin)
Payout approve করুন।

**Body:** `{ "adminNote": "Processed via bank transfer" }` (optional)

### PUT `/payout/:id/reject` (Protected — Admin)
Payout reject করুন — balance ফেরত যাবে।

**Body:** `{ "adminNote": "Invalid IBAN" }` (required)

---

## ৭. Dashboard

### GET `/dashboard/overview` (Protected — Admin)
মোট revenue, business count, seles count।

### GET `/dashboard/monthly-earnings` (Protected — Admin)
মাসিক earnings। Query: `?year=2026`

### GET `/dashboard/freelancer` (Protected — Seles) — নতুন
Freelancer-এর নিজের dashboard।

**Response:**
```json
{
  "user": { "firstName": "...", "balance": 150, "commissionRate": 15 },
  "stats": {
    "walletBalance": 150,
    "commissionRate": 15,
    "appliedAssignments": 5,
    "totalCourses": 2,
    "approvedCourses": 1,
    "totalEarned": 850,
    "referralCount": 3
  }
}
```

### GET `/dashboard/company` (Protected — Business) — নতুন
Company-র নিজের dashboard।

**Response:**
```json
{
  "user": { "businessName": "...", "balance": 0 },
  "stats": {
    "totalJobs": 10,
    "approvedJobs": 7,
    "pendingJobs": 3,
    "totalApplicants": 42,
    "paymentSummary": {
      "pending": { "count": 2, "total": 500 },
      "approved": { "count": 5, "total": 2500 }
    }
  }
}
```

---

## ৮. Leaderboard

### GET `/leaderboard`
Query: `?filter=weekly` / `monthly` / `yearly` (default: yearly)
Freelancer-দের ranking — course sales ও rating-এর উপর ভিত্তি করে।

---

## ৯. Review

### POST `/review` (Protected)
Review দিন।

**Body:** `{ "rating": 5, "comment": "Excellent!", "assignment": "<id>" }` বা `"course": "<id>"`

### GET `/review`
সব review।

### PUT `/review/:id` (Protected)
Review update।

### DELETE `/review/:id` (Protected)
Review delete।

---

## ১০. Chat

### POST `/conversation` (Protected)
নতুন conversation শুরু।

**Body:** `{ "receiverId": "<userId>" }`

### GET `/conversation` (Protected)
নিজের সব conversation।

### POST `/message` (Protected)
Message পাঠান। `multipart/form-data` — `attachment` (file, optional)।

**Body/Form:** `conversationId`, `message`

### GET `/message/:conversationId` (Protected)
একটি conversation-এর সব message।

### PUT `/message/:id` (Protected)
Message edit।

### DELETE `/message/:id` (Protected)
Message delete।

---

## ১১. Blog

### POST `/blog` (Protected — Admin)
Blog তৈরি।

### GET `/blog`
সব blog।

### GET `/blog/:id`
Blog detail।

### PUT `/blog/:id` (Protected — Admin)
Blog update।

### DELETE `/blog/:id` (Protected — Admin)
Blog delete।

---

## ১২. Industry

### POST `/industry` (Protected — Admin)
Industry তৈরি।

### GET `/industry`
সব industry।

### GET `/industry/:id`
Industry detail।

### PUT `/industry/:id` (Protected — Admin)
Industry update।

### DELETE `/industry/:id` (Protected — Admin)
Industry delete।

---

## Role সারণী

| Role | মানে | সংক্ষিপ্ত বিবরণ |
|---|---|---|
| `admin` | Admin | Platform পরিচালনা করে |
| `business` | Company | Job post করে, freelancer hire করে |
| `seles` | Freelancer | Job-এ apply করে, course তৈরি করে |

---

## নতুন যা যোগ হয়েছে (সংক্ষিপ্ত)

1. **Email Verification Bug ফিক্স** — এখন OTP confirm না করলে login হবে না
2. **User Model** — `balance`, `referredBy`, `commissionRate`, `tosAcceptedAt`, `tosIp` field যোগ
3. **Referral System** — `?ref=CODE` দিয়ে register করলে tracking হয়; payment approve-এ referrer ২০% পায়
4. **Application System** — Freelancer apply করতে পারে, company accept/reject করতে পারে
5. **Payout System** — IBAN/PayPal payout request, admin approve/reject, balance refund
6. **Commission Control** — Admin প্রতি user-এর commission ০-১০০% সেট করতে পারে
7. **Wallet Balance API** — `/user/wallet/balance`
8. **Freelancer Dashboard** — `/dashboard/freelancer`
9. **Company Dashboard** — `/dashboard/company`
