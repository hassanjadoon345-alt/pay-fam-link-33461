import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'manager' | 'member';

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return data.role as UserRole;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
};

export const checkIfMember = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", userId)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
};
