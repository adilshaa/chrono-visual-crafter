import { useAuthContext } from "@/contexts/SupabaseAuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

// Interface that matches the current useClerkAuth hook to maintain compatibility
interface UseSupabaseAuthReturn {
  user: any; // Using any to match current Clerk user interface
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

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const paymentToastShown = useRef(false);

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
      console.error("Error signing out:", error);
    }
  };

  return {
    user,
    profile,
    loading,
    isSignedIn: !!user,
    updateProfile,
    refreshProfile,
    signOut,
  };
};
