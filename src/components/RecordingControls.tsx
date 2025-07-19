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
import { motion } from "framer-motion";
import { useRecording } from "@/contexts/RecordingContext";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface RecordingControlsProps {
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
  /** Indicates that the recorded video is currently being processed into a file. */
  isProcessingVideo: boolean;
  /** Whether the current user still has credits to export */
  hasCredits: boolean;
  /** Whether there's a recorded video available for preview */
  hasRecordedVideo?: boolean;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
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
      className="fixed bottom-20 left-1/6 transform -translate-x-1/2 z-50 w-auto"
    >
      <div className="bg-[#101010] backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 shadow-2xl">
        <div className="flex flex-wrap items-center justify-center gap-4 min-w-max">
          <TooltipProvider delayDuration={200}>
            {!isRecording ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleStart}
                    size="icon"
                    variant="ghost"
                    className="w-14 h-14 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 border-0"
                    aria-label="Start recording"
                  >
                    <Play className="w-6 h-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start Recording</TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onPause}
                      size="icon"
                      variant="ghost"
                      className="w-12 h-12 rounded-full text-[#2BA6FF] hover:text-[#2BA6FF]/80 hover:bg-[#2BA6FF]/10 border-0"
                      aria-label={
                        isPaused ? "Resume recording" : "Pause recording"
                      }
                    >
                      {isPaused ? (
                        <PlayIcon className="w-5 h-5" />
                      ) : (
                        <Pause className="w-5 h-5" />
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
                      size="icon"
                      variant="ghost"
                      className="w-12 h-12 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border-0"
                      aria-label="Stop recording"
                    >
                      <Square className="w-5 h-5" />
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
                  size="icon"
                  variant="ghost"
                  className="w-12 h-12 rounded-full text-gray-300 hover:text-gray-200 hover:bg-gray-500/10 border-0"
                  aria-label="Reset counter"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restart</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Status Badge */}
          {/* {(isRecording || recordedChunksLength > 0) && (
            <div className="flex items-center gap-2">
              {isRecording && (
                <Badge className="bg-red-500/20 text-red-300 border border-red-400/30 px-3 py-1 rounded-full">
                  {isPaused ? "PAUSED" : "REC"}
                </Badge>
              )}
              {recordedChunksLength > 0 &&
                !isRecording &&
                !isProcessingVideo && (
                  <Badge className="bg-green-500/20 text-green-300 border border-green-400/30 px-3 py-1 rounded-full">
                    Ready
                  </Badge>
                )}
              {isProcessingVideo && (
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full animate-pulse">
                  Processing
                </Badge>
              )}
            </div>
          )} */}

          {/* Export Controls */}
          <div className="flex items-center gap-3">
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
                  variant="ghost"
                  className="w-12 h-12 rounded-full text-green-400 hover:text-green-300 hover:bg-green-500/10 disabled:opacity-30 disabled:cursor-not-allowed border-0"
                  aria-label="Preview video"
                >
                  <Eye className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Preview Video</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                {recordedChunksLength > 0 && !hasCredits ? (
                  <div className="flex flex-col items-center">
                    <Button
                      onClick={onDownloadVideo}
                      disabled={isProcessingVideo}
                      variant="ghost"
                      className="w-12 h-12 rounded-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 disabled:opacity-30 disabled:cursor-not-allowed border-0"
                      aria-label="Export video"
                    >
                      {isProcessingVideo ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                    </Button>
                    {/* <span className="text-xs text-amber-400 mt-1 px-2 py-0.5 bg-amber-500/20 rounded-full">
                      Upgrade
                    </span> */}
                  </div>
                ) : (
                  <Button
                    onClick={onDownloadVideo}
                    disabled={
                      recordedChunksLength === 0 ||
                      isProcessingVideo ||
                      !hasCredits
                    }
                    variant="ghost"
                    className="w-12 h-12 rounded-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 disabled:opacity-30 disabled:cursor-not-allowed border-0"
                    aria-label="Export video"
                  >
                    {isProcessingVideo ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Film className="w-5 h-5" />
                    )}
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {!hasCredits && recordedChunksLength > 0
                  ? "Download as video"
                  : "Export Video"}
              </TooltipContent>
            </Tooltip>

            {onTransparentExport && (
              <Tooltip>
                <TooltipTrigger asChild>
                  {recordedChunksLength > 0 && !hasCredits ? (
                    <div className="flex flex-col items-center">
                      <Button
                        onClick={onTransparentExport}
                        disabled={recordedChunksLength === 0}
                        variant="ghost"
                        className="w-12 h-12 rounded-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border-0"
                        aria-label="Export transparent overlay"
                      >
                        <Layers className="w-5 h-5" />
                      </Button>
                      {/* <span className="text-xs text-amber-400 mt-1 px-2 py-0.5 bg-amber-500/20 rounded-full">
                        Upgrade
                      </span> */}
                    </div>
                  ) : (
                    <Button
                      onClick={onTransparentExport}
                      disabled={recordedChunksLength === 0}
                      variant="ghost"
                      className="w-12 h-12 rounded-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border-0"
                      aria-label="Export transparent overlay"
                    >
                      <Layers className="w-5 h-5" />
                    </Button>
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {recordedChunksLength > 0
                    ? "Transparent Export"
                    : "Export Transparent Overlay"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RecordingControls;
