-- Add explicit UPDATE and DELETE policies to payments_ledger for audit trail protection

-- Deny all updates to maintain immutable audit trail
CREATE POLICY "No updates allowed on ledger"
  ON payments_ledger 
  FOR UPDATE 
  USING (false);

-- Allow only admins to delete ledger entries (with caution)
CREATE POLICY "Admins can delete ledger entries"
  ON payments_ledger 
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'));