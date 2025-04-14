
import React, { useState } from 'react';
import { useTwilio } from '@/context/TwilioContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, LogOut, HelpCircle, Info, ExternalLink } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import twilioVoiceConfigImg from "/lovable-uploads/47596cdb-c9d2-493d-9a72-9952eaae5937.png";
import twilioNumberConfigImg from "/lovable-uploads/e2e54000-37cc-4fdb-82e8-82d6042c300a.png";

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
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Configuration Guide</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Twilio Configuration Guide</SheetTitle>
                <SheetDescription>
                  Follow these steps to configure your Twilio account with PhoneB
                </SheetDescription>
              </SheetHeader>
              
              <Tabs defaultValue="step1" className="mt-6">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="step1">Credentials</TabsTrigger>
                  <TabsTrigger value="step2">Webhooks</TabsTrigger>
                  <TabsTrigger value="step3">Phone Number</TabsTrigger>
                  <TabsTrigger value="step4">TwiML Apps</TabsTrigger>
                </TabsList>
                
                <TabsContent value="step1" className="space-y-4 mt-4">
                  <h3 className="font-medium text-lg">Step 1: Find Your Credentials</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Log in to your Twilio account and find your Account SID and Auth Token on the dashboard. These are required to connect PhoneB to your Twilio account.
                    </p>
                    <Alert className="mt-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        You can find your Account SID and Auth Token in your 
                        <a 
                          href="https://www.twilio.com/console" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-phoneb-primary hover:underline ml-1 inline-flex items-center"
                        >
                          Twilio Dashboard
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
                
                <TabsContent value="step2" className="space-y-4 mt-4">
                  <h3 className="font-medium text-lg">Step 2: Configure Webhooks</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Set up your Twilio phone number to use the webhook URL for Voice and SMS. After logging in with your Twilio credentials, you'll see your webhook URL which should be configured in the Twilio console.
                    </p>
                    
                    <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                      {webhookUrl}
                    </div>
                    
                    <p className="text-sm mt-4 font-medium">Here's how to configure your webhooks:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-2">
                      <li>Go to the Phone Numbers section in your Twilio console</li>
                      <li>Select your phone number</li>
                      <li>In the Voice & Fax section, set the webhook URL for "A call comes in"</li>
                      <li>In the Messaging section, set the webhook URL for "A message comes in"</li>
                      <li>For both, select "HTTP POST" as the method</li>
                    </ol>
                    
                    <div className="mt-4 border rounded">
                      <p className="p-2 bg-muted text-sm font-medium">Example Configuration:</p>
                      <img 
                        src={twilioVoiceConfigImg} 
                        alt="Twilio Voice Configuration Example" 
                        className="w-full rounded-b" 
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="step3" className="space-y-4 mt-4">
                  <h3 className="font-medium text-lg">Step 3: Phone Number Configuration</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Verify that your phone number has the correct webhook configurations for both Voice and SMS.
                    </p>
                    
                    <div className="mt-4 border rounded">
                      <p className="p-2 bg-muted text-sm font-medium">Example Phone Number Configuration:</p>
                      <img 
                        src={twilioNumberConfigImg} 
                        alt="Twilio Phone Number Configuration" 
                        className="w-full rounded-b" 
                      />
                    </div>
                    
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Make sure the Webhook URL is correctly set for both Voice and Messaging. This will ensure that PhoneB can properly handle all incoming calls and messages.
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
                
                <TabsContent value="step4" className="space-y-4 mt-4">
                  <h3 className="font-medium text-lg">Step 4: TwiML Apps (Optional)</h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      TwiML Apps provide a way to organize the URLs you use with Twilio. While not required for basic functionality, they can help manage more complex call and messaging applications.
                    </p>
                    
                    <div className="bg-muted p-3 rounded-md">
                      <h4 className="font-medium mb-2">What are TwiML Apps?</h4>
                      <p className="text-sm text-muted-foreground">
                        TwiML Apps are containers for your voice and messaging URLs. They allow you to organize the URLs that handle different events (like incoming calls or messages) and can be reused across multiple Twilio phone numbers.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Configuration Steps:</p>
                      <ol className="list-decimal pl-5 text-sm space-y-2">
                        <li>Navigate to the <a 
                            href="https://www.twilio.com/console/voice/twiml/apps" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-phoneb-primary hover:underline inline-flex items-center"
                          >
                            TwiML Apps section
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a> in your Twilio Console</li>
                        <li>Click "Create new TwiML App"</li>
                        <li>Give your app a friendly name (e.g., "PhoneB App")</li>
                        <li>Set the "Request URL" for Voice to: <code className="bg-gray-100 px-1 rounded text-xs">{webhookUrl}</code></li>
                        <li>Set the "Request URL" for Messaging to the same URL</li>
                        <li>Save your TwiML App</li>
                      </ol>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md border">
                      <h4 className="font-medium mb-2">Example TwiML Response Code</h4>
                      <p className="text-xs mb-2">This is how our app will respond to incoming calls:</p>
                      <pre className="bg-black text-green-400 p-2 rounded text-xs overflow-auto">
{`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Hello! Welcome to Phone B.</Say>
  <Gather numDigits="1" action="/handle-input" method="POST">
    <Say>Press 1 to connect to an agent. Press 2 to leave a message.</Say>
  </Gather>
</Response>`}
                      </pre>
                    </div>
                    
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">Do I need to create a TwiML App?</span>
                        <p className="text-xs mt-1">
                          For basic PhoneB functionality, configuring webhooks directly on your phone number (as shown in Step 2) is sufficient. TwiML Apps are useful for more complex setups or when you want to reuse configurations across multiple phone numbers.
                        </p>
                      </AlertDescription>
                    </Alert>
                    
                    <a 
                      href="https://www.twilio.com/docs/usage/tutorials/how-to-use-twiml" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-phoneb-primary hover:underline"
                    >
                      Learn more about TwiML
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-8">
                <a 
                  href="https://www.twilio.com/console/phone-numbers/incoming" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-phoneb-primary hover:underline"
                >
                  Open Twilio Console to Configure Your Number
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </SheetContent>
          </Sheet>
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

