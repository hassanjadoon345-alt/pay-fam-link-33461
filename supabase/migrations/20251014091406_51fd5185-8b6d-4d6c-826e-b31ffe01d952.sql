-- Add 'member' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';

-- Add user_id to members table to link with auth
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);

-- RLS Policy: Members can view their own profile
CREATE POLICY "Members can view their own profile"
ON public.members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Members can view their own payments
CREATE POLICY "Members can view their own payments"
ON public.monthly_payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = monthly_payments.member_id
    AND members.user_id = auth.uid()
  )
);

-- RLS Policy: Members can view their own payment ledger
CREATE POLICY "Members can view their own ledger"
ON public.payments_ledger
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members
    WHERE members.id = payments_ledger.member_id
    AND members.user_id = auth.uid()
  )
);