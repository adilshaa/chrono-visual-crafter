import React, { useEffect, useState } from "react";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { Loader2 } from "lucide-react";

interface SupabaseAuthWrapperProps {
  children: React.ReactNode;
}

const SupabaseAuthWrapper: React.FC<SupabaseAuthWrapperProps> = ({
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        logger.info("Initializing Supabase Auth wrapper");

        // Test Supabase connection
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          logger.error("Supabase initialization error", { error });
          setInitError(`Supabase connection failed: ${error.message}`);
          return;
        }

        logger.info("Supabase Auth wrapper initialized successfully", {
          hasSession: !!data.session,
          userId: data.session?.user?.id,
        });

        // Initialize session persistence
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          logger.info("Auth state change detected", {
            event,
            hasSession: !!session,
            userId: session?.user?.id,
          });
        });

        // Store subscription for cleanup (though it's handled by the context)
        setIsInitialized(true);

        // Cleanup function would be handled by the auth context
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        logger.error("Unexpected error during Supabase initialization", {
          error,
        });
        setInitError(
          `Initialization failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    };

    initializeSupabase();
  }, []);

  // Show loading state during initialization
  if (!isInitialized && !initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#101010] via-[#101010] to-black flex items-center justify-center">
        <div className="min-h-screen  flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-white"></div>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white text-center p-8 bg-red-900/20 border border-red-500/30 rounded-lg backdrop-blur-sm max-w-md"
        >
          <h1 className="text-2xl font-bold mb-4 text-red-400">
            Authentication Error
          </h1>
          <p className="text-gray-300 mb-4">
            Failed to initialize Supabase authentication.
          </p>
          <div className="text-left bg-gray-900/50 p-4 rounded-md mb-4">
            <p className="text-sm text-red-400">{initError}</p>
          </div>
          <div className="text-left bg-gray-900/50 p-4 rounded-md">
            <p className="text-sm text-gray-400 mb-2">Please check:</p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Supabase project is running</li>
              <li>• Database connection is available</li>
              <li>• Network connectivity</li>
              <li>• Browser console for additional errors</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  // Render the app with Supabase Auth Provider
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
};

export default SupabaseAuthWrapper;
