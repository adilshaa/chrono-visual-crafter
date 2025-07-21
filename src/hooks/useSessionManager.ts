/**
 * Hook for managing Supabase Auth sessions
 * Provides utilities for session validation, debugging, and synchronization
 */

import { useCallback } from "react";
import { useAuthContext } from "@/contexts/SupabaseAuthContext";
import {
  debugAuthHeaders,
  validateSessionForDatabaseCall,
  ensureAuthHeaders,
  checkSessionSynchronization,
  forceSyncSession,
} from "@/lib/session-utils";
import { logger } from "@/lib/logger";

export const useSessionManager = () => {
  const { session, isSessionValid, refreshSession } = useAuthContext();

  /**
   * Debug current session and auth headers
   */
  const debugSession = useCallback(async () => {
    const authInfo = await debugAuthHeaders();
    const syncInfo = await checkSessionSynchronization();

    const debugInfo = {
      session: {
        exists: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
        isValid: isSessionValid(),
      },
      authHeaders: authInfo,
      synchronization: syncInfo,
    };

    logger.info("Session debug info", debugInfo);
    return debugInfo;
  }, [session, isSessionValid]);

  /**
   * Validate session before making database calls
   */
  const validateForDatabaseCall = useCallback(async () => {
    const validation = await validateSessionForDatabaseCall();

    if (!validation.isValid) {
      logger.warn("Session validation failed for database call", {
        error: validation.error,
      });
    }

    return validation;
  }, []);

  /**
   * Ensure auth headers are properly set
   */
  const ensureHeaders = useCallback(async () => {
    const hasHeaders = await ensureAuthHeaders();

    if (!hasHeaders) {
      logger.warn("Auth headers are not properly set");
    }

    return hasHeaders;
  }, []);

  /**
   * Check if session is synchronized across tabs
   */
  const checkSync = useCallback(async () => {
    const syncInfo = await checkSessionSynchronization();

    if (!syncInfo.isSync) {
      logger.warn("Session is not synchronized across tabs");
    }

    return syncInfo;
  }, []);

  /**
   * Force session synchronization
   */
  const forceSync = useCallback(async () => {
    const success = await forceSyncSession();

    if (success) {
      logger.info("Session synchronization forced successfully");
    } else {
      logger.error("Failed to force session synchronization");
    }

    return success;
  }, []);

  /**
   * Comprehensive session health check
   */
  const healthCheck = useCallback(async () => {
    logger.info("Running session health check");

    const results = {
      sessionExists: !!session,
      sessionValid: isSessionValid(),
      authHeaders: await debugAuthHeaders(),
      databaseValidation: await validateSessionForDatabaseCall(),
      synchronization: await checkSessionSynchronization(),
    };

    const isHealthy =
      results.sessionExists &&
      results.sessionValid &&
      results.authHeaders.hasAuthHeader &&
      results.databaseValidation.isValid &&
      results.synchronization.isSync;

    logger.info("Session health check completed", {
      isHealthy,
      results,
    });

    return {
      isHealthy,
      results,
    };
  }, [session, isSessionValid]);

  /**
   * Attempt to recover from session issues
   */
  const recoverSession = useCallback(async () => {
    logger.info("Attempting session recovery");

    try {
      // First try to refresh the session
      await refreshSession();

      // Then force synchronization
      await forceSync();

      // Run a health check to verify recovery
      const healthCheck = await validateForDatabaseCall();

      if (healthCheck.isValid) {
        logger.info("Session recovery successful");
        return true;
      } else {
        logger.warn("Session recovery failed", { error: healthCheck.error });
        return false;
      }
    } catch (error) {
      logger.error("Error during session recovery", { error });
      return false;
    }
  }, [refreshSession, forceSync, validateForDatabaseCall]);

  return {
    // Session state
    session,
    isSessionValid,

    // Session management
    refreshSession,
    recoverSession,

    // Debugging utilities
    debugSession,
    healthCheck,

    // Validation utilities
    validateForDatabaseCall,
    ensureHeaders,

    // Synchronization utilities
    checkSync,
    forceSync,
  };
};
