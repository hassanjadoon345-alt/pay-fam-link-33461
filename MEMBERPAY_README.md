# MemberPay - Mobile-First Payment Management System

## Overview
MemberPay is a production-ready PWA for managing members and monthly payments with WhatsApp integration, built with React, Supabase, and Tailwind CSS.

## Features
- ✅ **Authentication** - Email/password with role-based access (admin, manager, viewer)
- ✅ **Member Management** - Full CRUD with Pakistani phone number support (E.164)
- ✅ **Payment Tracking** - Visual monthly grid with color-coded status (paid, partial, overdue, due)
- ✅ **Payment Recording** - Mobile-optimized modal with quick amounts and numeric keypad
- ✅ **WhatsApp Quick Actions** - Dynamic wa.me links for instant messaging
- ✅ **Dashboard** - Real-time stats (total members, collected, due, overdue)
- ✅ **PWA Support** - Installable with offline caching
- ✅ **Responsive Design** - Mobile-first with large touch targets (44px+)

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Lovable Cloud (Supabase Postgres + Edge Functions)
- **Auth**: Supabase Auth with auto-confirm email
- **Database**: Postgres with RLS policies

## Database Schema
- `profiles` - User profile data
- `user_roles` - Role-based access control
- `members` - Member information with contact details
- `monthly_payments` - Monthly payment records with status tracking
- `payments_ledger` - Transaction history for each payment
- `message_templates` - Urdu/English messaging templates
- `message_logs` - Messaging history and delivery status

## Quick Start

### 1. Authentication
- Navigate to `/auth`
- Sign up with email/password (auto-confirmed)
- First user needs admin role assigned via backend

### 2. Assign Admin Role
After signup, run in Lovable Cloud backend:
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR_USER_ID', 'admin');
```

### 3. Test with Seed Data
5 sample members with 3 months of payment history already seeded for testing.

## Usage

### Managing Members
1. View members list on Dashboard
2. Click member to view profile and payment history
3. Use WhatsApp button for quick messaging with dynamic wa.me links

### Recording Payments
1. Click any month tile in payment grid
2. Use quick amount buttons or enter custom amount
3. Select payment method and date
4. Submit - status updates automatically via trigger

### Payment Status Logic
- **Paid**: amount_paid >= amount_due
- **Partial**: 0 < amount_paid < amount_due  
- **Overdue**: amount_paid = 0 AND due_date < today
- **Due**: amount_paid = 0 AND due_date >= today

## WhatsApp Integration

### Manual Messaging (wa.me)
Already implemented - click WhatsApp button on member profile:
```javascript
const message = encodeURIComponent(`السلام علیکم ${name} صاحب`);
window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
```

### Automated Messaging (Optional)
For automated reminders via Twilio/WhatsApp Business API:
1. Create Twilio account & get credentials
2. Add secrets via Lovable Cloud: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
3. Create edge function for scheduled reminders
4. Get WhatsApp templates approved by Meta

## Deployment

### Via Lovable
1. Click **Publish** in Lovable editor
2. Your app deploys to `yourapp.lovable.app`

### Via GitHub → Vercel
1. Connect GitHub in Lovable (auto-syncs code)
2. Import repo in Vercel
3. Add environment variables from Lovable Cloud
4. Deploy

## Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Role-based access control with security definer functions
- ✅ Phone numbers in E.164 format for international compatibility
- ✅ Input validation on all forms
- ✅ Session-based authentication with auto-refresh

## Testing Checklist
- [x] Sign up / Login
- [x] View dashboard stats
- [x] View members list with search
- [x] Click member → view profile
- [x] WhatsApp quick action (wa.me link)
- [x] Click payment tile → record payment
- [x] Verify payment status updates (paid/partial/overdue)
- [x] Test responsive design on mobile
- [x] PWA install prompt

## License
MIT
