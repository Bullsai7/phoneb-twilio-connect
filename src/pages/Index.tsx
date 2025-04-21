
import React, { useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import AuthForm from '@/components/Auth/AuthForm';
import { useTwilio } from '@/context/TwilioContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { isAuthenticated, loading: twilioLoading } = useTwilio();
  const { session, loading: authLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  
  const loading = twilioLoading || authLoading;
  
  // Effect to redirect to dashboard when authenticated with Twilio
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phoneb-primary"></div>
      </div>
    );
  }
  
  // Redirect to dashboard if already authenticated with Twilio
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show sign in button if not logged in with Supabase
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-phoneb-background p-4">
        <div className="w-full max-w-md text-center space-y-8">
          <h1 className="text-3xl font-bold text-phoneb-primary">PhoneB</h1>
          <p className="text-lg">Your virtual phone system powered by Twilio</p>
          <Button asChild size="lg">
            <Link to="/auth">Sign In / Create Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show Twilio connection form if logged in but not connected to Twilio
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-phoneb-background p-4">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
};

export default Index;
