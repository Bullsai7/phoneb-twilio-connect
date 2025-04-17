
import React, { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useTwilio } from '@/context/TwilioContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import AccountsManagement from './AccountsManagement';
import { useHistory } from '@/hooks/useHistory';

const DashboardView = () => {
  const { user } = useSupabaseAuth();
  const { credentials, login, logout, isAuthenticated, loading } = useTwilio();
  const { callHistory, messageHistory, refreshHistory } = useHistory();
  const [twilioCredentials, setTwilioCredentials] = useState({
    accountSid: credentials?.accountSid || '',
    authToken: credentials?.authToken || '',
    appSid: '',
    phoneNumber: ''
  });
  const [activeTab, setActiveTab] = useState("accounts");

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTwilioCredentials({
      ...twilioCredentials,
      [e.target.name]: e.target.value
    });
  };

  const saveTwilioCredentials = async () => {
    if (!twilioCredentials.accountSid || !twilioCredentials.authToken) {
      toast.error("Please enter both Account SID and Auth Token");
      return;
    }
    
    try {
      await login(twilioCredentials);
      toast.success("Twilio credentials saved successfully");
    } catch (error) {
      console.error("Error saving Twilio credentials:", error);
      toast.error("Failed to save Twilio credentials");
    }
  };

  const disconnectTwilio = async () => {
    try {
      await logout();
      setTwilioCredentials({
        accountSid: '',
        authToken: '',
        appSid: '',
        phoneNumber: ''
      });
      toast.success("Disconnected from Twilio");
    } catch (error) {
      console.error("Error disconnecting Twilio:", error);
      toast.error("Failed to disconnect from Twilio");
    }
  };

  // Calculate recent activity metrics
  const recentCalls = callHistory.slice(0, 10);
  const recentMessages = messageHistory.slice(0, 10);
  const totalCalls = callHistory.length;
  const totalMessages = messageHistory.length;
  const uniqueContacts = new Set([
    ...callHistory.map(call => call.phone_number),
    ...messageHistory.map(msg => msg.phone_number)
  ]).size;

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stats Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalCalls}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMessages}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Unique Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{uniqueContacts}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Twilio Accounts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts" className="mt-4">
          <AccountsManagement />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Twilio Credentials</CardTitle>
              <CardDescription>
                {isAuthenticated 
                  ? "Your Twilio account is connected. You can update your credentials or disconnect." 
                  : "Connect your Twilio account to make calls and send messages."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="accountSid">Account SID</Label>
                <Input
                  id="accountSid"
                  name="accountSid"
                  value={twilioCredentials.accountSid}
                  onChange={handleCredentialsChange}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              
              <div className="grid w-full gap-1.5">
                <Label htmlFor="authToken">Auth Token</Label>
                <Input
                  id="authToken"
                  name="authToken"
                  type="password"
                  value={twilioCredentials.authToken}
                  onChange={handleCredentialsChange}
                  placeholder="your_auth_token"
                />
              </div>
              
              <div className="grid w-full gap-1.5">
                <Label htmlFor="appSid">TwiML App SID (optional)</Label>
                <Input
                  id="appSid"
                  name="appSid"
                  value={twilioCredentials.appSid}
                  onChange={handleCredentialsChange}
                  placeholder="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              
              <div className="grid w-full gap-1.5">
                <Label htmlFor="phoneNumber">Phone Number (optional)</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={twilioCredentials.phoneNumber}
                  onChange={handleCredentialsChange}
                  placeholder="+1234567890"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {isAuthenticated ? (
                <>
                  <Button variant="outline" onClick={disconnectTwilio}>
                    Disconnect Twilio
                  </Button>
                  <Button onClick={saveTwilioCredentials}>
                    Update Credentials
                  </Button>
                </>
              ) : (
                <Button onClick={saveTwilioCredentials}>
                  Connect Twilio
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent calls and messages</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calls">
            <TabsList>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>
            <TabsContent value="calls" className="mt-4">
              {recentCalls.length > 0 ? (
                <div className="space-y-2">
                  {recentCalls.map(call => (
                    <div key={call.id} className="flex justify-between items-center p-2 border rounded-md">
                      <div>
                        <p className="font-medium">{call.contact_name || call.phone_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(call.timestamp).toLocaleString()} · {call.direction} · {call.status}
                        </p>
                      </div>
                      <div className="text-sm">
                        {call.duration ? `${call.duration}s` : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent calls</p>
              )}
            </TabsContent>
            <TabsContent value="messages" className="mt-4">
              {recentMessages.length > 0 ? (
                <div className="space-y-2">
                  {recentMessages.map(message => (
                    <div key={message.id} className="p-2 border rounded-md">
                      <div className="flex justify-between">
                        <p className="font-medium">{message.contact_name || message.phone_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleString()} · {message.direction}
                        </p>
                      </div>
                      <p className="text-sm mt-1 line-clamp-2">{message.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent messages</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" onClick={refreshHistory}>
            Refresh Activity
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DashboardView;
