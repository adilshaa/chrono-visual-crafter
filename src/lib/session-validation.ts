import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import {
  debugAuthHeaders,
  validateSessionForDatabaseCall,
  withAuth,
  requireAuth,
} from "./session-utils";

/**
 * Validate the current session
 */
export const validateSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }

    if (!data.session) {
      return {
        isValid: false,
        error: "No active session",
      };
    }

    return {
      isValid: true,
      user: data.session.user,
      session: data.session,
    };
  } catch (error) {
    logger.error("Error validating session", { error });
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Re-export utilities from session-utils
export {
  debugAuthHeaders,
  validateSessionForDatabaseCall as validateSessionForDatabase,
  withAuth,
  requireAuth,
};
