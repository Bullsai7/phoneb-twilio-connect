
import React, { useState } from 'react';
import { useTwilio } from '@/context/TwilioContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, LogOut } from 'lucide-react';

const AuthForm: React.FC = () => {
  const { login } = useTwilio();
  const { signOut, user } = useSupabaseAuth();
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate input
    if (!accountSid || !authToken) {
      toast.error("Please enter both Account SID and Auth Token");
      setLoading(false);
      return;
    }

    try {
      await login({
        accountSid,
        authToken
      });
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error("Failed to authenticate. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <div className="p-2 bg-phoneb-primary/10 rounded-full">
            <Phone className="h-8 w-8 text-phoneb-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">Welcome to PhoneB</CardTitle>
        <CardDescription className="text-center">
          {user ? `Logged in as ${user.email}` : "Enter your Twilio credentials to continue"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountSid">Account SID</Label>
            <Input
              id="accountSid"
              type="text"
              placeholder="AC..."
              value={accountSid}
              onChange={(e) => setAccountSid(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authToken">Auth Token</Label>
            <Input
              id="authToken"
              type="password"
              placeholder="Your Twilio Auth Token"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-phoneb-primary hover:bg-phoneb-primary/90"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Connect to Twilio'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <p className="text-sm text-center text-gray-500">
          Your credentials are securely stored and encrypted in the database
        </p>
        <p className="text-xs text-center text-gray-400">
          Don't have a Twilio account?{" "}
          <a 
            href="https://www.twilio.com/try-twilio" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-phoneb-primary hover:underline"
          >
            Sign up for free
          </a>
        </p>
        
        {user && (
          <Button
            variant="outline"
            onClick={signOut}
            className="mt-4"
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AuthForm;
