import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

/**
 * Debug auth headers to check if they're properly set
 */
export const debugAuthHeaders = async () => {
  try {
    const { data: authData } = await supabase.auth.getSession();

    // Check if auth headers are present in the client
    const hasAuthHeader = !!authData.session?.access_token;

    return {
      hasAuthHeader,
      userId: authData.session?.user?.id,
      expiresAt: authData.session?.expires_at,
    };
  } catch (error) {
    logger.error("Error debugging auth headers", { error });
    return {
      hasAuthHeader: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Validate session before making database calls
 */
export const validateSessionForDatabaseCall = async () => {
  try {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      return {
        isValid: false,
        error: "No active session",
      };
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = data.session.expires_at;

    if (expiresAt && expiresAt <= now) {
      return {
        isValid: false,
        error: "Session expired",
        expiresAt,
        now,
      };
    }

    return {
      isValid: true,
      user: data.session.user,
      expiresAt,
    };
  } catch (error) {
    logger.error("Error validating session for database call", { error });
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Ensure auth headers are properly set
 */
export const ensureAuthHeaders = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session?.access_token;
  } catch (error) {
    logger.error("Error ensuring auth headers", { error });
    return false;
  }
};

/**
 * Check if session is synchronized across tabs
 */
export const checkSessionSynchronization = async () => {
  try {
    // Get current session from localStorage
    const localStorageKey = Object.keys(localStorage).find(
      (key) => key.startsWith("sb-") && key.includes("-auth-token")
    );

    if (!localStorageKey) {
      return {
        isSync: false,
        error: "No session in localStorage",
      };
    }

    // Get current session from API
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      return {
        isSync: false,
        error: "No session from API",
      };
    }

    // Compare access tokens
    const localStorageData = JSON.parse(
      localStorage.getItem(localStorageKey) || "{}"
    );
    const localAccessToken = localStorageData?.access_token;
    const apiAccessToken = data.session.access_token;

    return {
      isSync: localAccessToken === apiAccessToken,
      localAccessToken: localAccessToken ? "present" : "missing",
      apiAccessToken: apiAccessToken ? "present" : "missing",
    };
  } catch (error) {
    logger.error("Error checking session synchronization", { error });
    return {
      isSync: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Force session synchronization
 */
export const forceSyncSession = async () => {
  try {
    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      logger.error("Error refreshing session during force sync", { error });
      return false;
    }

    return !!data.session;
  } catch (error) {
    logger.error("Error forcing session sync", { error });
    return false;
  }
};

/**
 * Utility to wrap operations with auth check
 */
export const withAuth = async <T>(operation: () => Promise<T>): Promise<T> => {
  const validation = await validateSessionForDatabaseCall();

  if (!validation.isValid) {
    throw new Error(`Authentication required: ${validation.error}`);
  }

  return operation();
};

/**
 * Require authentication for operations
 */
export const requireAuth = async () => {
  const validation = await validateSessionForDatabaseCall();

  if (!validation.isValid) {
    throw new Error(`Authentication required: ${validation.error}`);
  }

  const { data } = await supabase.auth.getSession();

  if (!data.session || !data.session.user) {
    throw new Error("No authenticated user");
  }

  return {
    user: data.session.user,
    session: data.session,
  };
};
