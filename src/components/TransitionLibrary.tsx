import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface TransitionLibraryProps {
  selectedTransition: string;
  onSelectTransition: (transition: string) => void;
}

const TransitionLibrary: React.FC<TransitionLibraryProps> = ({
  selectedTransition,
  onSelectTransition,
}) => {
  // Category state for filtering transitions
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Define all transitions with their categories
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
      id: "slideUp",
      name: "Slide Up",
      category: "motion",
      description: "Slides from bottom to top",
    },
    {
      id: "slideDown",
      name: "Slide Down",
      category: "motion",
      description: "Slides from top to bottom",
    },
    {
      id: "slideLeft",
      name: "Slide Left",
      category: "motion",
      description: "Slides from right to left",
    },
    {
      id: "slideRight",
      name: "Slide Right",
      category: "motion",
      description: "Slides from left to right",
    },
    {
      id: "cascade",
      name: "Cascade",
      category: "dynamic",
      description: "Numbers flow through each other",
    },
    {
      id: "scale",
      name: "Scale",
      category: "transform",
      description: "Grows from small to large",
    },
    {
      id: "rotate",
      name: "Rotate",
      category: "transform",
      description: "Rotates into position",
    },
    {
      id: "bounce",
      name: "Bounce",
      category: "dynamic",
      description: "Bouncy animation effect",
    },
    {
      id: "elastic",
      name: "Elastic",
      category: "dynamic",
      description: "Elastic spring-like motion",
    },
    {
      id: "wave",
      name: "Wave",
      category: "dynamic",
      description: "Wave-like side to side motion",
    },
    {
      id: "spiral",
      name: "Spiral",
      category: "special",
      description: "Spirals into position",
    },
    {
      id: "zoom",
      name: "Zoom",
      category: "transform",
      description: "Zooms from small to large",
    },
    {
      id: "flip",
      name: "Flip",
      category: "transform",
      description: "Flips vertically into view",
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

  // Define transition categories
  const categories = [
    { id: "all", name: "All Transitions" },
    { id: "basic", name: "Basic" },
    { id: "motion", name: "Motion" },
    { id: "transform", name: "Transform" },
    { id: "dynamic", name: "Dynamic" },
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
    case "slideUp":
      return `${baseClasses} animate-slide-up`;
    case "slideDown":
      return `${baseClasses} animate-slide-down`;
    case "slideLeft":
      return `${baseClasses} animate-slide-left`;
    case "slideRight":
      return `${baseClasses} animate-slide-right`;
    case "cascade":
      return `${baseClasses} animate-cascade`;
    case "scale":
      return `${baseClasses} animate-scale`;
    case "rotate":
      return `${baseClasses} animate-rotate`;
    case "bounce":
      return `${baseClasses} animate-bounce`;
    case "elastic":
      return `${baseClasses} animate-elastic`;
    case "wave":
      return `${baseClasses} animate-wave`;
    case "spiral":
      return `${baseClasses} animate-spiral`;
    case "zoom":
      return `${baseClasses} animate-zoom`;
    case "flip":
      return `${baseClasses} animate-flip`;
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
