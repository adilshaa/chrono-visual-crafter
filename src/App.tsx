import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClerkAuthWrapper from "./components/auth/ClerkAuthWrapper";
import PaddleProvider from "./components/payments/PaddleProvider";

// Import test utilities in development
if (process.env.NODE_ENV === "development") {
  import("@/utils/testCancellation");
  import("@/utils/testAlreadyCancelledFlow");
}
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Checkout from "./pages/Checkout";
import Studio from "./pages/Studio";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";

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
              <Routes>
                <Route path="/" element={<Landing />} />
                {/* <Route path="/auth" element={<Auth />} /> */}
                {/* <Route path="/pricing" element={<Pricing />} />
                <Route path="/checkout" element={<Checkout />} /> */}
                {/* <Route path="/about" element={<About />} /> */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />

                <Route
                  path="/studio"
                  element={
                    // <ProtectedRoute>
                      <Studio />
                    // </ProtectedRoute>
                  }
                />
                {/* <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                /> */}
                <Route path="*" element={<NotFound />} />
              </Routes>
          </TooltipProvider>
        </ClerkAuthWrapper>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
