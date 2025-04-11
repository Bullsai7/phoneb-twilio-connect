
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Phone, MessageSquare, History, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Phone, label: 'Calls', path: '/calls' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: History, label: 'History', path: '/history' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
          <h1 className="text-xl font-bold text-phoneb-primary">PhoneB</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                    isActive 
                      ? "bg-phoneb-primary text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      toggleSidebar();
                    }
                  }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
