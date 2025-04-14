
import React, { useState } from 'react';
import { useTwilio } from '@/context/TwilioContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, LogOut, HelpCircle, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AuthForm: React.FC = () => {
  const { login } = useTwilio();
  const { signOut, user } = useSupabaseAuth();
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(false);

  // Define webhook URLs - these should match your Supabase function URLs
  const baseUrl = "https://qjgbmowupuzgwrfcmaao.supabase.co/functions/v1";
  const webhookUrl = `${baseUrl}/handle-webhooks`;

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
        <div className="flex justify-between items-center">
          <div className="flex justify-center">
            <div className="p-2 bg-phoneb-primary/10 rounded-full">
              <Phone className="h-8 w-8 text-phoneb-primary" />
            </div>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Configuration Guide</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" side="left">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Twilio Configuration Guide</h3>
                <div className="space-y-2">
                  <h4 className="font-medium">Step 1: Find Your Credentials</h4>
                  <p className="text-sm text-muted-foreground">
                    Log in to your Twilio account and find your Account SID and Auth Token on the dashboard.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Step 2: Configure Webhooks</h4>
                  <p className="text-sm text-muted-foreground">
                    Set up your Twilio phone number to use the webhook URL for Voice and SMS:
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                    {webhookUrl}
                  </code>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Step 3: TwiML Configuration</h4>
                  <p className="text-sm text-muted-foreground">
                    Create a TwiML Bin in your Twilio account with basic call handling instructions.
                  </p>
                </div>
                <div className="mt-4">
                  <a 
                    href="https://www.twilio.com/console/phone-numbers/incoming" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-phoneb-primary hover:underline"
                  >
                    Open Twilio Console →
                  </a>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
        
        {user && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2 mt-2">
                <p className="text-sm font-medium">Your Webhook URL:</p>
                <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                  {webhookUrl}
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure this URL in your Twilio account for Voice and SMS webhooks.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
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
