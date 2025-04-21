
import React, { useState, useEffect } from 'react';
import CallInterface from '@/components/Calls/CallInterface';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, PhoneIcon, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTwilio } from '@/context/TwilioContext';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TwiMLAppGuide from '@/components/Calls/TwiMLAppGuide';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const Calls = () => {
  const { isAuthenticated: isTwilioSetup } = useTwilio();
  const { session, refreshSession, refreshingSession } = useSupabaseAuth();
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  
  const handleRetryConnection = async () => {
    try {
      await refreshSession();
      toast.success("Session refreshed. Retrying connection...");
      // Force a reload of the page after session refresh
      window.location.reload();
    } catch (error) {
      toast.error("Failed to refresh session");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Make a Call</h1>
      
      {isTwilioSetup ? (
        <Alert variant="default" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Ready to Call</AlertTitle>
          <AlertDescription>
            Your Twilio account is connected. Enter a phone number to make a call.
            Remember to allow microphone access when prompted by your browser.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Twilio Setup Required</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <p>To make calls, you need to set up your Twilio account first. Go to the dashboard and configure your Twilio credentials.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="w-fit">
                <Link to="/dashboard">Configure Twilio</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSetupGuide(!showSetupGuide)}>
                {showSetupGuide ? "Hide Setup Guide" : "Show Setup Guide"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <Alert variant="default" className="mb-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Connection Troubleshooting</AlertTitle>
        <AlertDescription className="flex flex-col space-y-2">
          <p>If you're experiencing connection issues, try refreshing your session:</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetryConnection} 
              disabled={refreshingSession} 
              className="w-fit flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${refreshingSession ? 'animate-spin' : ''}`} />
              {refreshingSession ? "Refreshing..." : "Refresh Connection"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowTroubleshooting(!showTroubleshooting)} 
              className="w-fit"
            >
              {showTroubleshooting ? "Hide Troubleshooting" : "Show Troubleshooting Tips"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowWebhookGuide(!showWebhookGuide)} 
              className="w-fit"
            >
              {showWebhookGuide ? "Hide Webhook Guide" : "Show Webhook Guide"}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
      
      {showWebhookGuide && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Twilio Webhook Configuration</CardTitle>
            <CardDescription>
              Make sure your Twilio phone number is properly configured with webhooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Required Webhook URLs</h3>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="font-mono text-sm break-all">https://qjgbmowupuzgwrfcmaao.supabase.co/functions/v1/handle-webhooks</p>
              </div>
              <p className="text-sm text-muted-foreground">
                This URL should be set as your <strong>Voice URL</strong> in your Twilio phone number settings and TwiML app.
              </p>
            </div>
            
            <div className="space-y-2 mt-4">
              <h3 className="font-medium">Configuration Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>Go to the <a href="https://www.twilio.com/console/phone-numbers/incoming" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Phone Numbers section</a> in your Twilio Console</li>
                <li>Click on your phone number</li>
                <li>Under "Voice & Fax" section, make sure "A CALL COMES IN" is set to "Webhook" and enter the URL above</li>
                <li>Set the HTTP method to "HTTP POST"</li>
                <li>Save your changes</li>
              </ol>
            </div>
            
            <div className="space-y-2 mt-4">
              <h3 className="font-medium">TwiML App Configuration:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>Go to the <a href="https://www.twilio.com/console/voice/twiml/apps" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">TwiML Apps section</a> in your Twilio Console</li>
                <li>Select your TwiML App or create a new one</li>
                <li>Set the "Request URL" to the webhook URL above</li>
                <li>Set the method to "HTTP POST"</li>
                <li>Save your changes</li>
              </ol>
            </div>
            
            <Alert variant="default" className="mt-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Your Configuration</AlertTitle>
              <AlertDescription>
                <p>Based on your screenshots, your Twilio configuration appears to be correct. The webhook URL is set properly in your phone number settings.</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
      
      {showTroubleshooting && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Troubleshooting Phone Connection</CardTitle>
            <CardDescription>Common issues and how to fix them</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Edge Function Errors</h3>
              <p className="text-sm text-muted-foreground mb-2">
                If you see "Edge Function returned a non-2xx status code", this typically means there's an issue with your Twilio configuration.
              </p>
              <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground ml-4">
                <li>Verify that your Twilio Account SID and Auth Token are correct in the Dashboard</li>
                <li>Make sure your TwiML App SID is added in Dashboard settings</li>
                <li>Check that you have a valid Twilio phone number</li>
                <li>Try refreshing your session using the button above</li>
                <li>If problems persist, try logging out and back in</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Microphone Issues</h3>
              <p className="text-sm text-muted-foreground mb-2">
                If your microphone isn't working:
              </p>
              <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground ml-4">
                <li>Make sure your browser has permission to access your microphone</li>
                <li>Check your device settings to ensure the correct microphone is selected</li>
                <li>Try using a different browser if problems persist</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Account Verification</h3>
              <p className="text-sm text-muted-foreground mb-2">
                If you're using a Twilio trial account:
              </p>
              <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground ml-4">
                <li>Verify your personal phone number in the Twilio Console</li>
                <li>You can only call verified numbers with a trial account</li>
                <li>Consider upgrading to a full Twilio account for production use</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
      
      {showSetupGuide && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Complete Twilio Setup Guide</CardTitle>
            <CardDescription>
              Follow these steps to get your Twilio account ready for calling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="account">
              <TabsList className="mb-4">
                <TabsTrigger value="account">1. Twilio Account</TabsTrigger>
                <TabsTrigger value="twiml">2. TwiML App</TabsTrigger>
                <TabsTrigger value="number">3. Phone Number</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account" className="space-y-4">
                <h3 className="font-semibold">Step 1: Set up your Twilio Account</h3>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Sign up for a <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Twilio account</a> if you don't have one</li>
                  <li>Get your Account SID and Auth Token from the <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Twilio Console</a></li>
                  <li>Go to the <Button variant="link" className="p-0 h-auto" asChild><Link to="/dashboard">Dashboard</Link></Button> in this app</li>
                  <li>Add a new Twilio account with your Account SID and Auth Token</li>
                </ol>
              </TabsContent>
              
              <TabsContent value="twiml" className="space-y-4">
                <h3 className="font-semibold">Step 2: Create a TwiML Application</h3>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Go to the <a href="https://www.twilio.com/console/voice/twiml/apps" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">TwiML Apps section</a> in your Twilio Console</li>
                  <li>Create a new TwiML App</li>
                  <li>For the Voice Request URL, enter:
                    <div className="bg-gray-100 p-2 my-2 rounded text-sm font-mono break-all">
                      https://qjgbmowupuzgwrfcmaao.supabase.co/functions/v1/handle-webhooks
                    </div>
                  </li>
                  <li>Save your app and copy the Application SID</li>
                  <li>Add this App SID to your Twilio account in this application's Dashboard</li>
                </ol>
              </TabsContent>
              
              <TabsContent value="number" className="space-y-4">
                <h3 className="font-semibold">Step 3: Get a Phone Number</h3>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Go to the <a href="https://www.twilio.com/console/phone-numbers/incoming" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Phone Numbers section</a> in your Twilio Console</li>
                  <li>Buy a phone number with voice capabilities</li>
                  <li>Alternatively, use the Phone Numbers tab in this app's Dashboard to purchase a number directly</li>
                  <li>Make sure your number is connected to your TwiML app in the Twilio Console</li>
                </ol>
                
                <div className="flex items-center p-3 bg-green-50 rounded border border-green-200 mt-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <p className="text-sm">Once you've completed all 3 steps, you should be able to make calls!</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      <CallInterface />
    </div>
  );
};

export default Calls;
