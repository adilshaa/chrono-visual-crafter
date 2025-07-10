import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { useNavigate } from "react-router-dom";
import CounterPreview from "@/components/CounterPreview";
import RecordingControls from "@/components/RecordingControls";
import StudioSidebar from "@/components/StudioSidebar";
import StudioRightPanel from "@/components/StudioRightPanel";
import GlassCard from "@/components/ui/glass-card";
import AuthButton from "@/components/auth/AuthButton";
import { Loader2 } from "lucide-react";
import { RecordingProvider, useRecording } from "@/contexts/RecordingContext";
import { cn } from "@/lib/utils";
import { Square } from "lucide-react";

// @ts-ignore
import GIF from "gif.js";

// Easing functions for transitions
const easingFunctions = {
  // Linear easing - constant speed
  linear: (progress: number): number => {
    return progress;
  },

  // Ease-out - starts fast, slows down at the end
  easeOut: (progress: number): number => {
    return 1 - Math.pow(1 - progress, 2);
  },

  // Ease-in - starts slow, speeds up
  easeIn: (progress: number): number => {
    return progress * progress;
  },

  // Bounce - overshoots and bounces back
  bounce: (progress: number): number => {
    // Bounce effect: overshoot and then bounce back
    if (progress < 0.5) {
      // First half: accelerating upward
      return 4 * progress * progress;
    } else if (progress < 0.8) {
      // Overshoot
      return 1 + (progress - 0.8) * 5;
    } else {
      // Final bounce back
      return 1 - 0.5 * Math.pow((progress - 1) * 2.5, 2);
    }
  },
};

