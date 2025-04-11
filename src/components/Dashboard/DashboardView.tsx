
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, History, ArrowRight } from 'lucide-react';

const RecentActivityItem: React.FC<{
  type: 'call' | 'message';
  direction: 'incoming' | 'outgoing';
  contact: string;
  time: string;
  content?: string;
}> = ({ type, direction, contact, time, content }) => {
  const Icon = type === 'call' ? Phone : MessageSquare;
  const directionColor = direction === 'incoming' ? 'text-blue-500' : 'text-green-500';
  
  return (
    <div className="flex items-start p-3 border-b border-gray-100 last:border-0">
      <div className={`mr-3 ${directionColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="font-medium truncate">{contact}</p>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{time}</span>
        </div>
        <div className="flex items-center mt-1">
          <span className={`text-xs capitalize ${directionColor}`}>{direction}</span>
          {content && (
            <p className="text-sm text-gray-600 truncate ml-2">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickActionButton: React.FC<{
  icon: React.ElementType;
  label: string;
  to: string;
  color: string;
}> = ({ icon: Icon, label, to, color }) => (
  <Link to={to} className="w-full">
    <Button 
      variant="outline" 
      className={`w-full h-24 flex flex-col items-center justify-center space-y-2 border-2 ${color}`}
    >
      <Icon className="h-6 w-6" />
      <span>{label}</span>
    </Button>
  </Link>
);

const DashboardView: React.FC = () => {
  // Mock data - in a real app, this would come from Twilio API
  const recentActivity = [
    {
      id: 1,
      type: 'call' as const,
      direction: 'incoming' as const,
      contact: '+1 (555) 123-4567',
      time: '10 min ago',
    },
    {
      id: 2,
      type: 'message' as const,
      direction: 'outgoing' as const,
      contact: 'Alice Smith',
      time: '25 min ago',
      content: 'I\'ll be there in 15 minutes.',
    },
    {
      id: 3,
      type: 'call' as const,
      direction: 'outgoing' as const,
      contact: 'Bob Johnson',
      time: '1 hour ago',
    },
    {
      id: 4,
      type: 'message' as const,
      direction: 'incoming' as const,
      contact: '+1 (555) 987-6543',
      time: '2 hours ago',
      content: 'Could you call me back when you get a chance?',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome to PhoneB</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionButton 
          icon={Phone} 
          label="New Call" 
          to="/calls" 
          color="border-phoneb-success text-phoneb-success hover:bg-phoneb-success/10" 
        />
        <QuickActionButton 
          icon={MessageSquare} 
          label="New Message" 
          to="/messages" 
          color="border-phoneb-primary text-phoneb-primary hover:bg-phoneb-primary/10" 
        />
        <QuickActionButton 
          icon={History} 
          label="View History" 
          to="/history" 
          color="border-purple-500 text-purple-500 hover:bg-purple-500/10" 
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Link to="/history" className="text-sm text-phoneb-primary hover:underline flex items-center">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivity.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {recentActivity.map((activity) => (
                <RecentActivityItem 
                  key={activity.id}
                  type={activity.type}
                  direction={activity.direction}
                  contact={activity.contact}
                  time={activity.time}
                  content={activity.content}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardView;
