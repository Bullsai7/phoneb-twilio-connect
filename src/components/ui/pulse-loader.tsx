
import React from 'react';

export const PulseLoader = () => {
  return (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
    </div>
  );
};
