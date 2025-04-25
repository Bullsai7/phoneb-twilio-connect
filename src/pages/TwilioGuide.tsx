
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const TwilioGuide = () => {
  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold">Twilio Setup Guide</h1>
      
      <Tabs defaultValue="account">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
          <TabsTrigger value="account">Account Setup</TabsTrigger>
          <TabsTrigger value="twiml">TwiML App</TabsTrigger>
          <TabsTrigger value="number">Phone Number</TabsTrigger>
          <TabsTrigger value="webhook">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>1. Twilio Account Setup</CardTitle>
              <CardDescription>
                First steps to get started with Twilio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-4">
                <li>Go to <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Twilio's website</a> and sign up for an account</li>
                <li>Once registered, locate your Account SID and Auth Token in the Twilio Console</li>
                <li>Add these credentials to your PhoneB dashboard:
                  <Button variant="outline" size="sm" asChild className="ml-2">
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="twiml" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>2. Create a TwiML Application</CardTitle>
              <CardDescription>
                TwiML Apps help manage voice and messaging capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-4">
                <li>Go to the <a href="https://www.twilio.com/console/voice/twiml/apps" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">TwiML Apps section</a> in your Twilio Console</li>
                <li>Click "Create new TwiML App"</li>
                <li>Name your app (e.g., "PhoneB App")</li>
                <li>Set the Voice Request URL to:
                  <div className="bg-gray-100 p-2 my-2 rounded text-sm font-mono">
                    https://qjgbmowupuzgwrfcmaao.supabase.co/functions/v1/handle-webhooks
                  </div>
                </li>
                <li>Save the app and copy the Application SID</li>
                <li>Add the Application SID to your PhoneB dashboard settings</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="number" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>3. Configure Phone Number</CardTitle>
              <CardDescription>
                Set up a Twilio phone number for making and receiving calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-4">
                <li>Navigate to the <a href="https://www.twilio.com/console/phone-numbers/incoming" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Phone Numbers section</a></li>
                <li>Buy a new number or configure an existing one</li>
                <li>Under Voice Configuration:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-2">
                    <li>Set "Accept Incoming" to Voice Calls</li>
                    <li>Configure the webhook URL (same as TwiML App)</li>
                    <li>Set HTTP Method to POST</li>
                  </ul>
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>4. Webhook Configuration</CardTitle>
              <CardDescription>
                Set up webhooks to handle call events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Webhook URL</AlertTitle>
                <AlertDescription>
                  Use this URL for all webhook configurations:
                  <div className="bg-gray-100 p-2 my-2 rounded text-sm font-mono break-all">
                    https://qjgbmowupuzgwrfcmaao.supabase.co/functions/v1/handle-webhooks
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-medium">Verification Steps:</h4>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Verify webhook URL is set in TwiML App</li>
                  <li>Confirm webhook URL in phone number settings</li>
                  <li>Test webhook response using Twilio's testing tools</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertTitle>Need More Help?</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          <span>Visit Twilio's documentation for detailed setup instructions.</span>
          <Button variant="outline" size="sm" asChild>
            <a href="https://www.twilio.com/docs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              Twilio Docs <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TwilioGuide;
