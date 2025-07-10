import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClerkAuthWrapper from "./components/auth/ClerkAuthWrapper";
import PaddleProvider from "./components/payments/PaddleProvider";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Studio from "./pages/Studio";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import StudioRightPanel from "@/components/StudioRightPanel";

const queryClient = new QueryClient();

const App = () => {
  // Debug environment variables


  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ClerkAuthWrapper>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PaddleProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route
                  path="/studio"
                  element={
                    <ProtectedRoute>
                      <Studio />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PaddleProvider>
          </TooltipProvider>
        </ClerkAuthWrapper>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
