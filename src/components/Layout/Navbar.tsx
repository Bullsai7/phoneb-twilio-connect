
import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogOut, Settings, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTwilio } from '@/context/TwilioContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { logout } = useTwilio();
  const { signOut, user } = useSupabaseAuth();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const handleSignOut = async () => {
    // First disconnect from Twilio
    logout();
    // Then sign out from Supabase
    await signOut();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/dashboard" className="flex items-center space-x-2">
          <span className="font-bold text-xl text-phoneb-primary">PhoneB</span>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
              <Avatar>
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 z-50">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            {user && (
              <div className="px-2 py-1.5 text-sm text-gray-500 truncate">
                {user.email}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to="/settings" className="flex items-center w-full">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
