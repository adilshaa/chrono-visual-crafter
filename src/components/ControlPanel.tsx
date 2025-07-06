import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TransitionLibrary from "./TransitionLibrary";
import { FastForward, Play, Rewind } from "lucide-react";

interface ControlPanelProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
}) => {
  // Helper function to get the speed descriptor
  const getSpeedDescription = (speed: number) => {
    if (speed <= 0.5) return "Slow";
    if (speed <= 1) return "Normal";
    if (speed <= 2) return "Fast";
    return "Very Fast";
  };

  return (
    <div className="space-y-4">
      {/* Animation Speed Control - Moved to top for better accessibility */}
      <Card className="!bg-[#101010] border-gray-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base font-medium flex items-center gap-2">
            ⏱️ Animation Speed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-[#151515] rounded-lg p-3 border border-gray-800/50">
              <div className="flex items-center gap-3 mb-3">
                <Rewind className="w-4 h-4 text-gray-400" />
                <Slider
                  id="animation-speed"
                  value={[settings.speed]}
                  onValueChange={([speed]) =>
                    onSettingsChange({ ...settings, speed })
                  }
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="flex-1"
                  aria-label="Animation speed"
                />
                <FastForward className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex justify-between">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400">Speed</span>
                  <span className="text-lg font-bold text-white">
                    {settings.speed.toFixed(1)}x
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400">Description</span>
                  <span className="text-sm text-white">
                    {getSpeedDescription(settings.speed)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-400">Duration</span>
                  <span className="text-sm text-white">
                    {(settings.duration / settings.speed).toFixed(1)}s
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Higher speeds may affect rendering quality during preview
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Counter Settings */}
      <Card className="!bg-[#101010] border-gray-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base font-medium">
            🧮 Counter Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Start Value</Label>
              <Input
                type="number"
                value={settings.startValue}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    startValue: parseInt(e.target.value) || 0,
                  })
                }
                className="bg-[#181818] border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">End Value</Label>
              <Input
                type="number"
                value={settings.endValue}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    endValue: parseInt(e.target.value) || 100,
                  })
                }
                className="bg-[#181818] border-gray-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-white">Duration</Label>
              <span className="text-sm text-white">
                {settings.duration} seconds
              </span>
            </div>
            <Slider
              value={[settings.duration]}
              onValueChange={([duration]) =>
                onSettingsChange({ ...settings, duration })
              }
              min={1}
              max={30}
              step={0.5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Font Family</Label>
            <Select
              value={settings.fontFamily}
              onValueChange={(fontFamily) =>
                onSettingsChange({ ...settings, fontFamily })
              }
            >
              <SelectTrigger className="bg-[#181818] border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orbitron">Orbitron</SelectItem>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="montserrat">Montserrat</SelectItem>
                <SelectItem value="arial">Arial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-white">Font Size</Label>
              <span className="text-sm text-white">{settings.fontSize}px</span>
            </div>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([fontSize]) =>
                onSettingsChange({ ...settings, fontSize })
              }
              min={40}
              max={300}
              step={5}
              className="w-full"
            />
          </div>

          {/* Transition Library */}
          <Card className="!bg-[#151515] border-gray-700/30 p-3">
            <TransitionLibrary
              selectedTransition={settings.transition}
              onSelectTransition={(transition) =>
                onSettingsChange({ ...settings, transition })
              }
            />
          </Card>

          <div className="space-y-2">
            <Label className="text-white">Number Format</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Prefix</Label>
                <Input
                  value={settings.prefix || ""}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, prefix: e.target.value })
                  }
                  placeholder="$, #, etc."
                  className="bg-[#181818] border-gray-600 text-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-400">Suffix</Label>
                <Input
                  value={settings.suffix || ""}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, suffix: e.target.value })
                  }
                  placeholder="%, K, M, etc."
                  className="bg-[#181818] border-gray-600 text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Number Separator</Label>
            <Select
              value={settings.separator || "none"}
              onValueChange={(separator) =>
                onSettingsChange({ ...settings, separator })
              }
            >
              <SelectTrigger className="bg-[#181818] border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (1234567)</SelectItem>
                <SelectItem value="comma">Comma (1,234,567)</SelectItem>
                <SelectItem value="dot">Dot (1.234.567)</SelectItem>
                <SelectItem value="space">Space (1 234 567)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Background</Label>
            <Select
              value={settings.background}
              onValueChange={(background) =>
                onSettingsChange({ ...settings, background })
              }
            >
              <SelectTrigger className="bg-[#181818] border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="black">Black</SelectItem>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="transparent">Transparent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ControlPanel;
