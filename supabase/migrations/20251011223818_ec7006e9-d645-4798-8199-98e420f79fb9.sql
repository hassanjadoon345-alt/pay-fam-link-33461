-- Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'viewer');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create members table
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  father_name TEXT,
  phone_number TEXT NOT NULL,
  alternate_phone TEXT,
  email TEXT,
  address TEXT,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  membership_type TEXT NOT NULL DEFAULT 'regular',
  monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view members"
  ON public.members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can insert members"
  ON public.members FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admins and managers can update members"
  ON public.members FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admins can delete members"
  ON public.members FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create monthly_payments table
CREATE TABLE public.monthly_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount_due DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_on DATE,
  status TEXT NOT NULL DEFAULT 'due' CHECK (status IN ('paid', 'partial', 'due', 'overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, year, month)
);

ALTER TABLE public.monthly_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payments"
  ON public.monthly_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage payments"
  ON public.monthly_payments FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
  );

-- Create payments_ledger table
CREATE TABLE public.payments_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_payment_id UUID REFERENCES public.monthly_payments(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ledger"
  ON public.payments_ledger FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can insert ledger entries"
  ON public.payments_ledger FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'manager')
  );

-- Create message_templates table
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message_ur TEXT NOT NULL,
  message_en TEXT,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'confirmation', 'overdue')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON public.message_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage templates"
  ON public.message_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create message_logs table
CREATE TABLE public.message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('whatsapp', 'sms')),
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  provider_response TEXT,
  provider_message_id TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view logs"
  ON public.message_logs FOR SELECT
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_payments_updated_at
  BEFORE UPDATE ON public.monthly_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update monthly_payment status on ledger insert
CREATE OR REPLACE FUNCTION public.update_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(10,2);
  v_amount_due DECIMAL(10,2);
  v_due_date DATE;
  v_new_status TEXT;
BEGIN
  -- Get current totals and due date
  SELECT 
    COALESCE(SUM(amount), 0),
    mp.amount_due,
    mp.due_date
  INTO v_total_paid, v_amount_due, v_due_date
  FROM public.payments_ledger pl
  JOIN public.monthly_payments mp ON mp.id = pl.monthly_payment_id
  WHERE pl.monthly_payment_id = NEW.monthly_payment_id
  GROUP BY mp.amount_due, mp.due_date;

  -- Determine status
  IF v_total_paid >= v_amount_due THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial';
  ELSIF v_due_date < CURRENT_DATE THEN
    v_new_status := 'overdue';
  ELSE
    v_new_status := 'due';
  END IF;

  -- Update monthly_payment
  UPDATE public.monthly_payments
  SET 
    amount_paid = v_total_paid,
    status = v_new_status,
    paid_on = CASE 
      WHEN v_new_status = 'paid' AND paid_on IS NULL THEN NEW.payment_date 
      ELSE paid_on 
    END,
    updated_at = NOW()
  WHERE id = NEW.monthly_payment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update payment status on ledger insert
CREATE TRIGGER update_payment_status_on_insert
  AFTER INSERT ON public.payments_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_status();

-- Insert default message templates in Urdu
INSERT INTO public.message_templates (name, message_ur, message_en, type) VALUES
('Payment Reminder', 'السلام علیکم {name} صاحب، آپ کی ماہانہ فیس {amount_due} روپے {due_date} تک ادا کریں۔ شکریہ', 'Hello {name}, please pay your monthly fee of Rs. {amount_due} by {due_date}. Thank you', 'reminder'),
('Payment Confirmation', '{name} صاحب، آپ کی {amount_paid} روپے کی ادائیگی موصول ہوئی۔ شکریہ', '{name}, your payment of Rs. {amount_paid} has been received. Thank you', 'confirmation'),
('Overdue Notice', '{name} صاحب، آپ کی {outstanding} روپے کی بقایا رقم ابھی تک باقی ہے۔ برائے مہربانی جلد ادا کریں', '{name}, you have an outstanding amount of Rs. {outstanding}. Please pay as soon as possible', 'overdue');