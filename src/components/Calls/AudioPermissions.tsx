
import React from 'react';
import { AlertTriangle, CheckCircle2, Mic, Volume2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface AudioPermissionsProps {
  micPermission: 'granted' | 'denied' | 'pending';
  audioOutput: 'granted' | 'denied' | 'pending';
  onRequestMic: () => void;
  onTestAudio: () => void;
}

const AudioPermissions = ({ 
  micPermission, 
  audioOutput, 
  onRequestMic, 
  onTestAudio 
}: AudioPermissionsProps) => {
  return (
    <div className="space-y-4 mb-6">
      <Alert className={micPermission === 'granted' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
        {micPermission === 'granted' ? 
          <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        }
        <AlertTitle>{micPermission === 'granted' ? 'Microphone Access Granted' : 'Microphone Access Required'}</AlertTitle>
        <AlertDescription className="flex flex-col space-y-2">
          <p>{micPermission === 'granted' 
            ? 'Your microphone is ready for calls.' 
            : 'Microphone access is needed to make calls.'}</p>
          {micPermission !== 'granted' && (
            <Button variant="outline" size="sm" onClick={onRequestMic} className="w-fit">
              <Mic className="mr-2 h-4 w-4" />
              Allow Microphone Access
            </Button>
          )}
        </AlertDescription>
      </Alert>
      
      <Alert className={audioOutput === 'granted' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
        {audioOutput === 'granted' ? 
          <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        }
        <AlertTitle>{audioOutput === 'granted' ? 'Speaker Access Granted' : 'Speaker Test Recommended'}</AlertTitle>
        <AlertDescription className="flex flex-col space-y-2">
          <p>{audioOutput === 'granted' 
            ? 'Your speaker is ready for calls.' 
            : 'Testing your speaker is recommended before making calls.'}</p>
          <Button variant="outline" size="sm" onClick={onTestAudio} className="w-fit">
            <Volume2 className="mr-2 h-4 w-4" />
            Test Speaker
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AudioPermissions;
