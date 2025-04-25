
import React from 'react';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WebhookGuideCardProps {
  show: boolean;
}

const WebhookGuideCard = ({ show }: WebhookGuideCardProps) => {
  if (!show) return null;

  return (
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
  );
};

export default WebhookGuideCard;
