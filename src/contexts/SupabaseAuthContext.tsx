import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { User, AuthResponse, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { handleAuthError } from "@/lib/auth-errors";

// Profile type based on the database schema
interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  credits: number | null;
  paddle_customer_id: string | null;
  ref_id: string | null;
  ref_credits: number | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (
    email: string,
    password: string,
    metadata?: object
  ) => Promise<AuthResponse>;
  verifyOTP: (
    email: string,
    token: string,
    type: "signup" | "recovery"
  ) => Promise<AuthResponse>;
  resendOTP: (
    email: string,
    type: "signup" | "recovery"
  ) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  // Session management utilities
  isSessionValid: () => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useAuthContext must be used within a SupabaseAuthProvider"
    );
  }
  return context;
};

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
}

export const SupabaseAuthProvider: React.FC<SupabaseAuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();

  // Refs for session management
  const authStateListenerRef = useRef<any>(null);
  const sessionRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionCheckRef = useRef<number>(0);

  // Function to create or fetch user profile
  const syncUserProfile = useCallback(
    async (user: User) => {
      try {
        logger.info("Syncing user profile", { userId: user.id });

        // First, try to fetch existing profile
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          logger.error("Error fetching profile", {
            error: fetchError,
            userId: user.id,
          });
          throw fetchError;
        }

        if (existingProfile) {
          logger.info("Using existing profile", { userId: user.id });
          setProfile(existingProfile);
          return existingProfile;
        }

        // Create new profile if it doesn't exist
        logger.info("Creating new profile for user", { userId: user.id });

        // Check for referral data in user metadata
        const referralId = user.user_metadata?.referral_id;
        let referrerUserId = null;
        let newUserCredits = 50; // Default credits

        // If there's a referral ID, find the referrer and process referral
        if (referralId && typeof referralId === "string" && referralId.trim()) {
          logger.info("Processing referral", {
            referralId,
            newUserId: user.id,
          });

          try {
            // Validate referral ID format
            if (!referralId.startsWith("ref_")) {
              logger.warn("Invalid referral ID format", { referralId });
            } else {
              // Find the referrer by their ref_id
              const { data: referrer, error: referrerError } = await supabase
                .from("profiles")
                .select("user_id, credits, ref_credits, full_name")
                .eq("ref_id", referralId)
                .single();

              if (referrer && !referrerError) {
                // Prevent self-referral
                if (referrer.user_id === user.id) {
                  logger.warn("Self-referral attempt blocked", {
                    userId: user.id,
                    referralId,
                  });
                } else {
                  referrerUserId = referrer.user_id;
                  newUserCredits = 70; // 50 base + 20 referral bonus

                  // Update referrer's credits (add 20 to both credits and ref_credits)
                  const updatedCredits = (referrer.credits || 0) + 20;
                  const updatedRefCredits = (referrer.ref_credits || 0) + 20;

                  const { error: updateError } = await supabase
                    .from("profiles")
                    .update({
                      credits: updatedCredits,
                      ref_credits: updatedRefCredits,
                    })
                    .eq("user_id", referrer.user_id);

                  if (updateError) {
                    logger.error("Error updating referrer credits", {
                      error: updateError,
                      referrerId: referrer.user_id,
                    });
                  } else {
                    logger.info("Referrer credits updated", {
                      referrerId: referrer.user_id,
                      referrerName: referrer.full_name,
                      newCredits: updatedCredits,
                      newRefCredits: updatedRefCredits,
                    });

                    // Note: Toast will be shown to the referrer when they next log in
                    // We can't show it here as this is for the new user
                  }
                }
              } else {
                logger.warn("Referrer not found", {
                  referralId,
                  error: referrerError,
                });
              }
            }
          } catch (error) {
            logger.error("Error processing referral", { error, referralId });
          }
        }

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || "",
            avatar_url: user.user_metadata?.avatar_url || null,
            subscription_status: "free",
            subscription_plan: "free",
            credits: newUserCredits,
            referred_by: referrerUserId,
          })
          .select()
          .single();

        if (insertError) {
          logger.error("Error creating profile", {
            error: insertError,
            userId: user.id,
          });
          throw insertError;
        }

        // Show welcome message for referred users
        if (referrerUserId && newUserCredits > 50) {
          toast({
            title: "Welcome! 🎉",
            description: `You've received ${newUserCredits} credits (including a 20 credit referral bonus)!`,
          });
        }

        logger.info("Profile created successfully", {
          profile: newProfile,
          userId: user.id,
        });
        setProfile(newProfile);
        return newProfile;
      } catch (error) {
        logger.error("Error syncing user profile", { error, userId: user.id });
        toast({
          title: "Profile Sync Error",
          description: "Failed to sync user profile. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [toast]
  );

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          logger.error("Error getting initial session", { error });
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (initialSession?.user && mounted) {
          setSession(initialSession);
          setUser(initialSession.user);
          lastSessionCheckRef.current = Date.now();
          await syncUserProfile(initialSession.user);
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        logger.error("Error initializing auth", { error });
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      logger.info("Auth state changed", { event, session: !!session });

      setSession(session);
      setUser(session?.user ?? null);
      lastSessionCheckRef.current = Date.now();

      if (session?.user) {
        try {
          await syncUserProfile(session.user);
        } catch (error) {
          logger.error("Error syncing profile on auth change", { error });
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // Store the subscription reference for cleanup
    authStateListenerRef.current = subscription;

    return () => {
      mounted = false;
      subscription.unsubscribe();

      // Clear any pending session refresh timeouts
      if (sessionRefreshTimeoutRef.current) {
        clearTimeout(sessionRefreshTimeoutRef.current);
      }
    };
  }, [syncUserProfile]);

  // Automatic session validation and refresh
  const validateAndRefreshSession = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastCheck = now - lastSessionCheckRef.current;

    // Only check session every 30 seconds to avoid excessive calls
    if (timeSinceLastCheck < 30000) {
      return;
    }

    lastSessionCheckRef.current = now;

    if (!session) {
      return;
    }

    try {
      // Get current session from Supabase
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        logger.error("Error checking current session", { error });
        return;
      }

      // If no session or session changed, update state
      if (!currentSession) {
        logger.info("No current session found, clearing state");
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      // Update session if it's different from current state
      if (currentSession.access_token !== session.access_token) {
        logger.info("Session updated from external source", {
          userId: currentSession.user?.id,
        });
        setSession(currentSession);
        setUser(currentSession.user);

        if (currentSession.user) {
          await syncUserProfile(currentSession.user);
        }
      }
    } catch (error) {
      logger.error("Error validating session", { error });
    }
  }, [session, syncUserProfile]);

  // Cross-tab session synchronization and periodic validation
  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    // Set up periodic session validation (every 60 seconds)
    const setupPeriodicValidation = () => {
      intervalId = setInterval(async () => {
        if (!mounted) return;

        try {
          await validateAndRefreshSession();
        } catch (error) {
          logger.error("Error during periodic session validation", { error });
        }
      }, 60000); // Check every minute
    };

    // Cross-tab synchronization using storage events
    const handleStorageChange = (event: StorageEvent) => {
      if (!mounted) return;

      // Listen for changes to Supabase auth storage
      if (event.key?.startsWith("sb-") && event.key.includes("-auth-token")) {
        logger.info("Auth storage changed in another tab, validating session");

        // Debounce the validation to avoid excessive calls
        if (sessionRefreshTimeoutRef.current) {
          clearTimeout(sessionRefreshTimeoutRef.current);
        }

        sessionRefreshTimeoutRef.current = setTimeout(async () => {
          try {
            await validateAndRefreshSession();
          } catch (error) {
            logger.error("Error validating session after storage change", {
              error,
            });
          }
        }, 1000);
      }
    };

    // Set up visibility change handler for tab focus
    const handleVisibilityChange = async () => {
      if (!mounted || document.hidden) return;

      logger.debug("Tab became visible, validating session");

      try {
        await validateAndRefreshSession();
      } catch (error) {
        logger.error("Error validating session on tab focus", { error });
      }
    };

    // Only set up listeners if we have a session
    if (session) {
      setupPeriodicValidation();
      window.addEventListener("storage", handleStorageChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      mounted = false;

      if (intervalId) {
        clearInterval(intervalId);
      }

      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (sessionRefreshTimeoutRef.current) {
        clearTimeout(sessionRefreshTimeoutRef.current);
      }
    };
  }, [session, validateAndRefreshSession]);

  // Auth methods
  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResponse> => {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        logger.error("Sign in error", { error: response.error });
      } else {
        logger.info("Sign in successful", { userId: response.data.user?.id });
      }

      return response;
    },
    []
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: object
    ): Promise<AuthResponse> => {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
        },
      });

      if (response.error) {
        logger.error("Sign up error", { error: response.error });
      } else {
        logger.info("Sign up successful", { userId: response.data.user?.id });
      }

      return response;
    },
    []
  );

  const verifyOTP = useCallback(
    async (
      email: string,
      token: string,
      type: "signup" | "recovery"
    ): Promise<AuthResponse> => {
      const response = await supabase.auth.verifyOtp({
        email,
        token,
        type,
      });

      if (response.error) {
        logger.error("OTP verification error", { error: response.error });
      } else {
        logger.info("OTP verification successful", {
          userId: response.data.user?.id,
        });
      }

      return response;
    },
    []
  );

  const resendOTP = useCallback(
    async (
      email: string,
      type: "signup" | "recovery"
    ): Promise<AuthResponse> => {
      const response = await supabase.auth.resend({
        type,
        email,
      });

      if (response.error) {
        logger.error("Resend OTP error", { error: response.error });
      } else {
        logger.info("OTP resent successfully");
      }

      return response;
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Sign out error", { error });
      throw error;
    }

    logger.info("Sign out successful");
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<AuthResponse> => {
      const response = await supabase.auth.resetPasswordForEmail(email);

      if (response.error) {
        logger.error("Password reset error", { error: response.error });
      } else {
        logger.info("Password reset email sent");
      }

      return response;
    },
    []
  );

  const updateProfile = useCallback(
    async (updates: Partial<Profile>): Promise<{ error?: string }> => {
      if (!user) {
        return { error: "No user authenticated" };
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          logger.error("Error updating profile", { error, userId: user.id });
          return { error: error.message };
        }

        if (data) {
          setProfile(data);
          logger.info("Profile updated successfully", { userId: user.id });
        }

        return {};
      } catch (error) {
        logger.error("Error updating profile", { error, userId: user.id });
        return { error: "Failed to update profile" };
      }
    },
    [user]
  );

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      logger.info("Refreshing profile data", { userId: user.id });

      const { data: refreshedProfile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        logger.error("Error refreshing profile", { error, userId: user.id });
        return;
      }

      if (refreshedProfile) {
        logger.info("Profile refreshed successfully", { userId: user.id });
        setProfile(refreshedProfile);
      }
    } catch (error) {
      logger.error("Error refreshing profile", { error, userId: user.id });
    }
  }, [user]);

  // Session validation utility
  const isSessionValid = useCallback((): boolean => {
    if (!session) {
      logger.debug("No session available");
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;

    if (!expiresAt) {
      logger.debug("Session has no expiration time");
      return true; // If no expiration, assume valid
    }

    // Check if session expires within the next 5 minutes (300 seconds)
    const isValid = expiresAt > now + 300;

    if (!isValid) {
      logger.warn("Session is expired or expiring soon", {
        expiresAt,
        now,
        timeUntilExpiry: expiresAt - now,
      });
    }

    return isValid;
  }, [session]);

  // Manual session refresh utility
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      logger.info("Manually refreshing session");

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        logger.error("Error refreshing session", { error });
        throw error;
      }

      if (data.session) {
        logger.info("Session refreshed successfully", {
          userId: data.session.user?.id,
          expiresAt: data.session.expires_at,
        });
        setSession(data.session);
        setUser(data.session.user);
        lastSessionCheckRef.current = Date.now();
      }
    } catch (error) {
      logger.error("Failed to refresh session", { error });
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    loading,
    session,
    signIn,
    signUp,
    verifyOTP,
    resendOTP,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
    isSessionValid,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
