
import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTwilio } from '@/context/TwilioContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppLayout: React.FC = () => {
  const { isAuthenticated, loading: twilioLoading } = useTwilio();
  const { session, loading: authLoading } = useSupabaseAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading state
  const loading = twilioLoading || authLoading;
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-phoneb-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in with Supabase
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to twilio auth if not connected to Twilio
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto p-6 bg-phoneb-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
