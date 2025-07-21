import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SupabaseAuthWrapper from "./components/auth/SupabaseAuthWrapper";
import PaddleProvider from "./components/payments/PaddleProvider";

// Import test utilities in development
if (process.env.NODE_ENV === "development") {
  import("@/utils/testCancellation");
  import("@/utils/testAlreadyCancelledFlow");
}
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import Studio from "./pages/Studio";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => {
  // Debug environment variables

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SupabaseAuthWrapper>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PaddleProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route
                  path="/auth"
                  element={<Navigate to="/login" replace />}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />

                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
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
        </SupabaseAuthWrapper>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
