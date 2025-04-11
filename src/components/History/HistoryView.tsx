import React, { useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  ArrowDownLeft, 
  ArrowUpRight,
  Calendar,
  Search,
  Filter,
  Phone as PhoneIcon
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data types
interface BaseHistoryItem {
  id: number;
  phoneNumber: string;
  contactName?: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
}

interface CallHistoryItem extends BaseHistoryItem {
  type: 'call';
  duration: string;
  status: 'completed' | 'missed' | 'busy' | 'failed';
}

interface MessageHistoryItem extends BaseHistoryItem {
  type: 'message';
  content: string;
}

type HistoryItem = CallHistoryItem | MessageHistoryItem;

const HistoryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<{
    incoming: boolean;
    outgoing: boolean;
    missed: boolean;
  }>({
    incoming: true,
    outgoing: true,
    missed: true,
  });

  // Mock history data - in a real app, this would come from Twilio API
  const mockHistory: HistoryItem[] = [
    {
      id: 1,
      type: 'call',
      phoneNumber: '+1 (555) 123-4567',
      contactName: 'John Doe',
      timestamp: '2023-04-10 09:30 AM',
      direction: 'incoming',
      duration: '5:21',
      status: 'completed',
    },
    {
      id: 2,
      type: 'message',
      phoneNumber: '+1 (555) 987-6543',
      timestamp: '2023-04-09 03:15 PM',
      direction: 'outgoing',
      content: "Hi there, just checking in to see how you're doing.",
    },
    {
      id: 3,
      type: 'call',
      phoneNumber: '+1 (555) 456-7890',
      contactName: 'Alice Smith',
      timestamp: '2023-04-09 11:45 AM',
      direction: 'outgoing',
      duration: '2:03',
      status: 'completed',
    },
    {
      id: 4,
      type: 'call',
      phoneNumber: '+1 (555) 123-4567',
      contactName: 'John Doe',
      timestamp: '2023-04-08 04:20 PM',
      direction: 'incoming',
      duration: '0:00',
      status: 'missed',
    },
    {
      id: 5,
      type: 'message',
      phoneNumber: '+1 (555) 123-4567',
      contactName: 'John Doe',
      timestamp: '2023-04-08 10:10 AM',
      direction: 'incoming',
      content: "Can you call me back when you're free?",
    },
    {
      id: 6,
      type: 'call',
      phoneNumber: '+1 (555) 789-0123',
      timestamp: '2023-04-07 02:33 PM',
      direction: 'outgoing',
      duration: '0:00',
      status: 'busy',
    },
    {
      id: 7,
      type: 'message',
      phoneNumber: '+1 (555) 456-7890',
      contactName: 'Alice Smith',
      timestamp: '2023-04-07 09:04 AM',
      direction: 'outgoing',
      content: "Let's meet at 2 PM today at the coffee shop.",
    },
    {
      id: 8,
      type: 'call',
      phoneNumber: '+1 (555) 234-5678',
      contactName: 'Bob Johnson',
      timestamp: '2023-04-06 05:47 PM',
      direction: 'incoming',
      duration: '8:12',
      status: 'completed',
    },
  ];

  // Filter and search the history items
  const filteredHistory = mockHistory.filter((item) => {
    // Filter by direction and call status
    if (item.type === 'call' && item.status === 'missed' && !filter.missed) {
      return false;
    }
    if (item.direction === 'incoming' && !filter.incoming) {
      return false;
    }
    if (item.direction === 'outgoing' && !filter.outgoing) {
      return false;
    }

    // Search by contact name, phone number, or message content
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = item.contactName?.toLowerCase().includes(searchLower);
      const phoneMatch = item.phoneNumber.toLowerCase().includes(searchLower);
      const contentMatch = item.type === 'message' && item.content.toLowerCase().includes(searchLower);
      
      return nameMatch || phoneMatch || contentMatch;
    }
    
    return true;
  });

  const callHistory = filteredHistory.filter((item) => item.type === 'call');
  const messageHistory = filteredHistory.filter((item) => item.type === 'message');

  // Render a single history item
  const renderHistoryItem = (item: HistoryItem) => {
    const Icon = item.type === 'call' ? Phone : MessageSquare;
    const DirectionIcon = item.direction === 'incoming' ? ArrowDownLeft : ArrowUpRight;
    const directionColor = item.direction === 'incoming' ? 'text-blue-500' : 'text-green-500';
    
    // Special case for missed calls
    const isMissed = item.type === 'call' && item.status === 'missed';
    const missedCallColor = isMissed ? 'text-phoneb-error' : directionColor;
    
    return (
      <div className="flex items-start p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <div className={`p-2 rounded-full ${item.type === 'call' ? 'bg-phoneb-primary/10' : 'bg-blue-500/10'} mr-3`}>
          <Icon className={`h-5 w-5 ${item.type === 'call' ? 'text-phoneb-primary' : 'text-blue-500'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">
                {item.contactName || item.phoneNumber}
              </p>
              <div className="flex items-center mt-1">
                <DirectionIcon className={`h-3 w-3 ${missedCallColor} mr-1`} />
                <span className={`text-xs ${missedCallColor}`}>
                  {item.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                  {isMissed && ' (Missed)'}
                </span>
                {item.type === 'call' && !isMissed && (
                  <span className="text-xs text-gray-500 ml-2">
                    Duration: {item.duration}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 whitespace-nowrap">{item.timestamp}</span>
              {item.type === 'call' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full mt-1"
                >
                  <PhoneIcon className="h-4 w-4 text-phoneb-primary" />
                </Button>
              )}
            </div>
          </div>
          
          {item.type === 'message' && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.content}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">History</h1>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search history..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filter.incoming}
                onCheckedChange={(checked) => setFilter({ ...filter, incoming: checked })}
              >
                Incoming
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.outgoing}
                onCheckedChange={(checked) => setFilter({ ...filter, outgoing: checked })}
              >
                Outgoing
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.missed}
                onCheckedChange={(checked) => setFilter({ ...filter, missed: checked })}
              >
                Missed calls
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="px-4 py-3">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="p-0">
          <TabsContent value="all" className="m-0">
            {filteredHistory.length > 0 ? (
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredHistory.map(renderHistoryItem)}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No history found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="calls" className="m-0">
            {callHistory.length > 0 ? (
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {callHistory.map(renderHistoryItem)}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No call history found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="messages" className="m-0">
            {messageHistory.length > 0 ? (
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {messageHistory.map(renderHistoryItem)}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">No message history found</p>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryView;