const StudioContent = () => {
  const { user, profile, updateProfile, refreshProfile } = useClerkAuth();
  const { toast } = useToast();
  const { isRecording, setIsRecording } = useRecording();
  const [isPaused, setIsPaused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);

  const [counterSettings, setCounterSettings] = useState({
    startValue: 0,
    endValue: 100,
    duration: 5,
    fontFamily: "orbitron",
    fontSize: 120,
    fontWeight: 400,
    letterSpacing: 0,
    design: "classic",
    background: "black",
    speed: 1,
    customFont: "",
    transition: "none",
    easing: "linear",
    prefix: "",
    suffix: "",
    separator: "none",
    backgroundGradient: "linear-gradient(45deg, #2193b0, #6dd5ed)",
    textColor: "#FFFFFF",
    useFloatValues: false, // Use float values toggle
  });

  const [textSettings, setTextSettings] = useState({
    enabled: false,
    text: "Sample Text",
    position: "right",
    fontSize: 120, // Default to same as counter
    fontFamily: "orbitron", // Default to same as counter
    color: "#ffffff",
    offsetX: 150, // Default to right side
    offsetY: 0,
    opacity: 1,
  });

  const [designSettings, setDesignSettings] = useState({
    neonColor: "#00FFFF",
    neonIntensity: 10,
    glowColor: "#FFFFFF",
    glowIntensity: 15,
    gradientColors:
      "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)",
    fireColors: "linear-gradient(45deg, #FF4444, #FF8800, #FFFF00)",
    fireGlow: 10,
    rainbowColors:
      "linear-gradient(45deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF, #FF0088)",
    chromeColors: "linear-gradient(45deg, #FFFFFF, #CCCCCC, #999999)",
  });

  const [currentValue, setCurrentValue] = useState(0);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [cancelGifGeneration, setCancelGifGeneration] = useState(false);

  // State for automatic video processing after recording stops
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isPreviewingVideo, setIsPreviewingVideo] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  // Sync text settings with counter settings
  useEffect(() => {
    setTextSettings((prev) => ({
      ...prev,
      fontSize: counterSettings.fontSize,
      fontFamily: counterSettings.fontFamily,
    }));
  }, [counterSettings.fontSize, counterSettings.fontFamily]);

  useEffect(() => {
    // When the user tweaks the start value while not recording we immediately reflect it in the preview.
    if (!isRecording) {
      setCurrentValue(counterSettings.startValue);
    }
  }, [counterSettings.startValue, isRecording]);

  const formatNumber = (value: number) => {
    // Check if we should use float values and if the value has decimal places
    const hasDecimal = value % 1 !== 0;

    // Format the number with or without decimal places
    let formattedValue;
    if (counterSettings.useFloatValues) {
      // For float values, show up to 2 decimal places and remove trailing zeros
      formattedValue = value.toFixed(2).replace(/\.?0+$/, "");
      // Ensure we keep .0 if it's exactly a .0 decimal
      if (formattedValue.indexOf(".") === -1 && hasDecimal) {
        formattedValue = value.toFixed(1);
      }
    } else {
      // For integer values, round to the nearest integer
      formattedValue = Math.round(value).toString();
    }

    // Apply separator
    if (counterSettings.separator && counterSettings.separator !== "none") {
      const separator =
        counterSettings.separator === "comma"
          ? ","
          : counterSettings.separator === "dot"
          ? "."
          : counterSettings.separator === "space"
          ? " "
          : "";

      if (separator) {
        // For numbers with decimals, only apply separator to the integer part
        if (formattedValue.includes(".")) {
          const parts = formattedValue.split(".");
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
          formattedValue = parts.join(".");
        } else {
          formattedValue = formattedValue.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            separator
          );
        }
      }
    }

    // Add prefix and suffix
    return `${counterSettings.prefix || ""}${formattedValue}${
      counterSettings.suffix || ""
    }`;
  };

  const handleStartRecording = () => {
    if (isRecording) return;
    console.log("Starting recording...");
    setRecordingTime(0);
    recordedChunks.current = [];
    setVideoBlob(null);
    setIsPaused(false);
    setIsRecording(true);

    const stream = (canvasRef.current as any).captureStream(60);

    // Configure MediaRecorder with proper settings for transparency
    const hasTransparency = counterSettings.background === "transparent";
    const hasSpecialEffects = ["neon", "glow"].includes(counterSettings.design);

    let mimeType = "video/webm";
    let recorderOptions = {};

    // Determine the best codec and settings for the recording
    if (hasTransparency) {
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9";
        // Special effects with transparency need higher quality
        if (hasSpecialEffects) {
          recorderOptions = {
            videoBitsPerSecond: 8000000, // Higher bitrate for effects
          };
        }
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        mimeType = "video/webm;codecs=vp8";
      }
    } else {
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9";
      }
    }

    mediaRecorder.current = new MediaRecorder(stream, {
      mimeType: mimeType,
      ...recorderOptions,
    });

    mediaRecorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    // When recording fully stops, automatically process the video so it is ready for download.
    mediaRecorder.current.onstop = () => {
      finalizeVideoProcessing();
    };

    mediaRecorder.current.start();
    // Set the initial value based on direction
    setCurrentValue(counterSettings.startValue);
  };

  const handleStopRecording = () => {
    if (!isRecording) return;
    console.log("Stopping recording...");
    setIsRecording(false);
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorder.current && isRecording) {
      if (isPaused) {
        mediaRecorder.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorder.current.pause();
        setIsPaused(true);
      }
    }
  };

  /**
   * Converts recorded chunks into a Blob and stores it so it can be downloaded later.
   * Shows a loader on the export button while processing.
   */
  const finalizeVideoProcessing = (): Blob | null => {
    if (recordedChunks.current.length === 0) return null;

    setIsProcessingVideo(true);

    // Determine the best WebM codec for alpha channel support
    let mimeType = "video/webm";
    let codecOptions = {};

    const hasTransparency = counterSettings.background === "transparent";
    const hasSpecialEffects = ["neon", "glow"].includes(counterSettings.design);

    if (hasTransparency) {
      // VP9 is best for alpha channel support
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9";
        // For transparency with special effects, ensure higher quality encoding
        if (hasSpecialEffects) {
          codecOptions = {
            alphaBitDepth: 8,
            bitrate: 8000000, // Higher bitrate for better quality with effects
          };
        }
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        mimeType = "video/webm;codecs=vp8";
      }
    } else {
      // For non-transparent backgrounds, just use vp9 for better compression
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9";
      }
    }

    try {
      const blob = new Blob(recordedChunks.current, {
        type: mimeType,
        ...codecOptions,
      });

      setVideoBlob(blob);

      // Create a URL for the video preview
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      const url = URL.createObjectURL(blob);
      setVideoPreviewUrl(url);

      return blob;
    } catch (error) {
      console.error("Failed to process video blob", error);
      toast({
        title: "Video Export Failed",
        description: "An error occurred while processing the video.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingVideo(false);
    }

    return null;
  };

  const handlePreviewVideo = () => {
    if (!videoBlob && recordedChunks.current.length > 0) {
      finalizeVideoProcessing();
    }

    if (videoPreviewUrl) {
      setIsPreviewingVideo(true);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewingVideo(false);
  };

  const handleDownloadVideo = () => {
    // Credit gating for Free users
    if (
      profile?.subscription_plan === "free" &&
      typeof profile?.credits === "number" &&
      profile.credits <= 0
    ) {
      toast({
        title: "Out of Credits",
        description:
          "You have reached your monthly export limit. Upgrade to Pro for unlimited exports.",
        variant: "destructive",
      });
      return;
    }

    let blobToDownload: Blob | null = videoBlob;

    if (!blobToDownload) {
      blobToDownload = finalizeVideoProcessing();
    }

    if (!blobToDownload) return;

    const fileExtension = "webm";

    const url = URL.createObjectURL(blobToDownload);
    const a = document.createElement("a");
    a.href = url;
    a.download = `counter-animation-${Date.now()}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const hasTransparency = counterSettings.background === "transparent";

    toast({
      title: "Video Downloaded",
      description: `Your counter animation video has been saved${
        hasTransparency ? " with transparency support" : ""
      }.`,
    });
    console.log(profile, "------------t");

    // Decrement credits for free users
    if (
      profile?.subscription_plan === "free" &&
      typeof profile?.credits === "number" &&
      profile.credits > 0
    ) {
      updateProfile({ credits: profile.credits - 1 });
      // Optionally refresh after update
      refreshProfile();
    }
  };

  const handleDownloadGif = async () => {
    if (!canvasRef.current || recordedChunks.current.length === 0) return;

    setIsGeneratingGif(true);
    setCancelGifGeneration(false);

    try {
      const gif = new GIF({
        workers: 4,
        quality: 15,
        width: 800,
        height: 600,
        workerScript:
          "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js",
        transparent:
          counterSettings.background === "transparent" ? 0x00000000 : null,
        background:
          counterSettings.background === "transparent"
            ? 0x00000000
            : counterSettings.background === "white"
            ? 0xffffff
            : 0x000000,
      });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const frameCount = Math.min(60, counterSettings.duration * 10);
      const delay = Math.max(
        50,
        (counterSettings.duration * 1000) / frameCount
      );

      let frameIndex = 0;

      const addFrame = () => {
        if (cancelGifGeneration) {
          setIsGeneratingGif(false);
          setCancelGifGeneration(false);
          return;
        }

        if (frameIndex >= frameCount) {
          gif.render();
          return;
        }

        const progress = frameIndex / (frameCount - 1);
        const value =
          counterSettings.startValue +
          (counterSettings.endValue - counterSettings.startValue) * progress;

        // Clear canvas with proper transparency handling
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background (solid or gradient)
        if (counterSettings.background === "transparent") {
          // nothing
        } else if (counterSettings.background === "gradient") {
          const extractColors = (gradientStr: string) =>
            gradientStr.match(/#[0-9a-fA-F]{3,6}/g) || ["#000000", "#ffffff"];

          const colors = extractColors(
            (counterSettings as any).backgroundGradient || ""
          );
          const grad = ctx.createLinearGradient(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const step = colors.length > 1 ? 1 / (colors.length - 1) : 1;
          colors.forEach((c, i) => grad.addColorStop(i * step, c));
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle =
            counterSettings.background === "white" ? "#FFFFFF" : "#000000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Determine text color based on background for readability
        const textColor =
          counterSettings.background === "white" ? "#000000" : "#FFFFFF";

        // Draw counter with proper color based on background
        ctx.fillStyle = textColor;
        ctx.font = `${counterSettings.fontSize}px ${counterSettings.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(formatNumber(value), canvas.width / 2, canvas.height / 2);

        gif.addFrame(canvas, { delay, copy: true });
        frameIndex++;

        // Add next frame after a small delay to prevent blocking
        setTimeout(addFrame, 1);
      };

      gif.on("progress", (progress: number) => {
        toast({
          title: "Generating GIF",
          description: `Progress: ${Math.round(progress * 100)}%`,
        });
      });

      gif.on("finished", (blob: Blob) => {
        if (!cancelGifGeneration) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `counter-animation-${Date.now()}.gif`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast({
            title: "GIF Downloaded",
            description:
              counterSettings.background === "transparent"
                ? "Your transparent counter animation GIF has been saved."
                : "Your counter animation GIF has been saved.",
          });
        }

        setIsGeneratingGif(false);
        setCancelGifGeneration(false);
      });

      addFrame();
    } catch (error) {
      console.error("Failed to generate GIF:", error);
      setIsGeneratingGif(false);
      setCancelGifGeneration(false);
      toast({
        title: "GIF Generation Failed",
        description: "Could not generate GIF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelGif = () => {
    setCancelGifGeneration(true);
    toast({
      title: "GIF Generation Cancelled",
      description: "The GIF generation process has been stopped.",
    });
  };

  const handleRestartRecording = () => {
    handleStopRecording();
    setTimeout(() => {
      setCurrentValue(counterSettings.startValue);
      setRecordingTime(0);

      // Clear any recorded chunks and processed blobs so we start fresh
      recordedChunks.current = [];
      setVideoBlob(null);
      setIsProcessingVideo(false);
    }, 100);
  };

  // Counter animation logic
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) * counterSettings.speed; // speed factor
      const durationMs = counterSettings.duration * 1000;
      const rawProgress = Math.min(elapsed / durationMs, 1); // Clamp between 0 and 1

      // Apply easing function
      const easedProgress =
        counterSettings.easing && counterSettings.easing in easingFunctions
          ? easingFunctions[
              counterSettings.easing as keyof typeof easingFunctions
            ](rawProgress)
          : rawProgress;

      // Compute current value
      const newValue =
        counterSettings.startValue +
        easedProgress * (counterSettings.endValue - counterSettings.startValue);

      // Update current value which will trigger transitions in CounterPreview
      setCurrentValue(newValue);
      setRecordingTime(elapsed);

      // Stop when progress reaches 1
      if (rawProgress >= 1) {
        handleStopRecording();
      }
    }, 1000 / 60); // 60fps updates for smooth animation

    return () => clearInterval(interval);
  }, [isRecording, isPaused, counterSettings]);

  return (
    <div className="h-screen bg-[#101010] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#171717] px-4 sm:px-6 py-3 sticky top-0 z-30 flex-shrink-0">
        <div className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/favicon.ico" alt="Logo" className="w-8 h-8 rounded" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Countable
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-400 px-3 py-1 rounded border border-[#2BA6FF]/30">
              <span className="hidden sm:inline">Recording Time:</span>
              <span className="font-mono text-[#2BA6FF]">
                {(recordingTime / 1000).toFixed(1)}s
              </span>
              {isRecording && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>

            <div className="flex items-center gap-2">
              {user && <AuthButton mode="user" />}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Studio Sidebar */}
        <StudioSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          counterSettings={counterSettings}
          onCounterSettingsChange={setCounterSettings}
          textSettings={textSettings}
          onTextSettingsChange={setTextSettings}
          designSettings={designSettings}
          onDesignSettingsChange={setDesignSettings}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col transition-all duration-300 overflow-hidden h-full">
          {/* Preview Area - Centered */}
          <div className="flex-1 flex justify-center items-center bg-[#0c0c0c] p-6">
            <div className="max-w-[800px] w-full flex flex-col items-center justify-center">
              <div className="w-full aspect-video flex items-center justify-center rounded-lg overflow-hidden bg-[#080808] shadow-2xl border border-white/5">
                {isPreviewingVideo && videoPreviewUrl ? (
                  <div className="relative w-full h-full">
                    <video
                      src={videoPreviewUrl}
                      className="w-full h-full object-contain"
                      autoPlay
                      controls
                      loop
                    />
                    <button
                      onClick={handleClosePreview}
                      className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <CounterPreview
                    ref={canvasRef}
                    settings={counterSettings}
                    textSettings={textSettings}
                    designSettings={designSettings}
                    currentValue={currentValue}
                    isRecording={isRecording}
                    formatNumber={formatNumber}
                  />
                )}
              </div>

              {/* Recording Controls - Moved below the preview */}
              <div className="py-4 px-4 flex justify-center w-full mt-4">
                <RecordingControls
                  isPaused={isPaused}
                  onStart={handleStartRecording}
                  onStop={handleStopRecording}
                  onPause={handlePauseRecording}
                  onRestart={handleRestartRecording}
                  onDownloadVideo={handleDownloadVideo}
                  onDownloadGif={handleDownloadGif}
                  onPreviewVideo={handlePreviewVideo}
                  recordedChunksLength={recordedChunks.current.length}
                  isGeneratingGif={isGeneratingGif}
                  onCancelGif={handleCancelGif}
                  isProcessingVideo={isProcessingVideo}
                  hasCredits={
                    profile?.subscription_plan === "pro" ||
                    profile?.credits === null ||
                    (typeof profile?.credits === "number" &&
                      profile.credits > 0)
                  }
                  hasRecordedVideo={!!videoPreviewUrl}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Panel - Always visible */}
        <StudioRightPanel
          counterSettings={counterSettings}
          onCounterSettingsChange={setCounterSettings}
          designSettings={designSettings}
          onDesignSettingsChange={setDesignSettings}
        />
      </div>
    </div>
  );
};

const Studio = () => {
  return (
    <RecordingProvider>
      <StudioContent />
    </RecordingProvider>
  );
};

export default Studio;