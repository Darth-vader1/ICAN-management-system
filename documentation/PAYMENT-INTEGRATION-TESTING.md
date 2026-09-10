# Payment Integration Testing Guide

## Overview
Your ICAN Management System now has Paystack payment integration set up and ready to test.

## Configuration Status
✅ **Backend**:
- Paystack keys configured in `.env`
- Payment API endpoints active
- Webhook endpoint ready
- Payment models and services implemented

✅ **Frontend**:
- Payment service created
- Payment modal component ready
- Success/failure pages implemented
- Routes configured

## Test Payment Flow

### Step 1: Login as a Student
1. Navigate to http://localhost:5173/login
2. Login with a student account
3. Go to Billing page (`/billing`)

### Step 2: Initiate Payment
1. Find an unpaid invoice in the invoices list
2. Click the "Pay" button
3. Payment modal will open showing:
   - Invoice number
   - Total amount
   - Paid amount
   - Balance due
4. Click "Pay ₦X,XXX" button

### Step 3: Paystack Payment
You'll be redirected to Paystack's payment page. Use these test cards:

**Successful Payment:**
- Card Number: `4084 0840 8408 4081`
- CVV: `408`
- Expiry: Any future date (e.g., `12/25`)
- PIN: `1234`
- OTP: `123456`

**Declined Payment:**
- Card Number: `5060 6666 6666 6666 666`
- CVV: Any 3 digits
- Expiry: Any future date

### Step 4: Payment Verification
- After completing payment, you'll be redirected to `/payment/success`
- The system will automatically verify the payment
- You'll see the payment confirmation with reference and amount
- Click "View Billing" to return to billing page

### Step 5: Verify Payment Record
1. Go back to billing page
2. Switch to "Payments" tab
3. Verify your payment appears in the list
4. Check invoice status is updated (Partial/Paid)

## API Endpoints

### Initialize Payment
```bash
POST http://localhost:8000/api/payments/paystack/initialize/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "invoice_id": "uuid-of-invoice",
  "callback_url": "http://localhost:5173/payment/success"
}
```

**Response:**
```json
{
  "success": true,
  "authorization_url": "https://checkout.paystack.com/...",
  "access_code": "xxx",
  "reference": "INV-2025-0001-1234567890",
  "amount": 50000.00,
  "invoice_number": "INV-2025-0001"
}
```

### Verify Payment
```bash
GET http://localhost:8000/api/payments/paystack/verify/{reference}/
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "reference": "INV-2025-0001-1234567890",
  "status": "success",
  "amount": 5000000,
  "currency": "NGN",
  "transaction_date": "2026-09-10T14:30:00Z",
  "payment_id": "uuid",
  "payment_status": "confirmed"
}
```

## Webhook Setup (Optional for Testing)

To test webhooks locally:

1. **Install ngrok:**
   ```bash
   ngrok http 8000
   ```

2. **Configure Paystack Webhook:**
   - Go to https://dashboard.paystack.com/#/settings/developer
   - Add webhook URL: `https://your-ngrok-url.ngrok.io/api/payments/paystack/webhook/`

3. **Test Webhook:**
   - Make a payment
   - Check Django logs for webhook events
   - Verify payment status updates automatically

## Troubleshooting

### Payment initialization fails
- Check that `PAYSTACK_PUBLIC_KEY` and `PAYSTACK_SECRET_KEY` are in `.env`
- Restart Django server after adding keys
- Verify invoice exists and belongs to the student

### Redirect doesn't work
- Check that callback URL is correctly set
- Verify payment success/failure routes are in App.tsx
- Check browser console for errors

### Webhook not receiving events
- Verify ngrok is running and URL is correct
- Check Paystack webhook secret is configured
- Look for webhook errors in Django logs

### Payment verification fails
- Ensure reference is stored in sessionStorage
- Check API authentication token is valid
- Verify payment was actually completed on Paystack

## Production Checklist

Before going live:

- [ ] Replace test keys with live Paystack keys
- [ ] Set up production webhook URL
- [ ] Configure proper callback URLs
- [ ] Test with real bank cards (small amounts)
- [ ] Set up payment failure notifications
- [ ] Configure audit logging for payments
- [ ] Set up monitoring for failed webhooks
- [ ] Document refund process
- [ ] Train staff on payment reconciliation

## Security Notes

- ✅ Payment API endpoints require authentication
- ✅ Students can only pay their own invoices
- ✅ Webhook signature verification implemented
- ✅ Payment amounts validated on backend
- ⚠️ Never expose `PAYSTACK_SECRET_KEY` in frontend
- ⚠️ Always verify payments on backend before updating records

## Support

For Paystack integration issues:
- Docs: https://paystack.com/docs
- Support: support@paystack.com
- Dashboard: https://dashboard.paystack.com

For ICAN system issues:
- Check backend logs: Django terminal
- Check frontend console: Browser DevTools
- Review audit logs in database
