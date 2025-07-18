import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  Zap,
  Cpu,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface TransitionLibraryProps {
  selectedTransition: string;
  onSelectTransition: (transition: string) => void;
  selectedEasing?: string;
  onSelectEasing?: (easing: string) => void;
  counterSettings?: {
    hasTransparency?: boolean;
    isHighResolution?: boolean;
    isMultiDigit?: boolean;
    exportFormat?: string;
  };
}

interface TransitionData {
  id: string;
  name: string;
  category: "basic" | "multi-digit" | "special" | "advanced";
  description: string;
  complexity: "low" | "medium" | "high";
  supportsTransparency: boolean;
  requiresGPU: boolean;
  performance: "excellent" | "good" | "moderate" | "intensive";
  tooltip: string;
  compatibilityNotes?: string[];
  previewAnimation: string;
}

const TransitionLibrary: React.FC<TransitionLibraryProps> = ({
  selectedTransition,
  onSelectTransition,
  selectedEasing = "linear",
  onSelectEasing = () => {},
  counterSettings = {},
}) => {
  // Category state for filtering transitions
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [previewStates, setPreviewStates] = useState<Record<string, boolean>>(
    {}
  );
  const previewTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Define all transitions with enhanced categorization and metadata
  const transitions: TransitionData[] = [
    // Basic Transitions
    {
      id: "none",
      name: "None",
      category: "basic",
      description: "No animation effect - instant number change",
      complexity: "low",
      supportsTransparency: true,
      requiresGPU: false,
      performance: "excellent",
      tooltip:
        "Perfect for simple counters where you want instant updates without any visual effects.",
      previewAnimation: "text-white",
    },
    {
      id: "fadeIn",
      name: "Fade In",
      category: "basic",
      description: "Simple fade in transition with smooth opacity change",
      complexity: "low",
      supportsTransparency: true,
      requiresGPU: false,
      performance: "excellent",
      tooltip:
        "Classic fade effect that smoothly transitions from transparent to opaque. Works great for subtle animations.",
      previewAnimation: "text-white animate-fade-in",
    },

    // Multi-Digit Transitions
    {
      id: "odometer",
      name: "Odometer",
      category: "multi-digit",
      description: "Rolling digits like a mechanical odometer",
      complexity: "medium",
      supportsTransparency: true,
      requiresGPU: false,
      performance: "good",
      tooltip:
        "Each digit rolls independently like a car odometer. Perfect for realistic counting animations.",
      compatibilityNotes: [
        "Works best with multi-digit counters",
        "Requires consistent digit spacing",
      ],
      previewAnimation: "text-white animate-counter-spin",
    },

    // Special Effects
    {
      id: "glitch",
      name: "Glitch",
      category: "special",
      description: "Digital glitch effect with random displacement",
      complexity: "medium",
      supportsTransparency: true,
      requiresGPU: false,
      performance: "good",
      tooltip:
        "Cyberpunk-style glitch effect with random position shifts. Perfect for tech or gaming themes.",
      previewAnimation: "text-white animate-counter-shake",
    },
    {
      id: "blur",
      name: "Blur",
      category: "special",
      description: "Numbers blur in and out of focus",
      complexity: "medium",
      supportsTransparency: true,
      requiresGPU: false,
      performance: "good",
      tooltip:
        "Smooth blur-to-focus transition. Creates a dreamy, cinematic effect for your counters.",
      compatibilityNotes: ["May affect text clarity during transition"],
      previewAnimation: "text-white animate-pulse",
    },
    {
      id: "typewriter",
      name: "Typewriter",
      category: "special",
      description: "Types numbers character by character",
      complexity: "medium",
      supportsTransparency: true,
      requiresGPU: false,
      performance: "good",
      tooltip:
        "Reveals numbers one character at a time like typing. Great for dramatic reveals or storytelling.",
      compatibilityNotes: ["Animation duration scales with digit count"],
      previewAnimation: "text-white animate-pulse",
    },

    // Advanced Transitions
    {
      id: "hologram-flicker",
      name: "Hologram Flicker",
      category: "advanced",
      description: "Sci-fi holographic effect with scan lines and interference",
      complexity: "high",
      supportsTransparency: true,
      requiresGPU: false,
      performance: "moderate",
      tooltip:
        "Authentic holographic display with scan lines, RGB separation, static noise, and glitch effects. Perfect for sci-fi themes.",
      compatibilityNotes: [
        "Best with transparent or dark backgrounds",
        "Includes flickering effects",
      ],
      previewAnimation: "text-cyan-400 animate-counter-glow",
    },
  ];

  // Define easing functions
  const easingOptions = [
    {
      id: "linear",
      name: "Linear",
      description: "Counts at constant speed (0→1000→2000→3000→4000→5000)",
    },
    {
      id: "easeOut",
      name: "Ease-Out",
      description:
        "Starts fast, slows down at the end (0→3000→4500→4800→4950→5000)",
    },
    {
      id: "easeIn",
      name: "Ease-In",
      description: "Starts slow, speeds up (0→500→2000→4000→5000)",
    },
    {
      id: "bounce",
      name: "Bounce",
      description: "Overshoots and bounces back (0→3000→5500→4800→5200→5000)",
    },
  ];

  // Define transition categories
  const categories = [
    { id: "all", name: "All Effects" },
    { id: "basic", name: "Basic" },
    { id: "multi-digit", name: "Multi-Digit" },
    { id: "special", name: "Special" },
    { id: "advanced", name: "Advanced" },
  ];

  // Compatibility checking system
  const checkTransitionCompatibility = (transition: TransitionData) => {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check transparency compatibility
    if (counterSettings.hasTransparency && !transition.supportsTransparency) {
      issues.push("This transition doesn't support transparent backgrounds");
    }

    // Check multi-digit compatibility
    if (
      counterSettings.isMultiDigit &&
      transition.category !== "multi-digit" &&
      transition.category !== "advanced"
    ) {
      warnings.push("This transition may not animate individual digits");
    }

    // Check performance for high resolution
    if (
      counterSettings.isHighResolution &&
      transition.performance === "moderate"
    ) {
      warnings.push("May impact performance at high resolutions");
    }

    // Check export format compatibility
    if (
      counterSettings.exportFormat === "gif" &&
      transition.complexity === "high"
    ) {
      warnings.push("Complex transitions may result in large GIF files");
    }

    return { issues, warnings, isCompatible: issues.length === 0 };
  };

  // Live preview animation trigger
  const triggerPreviewAnimation = (transitionId: string) => {
    // Clear existing timer
    if (previewTimers.current[transitionId]) {
      clearTimeout(previewTimers.current[transitionId]);
    }

    // Set preview state
    setPreviewStates((prev) => ({ ...prev, [transitionId]: true }));

    // Reset after animation duration
    previewTimers.current[transitionId] = setTimeout(() => {
      setPreviewStates((prev) => ({ ...prev, [transitionId]: false }));
    }, 1000);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(previewTimers.current).forEach((timer) =>
        clearTimeout(timer)
      );
    };
  }, []);

  // Filter transitions by active category
  const filteredTransitions =
    activeCategory === "all"
      ? transitions
      : transitions.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-4">
      <Label className="text-white">Transition Effect</Label>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              activeCategory === category.id
                ? "bg-[#2BA6FF]/50 text-white"
                : "bg-[#202020] text-gray-300 hover:bg-[#2BA6FF]/20"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Transition grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filteredTransitions.map((transition) => {
          const isAnimating = previewStates[transition.id];

          return (
            <button
              key={transition.id}
              onClick={() => onSelectTransition(transition.id)}
              onMouseEnter={() => triggerPreviewAnimation(transition.id)}
              className={`p-3 rounded-lg border transition-colors relative group ${
                selectedTransition === transition.id
                  ? "border-[#2BA6FF] bg-[#2BA6FF]/10"
                  : "border-gray-700 bg-[#171717] hover:border-gray-500"
              }`}
            >
              <div className="flex flex-col items-center">
                {/* Transition preview animation */}
                <div className="w-full h-14 flex items-center justify-center overflow-hidden relative">
                  <div
                    className={`text-lg font-bold transition-all duration-300 ${
                      isAnimating ? transition.previewAnimation : "text-white"
                    }`}
                  >
                    {transition.category === "multi-digit" ? "123" : "123"}
                  </div>
                </div>

                {/* Transition name */}
                <div className="mt-2 text-xs text-white text-center">
                  {transition.name}
                </div>
              </div>

              {/* Category indicators */}
              {transition.category === "multi-digit" && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              )}
              {transition.category === "advanced" && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Category information panels */}
      {activeCategory === "multi-digit" && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-xs text-green-400">
              <p className="font-medium mb-1">Multi-Digit Animation</p>
              <p>
                These effects animate each digit individually for more dynamic
                and engaging counter animations.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeCategory === "advanced" && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-xs text-purple-400">
              <p className="font-medium mb-1">Advanced Transitions</p>
              <p>
                Complex visual effects with particle systems, physics
                simulations, and advanced rendering techniques. These
                transitions offer stunning visual impact but may require more
                processing power.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeCategory === "special" && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-xs text-blue-400">
              <p className="font-medium mb-1">Special Effects</p>
              <p>
                Unique transition styles that add character and personality to
                your counters. Perfect for themed content or creative projects.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeCategory === "basic" && (
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-xs text-gray-400">
              <p className="font-medium mb-1">Basic Transitions</p>
              <p>
                Simple, reliable effects that work well in any context.
                Excellent performance and universal compatibility.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Easing Function Selection */}
      <div className="mt-6 space-y-2">
        <Label className="text-white">Easing Function</Label>
        <Select value={selectedEasing} onValueChange={onSelectEasing}>
          <SelectTrigger className="bg-[#181818] border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {easingOptions.map((easing) => (
              <SelectItem key={easing.id} value={easing.id}>
                {easing.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Easing description */}
        <div className="text-xs text-gray-400 mt-1">
          {easingOptions.find((e) => e.id === selectedEasing)?.description ||
            ""}
        </div>
      </div>
    </div>
  );
};

export default TransitionLibrary;
