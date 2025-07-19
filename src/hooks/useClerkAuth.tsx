import { useUser, useAuth as useClerkAuthHook } from "@clerk/clerk-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";

// Static variables to track fetch status across renders
const fetchedUsers = new Set<string>();
const fetchInProgress = new Set<string>();

export const useClerkAuth = () => {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, signOut: clerkSignOut } = useClerkAuthHook();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentToastShown = useRef(false);
  const syncedUserRef = useRef<string | null>(null);
  const profileSyncedRef = useRef(false);
  const profileCache = useRef<Map<string, any>>(new Map());
  const syncInProgress = useRef(false);

  // Function to refresh profile data from database
  const refreshProfile = useCallback(async () => {
    if (!user || !isSignedIn) return;

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
        logger.info("Profile refreshed successfully", {
          profile: refreshedProfile,
          userId: user.id,
        });
        setProfile(refreshedProfile);
      }
    } catch (error) {
      logger.error("Error refreshing profile", { error, userId: user.id });
    }
  }, [user, isSignedIn]);

  useEffect(() => {
    // Check for payment success parameter
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
  }, [searchParams, navigate, refreshProfile]);

  // Track initial fetch completion
  const initialFetchDone = useRef(false);

  useEffect(() => {
    // Function to handle user sign out
    const handleSignOut = () => {
      setProfile(null);
      syncedUserRef.current = null;
      profileSyncedRef.current = false;
      profileCache.current.clear();
      initialFetchDone.current = false;
      setLoading(false);
    };

    // Don't do anything if user data isn't loaded yet
    if (!userLoaded) {
      return;
    }

    // Handle sign out case
    if (!isSignedIn || !user) {
      handleSignOut();
      return;
    }

    // If we already fetched data for this user, use the cached version
    const cachedProfile = profileCache.current.get(user.id);
    if (cachedProfile && syncedUserRef.current === user.id) {
      logger.info("Using cached profile from memory", { userId: user.id });
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }

    // If we're already fetching, don't start another fetch
    if (syncInProgress.current) {
      logger.info("Sync already in progress, skipping", { userId: user.id });
      return;
    }

    // Only fetch from database once per user session
    const fetchUserProfile = async () => {
      syncInProgress.current = true;

      try {
        logger.info("Fetching user profile from Supabase (one-time)", {
          userId: user.id,
        });

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
          setLoading(false);
          return;
        }

        // Create profile if it doesn't exist
        if (!existingProfile) {
          logger.info("Creating new profile for user", { userId: user.id });
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              email: user.primaryEmailAddress?.emailAddress || "",
              full_name: user.fullName || "",
              avatar_url: user.imageUrl || null,
              subscription_status: "free",
              subscription_plan: "free",
              credits: 50,
            })
            .select()
            .single();

          if (insertError) {
            logger.error("Error creating profile", {
              error: insertError,
              userId: user.id,
            });
            toast({
              title: "Profile Creation Error",
              description: "Failed to create user profile. Please try again.",
              variant: "destructive",
            });
          } else {
            logger.info("Profile created successfully", {
              profile: newProfile,
              userId: user.id,
            });
            setProfile(newProfile);
            profileCache.current.set(user.id, newProfile);
            syncedUserRef.current = user.id;
            profileSyncedRef.current = true;
            initialFetchDone.current = true;
          }
        } else {
          // Use existing profile
          logger.info("Using existing profile from database", {
            userId: user.id,
          });
          setProfile(existingProfile);
          profileCache.current.set(user.id, existingProfile);
          syncedUserRef.current = user.id;
          profileSyncedRef.current = true;
          initialFetchDone.current = true;
        }
      } catch (error) {
        logger.error("Error syncing user with Supabase", {
          error,
          userId: user.id,
        });
        toast({
          title: "Sync Error",
          description: "Failed to sync user data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        syncInProgress.current = false;
        setLoading(false);
      }
    };

    // Only fetch if we haven't already fetched for this user
    if (
      user?.id &&
      (!initialFetchDone.current || syncedUserRef.current !== user.id)
    ) {
      fetchUserProfile();
    }
  }, [user?.id, isSignedIn, userLoaded]);

  const updateProfile = async (updates: any) => {
    if (!user) return { error: "No user" };

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (!error && data) {
        setProfile(data);
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await clerkSignOut();
      setProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    user,
    profile,
    loading: loading || !userLoaded,
    isSignedIn,
    updateProfile,
    refreshProfile,
    signOut,
  };
};
