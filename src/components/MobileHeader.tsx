import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthButton from "@/components/auth/AuthButton";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Share2 } from "lucide-react";

interface MobileHeaderProps {
  recordingTime: number;
  isRecording: boolean;
  isPaused?: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  recordingTime,
  isRecording,
  isPaused = false,
}) => {
  const { user } = useSupabaseAuth();

  return (
    <header className="bg-[#171717] border-b border-gray-100/10 px-4 py-3 flex-shrink-0 sticky top-0 z-30 h-[60px] max-h-[15vh]">
      <div className="flex items-center justify-between h-full">
        {/* Logo and Title - Condensed */}
        <div className="flex items-center gap-3">
          <img src="/favicon.ico" alt="Logo" className="w-6 h-6 rounded" />
          <h1 className="text-lg font-bold text-white truncate">Countable</h1>
        </div>

        {/* Recording Status and User */}
        <div className="flex items-center gap-3">
          {/* Recording Timer */}
          <AnimatePresence>
            {(isRecording || recordingTime > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 text-sm bg-[#2BA6FF]/10 border border-[#2BA6FF]/30 rounded-lg px-3 py-1.5"
              >
                {/* Recording Indicator */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={`w-2 h-2 rounded-full ${
                        isPaused ? "bg-yellow-500" : "bg-red-500"
                      }`}
                    >
                      {!isPaused && (
                        <motion.div
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="w-full h-full bg-red-500 rounded-full"
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Timer Display */}
                <span className="font-mono text-[#2BA6FF] font-medium">
                  {(recordingTime / 1000).toFixed(1)}s
                </span>

                {/* Status Text */}
                <span className="text-gray-400 text-xs hidden sm:inline">
                  {isPaused ? "Paused" : isRecording ? "Recording" : "Ready"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Referral Button */}
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-referral-modal"))
            }
            className="text-xs bg-gradient-to-r from-blue-500 to-cyan-400 text-white px-2 py-1 rounded-md font-medium flex items-center gap-1"
          >
            <Share2 className="w-3 h-3" />
            Refer
          </button>

          {/* User Profile - Condensed */}
          {user && (
            <div className="flex-shrink-0">
              <AuthButton mode="user" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
