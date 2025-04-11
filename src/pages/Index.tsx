
import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthForm from '@/components/Auth/AuthForm';
import { useTwilio } from '@/context/TwilioContext';

const Index = () => {
  const { isAuthenticated, loading } = useTwilio();
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phoneb-primary"></div>
      </div>
    );
  }
  
  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-phoneb-background p-4">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
};

export default Index;
