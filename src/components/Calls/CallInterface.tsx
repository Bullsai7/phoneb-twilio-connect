
import React, { useState } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const CallInterface: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callTo, setCallTo] = useState('');

  const formatPhoneNumber = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Format the phone number (US format as an example)
    let formattedValue = '';
    if (numericValue.length <= 3) {
      formattedValue = numericValue;
    } else if (numericValue.length <= 6) {
      formattedValue = `(${numericValue.slice(0, 3)}) ${numericValue.slice(3)}`;
    } else {
      formattedValue = `(${numericValue.slice(0, 3)}) ${numericValue.slice(3, 6)}-${numericValue.slice(6, 10)}`;
    }
    
    return formattedValue;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const startCall = () => {
    // Validate phone number
    const numericValue = phoneNumber.replace(/\D/g, '');
    if (numericValue.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // In a real implementation, we would use Twilio's Voice SDK here
    setIsCallActive(true);
    setCallTo(phoneNumber);
    setCallDuration(0);

    // Start call duration timer
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Store interval ID for cleanup
    // @ts-ignore
    window.callInterval = interval;
    
    toast.success(`Calling ${phoneNumber}...`);
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsMuted(false);
    setIsSpeakerOn(false);
    
    // Clear interval
    // @ts-ignore
    if (window.callInterval) {
      // @ts-ignore
      clearInterval(window.callInterval);
      // @ts-ignore
      window.callInterval = null;
    }
    
    toast.info(`Call ended (${formatDuration(callDuration)})`);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.info(isMuted ? "Microphone unmuted" : "Microphone muted");
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    toast.info(isSpeakerOn ? "Speaker off" : "Speaker on");
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <div className="max-w-md mx-auto">
      {!isCallActive ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Input
                  type="text"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className="flex-1 phoneb-input"
                />
                <Button 
                  onClick={startCall}
                  className="rounded-full h-12 w-12 bg-phoneb-success hover:bg-phoneb-success/90 flex items-center justify-center p-0"
                >
                  <Phone className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((digit) => (
                  <Button
                    key={digit}
                    variant="outline"
                    className="h-14 text-lg"
                    onClick={() => setPhoneNumber(prev => formatPhoneNumber(prev + digit))}
                  >
                    {digit}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center">
          <CardContent className="pt-6 pb-6 space-y-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{callTo}</h2>
                <p className="text-gray-500">{formatDuration(callDuration)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className={`rounded-full h-14 w-14 mx-auto flex items-center justify-center p-0 ${
                  isMuted ? 'bg-phoneb-primary/10 text-phoneb-primary' : ''
                }`}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              
              <Button
                className="rounded-full h-14 w-14 mx-auto bg-phoneb-error hover:bg-phoneb-error/90 flex items-center justify-center p-0"
                onClick={endCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              
              <Button
                variant="outline"
                className={`rounded-full h-14 w-14 mx-auto flex items-center justify-center p-0 ${
                  isSpeakerOn ? 'bg-phoneb-primary/10 text-phoneb-primary' : ''
                }`}
                onClick={toggleSpeaker}
              >
                {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CallInterface;
