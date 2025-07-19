import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import {
  Download,
  Settings,
  Film,
  Image,
  Loader2,
  Info,
  Zap,
  Monitor,
  Smartphone,
  Tv,
  CheckCircle,
  BarChart2,
} from "lucide-react";
import {
  TransparentCounterExporter,
  TransparentExportOptions,
  CounterSettings,
  TextSettings,
  DesignSettings,
} from "@/utils/transparentExport";

// Custom scrollbar styles
import "./scrollbar-styles.css";

interface TransparentExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counterSettings: CounterSettings;
  textSettings: TextSettings;
  designSettings: DesignSettings;
}

const PRESET_SIZES = [
  { name: "HD (1920x1080)", width: 1920, height: 1080, icon: Monitor },
  { name: "4K (3840x2160)", width: 3840, height: 2160, icon: Tv },
  { name: "Mobile (1080x1920)", width: 1080, height: 1920, icon: Smartphone },
  { name: "Square (1080x1080)", width: 1080, height: 1080, icon: Monitor },
  { name: "Custom", width: 800, height: 600, icon: Settings },
];

const PRESET_FRAME_RATES = [24, 25, 30, 50, 60, 120];

export const TransparentExportModal: React.FC<TransparentExportModalProps> = ({
  open,
  onOpenChange,
  counterSettings,
  textSettings,
  designSettings,
}) => {
  const [exportOptions, setExportOptions] = useState<TransparentExportOptions>({
    includeCounter: true,
    includeText: textSettings.enabled,
    format: "png-sequence",
    width: 1920,
    height: 1080,
    frameRate: 60,
    duration: counterSettings.duration,
    scale: 1.0,
    preserveAnimations: true,
    transitionType: counterSettings.transition,
    easingFunction: counterSettings.easing,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customSize, setCustomSize] = useState({ width: 800, height: 600 });
  const [isCancelRequested, setIsCancelRequested] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");
  const { toast } = useToast();
  const { user, profile, updateProfile, refreshProfile } = useClerkAuth();

  const handlePresetChange = (presetIndex: number) => {
    setSelectedPreset(presetIndex);
    const preset = PRESET_SIZES[presetIndex];

    if (preset.name === "Custom") {
      setExportOptions((prev) => ({
        ...prev,
        width: customSize.width,
        height: customSize.height,
      }));
    } else {
      setExportOptions((prev) => ({
        ...prev,
        width: preset.width,
        height: preset.height,
      }));
    }
  };

  const handleCustomSizeChange = (
    dimension: "width" | "height",
    value: number
  ) => {
    setCustomSize((prev) => ({ ...prev, [dimension]: value }));
    if (selectedPreset === PRESET_SIZES.length - 1) {
      // Custom preset
      setExportOptions((prev) => ({ ...prev, [dimension]: value }));
    }
  };

  const handleExport = async () => {
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

    setIsExporting(true);
    setIsCancelRequested(false);
    setExportProgress(0);
    setExportStatus("Initializing export...");

    try {
      const exporter = new TransparentCounterExporter(
        exportOptions,
        counterSettings,
        textSettings,
        designSettings
      );

      // Add progress callback function
      const progressCallback = (progress: number, status: string) => {
        setExportProgress(progress);
        setExportStatus(status);
      };

      // Add cancellation check function
      const checkCancellation = () => isCancelRequested;

      // Pass both the cancellation check and progress callback
      const exports = await exporter.export(
        checkCancellation,
        progressCallback
      );

      // If cancelled, don't download exports
      if (isCancelRequested) {
        toast({
          title: "Export Cancelled",
          description: "The export process was cancelled.",
        });
        setIsExporting(false);
        return;
      }

      setExportProgress(100);
      setExportStatus("Preparing download...");

      await TransparentCounterExporter.downloadExports(
        exports,
        "transparent-counter-overlay"
      );

      const hasTransparency = counterSettings.background === "transparent";
      toast({
        title: "Export Complete",
        description: `Your transparent counter overlay has been exported successfully${
          hasTransparency ? " with transparency support" : ""
        }!`,
      });

      // Decrement credits for free users
      if (
        profile?.subscription_plan === "free" &&
        typeof profile?.credits === "number" &&
        profile.credits > 0
      ) {
        updateProfile({ credits: profile.credits - 1 });
        refreshProfile();
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description:
          "There was an error exporting your transparent counter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setIsCancelRequested(false);
    }
  };

  const estimatedFileSize = () => {
    const frameCount = Math.ceil(
      exportOptions.frameRate * exportOptions.duration
    );
    const pixelCount =
      exportOptions.width *
      exportOptions.height *
      exportOptions.scale *
      exportOptions.scale;

    // Rough estimates
    const pngSize = (frameCount * (pixelCount * 4)) / 1024 / 1024; // 4 bytes per pixel (RGBA)
    const webmSize = (pixelCount * exportOptions.duration * 8) / 1024 / 1024; // Compressed estimate

    return { pngSize, webmSize, frameCount };
  };

  const { pngSize, webmSize, frameCount } = estimatedFileSize();

  // Check if multi-digit transition is selected
  const isMultiDigitTransition = [
    "fade-roll",
    "flip-down",
    "slide-vertical",
    "bounce",
    "scale",
  ].includes(counterSettings.transition);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-[#171717]/60 border border-white/[0.08] backdrop-blur-sm max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Export Transparent Counter Overlay
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Generate professional overlay elements for video editing workflows
            with full transparency support and advanced multi-digit animations.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/[0.03] border border-white/[0.08]">
            <TabsTrigger
              value="content"
              className="data-[state=active]:bg-[#2BA6FF]/20 data-[state=active]:text-[#2BA6FF]"
            >
              Content
            </TabsTrigger>
            <TabsTrigger
              value="format"
              className="data-[state=active]:bg-[#2BA6FF]/20 data-[state=active]:text-[#2BA6FF]"
            >
              Format & Quality
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="data-[state=active]:bg-[#2BA6FF]/20 data-[state=active]:text-[#2BA6FF]"
            >
              Preview & Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 custom-scrollbar">
            <Card className="bg-white/[0.03] border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  Content Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">
                      Include Counter Numbers
                    </Label>
                    <p className="text-xs text-white/40">
                      Export the animated counter display
                    </p>
                  </div>
                  <Switch
                    checked={exportOptions.includeCounter}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeCounter: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Include Text Elements</Label>
                    <p className="text-xs text-white/40">
                      Export additional text overlays
                    </p>
                  </div>
                  <Switch
                    checked={exportOptions.includeText}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeText: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Preserve Animations</Label>
                    <p className="text-xs text-white/40">
                      Include transition effects and animations
                    </p>
                  </div>
                  <Switch
                    checked={exportOptions.preserveAnimations}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        preserveAnimations: checked,
                      }))
                    }
                  />
                </div>

                {/* Multi-digit animation info */}
                {isMultiDigitTransition && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="text-green-400 font-medium mb-1">
                          Multi-Digit Animation Detected
                        </p>
                        <p className="text-green-400/80">
                          Your current transition "{counterSettings.transition}"
                          will animate each digit individually for enhanced
                          visual appeal.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="format" className="space-y-6 custom-scrollbar">
            <Card className="bg-white/[0.03] border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  Export Format
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Output Format</Label>
                  <Select
                    value={exportOptions.format}
                    onValueChange={(
                      value: "png-sequence" | "webm-alpha" | "both"
                    ) =>
                      setExportOptions((prev) => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png-sequence">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          PNG Sequence (Best Quality)
                        </div>
                      </SelectItem>
                      <SelectItem value="webm-alpha">
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4" />
                          WebM with Alpha (Smaller Size)
                        </div>
                      </SelectItem>
                      <SelectItem value="both">
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Both Formats
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-white/40">
                    PNG sequences preserve all effects perfectly. WebM files are
                    optimized to prevent color bleeding.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.03] border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  Resolution & Scaling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-white">Size Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_SIZES.map((preset, index) => {
                      const Icon = preset.icon;
                      return (
                        <button
                          key={preset.name}
                          onClick={() => handlePresetChange(index)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            selectedPreset === index
                              ? "border-[#2BA6FF] bg-[#2BA6FF]/20"
                              : "border-white/20 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4" />
                            <span className="text-white text-sm font-medium">
                              {preset.name}
                            </span>
                          </div>
                          <p className="text-xs text-white/60">
                            {preset.width} × {preset.height}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedPreset === PRESET_SIZES.length - 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Width</Label>
                      <Input
                        type="number"
                        value={customSize.width}
                        onChange={(e) =>
                          handleCustomSizeChange(
                            "width",
                            parseInt(e.target.value) || 800
                          )
                        }
                        className="bg-white/[0.03] border-white/[0.08] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Height</Label>
                      <Input
                        type="number"
                        value={customSize.height}
                        onChange={(e) =>
                          handleCustomSizeChange(
                            "height",
                            parseInt(e.target.value) || 600
                          )
                        }
                        className="bg-white/[0.03] border-white/[0.08] text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-white">Scale Factor</Label>
                    <span className="text-sm text-white">
                      {exportOptions.scale}x
                    </span>
                  </div>
                  <Slider
                    value={[exportOptions.scale]}
                    onValueChange={([scale]) =>
                      setExportOptions((prev) => ({ ...prev, scale }))
                    }
                    min={0.5}
                    max={4.0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-white/40">
                    Higher scale = better quality but larger file size
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.03] border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-white text-sm">
                  Timing & Frame Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Frame Rate (FPS)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_FRAME_RATES.map((fps) => (
                      <button
                        key={fps}
                        onClick={() =>
                          setExportOptions((prev) => ({
                            ...prev,
                            frameRate: fps,
                          }))
                        }
                        className={`p-2 rounded border text-center transition-all ${
                          exportOptions.frameRate === fps
                            ? "border-[#2BA6FF] bg-[#2BA6FF]/20 text-[#2BA6FF]"
                            : "border-white/20 bg-white/5 hover:bg-white/10 text-white"
                        }`}
                      >
                        {fps}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/40">
                    Higher frame rates create smoother multi-digit animations
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-white">Duration</Label>
                    <span className="text-sm text-white">
                      {exportOptions.duration}s
                    </span>
                  </div>
                  <Slider
                    value={[exportOptions.duration]}
                    onValueChange={([duration]) =>
                      setExportOptions((prev) => ({ ...prev, duration }))
                    }
                    min={1}
                    max={30}
                    step={0.5}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6 custom-scrollbar">
            <Card className="bg-white/[0.03] border border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Export Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-white/60">Resolution</p>
                    <p className="text-white font-medium">
                      {Math.round(exportOptions.width * exportOptions.scale)} ×{" "}
                      {Math.round(exportOptions.height * exportOptions.scale)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-white/60">Frame Count</p>
                    <p className="text-white font-medium">
                      {frameCount} frames
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-white/60">Frame Rate</p>
                    <p className="text-white font-medium">
                      {exportOptions.frameRate} FPS
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-white/60">Duration</p>
                    <p className="text-white font-medium">
                      {exportOptions.duration}s
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-white/60">Estimated File Sizes</p>
                  <div className="flex gap-2">
                    {(exportOptions.format === "png-sequence" ||
                      exportOptions.format === "both") && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        PNG: ~{pngSize.toFixed(1)}MB
                      </Badge>
                    )}
                    {(exportOptions.format === "webm-alpha" ||
                      exportOptions.format === "both") && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        WebM: ~{webmSize.toFixed(1)}MB
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-white/60">Content & Features</p>
                  <div className="flex gap-2 flex-wrap">
                    {exportOptions.includeCounter && (
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        Counter
                      </Badge>
                    )}
                    {exportOptions.includeText && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        Text
                      </Badge>
                    )}
                    {exportOptions.preserveAnimations && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        Animations
                      </Badge>
                    )}
                    {isMultiDigitTransition && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Multi-Digit
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-[#2BA6FF]/10 border border-[#2BA6FF]/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#2BA6FF] flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-[#2BA6FF] font-medium mb-2">
                    Export Information
                  </p>
                  <ul className="text-[#2BA6FF] space-y-1 text-xs">
                    <li>
                      • PNG sequences provide the highest quality with perfect
                      alpha channel support
                    </li>
                    <li>
                      • WebM files are optimized to prevent color bleeding and
                      artifacts
                    </li>
                    <li>
                      • Multi-digit animations create individual digit
                      transitions for enhanced visual appeal
                    </li>
                    <li>
                      • Both formats are compatible with major video editing
                      software
                    </li>
                    <li>
                      • Transparent backgrounds allow seamless overlay on any
                      content
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export Progress Bar */}
        {isExporting && (
          <div className="mb-4">
            <Card className="bg-[#171717]/80 border border-white/[0.08] overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#2BA6FF]" />
                    <span className="text-sm text-white font-medium">
                      Export Progress
                    </span>
                  </div>
                  <span className="text-sm text-[#2BA6FF] font-medium">
                    {Math.round(exportProgress)}%
                  </span>
                </div>

                <div className="space-y-2">
                  <Progress
                    value={exportProgress}
                    className="h-1.5 bg-white/10"
                    indicatorClassName="bg-[#2BA6FF]"
                  />
                  <p className="text-xs text-white/60">{exportStatus}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-white/[0.08]">
          <Button
            variant="outline"
            onClick={() => {
              if (isExporting && !isCancelRequested) {
                // Request cancellation of the export process
                setIsCancelRequested(true);
                setExportStatus("Cancelling export process...");
                toast({
                  title: "Cancelling Export",
                  description: "Cancelling the export process...",
                });
              } else if (!isExporting) {
                // Just close the modal if not exporting
                onOpenChange(false);
              }
            }}
            disabled={isCancelRequested && isExporting}
            className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-white"
          >
            {isCancelRequested && isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : isExporting ? (
              "Cancel Export"
            ) : (
              "Cancel"
            )}
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              isExporting ||
              (!exportOptions.includeCounter && !exportOptions.includeText) ||
              (profile?.subscription_plan === "free" &&
                typeof profile?.credits === "number" &&
                profile.credits <= 0)
            }
            className="flex-1 bg-[#2BA6FF]/60 hover:bg-[#2BA6FF]/80 text-white disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : profile?.subscription_plan === "free" &&
              typeof profile?.credits === "number" &&
              profile.credits <= 0 ? (
              <>
                <Download className="w-4 h-4 mr-2" />
                Out of Credits
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Overlay
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
