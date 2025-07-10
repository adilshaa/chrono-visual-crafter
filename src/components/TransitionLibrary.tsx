import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransitionLibraryProps {
  selectedTransition: string;
  onSelectTransition: (transition: string) => void;
  selectedEasing?: string;
  onSelectEasing?: (easing: string) => void;
}

const TransitionLibrary: React.FC<TransitionLibraryProps> = ({
  selectedTransition,
  onSelectTransition,
  selectedEasing = "linear",
  onSelectEasing = () => {},
}) => {
  // Category state for filtering transitions
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Define visible transitions (keeping only None, Fade In, Glitch, Blur, Typewriter)
  const transitions = [
    {
      id: "none",
      name: "None",
      category: "basic",
      description: "No animation effect",
    },
    {
      id: "fadeIn",
      name: "Fade In",
      category: "basic",
      description: "Simple fade in transition",
    },
    {
      id: "glitch",
      name: "Glitch",
      category: "special",
      description: "Digital glitch effect",
    },
    {
      id: "blur",
      name: "Blur",
      category: "special",
      description: "Blurs into focus",
    },
    {
      id: "typewriter",
      name: "Typewriter",
      category: "special",
      description: "Types text character by character",
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
    { id: "special", name: "Special" },
  ];

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
                ? "bg-[#2BA6FF] text-white"
                : "bg-[#202020] text-gray-300 hover:bg-[#2BA6FF]/20"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Transition grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filteredTransitions.map((transition) => (
          <button
            key={transition.id}
            onClick={() => onSelectTransition(transition.id)}
            className={`p-3 rounded-lg border transition-colors relative ${
              selectedTransition === transition.id
                ? "border-[#2BA6FF] bg-[#2BA6FF]/20"
                : "border-gray-700 bg-[#181818] hover:border-gray-500"
            }`}
          >
            <div className="flex flex-col items-center">
              {/* Transition preview animation */}
              <div className="w-full h-14 flex items-center justify-center overflow-hidden relative">
                <div
                  className={`text-lg font-bold ${getPreviewAnimationClass(
                    transition.id
                  )}`}
                >
                  123
                </div>
              </div>
              <div className="mt-2 text-xs text-white">{transition.name}</div>
            </div>
          </button>
        ))}
      </div>

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

// Helper function to get the appropriate animation class for each transition type
function getPreviewAnimationClass(transitionId: string): string {
  const baseClasses = "text-white";

  switch (transitionId) {
    case "none":
      return `${baseClasses}`;
    case "fadeIn":
      return `${baseClasses} animate-fade-in`;
    case "glitch":
      return `${baseClasses} animate-glitch`;
    case "blur":
      return `${baseClasses} animate-blur`;
    case "typewriter":
      return `${baseClasses} animate-typewriter`;
    default:
      return baseClasses;
  }
}

export default TransitionLibrary;
