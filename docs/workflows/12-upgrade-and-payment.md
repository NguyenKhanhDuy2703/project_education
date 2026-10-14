---
doc_type: workflow
title: Sequence Diagram - PRO Upgrade & VNPAY Payment Gateway Integration (Upgrade & Payment Flow)
project: study-web
version: "1.1"
version_source: codebase
authors:
  - {name: Nguyen Khanh Duy, alias: Duy, role: Fullstack Lead & Architect}
scope: VNPAY Payment Gateway Integration, Paywall Modal, Checksum Verification, and Automated PRO Entitlement Activation
date: 2026-10-14
source_file: "MODULE_FE/src/features/lab/components/UpgradeModal.tsx, MODULE_BE/src/modules/payment"
status: final
language: en
related_docs: [02-catalog-topic-discovery.md, 04-lab-submission-progress.md, 09-admin-users-and-entitlements.md]
---

# Sequence Diagram: PRO Upgrade & VNPAY Payment Gateway Integration (Upgrade & Payment Flow)

## 1. Document Information

| Attribute | Details |
|---|---|
| **Document Title** | PRO Upgrade & VNPAY Payment Gateway Integration Workflow |
| **Version** | v1.1 |
| **Author** | Nguyen Khanh Duy (Fullstack Lead & Architect) |
| **Scope** | Learner conversion lifecycle from paywall modal trigger / pricing catalog, plan selection (Monthly / Yearly), payment intent initialization, secure redirection through VNPAY Gateway, HMAC-SHA512 IPN webhook verification, and instant PRO entitlement activation |
| **Date** | 2026-10-14 |
| **Source Reference** | `MODULE_FE/src/features/lab/components/UpgradeModal.tsx`, `MODULE_BE/src/modules/payment/payment.controller.ts`, `MODULE_BE/src/modules/payment/vnpay.service.ts` |

---

## 2. Core Content

### 2.1. Workflow Summary (TL;DR)
- **Input**: Learner interacts with a lab with `requiresPro = true` or clicks the "Upgrade PRO" button in the application header.
- **Plan Selection**: Displays Pricing modal, comparing Monthly (e.g. 199,000 VND) and Yearly (e.g. 1,490,000 VND) plans.
- **VNPAY Checkout**:
  - NestJS backend generates a signed payment URL with a cryptographic `vnp_SecureHash` (HMAC-SHA512).
  - Browser navigates to the VNPAY Gateway to render dynamic QR code scanning (VNPAY-QR) or local ATM/credit card entry.
- **Verification & Activation**:
  - VNPAY triggers a background server-to-server Instant Payment Notification (IPN) webhook to the backend to verify cryptographic checksums and transaction status.
  - Backend updates user role to `user_pro`, calculates expiration dates, and logs the transaction into `payment_orders`.
  - Learner is returned to the success celebration page with immediate access to all locked labs.

---

### 2.2. Roles & Responsibilities (Who Does What)

| Entity | Type | Roles & Responsibilities |
|---|---|---|
| **Learner** | Actor | Chooses subscription plan, scans QR code or submits banking payment |
| **UpgradeModal / Pricing UI** | Client UI | Highlights PRO benefits, renders pricing cards, initiates VNPAY checkout |
| **Payment Controller & Service** | NestJS Backend | Generates signed VNPAY redirect URLs, computes HMAC-SHA512, handles IPN Webhook |
| **VNPAY Gateway** | Payment Gateway | Processes banking transactions, manages redirects, dispatches IPN notifications |
| **PostgreSQL Database** | Storage | Houses `payment_orders` and updates `users` (`role = 'user_pro'`, `pro_expires_at`) |

---

