
import React from 'react';
import { User, Mic, MicOff, Volume2, VolumeX, PhoneOff } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ActiveCallProps {
  callTo: string;
  duration: string;
  isMuted: boolean;
  isSpeakerOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
}

const ActiveCall = ({
  callTo,
  duration,
  isMuted,
  isSpeakerOn,
  onToggleMute,
  onToggleSpeaker,
  onEndCall
}: ActiveCallProps) => {
  return (
    <Card className="text-center">
      <CardContent className="pt-6 pb-6 space-y-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-gray-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{callTo}</h2>
            <p className="text-gray-500">{duration}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className={`rounded-full h-14 w-14 mx-auto flex items-center justify-center p-0 ${
              isMuted ? 'bg-phoneb-primary/10 text-phoneb-primary' : ''
            }`}
            onClick={onToggleMute}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
          
          <Button
            className="rounded-full h-14 w-14 mx-auto bg-phoneb-error hover:bg-phoneb-error/90 flex items-center justify-center p-0"
            onClick={onEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          
          <Button
            variant="outline"
            className={`rounded-full h-14 w-14 mx-auto flex items-center justify-center p-0 ${
              isSpeakerOn ? 'bg-phoneb-primary/10 text-phoneb-primary' : ''
            }`}
            onClick={onToggleSpeaker}
          >
            {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveCall;
