
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'contact';
  timestamp: Date;
}

const MessageInterface: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentContact, setCurrentContact] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Format phone number as user types
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

  // Handle phone number input change
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  // Start new conversation
  const startConversation = () => {
    // Validate phone number
    const numericValue = phoneNumber.replace(/\D/g, '');
    if (numericValue.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setCurrentContact(phoneNumber);
    setShowMessageForm(true);
    
    // Clear previous conversation
    setMessages([]);
  };

  // Send message
  const sendMessage = () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    // In a real implementation, we would use Twilio's SMS API here
    const newMessage: Message = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    
    toast.success(`Message sent to ${currentContact}`);
    
    // Simulate received message after a short delay
    setTimeout(() => {
      const receivedMessage: Message = {
        id: Date.now(),
        text: "This is a simulated response. In a real app, this would be the actual response from the recipient.",
        sender: 'contact',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, receivedMessage]);
    }, 2000);
  };

  // Close conversation and return to phone number input
  const closeConversation = () => {
    setShowMessageForm(false);
    setCurrentContact(null);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Format timestamp for messages
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="h-full">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {showMessageForm ? (
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <span>{currentContact}</span>
                </div>
              ) : (
                "New Message"
              )}
            </CardTitle>
            {showMessageForm && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={closeConversation}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {!showMessageForm ? (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">To</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="phoneNumber"
                    placeholder="Phone number"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    className="flex-1"
                  />
                  <Button 
                    onClick={startConversation}
                    disabled={!phoneNumber}
                    className="bg-phoneb-primary hover:bg-phoneb-primary/90"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-[500px]">
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={cn(
                          "max-w-[80%] rounded-lg p-3 relative",
                          msg.sender === 'user' 
                            ? "bg-phoneb-primary text-white ml-auto" 
                            : "bg-gray-200 text-gray-800"
                        )}
                      >
                        <p>{msg.text}</p>
                        <span className={cn(
                          "text-xs absolute bottom-1 right-2",
                          msg.sender === 'user' ? "text-white/70" : "text-gray-500"
                        )}>
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Start a conversation with {currentContact}
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    className="min-h-10 resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    className="bg-phoneb-primary hover:bg-phoneb-primary/90 h-10 w-10 p-0 rounded-full flex items-center justify-center"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageInterface;
