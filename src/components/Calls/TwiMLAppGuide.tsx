
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TwiMLAppGuideProps {
  onClose?: () => void;
}

const TwiMLAppGuide: React.FC<TwiMLAppGuideProps> = ({ onClose }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
          Twilio TwiML App Setup Required
        </CardTitle>
        <CardDescription>
          Before you can make calls, you need to create a TwiML Application in your Twilio account
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="guide">
          <TabsList className="mb-4">
            <TabsTrigger value="guide">Setup Guide</TabsTrigger>
            <TabsTrigger value="troubleshoot">Troubleshooting</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guide" className="space-y-4">
            <p>Follow these steps to set up your TwiML App in Twilio:</p>
            
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Go to the <a href="https://www.twilio.com/console/voice/twiml/apps" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Twilio TwiML Apps page</a></li>
              <li>Click <strong>Create new TwiML App</strong></li>
              <li>Give your app a friendly name (e.g., "PhoneB App")</li>
              <li>For the <strong>Voice Request URL</strong>, enter the URL that our calls will use for instructions:
                <div className="bg-gray-100 p-2 my-2 rounded text-sm font-mono break-all">
                  https://{window.location.hostname}/api/twiml
                </div>
              </li>
              <li>Leave other fields blank and click <strong>Create</strong></li>
              <li>On the next page, you'll see your new app - copy the <strong>Application SID</strong></li>
              <li>Go to the <strong>Dashboard</strong> section of this app and update your Twilio account settings with the Application SID</li>
            </ol>
            
            <Alert className="mt-4">
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Once you've created your TwiML App, make sure to add the App SID to your Twilio account settings in this application.
              </AlertDescription>
            </Alert>
          </TabsContent>
          
          <TabsContent value="troubleshoot" className="space-y-4">
            <h3 className="font-semibold">Common Issues</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Missing App SID</h4>
                <p className="text-sm text-muted-foreground">
                  If you get errors about a missing App SID, it means you haven't added the TwiML Application SID to your account settings.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">Invalid Voice URL</h4>
                <p className="text-sm text-muted-foreground">
                  Make sure your TwiML App has a valid Voice Request URL. It should point to a publicly accessible endpoint that returns TwiML instructions.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">No Phone Number</h4>
                <p className="text-sm text-muted-foreground">
                  You must have a Twilio phone number with voice capabilities to make outgoing calls. Purchase one in your Twilio console if needed.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {onClose && (
        <CardFooter>
          <Button onClick={onClose}>Got it</Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default TwiMLAppGuide;
