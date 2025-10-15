-- Add INSERT policy for message_logs table
CREATE POLICY "Admins and managers can insert message logs"
ON public.message_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Create function to automatically assign admin role to first user
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user (no existing admins)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to run after user signup
CREATE TRIGGER on_first_user_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_first_admin();