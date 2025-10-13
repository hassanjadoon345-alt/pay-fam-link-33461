-- Remove the security definer view as it creates a security linter warning
DROP VIEW IF EXISTS members_view_for_managers;