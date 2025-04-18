import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import AccountsManagement from '@/components/Dashboard/AccountsManagement';
import PhoneNumberSelector from '@/components/Dashboard/PhoneNumbers/PhoneNumberSelector';

const DashboardView = () => {
  const { user } = useSupabaseAuth();

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to PhoneB</CardTitle>
            <CardDescription>
              Please sign in to access your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>You need to be logged in to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <AccountsManagement />
        <PhoneNumberSelector />
      </div>
    </div>
  );
};

export default DashboardView;
