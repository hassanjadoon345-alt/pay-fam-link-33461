-- Ensure payments_ledger inserts update monthly_payments totals and status
DROP TRIGGER IF EXISTS update_payment_status_trigger ON public.payments_ledger;
CREATE TRIGGER update_payment_status_trigger
AFTER INSERT ON public.payments_ledger
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_status();