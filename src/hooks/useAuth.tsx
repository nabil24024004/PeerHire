import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_hirer: boolean;
  is_freelancer: boolean;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  role: 'hirer' | 'freelancer' | null;
  roles: string[];
  activeRole: string | null;
  hasMultipleRoles: boolean;
}

// Get initial role from localStorage immediately (no flicker)
const getStoredRole = (): 'hirer' | 'freelancer' => {
  const stored = localStorage.getItem("activeRole");
  return (stored === 'freelancer' || stored === 'hirer') ? stored : 'hirer';
};

// Cache auth state to prevent redundant fetches
let cachedAuthState: AuthState | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export function useAuth() {
  // Initialize with stored role to prevent flickering
  const storedRole = getStoredRole();

  const [authState, setAuthState] = useState<AuthState>(() =>
    cachedAuthState || {
      user: null,
      profile: null,
      loading: true,
      role: storedRole,
      roles: [],
      activeRole: storedRole,
      hasMultipleRoles: false,
    }
  );
  const navigate = useNavigate();
  const isFetching = useRef(false);
  const isInitialized = useRef(false);

  const updateAuthState = useCallback((newState: AuthState) => {
    cachedAuthState = newState;
    lastFetchTime = Date.now();
    setAuthState(newState);
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    // Prevent concurrent fetches
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch user profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      // Determine user roles from profile
      const userRoles: string[] = [];
      if (profile?.is_hirer) userRoles.push('hirer');
      if (profile?.is_freelancer) userRoles.push('freelancer');

      // Get stored active role - keep it stable
      let currentActiveRole = localStorage.getItem("activeRole") as 'hirer' | 'freelancer' | null;

      // Only change if the stored role is invalid
      if (!currentActiveRole || !userRoles.includes(currentActiveRole)) {
        currentActiveRole = userRoles[0] as 'hirer' | 'freelancer' || 'hirer';
        localStorage.setItem("activeRole", currentActiveRole);
      }

      updateAuthState({
        user: user || null,
        profile: profile || null,
        loading: false,
        role: currentActiveRole,
        roles: userRoles,
        activeRole: currentActiveRole,
        hasMultipleRoles: userRoles.length > 1,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setAuthState(prev => ({ ...prev, loading: false }));
    } finally {
      isFetching.current = false;
    }
  }, [updateAuthState]);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Only fetch if cache is stale
          const now = Date.now();
          if (now - lastFetchTime > CACHE_DURATION || !cachedAuthState?.user) {
            fetchUserProfile(session.user.id);
          }
        } else {
          updateAuthState({
            user: null,
            profile: null,
            loading: false,
            role: null,
            roles: [],
            activeRole: null,
            hasMultipleRoles: false,
          });
        }
      }
    );

    // Check for existing session only if no cache
    if (!cachedAuthState?.user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          updateAuthState({
            user: null,
            profile: null,
            loading: false,
            role: null,
            roles: [],
            activeRole: null,
            hasMultipleRoles: false,
          });
        }
      });
    } else {
      setAuthState(cachedAuthState);
    }

    return () => subscription.unsubscribe();
  }, [updateAuthState, fetchUserProfile]);

  const switchRole = async (newRole: 'freelancer' | 'hirer') => {
    if (!authState.user) return;

    // Update localStorage first to prevent flicker on next load
    localStorage.setItem("activeRole", newRole);

    // Update local state and cache immediately
    const newState = {
      ...authState,
      role: newRole,
      activeRole: newRole,
    };
    updateAuthState(newState);
  };

  const addRole = async (newRole: 'freelancer' | 'hirer') => {
    if (!authState.user) return { success: false };

    try {
      // Update profile to add the new role
      const updateData = newRole === 'freelancer'
        ? { is_freelancer: true }
        : { is_hirer: true };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", authState.user.id);

      if (error) throw error;

      // Clear cache and refresh profile
      cachedAuthState = null;
      lastFetchTime = 0;
      await fetchUserProfile(authState.user.id);
      return { success: true };
    } catch (error) {
      console.error("Error adding role:", error);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    // Clear cache on sign out
    cachedAuthState = null;
    lastFetchTime = 0;
    isInitialized.current = false;
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
