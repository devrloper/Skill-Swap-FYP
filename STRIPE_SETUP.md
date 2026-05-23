# Stripe Integration Setup Guide

## Overview
This guide explains how to set up and configure Stripe payment processing for purchasing credits on the Skill-Swap platform.

## Prerequisites
- Stripe account (https://stripe.com)
- Node.js and npm installed
- Next.js project already running

## Installation

The Stripe package is already installed. If not, run:
```bash
npm install stripe
```

## Environment Variables

Add these variables to your `.env.local` file:

```env
# Stripe Keys - Get from https://dashboard.stripe.com/apikeys
STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxx  # or pk_live_xxx for production
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx  # or sk_live_xxx for production
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx  # Get from webhook endpoint settings

# App URL for redirect after payment
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL
```

## Getting Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable Key** and **Secret Key**
3. Keep these keys secure - never commit them to version control

## Setting Up Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your endpoint URL:
   - Development: `http://localhost:3000/api/webhooks/stripe` (requires ngrok for testing)
   - Production: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `charge.refunded` (optional)
   - `charge.dispute.created` (optional)
5. Copy the **Signing Secret** and add it to `STRIPE_WEBHOOK_SECRET` in `.env.local`

## Testing Locally with ngrok

To test webhooks locally:

1. Install ngrok: https://ngrok.com/download
2. Start ngrok: `ngrok http 3000`
3. Use the provided URL in Stripe webhook settings
4. Use Stripe test cards: https://stripe.com/docs/testing

Test Cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

## API Endpoints

### 1. Create Checkout Session
**POST** `/api/credits/checkout`

Request:
```json
{
  "packId": "starter" // "starter", "growth", or "pro"
}
```

Response:
```json
{
  "ok": true,
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_xxx"
}
```

### 2. Verify Payment
**GET** `/api/credits/verify-payment?sessionId=cs_xxx`

Response:
```json
{
  "ok": true,
  "status": "paid",
  "creditsAdded": 5,
  "packLabel": "Starter Credits",
  "amount": 499
}
```

### 3. Stripe Webhook
**POST** `/api/webhooks/stripe`

Automatically processes:
- `checkout.session.completed` - Awards credits when payment succeeds
- `charge.refunded` - Handles refunds
- `charge.dispute.created` - Logs disputes

## Credit Packages

Current credit packages in `src/app/lib/creditLogic.ts`:

```typescript
export const PAID_CREDIT_PACKS = {
  starter: { credits: 5, price: 499, label: "Starter Credits" },      // 499 PKR
  growth: { credits: 12, price: 999, label: "Growth Credits" },        // 999 PKR
  pro: { credits: 30, price: 1999, label: "Pro Credits" },             // 1999 PKR
} as const;
```

Prices are in PKR but are automatically converted to USD for Stripe processing using the rate defined in `src/app/lib/stripe.ts` (currently 1 PKR = 0.0036 USD).

## Frontend Integration

### Using the Credit Package Modal

```tsx
import CreditPackageModal from "@/app/components/creditpackagemodal/page";
import { useState } from "react";

export default function PricingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Buy Credits
      </button>
      <CreditPackageModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
```

### Using the Custom Hook

```tsx
import { useStripeCheckout } from "@/app/hooks/useStripeCheckout";

export default function CreditBuyButton() {
  const { initiateCheckout, loading, error } = useStripeCheckout();

  return (
    <button 
      onClick={() => initiateCheckout("starter")}
      disabled={loading}
    >
      {loading ? "Processing..." : "Buy Credits"}
    </button>
  );
}
```

### Payment Success Component

Add to your pricing page to show payment status:

```tsx
import PaymentSuccessComponent from "@/app/components/paymentsuccesscomponent/page";

export default function PricingPage() {
  return (
    <div>
      <PaymentSuccessComponent />
      {/* Rest of your pricing page */}
    </div>
  );
}
```

## Database Schema

### Credit Purchases Collection
```typescript
{
  id: string;
  userId: string;
  packId: "starter" | "growth" | "pro";
  label: string;
  credits: number;
  amount: number;           // In USD (cents)
  currency: "USD";
  status: "pending" | "paid";
  stripeSessionId: string;
  createdAt: Timestamp;
  paidAt?: Timestamp;      // Set when payment succeeds
}
```

### Credit Transactions Collection
```typescript
{
  id: string;
  userId: string;
  delta: number;           // Credits added/deducted
  type: "paid_credit_purchase" | "interview_pass" | ...;
  metadata: {
    purchaseId: string;
    packId: string;
    stripeSessionId: string;
    currency: "USD";
  };
  createdAt: Timestamp;
}
```

## Troubleshooting

### Payment not going through
1. Check if Stripe keys are correctly set in `.env.local`
2. Verify card details (use test cards during development)
3. Check Stripe Dashboard for error logs

### Webhook not triggered
1. Verify webhook endpoint is accessible
2. Check webhook signing secret is correct
3. Use ngrok for local testing
4. Review Stripe Dashboard → Webhooks → Events log

### Credits not awarded
1. Check webhook logs in Stripe Dashboard
2. Verify user is authenticated
3. Check Firebase Firestore for purchase record with `status: "pending"`
4. Check browser console for errors

### Exchange Rate
To update the PKR to USD exchange rate:
1. Open `src/app/lib/stripe.ts`
2. Update `STRIPE_EXCHANGE_RATE` value
3. Formula: 1 PKR = 0.00XX USD (adjust XX based on current rate)

## Security Considerations

✅ **Implemented:**
- Webhook signature verification
- User authentication checks
- Metadata validation
- Secure payment processing through Stripe
- No storage of sensitive card data

⚠️ **Best Practices:**
- Use environment variables for sensitive keys
- Enable Stripe's security features in dashboard
- Monitor webhook logs regularly
- Implement rate limiting on API endpoints
- Use HTTPS in production
- Keep Stripe SDK updated

## Production Checklist

- [ ] Switch to Stripe live keys
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Set up production webhook endpoint
- [ ] Enable HTTPS on your domain
- [ ] Test payment flow end-to-end
- [ ] Set up monitoring/alerts for webhook failures
- [ ] Document refund process for customer support
- [ ] Set up email notifications for successful purchases
- [ ] Test error handling and edge cases

## Support

- Stripe Docs: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Next.js Docs: https://nextjs.org/docs
