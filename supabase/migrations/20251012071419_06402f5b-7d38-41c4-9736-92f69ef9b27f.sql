-- Fix critical security issues: Restrict access to sensitive data

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can view logs" ON public.message_logs;
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.monthly_payments;
DROP POLICY IF EXISTS "Authenticated users can view ledger" ON public.payments_ledger;
DROP POLICY IF EXISTS "Authenticated users can view templates" ON public.message_templates;

-- Members table: Only admin and manager can view
CREATE POLICY "Admin and manager can view members" ON public.members
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Message logs: Only admin and manager can view
CREATE POLICY "Admin and manager can view message logs" ON public.message_logs
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Monthly payments: Only admin and manager can view
CREATE POLICY "Admin and manager can view payments" ON public.monthly_payments
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Payments ledger: Only admin and manager can view
CREATE POLICY "Admin and manager can view ledger" ON public.payments_ledger
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Message templates: Only admin and manager can view
CREATE POLICY "Admin and manager can view templates" ON public.message_templates
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Fix profiles table: Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix user_roles table: Only admins can manage roles
CREATE POLICY "Admins can insert roles" ON public.user_roles
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles" ON public.user_roles
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles" ON public.user_roles
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));