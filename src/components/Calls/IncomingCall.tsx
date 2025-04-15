
import React from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface IncomingCallProps {
  from: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCall = ({ from, onAccept, onReject }: IncomingCallProps) => {
  return (
    <Card className="mb-4 bg-blue-50 border-blue-200">
      <CardContent className="pt-6 pb-6 space-y-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
            <Phone className="h-10 w-10 text-blue-600" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Incoming Call</h2>
            <p className="text-gray-600">{from}</p>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button
            className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600 flex items-center justify-center p-0"
            onClick={onAccept}
          >
            <Phone className="h-6 w-6" />
          </Button>
          
          <Button
            className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600 flex items-center justify-center p-0"
            onClick={onReject}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomingCall;
