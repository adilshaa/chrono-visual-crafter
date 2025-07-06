import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { useNavigate } from "react-router-dom";
import CounterPreview from "@/components/CounterPreview";
import RecordingControls from "@/components/RecordingControls";
import StudioSidebar from "@/components/StudioSidebar";
import GlassCard from "@/components/ui/glass-card";
import AuthButton from "@/components/auth/AuthButton";
import { Loader2 } from "lucide-react";

// @ts-ignore
import GIF from "gif.js";

const Studio = () => {
  const { toast } = useToast();
  const { user, profile, loading } = useClerkAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [counterSettings, setCounterSettings] = useState({
    startValue: 0,
    endValue: 100,
    duration: 5,
    fontFamily: "orbitron",
    fontSize: 120,
    design: "classic",
    background: "black",
    speed: 1,
    customFont: "",
    transition: "slideUp",
    prefix: "",
    suffix: "",
    separator: "none",
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

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentValue, setCurrentValue] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [cancelGifGeneration, setCancelGifGeneration] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  // Sync text settings with counter settings
  useEffect(() => {
    setTextSettings((prev) => ({
      ...prev,
      fontSize: counterSettings.fontSize,
      fontFamily: counterSettings.fontFamily,
    }));
  }, [counterSettings.fontSize, counterSettings.fontFamily]);

  const formatNumber = (value: number) => {
    let formattedValue = Math.floor(value).toString();

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
        formattedValue = formattedValue.replace(
          /\B(?=(\d{3})+(?!\d))/g,
          separator
        );
      }
    }

    // Add prefix and suffix
    return `${counterSettings.prefix || ""}${formattedValue}${
      counterSettings.suffix || ""
    }`;
  };

  const handleStartRecording = async () => {
    if (!canvasRef.current) return;

    try {
      const stream = canvasRef.current.captureStream(60);
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      recordedChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setCurrentValue(counterSettings.startValue);
      toast({
        title: "Recording Started",
        description: "Counter animation recording has begun.",
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Recording Failed",
        description: "Could not start recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      toast({
        title: "Recording Stopped",
        description: "Your counter animation is ready for export.",
      });
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        toast({
          title: "Recording Resumed",
          description: "Counter animation recording continued.",
        });
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        toast({
          title: "Recording Paused",
          description: "Counter animation recording paused.",
        });
      }
    }
  };

  const handleDownloadVideo = () => {
    if (recordedChunks.current.length === 0) return;

    // Determine the best WebM codec for alpha channel support
    let mimeType = "video/webm";
    let fileExtension = "webm";
    let codecDescription = "WebM";

    // Check for VP9 support (best for alpha channels)
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
      mimeType = "video/webm;codecs=vp9";
      codecDescription = "VP9";
    }
    // Fallback to VP8 if VP9 not supported
    else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
      mimeType = "video/webm;codecs=vp8";
      codecDescription = "VP8";
    }

    const blob = new Blob(recordedChunks.current, {
      type: mimeType,
    });

    const url = URL.createObjectURL(blob);
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
      description: `Your counter animation video has been saved as ${codecDescription} ${
        hasTransparency ? "with transparency support" : ""
      }.`,
    });
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

        if (counterSettings.background !== "transparent") {
          ctx.fillStyle =
            counterSettings.background === "white" ? "#FFFFFF" : "#000000";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw counter with proper color based on background
        ctx.fillStyle =
          counterSettings.background === "white" ? "#000000" : "#FFFFFF";
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
    }, 100);
  };

  // Counter animation logic
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(() => {
      setCurrentValue((prev) => {
        const progress =
          (prev - counterSettings.startValue) /
          (counterSettings.endValue - counterSettings.startValue);
        if (progress >= 1) {
          handleStopRecording();
          return counterSettings.endValue;
        }

        const step =
          (counterSettings.endValue - counterSettings.startValue) /
          ((counterSettings.duration * 60) / counterSettings.speed);
        return Math.min(prev + step, counterSettings.endValue);
      });

      setRecordingTime((prev) => prev + 1000 / 60);
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [isRecording, isPaused, counterSettings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101010] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-4 animate-spin">
            <Loader2 className="w-8 h-8 text-[#2BA6FF]" />
          </div>
          <p className="text-white">Loading Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#101010] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#171717] px-4 sm:px-6 py-3 sticky top-0 z-30 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        {/* Studio Sidebar */}
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
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarOpen ? "" : ""
          } overflow-hidden h-full`}
        >
          {/* Preview Area */}
          <div className="flex-1 flex justify-center items-center bg-[#0c0c0c] p-6">
            <div className="w-[600px] h-[350px] flex items-center justify-center rounded-lg overflow-hidden bg-[#080808] shadow-2xl border border-white/5">
              <CounterPreview
                ref={canvasRef}
                settings={counterSettings}
                textSettings={textSettings}
                designSettings={designSettings}
                currentValue={currentValue}
                isRecording={isRecording}
                formatNumber={formatNumber}
              />
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex-shrink-0 py-4 flex justify-center bg-[#171717] border-t border-white/5">
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              onPause={handlePauseRecording}
              onRestart={handleRestartRecording}
              onDownloadVideo={handleDownloadVideo}
              onDownloadGif={handleDownloadGif}
              recordedChunksLength={recordedChunks.current.length}
              isGeneratingGif={isGeneratingGif}
              onCancelGif={handleCancelGif}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Studio;
