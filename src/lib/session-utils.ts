/**
 * Session management utilities for Supabase Auth
 * Provides debugging and validation utilities for session management
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

/**
 * Debug utility to check if auth headers are properly set
 */
export const debugAuthHeaders = async (): Promise<{
  hasAuthHeader: boolean;
  authHeaderValue?: string;
  sessionExists: boolean;
  userId?: string;
}> => {
  try {
    // Get current session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      logger.error("Error getting session for debug", { error });
      return {
        hasAuthHeader: false,
        sessionExists: false,
      };
    }

    const sessionExists = !!session;
    const hasAuthHeader = !!session?.access_token;

    return {
      hasAuthHeader,
      authHeaderValue: session?.access_token
        ? `Bearer ${session.access_token}`
        : undefined,
      sessionExists,
      userId: session?.user?.id,
    };
  } catch (error) {
    logger.error("Error in debugAuthHeaders", { error });
    return {
      hasAuthHeader: false,
      sessionExists: false,
    };
  }
};

/**
 * Utility to validate session before making database calls
 */
export const validateSessionForDatabaseCall = async (): Promise<{
  isValid: boolean;
  error?: string;
  userId?: string;
}> => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      logger.error("Session validation error", { error });
      return {
        isValid: false,
        error: "Failed to get session",
      };
    }

    if (!session) {
      logger.warn("No session found for database call");
      return {
        isValid: false,
        error: "No active session",
      };
    }

    if (!session.user) {
      logger.warn("Session exists but no user found");
      return {
        isValid: false,
        error: "Session has no user",
      };
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at <= now) {
      logger.warn("Session is expired", {
        expiresAt: session.expires_at,
        now,
      });
      return {
        isValid: false,
        error: "Session is expired",
      };
    }

    logger.debug("Session validation successful", {
      userId: session.user.id,
      expiresAt: session.expires_at,
    });

    return {
      isValid: true,
      userId: session.user.id,
    };
  } catch (error) {
    logger.error("Error validating session", { error });
    return {
      isValid: false,
      error: "Session validation failed",
    };
  }
};

/**
 * Utility to ensure Supabase client has proper auth headers
 */
export const ensureAuthHeaders = async (): Promise<boolean> => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      logger.warn("No valid session for auth headers");
      return false;
    }

    // The Supabase client automatically handles auth headers
    // This function mainly serves as a validation check
    logger.debug("Auth headers should be automatically set", {
      userId: session.user?.id,
      hasAccessToken: !!session.access_token,
    });

    return true;
  } catch (error) {
    logger.error("Error ensuring auth headers", { error });
    return false;
  }
};

/**
 * Utility to get the current Supabase client instance
 * Ensures we're using the same client throughout the app
 */
export const getSupabaseClient = () => {
  return supabase;
};

/**
 * Utility to check if the current session is synchronized across tabs
 */
export const checkSessionSynchronization = async (): Promise<{
  isSync: boolean;
  localStorageSession?: any;
  clientSession?: any;
}> => {
  try {
    // Get session from client
    const {
      data: { session: clientSession },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      logger.error("Error getting client session for sync check", { error });
      return { isSync: false };
    }

    // Get session from localStorage (where Supabase stores it)
    const storageKey = `sb-${
      supabase.supabaseUrl.split("//")[1].split(".")[0]
    }-auth-token`;
    const localStorageData = localStorage.getItem(storageKey);

    let localStorageSession = null;
    if (localStorageData) {
      try {
        localStorageSession = JSON.parse(localStorageData);
      } catch (parseError) {
        logger.warn("Error parsing localStorage session", { parseError });
      }
    }

    const isSync = !!(
      clientSession &&
      localStorageSession &&
      clientSession.access_token === localStorageSession.access_token
    );

    logger.debug("Session synchronization check", {
      isSync,
      hasClientSession: !!clientSession,
      hasLocalStorageSession: !!localStorageSession,
    });

    return {
      isSync,
      localStorageSession,
      clientSession,
    };
  } catch (error) {
    logger.error("Error checking session synchronization", { error });
    return { isSync: false };
  }
};

/**
 * Utility to force session refresh and synchronization
 */
export const forceSyncSession = async (): Promise<boolean> => {
  try {
    logger.info("Forcing session synchronization");

    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      logger.error("Error forcing session sync", { error });
      return false;
    }

    if (data.session) {
      logger.info("Session sync successful", {
        userId: data.session.user?.id,
        expiresAt: data.session.expires_at,
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Error in forceSyncSession", { error });
    return false;
  }
};