### 2.3. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Learner / Student
    participant UI as UpgradeModal / Pricing UI
    participant BE as NestJS Backend (PaymentModule)
    participant VNPay as VNPAY Payment Gateway
    participant DB as PostgreSQL
    participant Bank as Mobile Banking App

    Note over User, Bank: 1. Plan Selection & Payment Initialization
    User->>UI: Click "Upgrade PRO" on locked lab
    UI-->>User: Open Comparison Modal (Free vs PRO)
    User->>UI: Select "1-Year PRO Plan" & click "Pay via VNPAY"
    UI->>BE: POST /api/payment/create-order { planId: "plan-pro-yearly", paymentMethod: "VNPAY" }
    BE->>DB: INSERT INTO payment_orders (user_id, plan_id, amount, status) VALUES (..., 'PENDING')
    DB-->>BE: Order initialized (order_8829)
    BE->>BE: Calculate HMAC-SHA512 vnp_SecureHash with server secret key
    BE-->>UI: 200 OK { paymentUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=..." }
    UI-->>User: Redirect browser to VNPAY Gateway

    Note over User, Bank: 2. Checkout via Banking App
    User->>VNPay: Select "VNPAY-QR" payment method
    VNPay-->>User: Render dynamic QR code
    User->>Bank: Open Mobile Banking app, scan QR and confirm OTP
    Bank->>VNPay: Debit account & confirm successful payment

    Note over VNPay, DB: 3. Server-to-Server IPN Webhook Verification
    VNPay->>BE: GET /api/payment/vnpay-ipn?vnp_TxnRef=order_8829&vnp_ResponseCode=00&vnp_SecureHash=...
    BE->>BE: Compute and verify HMAC-SHA512 signature against incoming checksum
    
    alt Signature Mismatch or Tampered Amount
        BE-->>VNPay: { RspCode: "97", Message: "Invalid Checksum" }
    else Signature Valid & Response Code 00
        BE->>DB: UPDATE payment_orders SET status = 'SUCCESS', paid_at = NOW() WHERE id = 'order_8829'
        BE->>DB: UPDATE users SET role = 'user_pro', pro_expires_at = NOW() + INTERVAL '1 YEAR' WHERE id = :userId
        DB-->>BE: PRO activation committed
        BE-->>VNPay: { RspCode: "00", Message: "Confirm Success" }
    end

    Note over User, DB: 4. Learner Redirection & Immediate Content Unlocking
    VNPay-->>UI: Redirect user to `/payment/success?orderId=order_8829`
    UI->>BE: GET /api/users/me/profile (Update Redux Credentials)
    BE-->>UI: 200 OK { user: { role: "user_pro", proExpiresAt: "2027-10-14" } }
    UI-->>User: Celebration screen 🎉: "Welcome to PRO Membership!"
    User->>UI: Click "Continue Lab" -> All exercise solutions unlocked
```

---

### 2.4. Technical Specifications & Architecture Details

1. **Dual Verification Architecture (Return URL vs IPN Webhook)**:
   - **Return URL (Client-Side)**: Provides seamless UI transition without forcing the user to wait.
   - **IPN Webhook (Server-to-Server)**: Authoritative channel for granting entitlements. Even if the user terminates their browser after completing the mobile bank transfer, the account is reliably activated by the IPN.
2. **Cryptographic Integrity via HMAC-SHA512**:
   - All query parameters are alphabetically ordered and hashed alongside the server secret `VNPAY_HASH_SECRET`. Any parameter tampering (`vnp_Amount`, `orderId`) causes checksum verification to fail immediately.
3. **Dynamic Subscription Stacking**:
   - For active PRO members renewing their subscriptions, additional duration is added to the existing `pro_expires_at` timestamp rather than overwriting from current time.

---

### 2.5. Edge Cases & Exception Handling

| Edge Case | System Response | User Experience |
|---|---|---|
| **User Cancels on VNPAY Gateway** | VNPAY redirects back with `vnp_ResponseCode = 24` | Displays friendly cancellation message with option to retry |
| **Network Loss During QR Scan** | VNPAY times out pending transaction after 15 minutes | Order transitions automatically to `EXPIRED` status |
| **Delayed IPN Due to Banking Congestion** | Frontend performs lightweight polling check | Displays spinner: *"Confirming your transaction with the bank..."* and auto-resolves when IPN lands |

---

## 3. References & Source Links

- **Frontend Codebase**:
  - Upgrade Modal: [UpgradeModal.tsx](file:///d:/Projects/study-web/MODULE_FE/src/features/lab/components/UpgradeModal.tsx)
- **Backend Codebase**:
  - Payment Controller: [payment.controller.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/payment/payment.controller.ts)
  - VNPAY Service: [vnpay.service.ts](file:///d:/Projects/study-web/MODULE_BE/src/modules/payment/vnpay.service.ts)
- **Related Workflows**:
  - Course Discovery & Paywall: [02-catalog-topic-discovery.md](file:///d:/Projects/study-web/docs/workflows/02-catalog-topic-discovery.md)
  - Submission & Progress: [04-lab-submission-progress.md](file:///d:/Projects/study-web/docs/workflows/04-lab-submission-progress.md)
  - Admin Users Governance: [09-admin-users-and-entitlements.md](file:///d:/Projects/study-web/docs/workflows/09-admin-users-and-entitlements.md)
