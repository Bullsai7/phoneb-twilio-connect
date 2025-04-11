
import React, { useState } from 'react';
import { Phone, MessageSquare, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useHistory, CallHistoryItem, MessageHistoryItem } from '@/hooks/useHistory';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const HistoryView: React.FC = () => {
  const { callHistory, messageHistory, loading, error, refreshHistory } = useHistory();
  const [activeTab, setActiveTab] = useState('calls');
  const navigate = useNavigate();

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };

  const handleNewCall = (phoneNumber: string) => {
    navigate('/calls', { state: { phoneNumber } });
  };

  const handleNewMessage = (phoneNumber: string) => {
    navigate('/messages', { state: { phoneNumber } });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-phoneb-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        Error loading history: {error.message}
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={refreshHistory}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Communication History</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calls" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="calls">
              <Phone className="mr-2 h-4 w-4" />
              Calls
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calls">
            {callHistory.length > 0 ? (
              <div className="space-y-2 divide-y">
                {callHistory.map((call) => (
                  <div key={call.id} className="pt-2 first:pt-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 ${call.direction === 'incoming' ? 'text-blue-500' : 'text-green-500'}`}>
                          {call.direction === 'incoming' ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {call.contact_name || call.phone_number}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 space-x-2">
                            <span>{call.direction === 'incoming' ? 'Incoming' : 'Outgoing'}</span>
                            <span>•</span>
                            <span>{call.status}</span>
                            {call.duration && (
                              <>
                                <span>•</span>
                                <span>{call.duration}s</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(call.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleNewCall(call.phone_number)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleNewMessage(call.phone_number)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Phone className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>No call history yet</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="messages">
            {messageHistory.length > 0 ? (
              <div className="space-y-2 divide-y">
                {messageHistory.map((msg) => (
                  <div key={msg.id} className="pt-2 first:pt-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 ${msg.direction === 'incoming' ? 'text-blue-500' : 'text-green-500'}`}>
                          {msg.direction === 'incoming' ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {msg.contact_name || msg.phone_number}
                          </p>
                          <p className="text-sm text-gray-600 truncate max-w-xs">{msg.content}</p>
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <span>{msg.direction === 'incoming' ? 'Received' : 'Sent'}</span>
                            <span className="mx-1">•</span>
                            <span>{formatTime(msg.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleNewCall(msg.phone_number)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleNewMessage(msg.phone_number)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>No message history yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default HistoryView;
