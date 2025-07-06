import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClerkAuthWrapper from "./components/auth/ClerkAuthWrapper";
import PaddleProvider from "./components/payments/PaddleProvider";
import DebugLogger from "./components/DebugLogger";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Studio from "./pages/Studio";
import UserProfile from "./pages/UserProfile";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  // Debug environment variables
  console.log("App Environment Check:");
  console.log("NODE_ENV:", import.meta.env.MODE);
  console.log(
    "VITE_CLERK_PUBLISHABLE_KEY exists:",
    !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  );
  console.log("VITE_SUPABASE_URL exists:", !!import.meta.env.VITE_SUPABASE_URL);
  console.log(
    "VITE_PADDLE_CLIENT_TOKEN exists:",
    !!import.meta.env.VITE_PADDLE_CLIENT_TOKEN
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkAuthWrapper>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <UserProfile />
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
          </BrowserRouter>
          <DebugLogger />
        </TooltipProvider>
      </ClerkAuthWrapper>
    </QueryClientProvider>
  );
};

export default App;
