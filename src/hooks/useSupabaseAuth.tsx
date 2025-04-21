
import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingSession, setRefreshingSession] = useState(false);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Got existing session:', session ? 'yes' : 'no');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a function to refresh the session token if needed
  const refreshSession = useCallback(async () => {
    if (refreshingSession) return false;
    
    try {
      setRefreshingSession(true);
      console.log('Refreshing session token...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        toast.error("Failed to refresh session: " + error.message);
        return false;
      } 
      
      if (data && data.session) {
        console.log('Session refreshed successfully');
        setSession(data.session);
        setUser(data.session.user);
        toast.success("Session refreshed successfully");
        return true;
      } else {
        console.error('No session returned after refresh');
        toast.error("Failed to refresh session: No session returned");
        return false;
      }
    } catch (error: any) {
      console.error('Error refreshing session:', error);
      toast.error("Error refreshing session: " + error.message);
      return false;
    } finally {
      setRefreshingSession(false);
    }
  }, [refreshingSession]);

  return {
    session,
    user,
    loading,
    refreshingSession,
    signOut,
    refreshSession
  };
}
