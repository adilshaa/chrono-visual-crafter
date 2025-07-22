import { useAuthContext } from "@/contexts/SupabaseAuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { logger } from "@/lib/logger";

// Interface for Supabase authentication hook
interface UseSupabaseAuthReturn {
  user: any; // Supabase user object
  profile: any;
  loading: boolean;
  isSignedIn: boolean;
  updateProfile: (updates: any) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useSupabaseAuth = (): UseSupabaseAuthReturn => {
  const {
    user,
    profile,
    loading,
    updateProfile,
    refreshProfile,
    signOut: contextSignOut,
  } = useAuthContext();

  // Access the session context for additional session information
  const { isLoading: sessionLoading, error: sessionError } =
    useSessionContext();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const paymentToastShown = useRef(false);

  // Log any session errors
  useEffect(() => {
    if (sessionError) {
      logger.error("Session error in useSupabaseAuth", { error: sessionError });
    }
  }, [sessionError]);

  // Handle payment success parameter (maintaining existing functionality)
  useEffect(() => {
    if (
      searchParams.get("payment") === "success" &&
      !paymentToastShown.current
    ) {
      toast({
        title: "Welcome to Pro!",
        description:
          "Your subscription is now active. Enjoy all the premium features!",
      });
      paymentToastShown.current = true;

      // Refresh profile data to get updated subscription status
      setTimeout(() => {
        refreshProfile();
      }, 1000); // Wait 1 second for webhook to process

      // Remove the parameter from URL
      navigate(window.location.pathname, { replace: true });
    }
  }, [searchParams, navigate, refreshProfile, toast]);

  const signOut = async () => {
    try {
      await contextSignOut();
    } catch (error) {
      logger.error("Error signing out:", { error });
    }
  };

  return {
    user,
    profile,
    loading: loading || sessionLoading,
    isSignedIn: !!user,
    updateProfile,
    refreshProfile,
    signOut,
  };
};
