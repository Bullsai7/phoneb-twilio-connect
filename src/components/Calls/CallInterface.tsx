import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  User,
  Settings,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useTwilio } from '@/context/TwilioContext';
import { Link } from 'react-router-dom';
import { Device } from 'twilio-client';

const CallInterface: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callTo, setCallTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [audioOutput, setAudioOutput] = useState<'granted' | 'denied' | 'pending'>('pending');
  const { session } = useSupabaseAuth();
  const { isAuthenticated: isTwilioSetup } = useTwilio();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [device, setDevice] = useState<any>(null);
  const [connection, setConnection] = useState<any>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallFrom, setIncomingCallFrom] = useState('');

  // Check for microphone and speaker permissions on mount
  useEffect(() => {
    checkAudioPermissions();
  }, []);

  const checkAudioPermissions = async () => {
    try {
      // Check mic permissions
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      
      // Clean up mic stream
      micStream.getTracks().forEach(track => track.stop());
      
      // Check audio output
      const audio = new Audio();
      audio.volume = 0.01; // Very low volume
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Audio playback started successfully
            setAudioOutput('granted');
            audio.pause();
          })
          .catch(error => {
            // Auto-play was prevented
            console.error("Audio playback failed:", error);
            setAudioOutput('denied');
          });
      }
    } catch (error) {
      console.error("Error checking audio permissions:", error);
      setMicPermission('denied');
    }
  };

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      toast.success("Microphone access granted");
    } catch (error) {
      setMicPermission('denied');
      toast.error("Microphone access denied. Please enable it in your browser settings.");
    }
  };

  const testAudioOutput = () => {
    try {
      // Create audio element for testing
      if (!audioRef.current) {
        audioRef.current = new Audio('/ringtone.mp3');
      }
      
      audioRef.current.volume = 0.3;
      audioRef.current.play()
        .then(() => {
          setAudioOutput('granted');
          toast.success("Speaker test successful");
          
          // Stop audio after 2 seconds
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
          }, 2000);
        })
        .catch(error => {
          console.error("Audio playback failed:", error);
          setAudioOutput('denied');
          toast.error("Speaker test failed. Please check your browser settings.");
        });
    } catch (error) {
      console.error("Error testing audio output:", error);
      toast.error("Error testing audio output");
    }
  };

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

  const startCall = async () => {
    // Reset error state
    setErrorDetails(null);
    
    // Check microphone permission
    if (micPermission !== 'granted') {
      toast.error("Microphone access is required to make calls");
      await requestMicPermission();
      return;
    }
    
    // Validate phone number
    const numericValue = phoneNumber.replace(/\D/g, '');
    if (numericValue.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!isTwilioSetup) {
      toast.error("Please set up your Twilio credentials in the settings first");
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Starting call to:", numericValue);
      console.log("Auth token:", session?.access_token ? "Available" : "Not available");
      
      // Call the Supabase Edge Function to make a call
      const { data, error } = await supabase.functions.invoke('make-call', {
        body: { to: numericValue },
        headers: session?.access_token 
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined
      });
      
      if (error) {
        console.error("Error invoking function:", error);
        throw new Error(error.message || "Failed to connect to call service");
      }
      
      if (!data?.success) {
        console.error("Function returned error:", data);
        throw new Error(data?.error || "Failed to initiate call");
      }
      
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
      
    } catch (error) {
      console.error('Error making call:', error);
      const errorMessage = error.message || "Failed to make call";
      
      // Check for specific errors
      if (errorMessage.includes("Twilio credentials not found")) {
        setErrorDetails("Twilio credentials are missing or invalid. Please check your settings.");
      } else if (errorMessage.includes("Invalid token")) {
        setErrorDetails("Your session has expired. Please sign in again.");
      } else {
        setErrorDetails(errorMessage);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Twilio Device when component mounts
  useEffect(() => {
    const setupTwilioDevice = async () => {
      if (!session?.access_token || !isTwilioSetup) return;

      try {
        // Get Twilio token from our edge function
        const { data, error } = await supabase.functions.invoke('get-twilio-token', {
          headers: session?.access_token 
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined
        });

        if (error) throw error;

        // Create Twilio Device
        const newDevice = new Device(data.token);

        // Handle incoming calls
        newDevice.on('incoming', (conn) => {
          setIsIncomingCall(true);
          setIncomingCallFrom(conn.parameters.From || 'Unknown');
          setConnection(conn);
          
          // Auto-accept call after microphone permission
          if (micPermission === 'granted') {
            conn.accept();
            setIsCallActive(true);
            setCallTo(conn.parameters.From || 'Unknown');
            startCallTimer();
          } else {
            toast.error("Microphone access required to accept calls");
            requestMicPermission();
          }
        });

        newDevice.on('error', (error) => {
          console.error('Twilio device error:', error);
          toast.error("Error with phone connection: " + error.message);
        });

        setDevice(newDevice);
      } catch (error) {
        console.error('Error setting up Twilio device:', error);
        toast.error("Failed to initialize phone connection");
      }
    };

    setupTwilioDevice();

    return () => {
      if (device) {
        device.destroy();
      }
    };
  }, [session, isTwilioSetup, micPermission]);

  const startCallTimer = () => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    // @ts-ignore
    window.callInterval = interval;
  };

  const handleAcceptCall = () => {
    if (connection) {
      connection.accept();
      setIsCallActive(true);
      setIsIncomingCall(false);
      startCallTimer();
      toast.success(`Connected with ${incomingCallFrom}`);
    }
  };

  const handleRejectCall = () => {
    if (connection) {
      connection.reject();
      setIsIncomingCall(false);
      setConnection(null);
      toast.info(`Rejected call from ${incomingCallFrom}`);
    }
  };

  // Modify the endCall function to handle both outgoing and incoming calls
  const endCall = () => {
    if (connection) {
      connection.disconnect();
      setConnection(null);
    }
    setIsCallActive(false);
    setIsIncomingCall(false);
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
      {/* Permissions checks */}
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
              <Button variant="outline" size="sm" onClick={requestMicPermission} className="w-fit">
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
            <Button variant="outline" size="sm" onClick={testAudioOutput} className="w-fit">
              <Volume2 className="mr-2 h-4 w-4" />
              Test Speaker
            </Button>
          </AlertDescription>
        </Alert>
      </div>

      {!isTwilioSetup && (
        <Alert className="mb-4" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Twilio Not Configured</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <p>Please configure your Twilio credentials in the dashboard to make calls.</p>
            <Button variant="outline" size="sm" asChild className="w-fit">
              <Link to="/dashboard">
                <Settings className="mr-2 h-4 w-4" />
                Configure Twilio
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {errorDetails && (
        <Alert className="mb-4" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Call Error</AlertTitle>
          <AlertDescription>
            {errorDetails}
          </AlertDescription>
        </Alert>
      )}

      {isIncomingCall && !isCallActive && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="pt-6 pb-6 space-y-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                <Phone className="h-10 w-10 text-blue-600" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold">Incoming Call</h2>
                <p className="text-gray-600">{incomingCallFrom}</p>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button
                className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600 flex items-center justify-center p-0"
                onClick={handleAcceptCall}
              >
                <Phone className="h-6 w-6" />
              </Button>
              
              <Button
                className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600 flex items-center justify-center p-0"
                onClick={handleRejectCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                  disabled={isLoading || !isTwilioSetup || micPermission !== 'granted'}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <Phone className="h-5 w-5" />
                  )}
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
