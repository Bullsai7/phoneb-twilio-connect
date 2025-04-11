
import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthView from '@/components/Auth/AuthView';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const Auth = () => {
  const { session, loading } = useSupabaseAuth();
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phoneb-primary"></div>
      </div>
    );
  }
  
  // Redirect to dashboard if already authenticated
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-phoneb-background p-4">
      <div className="w-full max-w-md">
        <AuthView />
      </div>
    </div>
  );
};

export default Auth;
