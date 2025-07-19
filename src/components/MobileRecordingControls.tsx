import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Image,
  Loader2,
  Pause,
  PlayIcon,
  Film,
  Eye,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecording } from "@/contexts/RecordingContext";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface MobileRecordingControlsProps {
  isPaused: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onRestart: () => void;
  onDownloadVideo: () => void;
  onDownloadGif: () => void;
  onPreviewVideo: () => void;
  onTransparentExport?: () => void;
  recordedChunksLength: number;
  isGeneratingGif: boolean;
  onCancelGif: () => void;
  isProcessingVideo: boolean;
  hasCredits: boolean;
  hasRecordedVideo?: boolean;
  className?: string;
}

const MobileRecordingControls: React.FC<MobileRecordingControlsProps> = ({
  isPaused,
  onStart,
  onStop,
  onPause,
  onRestart,
  onDownloadVideo,
  onDownloadGif,
  onPreviewVideo,
  onTransparentExport,
  recordedChunksLength,
  isGeneratingGif,
  onCancelGif,
  isProcessingVideo,
  hasCredits,
  hasRecordedVideo = false,
  className = "",
}) => {
  const { isRecording, setIsRecording } = useRecording();

  const handleStart = () => {
    setIsRecording(true);
    onStart();
  };

  const handleStop = () => {
    setIsRecording(false);
    onStop();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`w-full ${className}`}
    >
      <div className="bg-[#101010]/95 backdrop-blur-md border border-white/20 rounded-2xl mx-4 px-4 py-4 shadow-2xl">
        {/* Recording Status Badge */}
        <AnimatePresence>
          {(isRecording || recordedChunksLength > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex justify-center mb-4"
            >
              {isRecording && (
                <Badge className="bg-red-500/20 text-red-300 border border-red-400/30 px-4 py-2 rounded-full text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    {isPaused ? "PAUSED" : "RECORDING"}
                  </div>
                </Badge>
              )}
              {recordedChunksLength > 0 &&
                !isRecording &&
                !isProcessingVideo && (
                  <Badge className="bg-green-500/20 text-green-300 border border-green-400/30 px-4 py-2 rounded-full text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      READY TO EXPORT
                    </div>
                  </Badge>
                )}
              {isProcessingVideo && (
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30 px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    PROCESSING
                  </div>
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Controls Row */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <TooltipProvider delayDuration={200}>
            {!isRecording ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleStart}
                    size="lg"
                    className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-all duration-200 border border-red-400/30"
                    aria-label="Start recording"
                  >
                    <Play className="w-7 h-7" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start Recording</TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onPause}
                      size="lg"
                      className="w-14 h-14 rounded-full bg-[#2BA6FF]/20 text-[#2BA6FF] hover:text-[#2BA6FF]/80 hover:bg-[#2BA6FF]/30 border border-[#2BA6FF]/30"
                      aria-label={
                        isPaused ? "Resume recording" : "Pause recording"
                      }
                    >
                      {isPaused ? (
                        <PlayIcon className="w-6 h-6" />
                      ) : (
                        <Pause className="w-6 h-6" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isPaused ? "Resume" : "Pause"}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleStop}
                      size="lg"
                      className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/30 border border-red-400/30"
                      aria-label="Stop recording"
                    >
                      <Square className="w-6 h-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop</TooltipContent>
                </Tooltip>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onRestart}
                  size="lg"
                  className="w-14 h-14 rounded-full bg-gray-500/20 text-gray-300 hover:text-gray-200 hover:bg-gray-500/30 border border-gray-400/30"
                  aria-label="Reset counter"
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restart</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Export Controls Row */}
        <div className="flex items-center justify-center gap-3">
          <TooltipProvider delayDuration={200}>
            {/* Preview Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onPreviewVideo}
                  disabled={
                    recordedChunksLength === 0 ||
                    isProcessingVideo ||
                    !hasRecordedVideo
                  }
                  size="lg"
                  className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 hover:text-green-300 hover:bg-green-500/30 disabled:opacity-30 disabled:cursor-not-allowed border border-green-400/30"
                  aria-label="Preview video"
                >
                  <Eye className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Preview Video</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onDownloadVideo}
                  disabled={
                    recordedChunksLength === 0 ||
                    isProcessingVideo 
                    
                  }
                  size="lg"
                  className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed border border-blue-400/30"
                  aria-label="Export video"
                >
                  {isProcessingVideo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Export Video</TooltipContent>
            </Tooltip>

            {onTransparentExport && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onTransparentExport}
                    disabled={recordedChunksLength === 0}
                    size="lg"
                    className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/30 border border-cyan-400/30"
                    aria-label="Export transparent overlay"
                  >
                    <Layers className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Export Transparent Overlay
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileRecordingControls;
