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
} from "lucide-react";
import { motion } from "framer-motion";
import { useRecording } from "@/contexts/RecordingContext";

interface RecordingControlsProps {
  isPaused: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onRestart: () => void;
  onDownloadVideo: () => void;
  onDownloadGif: () => void;
  recordedChunksLength: number;
  isGeneratingGif: boolean;
  onCancelGif: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isPaused,
  onStart,
  onStop,
  onPause,
  onRestart,
  onDownloadVideo,
  onDownloadGif,
  recordedChunksLength,
  isGeneratingGif,
  onCancelGif,
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
      className="flex items-center gap-4"
    >
      {/* Recording Controls */}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <Button
            onClick={handleStart}
            size="icon"
            className="w-14 h-14 rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25 transition-all duration-200 border-0"
            aria-label="Start recording"
          >
            <Play className="w-6 h-6" />
          </Button>
        ) : (
          <div className="flex items-center gap-3">
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
            <Button
              onClick={handleStop}
              size="icon"
              className="w-12 h-12 rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-lg border-0"
              aria-label="Stop recording"
            >
              <Square className="w-5 h-5" />
            </Button>
          </div>
        )}

        <Button
          onClick={onRestart}
          size="icon"
          className="w-12 h-12 rounded-full bg-gray-700/90 hover:bg-gray-600 text-white shadow-lg border-0"
          aria-label="Reset counter"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Status Badge */}
      {(isRecording || recordedChunksLength > 0) && (
        <div className="flex items-center gap-2">
          {isRecording && (
            <Badge className="bg-red-600/90 text-white animate-pulse border-0 px-3 py-1">
              {isPaused ? "PAUSED" : "REC"}
            </Badge>
          )}
          {recordedChunksLength > 0 && !isRecording && (
            <Badge className="bg-green-700/90 text-green-200 border-0 px-3 py-1">
              Ready
            </Badge>
          )}
        </div>
      )}

      {/* Export Controls */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <Button
            onClick={onDownloadVideo}
            disabled={recordedChunksLength === 0}
            className="w-auto h-12 px-4 rounded-full bg-blue-600/90 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg border-0 flex items-center gap-2"
            aria-label="Export as WebM video"
          >
            <Film className="w-4 h-4" />
            <span>Export Video</span>
          </Button>
          <div className="absolute -bottom-8 left-0 right-0 text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity text-blue-300">
            Supports transparency
          </div>
        </div>

        <div className="relative group">
          <Button
            onClick={isGeneratingGif ? onCancelGif : onDownloadGif}
            disabled={recordedChunksLength === 0 && !isGeneratingGif}
            className="w-auto h-12 px-4 rounded-full bg-purple-600/90 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg border-0 flex items-center gap-2"
            aria-label={
              isGeneratingGif ? "Cancel GIF generation" : "Export as GIF"
            }
          >
            {isGeneratingGif ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Image className="w-4 h-4" />
                <span>Export GIF</span>
              </>
            )}
          </Button>
          <div className="absolute -bottom-8 left-0 right-0 text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity text-purple-300">
            Optimized for web
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RecordingControls;
