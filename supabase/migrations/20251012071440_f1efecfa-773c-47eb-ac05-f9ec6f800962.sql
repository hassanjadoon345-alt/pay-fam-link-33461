-- Fix remaining security warnings: Set search_path for functions

-- Recreate update_updated_at_column with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Recreate update_payment_status with proper search_path  
CREATE OR REPLACE FUNCTION public.update_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;