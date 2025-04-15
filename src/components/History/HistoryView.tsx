
import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useHistory, CallHistoryItem, MessageHistoryItem } from '@/hooks/useHistory';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const HistoryView: React.FC = () => {
  const { callHistory, messageHistory, loading, error, refreshHistory } = useHistory();
  const [activeTab, setActiveTab] = useState('calls');
  const navigate = useNavigate();
  
  // Pagination state
  const [currentCallPage, setCurrentCallPage] = useState(1);
  const [currentMessagePage, setCurrentMessagePage] = useState(1);
  const itemsPerPage = 5;

  // Get current items for pagination
  const indexOfLastCall = currentCallPage * itemsPerPage;
  const indexOfFirstCall = indexOfLastCall - itemsPerPage;
  const currentCalls = callHistory.slice(indexOfFirstCall, indexOfLastCall);
  
  const indexOfLastMessage = currentMessagePage * itemsPerPage;
  const indexOfFirstMessage = indexOfLastMessage - itemsPerPage;
  const currentMessages = messageHistory.slice(indexOfFirstMessage, indexOfLastMessage);

  // Calculate total pages
  const totalCallPages = Math.ceil(callHistory.length / itemsPerPage);
  const totalMessagePages = Math.ceil(messageHistory.length / itemsPerPage);

  // Handle refresh
  const handleRefresh = () => {
    refreshHistory();
    toast.info("Refreshing history...");
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      console.error('Error formatting time:', e, 'for timestamp:', timestamp);
      return 'Unknown time';
    }
  };

  const handleNewCall = (phoneNumber: string) => {
    navigate('/calls', { state: { phoneNumber } });
  };

  const handleNewMessage = (phoneNumber: string) => {
    navigate('/messages', { state: { phoneNumber } });
  };

  useEffect(() => {
    // Log the history data when it changes
    console.log('Call history in component:', callHistory);
    console.log('Message history in component:', messageHistory);
  }, [callHistory, messageHistory]);

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
        <p>Error loading history: {error.message}</p>
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
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle>Communication History</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh} 
          className="h-8 w-8"
          title="Refresh history"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calls" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="calls">
              <Phone className="mr-2 h-4 w-4" />
              Calls {callHistory.length > 0 && `(${callHistory.length})`}
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages {messageHistory.length > 0 && `(${messageHistory.length})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calls">
            {callHistory.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Direction</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentCalls.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell>
                          <div className={`flex items-center ${call.direction === 'incoming' ? 'text-blue-500' : 'text-green-500'}`}>
                            {call.direction === 'incoming' ? (
                              <ArrowDownLeft className="h-4 w-4 mr-1" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                            )}
                            {call.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{call.contact_name || call.phone_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className={
                              call.status === 'completed' ? 'text-green-500' :
                              call.status === 'missed' ? 'text-red-500' :
                              call.status === 'busy' ? 'text-yellow-500' :
                              'text-gray-500'
                            }>
                              {call.status}
                            </span>
                            {call.duration && <span>• {call.duration}s</span>}
                          </div>
                        </TableCell>
                        <TableCell>{formatTime(call.timestamp)}</TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalCallPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      {currentCallPage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious onClick={() => setCurrentCallPage(currentCallPage - 1)} />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: totalCallPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            isActive={page === currentCallPage}
                            onClick={() => setCurrentCallPage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      {currentCallPage < totalCallPages && (
                        <PaginationItem>
                          <PaginationNext onClick={() => setCurrentCallPage(currentCallPage + 1)} />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Phone className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>No call history yet</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="messages">
            {messageHistory.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Direction</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentMessages.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell>
                          <div className={`flex items-center ${msg.direction === 'incoming' ? 'text-blue-500' : 'text-green-500'}`}>
                            {msg.direction === 'incoming' ? (
                              <ArrowDownLeft className="h-4 w-4 mr-1" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                            )}
                            {msg.direction === 'incoming' ? 'Received' : 'Sent'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{msg.contact_name || msg.phone_number}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600 truncate max-w-xs">{msg.content}</p>
                        </TableCell>
                        <TableCell>{formatTime(msg.timestamp)}</TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalMessagePages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      {currentMessagePage > 1 && (
                        <PaginationItem>
                          <PaginationPrevious onClick={() => setCurrentMessagePage(currentMessagePage - 1)} />
                        </PaginationItem>
                      )}
                      
                      {Array.from({ length: totalMessagePages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            isActive={page === currentMessagePage}
                            onClick={() => setCurrentMessagePage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      {currentMessagePage < totalMessagePages && (
                        <PaginationItem>
                          <PaginationNext onClick={() => setCurrentMessagePage(currentMessagePage + 1)} />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                )}
              </>
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
