import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  role: 'hirer' | 'freelancer' | null;
  roles: string[];
  activeRole: string | null;
  hasMultipleRoles: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    role: null,
    roles: [],
    activeRole: null,
    hasMultipleRoles: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setAuthState({
            user: null,
            loading: false,
            role: null,
            roles: [],
            activeRole: null,
            hasMultipleRoles: false,
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserRoles(session.user.id);
      } else {
        setAuthState({
          user: null,
          loading: false,
          role: null,
          roles: [],
          activeRole: null,
          hasMultipleRoles: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      const userRoles = rolesData?.map((r) => r.role) || [];

      // Fetch active role from profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("active_role")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      let currentActiveRole = profileData?.active_role;

      // If no active role set, use first available role or localStorage
      if (!currentActiveRole && userRoles.length > 0) {
        const storedRole = localStorage.getItem("activeRole");
        if (storedRole && userRoles.includes(storedRole as any)) {
          currentActiveRole = storedRole;
        } else {
          currentActiveRole = userRoles[0];
        }
        
        // Update profile with active role
        await supabase
          .from("profiles")
          .update({ active_role: currentActiveRole })
          .eq("id", userId);
      }

      setAuthState({
        user: user || null,
        loading: false,
        role: currentActiveRole as 'hirer' | 'freelancer' | null,
        roles: userRoles,
        activeRole: currentActiveRole,
        hasMultipleRoles: userRoles.length > 1,
      });
    } catch (error) {
      console.error("Error fetching user roles:", error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const switchRole = async (newRole: 'freelancer' | 'hirer') => {
    if (!authState.user) return;

    try {
      // Update active role in database
      const { error } = await supabase
        .from("profiles")
        .update({ active_role: newRole })
        .eq("id", authState.user.id);

      if (error) throw error;

      // Update local state
      setAuthState(prev => ({
        ...prev,
        role: newRole,
        activeRole: newRole,
      }));
      localStorage.setItem("activeRole", newRole);
    } catch (error) {
      console.error("Error switching role:", error);
    }
  };

  const addRole = async (newRole: 'freelancer' | 'hirer') => {
    if (!authState.user) return { success: false };

    try {
      // Add new role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: authState.user.id, role: newRole });

      if (roleError) throw roleError;

      // Create role-specific profile
      if (newRole === "freelancer") {
        const { error: profileError } = await supabase
          .from("freelancer_profiles")
          .insert({
            user_id: authState.user.id,
            status: "available",
            skills: [],
            hourly_rate: 0,
          });

        if (profileError) throw profileError;
      } else {
        const { error: profileError } = await supabase
          .from("hirer_profiles")
          .insert({
            user_id: authState.user.id,
            default_budget: 0,
            preferred_subjects: [],
          });

        if (profileError) throw profileError;
      }

      // Refresh roles
      await fetchUserRoles(authState.user.id);
      return { success: true };
    } catch (error) {
      console.error("Error adding role:", error);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("activeRole");
    navigate('/');
  };

  return {
    ...authState,
    signOut,
    switchRole,
    addRole,
  };
}
