import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TwilioProvider } from "./context/TwilioContext";
import AppLayout from "./components/Layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Calls from "./pages/Calls";
import Messages from "./pages/Messages";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import TwilioGuide from "./pages/TwilioGuide";

const App: React.FC = () => {
  // Create a new instance of QueryClient
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TwilioProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected routes */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calls" element={<Calls />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/history" element={<History />} />
                <Route path="/guide" element={<TwilioGuide />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TwilioProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
