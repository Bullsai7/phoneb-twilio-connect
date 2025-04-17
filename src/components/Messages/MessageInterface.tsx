
import React, { useState, useEffect } from 'react';
import { Send, RefreshCw, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useHistory, MessageHistoryItem } from '@/hooks/useHistory';
import { useTwilioAccounts } from '@/hooks/useTwilioAccounts';

const MessageInterface = () => {
  const { session } = useSupabaseAuth();
  const { messageHistory, refreshHistory } = useHistory();
  const { accounts, defaultAccount } = useTwilioAccounts();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  // Set selected account to default on initial load
  useEffect(() => {
    if (defaultAccount && !selectedAccountId) {
      setSelectedAccountId(defaultAccount.id);
    }
  }, [defaultAccount]);
  
  // Group messages by phone number
  const messagesByPhone: Record<string, MessageHistoryItem[]> = {};
  messageHistory.forEach(msg => {
    if (!messagesByPhone[msg.phone_number]) {
      messagesByPhone[msg.phone_number] = [];
    }
    messagesByPhone[msg.phone_number].push(msg);
  });
  
  // Get unique phone numbers sorted by most recent message
  const conversationPhoneNumbers = Object.keys(messagesByPhone).sort((a, b) => {
    const aLatest = messagesByPhone[a][0].timestamp;
    const bLatest = messagesByPhone[b][0].timestamp;
    return new Date(bLatest).getTime() - new Date(aLatest).getTime();
  });
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  // If user selects a conversation, populate the phone number field
  useEffect(() => {
    if (selectedConversation) {
      setPhoneNumber(selectedConversation);
    }
  }, [selectedConversation]);
  
  const handleSendMessage = async () => {
    if (!phoneNumber || !message) {
      toast.error('Please enter a phone number and message');
      return;
    }
    
    if (!session) {
      toast.error('You must be logged in to send messages');
      return;
    }
    
    setSending(true);
    
    try {
      const requestBody: { 
        to: string; 
        message: string; 
        accountId?: string; 
      } = { 
        to: phoneNumber, 
        message 
      };
      
      // Add the account ID to the request if specified
      if (selectedAccountId) {
        requestBody.accountId = selectedAccountId;
      }
      
      const { data, error } = await supabase.functions.invoke('send-message', {
        body: requestBody,
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (error) throw new Error(error.message);
      
      toast.success('Message sent successfully!');
      setMessage('');
      
      // Update the selected conversation
      setSelectedConversation(phoneNumber);
      
      // Refresh history to show the new message
      refreshHistory();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  };
  
  // Find the selected account
  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
  
  // Get the messages for the selected conversation
  const currentConversation = selectedConversation
    ? messagesByPhone[selectedConversation].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : [];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Conversations Sidebar */}
      <Card className="col-span-1 h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Conversations</h3>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={refreshHistory} 
              title="Refresh conversations"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-grow pb-0">
          {conversationPhoneNumbers.length > 0 ? (
            <div className="space-y-2">
              {conversationPhoneNumbers.map(phone => {
                const latestMessage = messagesByPhone[phone][0];
                const contactName = latestMessage.contact_name || phone;
                return (
                  <div
                    key={phone}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedConversation === phone
                        ? 'bg-muted'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedConversation(phone)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium truncate">{contactName}</h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(latestMessage.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {latestMessage.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No conversations yet
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Message Content */}
      <Card className="col-span-2 h-full flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex justify-between items-center">
            <div>
              {selectedConversation ? (
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    {messagesByPhone[selectedConversation][0].contact_name || selectedConversation}
                  </h3>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 mr-1" />
                    <span>{selectedConversation}</span>
                  </div>
                </div>
              ) : (
                <h3 className="font-semibold">New Message</h3>
              )}
            </div>
            
            {accounts.length > 0 && (
              <Select 
                value={selectedAccountId || ''} 
                onValueChange={(value) => setSelectedAccountId(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Twilio account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name}
                      {account.is_default ? " (Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {!selectedConversation && (
            <div className="mt-2">
              <Input 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                type="tel"
              />
            </div>
          )}
          
          {selectedAccount?.phone_number && (
            <div className="text-xs text-muted-foreground">
              Sending from: {selectedAccount.phone_number}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="overflow-y-auto flex-grow p-4">
          {currentConversation.length > 0 ? (
            <div className="space-y-4">
              {currentConversation.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      msg.direction === 'outgoing' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <div className="text-xs mt-1 opacity-70 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedConversation ? (
            <div className="text-center py-10 text-muted-foreground">
              No messages in this conversation yet.
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Enter a phone number and message to start a conversation.
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t p-3">
          <div className="flex w-full space-x-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!phoneNumber || !message || sending || !selectedAccountId}
              className="self-end"
            >
              {sending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Send</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MessageInterface;
