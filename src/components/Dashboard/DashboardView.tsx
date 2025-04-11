
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, History, ArrowRight, ArrowUpRight, ArrowDownLeft, User } from 'lucide-react';
import { useHistory } from '@/hooks/useHistory';
import { formatDistanceToNow } from 'date-fns';

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
  const { callHistory, messageHistory, loading } = useHistory();
  const navigate = useNavigate();
  
  // Combine call and message history and sort by timestamp
  const recentActivity = [
    ...callHistory.slice(0, 5).map(call => ({
      id: call.id,
      type: 'call' as const,
      direction: call.direction,
      contact: call.contact_name || call.phone_number,
      time: call.timestamp,
      phoneNumber: call.phone_number,
    })),
    ...messageHistory.slice(0, 5).map(message => ({
      id: message.id,
      type: 'message' as const,
      direction: message.direction,
      contact: message.contact_name || message.phone_number,
      time: message.timestamp,
      content: message.content,
      phoneNumber: message.phone_number,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  .slice(0, 5);

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };

  const handleItemClick = (type: 'call' | 'message', phoneNumber: string) => {
    if (type === 'call') {
      navigate('/calls', { state: { phoneNumber } });
    } else {
      navigate('/messages', { state: { phoneNumber } });
    }
  };

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
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-phoneb-primary"></div>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleItemClick(activity.type, activity.phoneNumber)}
                >
                  <div className={`mr-3 ${activity.direction === 'incoming' ? 'text-blue-500' : 'text-green-500'}`}>
                    {activity.type === 'call' ? (
                      <Phone className="h-5 w-5" />
                    ) : (
                      <MessageSquare className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium truncate">{activity.contact}</p>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{formatTime(activity.time)}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-xs capitalize flex items-center">
                        {activity.direction === 'incoming' ? (
                          <ArrowDownLeft className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        )}
                        {activity.direction}
                      </span>
                      {'content' in activity && (
                        <p className="text-sm text-gray-600 truncate ml-2">{activity.content}</p>
                      )}
                    </div>
                  </div>
                </div>
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
