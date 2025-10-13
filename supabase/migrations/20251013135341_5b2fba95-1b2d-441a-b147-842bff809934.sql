-- Create a view that masks sensitive member data for managers
-- Admins get full access, managers get limited access to reduce exposure risk

CREATE OR REPLACE VIEW members_view_for_managers AS
SELECT 
  id,
  name,
  father_name,
  phone_number,
  -- Mask alternate phone, email, and address for managers
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN alternate_phone
    ELSE NULL
  END as alternate_phone,
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN email
    ELSE NULL
  END as email,
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN address
    ELSE NULL
  END as address,
  membership_type,
  monthly_fee,
  active,
  joining_date,
  notes,
  created_at,
  updated_at
FROM members
WHERE has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager');

-- Grant access to the view
GRANT SELECT ON members_view_for_managers TO authenticated;

-- Add comment explaining the security approach
COMMENT ON VIEW members_view_for_managers IS 'Provides field-level access control: admins see all fields, managers see limited fields to reduce exposure risk if accounts are compromised';