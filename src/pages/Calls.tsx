
import React, { useState } from 'react';
import CallInterface from '@/components/Calls/CallInterface';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, PhoneIcon, CheckCircle2 } from 'lucide-react';
import { useTwilio } from '@/context/TwilioContext';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TwiMLAppGuide from '@/components/Calls/TwiMLAppGuide';

const Calls = () => {
  const { isAuthenticated: isTwilioSetup } = useTwilio();
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  
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
          <Info className="h-4 w-4" />
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
                      https://{window.location.hostname}/api/twiml
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
