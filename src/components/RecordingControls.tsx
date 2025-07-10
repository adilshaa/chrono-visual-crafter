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
      className="flex flex-wrap items-center justify-center gap-4"
    >
      <TooltipProvider delayDuration={200}>
        {!isRecording ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleStart}
                size="icon"
                className="w-14 h-14 rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25 transition-all duration-200 border-0"
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
                  className="w-12 h-12 rounded-full bg-[#2BA6FF]/90 hover:bg-[#2BA6FF] text-white shadow-lg border-0"
                  aria-label={isPaused ? "Resume recording" : "Pause recording"}
                >
                  {isPaused ? (
                    <PlayIcon className="w-5 h-5" />
                  ) : (
                    <Pause className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPaused ? "Resume" : "Pause"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleStop}
                  size="icon"
                  className="w-12 h-12 rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-lg border-0"
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
              className="w-12 h-12 rounded-full bg-gray-700/90 hover:bg-gray-600 text-white shadow-lg border-0"
              aria-label="Reset counter"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Restart</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Status Badge */}
      {(isRecording || recordedChunksLength > 0) && (
        <div className="flex items-center gap-2">
          {isRecording && (
            <Badge className="bg-red-600/90 text-white animate-pulse border-0 px-3 py-1">
              {isPaused ? "PAUSED" : "REC"}
            </Badge>
          )}
          {recordedChunksLength > 0 && !isRecording && !isProcessingVideo && (
            <Badge className="bg-green-700/90 text-green-200 border-0 px-3 py-1">
              Ready
            </Badge>
          )}
          {isProcessingVideo && (
            <Badge className="bg-blue-600/90 text-white border-0 px-3 py-1 animate-pulse">
              Processing
            </Badge>
          )}
        </div>
      )}

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
              className="w-12 h-12 rounded-full bg-green-600/90 hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg border-0 flex items-center justify-center"
              aria-label="Preview video"
            >
              <Eye className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Preview Video</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onDownloadVideo}
              disabled={
                recordedChunksLength === 0 || isProcessingVideo || !hasCredits
              }
              className="w-12 h-12 rounded-full bg-blue-600/90 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg border-0 flex items-center justify-center"
              aria-label="Export video"
            >
              {isProcessingVideo ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Film className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Export Video</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={isGeneratingGif ? onCancelGif : onDownloadGif}
              disabled={recordedChunksLength === 0 && !isGeneratingGif}
              className="w-12 h-12 rounded-full bg-purple-600/90 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg border-0 flex items-center justify-center"
              aria-label={
                isGeneratingGif ? "Cancel GIF generation" : "Export GIF"
              }
            >
              {isGeneratingGif ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Image className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isGeneratingGif ? "Cancel GIF" : "Export GIF"}
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.div>
  );
};

export default RecordingControls;
