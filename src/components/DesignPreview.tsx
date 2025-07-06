import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface DesignPreviewProps {
  selectedDesign: string;
  onDesignChange: (design: string) => void;
  designSettings?: any;
  onDesignSettingsChange?: (settings: any) => void;
}

const DesignPreview: React.FC<DesignPreviewProps> = ({
  selectedDesign,
  onDesignChange,
  designSettings = {},
  onDesignSettingsChange = () => {},
}) => {
  const designs = [
    {
      id: "classic",
      name: "Classic",
      preview: <div className="text-2xl font-bold text-white">123</div>,
    },
    {
      id: "neon",
      name: "Neon",
      customizable: true,
      preview: (
        <div
          className="text-2xl font-bold"
          style={{
            color: designSettings.neonColor || "#00FFFF",
            textShadow: `0 0 ${designSettings.neonIntensity || 10}px ${
              designSettings.neonColor || "#00FFFF"
            }, 0 0 ${(designSettings.neonIntensity || 10) * 2}px ${
              designSettings.neonColor || "#00FFFF"
            }, 0 0 ${(designSettings.neonIntensity || 10) * 3}px ${
              designSettings.neonColor || "#00FFFF"
            }`,
          }}
        >
          123
        </div>
      ),
    },
    {
      id: "glow",
      name: "Glow",
      customizable: true,
      preview: (
        <div
          className="text-2xl font-bold"
          style={{
            color: designSettings.glowColor || "#FFFFFF",
            textShadow: `0 0 ${designSettings.glowIntensity || 15}px ${
              designSettings.glowColor || "#FFFFFF"
            }, 0 0 ${(designSettings.glowIntensity || 15) * 1.5}px ${
              designSettings.glowColor || "#FFFFFF"
            }`,
          }}
        >
          123
        </div>
      ),
    },
    {
      id: "gradient",
      name: "Gradient",
      customizable: true,
      preview: (
        <div
          className="text-2xl font-bold"
          style={{
            background:
              designSettings.gradientColors ||
              "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          123
        </div>
      ),
    },
    {
      id: "fire",
      name: "Fire",
      customizable: true,
      preview: (
        <div
          className="text-2xl font-bold"
          style={{
            background:
              designSettings.fireColors ||
              "linear-gradient(45deg, #FF4444, #FF8800, #FFFF00)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            textShadow: `0 0 ${designSettings.fireGlow || 10}px #FF4444`,
          }}
        >
          123
        </div>
      ),
    },
    {
      id: "rainbow",
      name: "Rainbow",
      customizable: true,
      preview: (
        <div
          className="text-2xl font-bold"
          style={{
            background:
              designSettings.rainbowColors ||
              "linear-gradient(45deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF, #FF0088)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          123
        </div>
      ),
    },
    {
      id: "chrome",
      name: "Chrome",
      customizable: true,
      preview: (
        <div
          className="text-2xl font-bold"
          style={{
            background:
              designSettings.chromeColors ||
              "linear-gradient(45deg, #FFFFFF, #CCCCCC, #999999)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          123
        </div>
      ),
    },
  ];

  const selectedDesignObj = designs.find((d) => d.id === selectedDesign);

  return (
    <div className="space-y-4">
      <Card className="!bg-[#101010] border-gray-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base font-medium flex items-center gap-2">
            🎨 Design Styles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {designs.map((design) => (
              <button
                key={design.id}
                onClick={() => onDesignChange(design.id)}
                className={`
                  p-4 rounded-lg border transition-all duration-200 hover:scale-105
                  ${
                    selectedDesign === design.id
                      ? "border-gray-600 bg-[#181818]/60"
                      : " border-gray-700/50 bg-[#101010] hover:border-gray-500"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className=" rounded p-2 min-h-[50px] flex items-center justify-center w-full">
                    {design.preview}
                  </div>
                  <span className="text-white text-sm font-medium">
                    {design.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customization Controls */}
      {selectedDesignObj?.customizable && (
        <Card className="!bg-[#101010] border-gray-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base font-medium">
              🎛️ Customize {selectedDesignObj.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDesign === "neon" && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="neon-color"
                    className="text-white flex items-center justify-between"
                  >
                    <span>Neon Color</span>
                    <span className="text-xs text-gray-400">
                      Click to select
                    </span>
                  </Label>
                  <div className="flex flex-col gap-3">
                    {/* Color presets */}
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        "#00FFFF",
                        "#FF00FF",
                        "#00FF00",
                        "#FFFF00",
                        "#FF3300",
                      ].map((color) => (
                        <button
                          key={color}
                          onClick={() =>
                            onDesignSettingsChange({
                              ...designSettings,
                              neonColor: color,
                            })
                          }
                          className={`w-full h-8 rounded-md border-2 ${
                            (designSettings.neonColor || "#00FFFF") === color
                              ? "border-white scale-110"
                              : "border-transparent"
                          } transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select ${color} color`}
                          type="button"
                        />
                      ))}
                    </div>

                  <div className="flex gap-2">
                      <div className="relative">
                    <Input
                          id="neon-color"
                      type="color"
                      value={designSettings.neonColor || "#00FFFF"}
                      onChange={(e) =>
                        onDesignSettingsChange({
                          ...designSettings,
                              neonColor: e.target.value,
                        })
                      }
                          className="w-12 h-10 p-1 bg-[#181818] border-gray-600 cursor-pointer"
                          aria-label="Choose neon color"
                    />
                        <span className="sr-only">Choose a custom color</span>
                      </div>
                    <Input
                      value={designSettings.neonColor || "#00FFFF"}
                      onChange={(e) =>
                        onDesignSettingsChange({
                          ...designSettings,
                            neonColor: e.target.value,
                        })
                      }
                      className="bg-[#181818] border-gray-600 text-white"
                        aria-label="Color hex value"
                        placeholder="Hex color value"
                    />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="neon-intensity"
                    className="text-white flex items-center justify-between"
                  >
                    <span>Intensity</span>
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                      {designSettings.neonIntensity || 10}px
                    </span>
                  </Label>
                  <Slider
                    id="neon-intensity"
                    value={[designSettings.neonIntensity || 10]}
                    onValueChange={([intensity]) =>
                      onDesignSettingsChange({
                        ...designSettings,
                        neonIntensity: intensity,
                      })
                    }
                    min={5}
                    max={50}
                    step={1}
                    className="w-full"
                    aria-label="Adjust neon intensity"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtle</span>
                    <span>Intense</span>
                  </div>
                </div>
              </>
            )}

            {selectedDesign === "glow" && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="glow-color"
                    className="text-white flex items-center justify-between"
                  >
                    <span>Glow Color</span>
                    <span className="text-xs text-gray-400">
                      Click to select
                    </span>
                  </Label>
                  <div className="flex flex-col gap-3">
                    {/* Color presets */}
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        "#FFFFFF",
                        "#FFC0CB",
                        "#87CEEB",
                        "#90EE90",
                        "#FFFACD",
                      ].map((color) => (
                        <button
                          key={color}
                          onClick={() =>
                            onDesignSettingsChange({
                              ...designSettings,
                              glowColor: color,
                            })
                          }
                          className={`w-full h-8 rounded-md border-2 ${
                            (designSettings.glowColor || "#FFFFFF") === color
                              ? "border-white scale-110"
                              : "border-transparent"
                          } transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select ${color} color`}
                          type="button"
                        />
                      ))}
                    </div>

                  <div className="flex gap-2">
                      <div className="relative">
                    <Input
                          id="glow-color"
                      type="color"
                      value={designSettings.glowColor || "#FFFFFF"}
                      onChange={(e) =>
                        onDesignSettingsChange({
                          ...designSettings,
                              glowColor: e.target.value,
                        })
                      }
                          className="w-12 h-10 p-1 bg-[#181818] border-gray-600 cursor-pointer"
                          aria-label="Choose glow color"
                    />
                        <span className="sr-only">Choose a custom color</span>
                      </div>
                    <Input
                      value={designSettings.glowColor || "#FFFFFF"}
                      onChange={(e) =>
                        onDesignSettingsChange({
                          ...designSettings,
                            glowColor: e.target.value,
                        })
                      }
                      className="bg-[#181818] border-gray-600 text-white"
                        aria-label="Color hex value"
                        placeholder="Hex color value"
                    />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="glow-intensity"
                    className="text-white flex items-center justify-between"
                  >
                    <span>Intensity</span>
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                      {designSettings.glowIntensity || 15}px
                    </span>
                  </Label>
                  <Slider
                    id="glow-intensity"
                    value={[designSettings.glowIntensity || 15]}
                    onValueChange={([intensity]) =>
                      onDesignSettingsChange({
                        ...designSettings,
                        glowIntensity: intensity,
                      })
                    }
                    min={5}
                    max={50}
                    step={1}
                    className="w-full"
                    aria-label="Adjust glow intensity"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtle</span>
                    <span>Intense</span>
                  </div>
                </div>
              </>
            )}

            {(selectedDesign === "gradient" ||
              selectedDesign === "fire" ||
              selectedDesign === "rainbow" ||
              selectedDesign === "chrome") && (
              <>
              <div className="space-y-2">
                  <Label
                    htmlFor={`${selectedDesign}-gradient`}
                    className="text-white flex items-center justify-between"
                  >
                    <span>Color Gradient</span>
                    <span className="text-xs text-gray-400">
                      Select preset or customize
                    </span>
                  </Label>

                  {/* Gradient presets */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {selectedDesign === "gradient" &&
                      [
                        {
                          name: "Ocean",
                          value: "linear-gradient(45deg, #2193b0, #6dd5ed)",
                        },
                        {
                          name: "Sunset",
                          value:
                            "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)",
                        },
                        {
                          name: "Forest",
                          value: "linear-gradient(45deg, #134E5E, #71B280)",
                        },
                        {
                          name: "Berry",
                          value: "linear-gradient(45deg, #8E2DE2, #4A00E0)",
                        },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() =>
                            onDesignSettingsChange({
                              ...designSettings,
                              gradientColors: preset.value,
                            })
                          }
                          className="flex flex-col items-center p-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-white hover:border-gray-600"
                          aria-label={`Use ${preset.name} gradient preset`}
                          type="button"
                        >
                          <div
                            className="w-full h-6 rounded-sm mb-1"
                            style={{ background: preset.value }}
                            aria-hidden="true"
                          />
                          <span className="text-xs text-white">
                            {preset.name}
                          </span>
                        </button>
                      ))}

                    {selectedDesign === "fire" &&
                      [
                        {
                          name: "Classic Fire",
                          value:
                            "linear-gradient(45deg, #FF4444, #FF8800, #FFFF00)",
                        },
                        {
                          name: "Blue Flame",
                          value: "linear-gradient(45deg, #00C6FF, #0072FF)",
                        },
                        {
                          name: "Green Fire",
                          value:
                            "linear-gradient(45deg, #00FF9D, #00FFD1, #AEFFC8)",
                        },
                        {
                          name: "Purple Blaze",
                          value:
                            "linear-gradient(45deg, #8A2387, #E94057, #F27121)",
                        },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() =>
                            onDesignSettingsChange({
                              ...designSettings,
                              fireColors: preset.value,
                            })
                          }
                          className="flex flex-col items-center p-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-white hover:border-gray-600"
                          aria-label={`Use ${preset.name} gradient preset`}
                          type="button"
                        >
                          <div
                            className="w-full h-6 rounded-sm mb-1"
                            style={{ background: preset.value }}
                            aria-hidden="true"
                          />
                          <span className="text-xs text-white">
                            {preset.name}
                          </span>
                        </button>
                      ))}

                    {selectedDesign === "rainbow" &&
                      [
                        {
                          name: "Classic Rainbow",
                          value:
                            "linear-gradient(45deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF, #FF0088)",
                        },
                        {
                          name: "Pastel",
                          value:
                            "linear-gradient(45deg, #ffadad, #ffd6a5, #fdffb6, #caffbf, #9bf6ff, #a0c4ff, #bdb2ff, #ffc6ff)",
                        },
                        {
                          name: "Bright",
                          value:
                            "linear-gradient(45deg, #f94144, #f3722c, #f8961e, #f9c74f, #90be6d, #43aa8b, #577590)",
                        },
                        {
                          name: "Neon",
                          value:
                            "linear-gradient(45deg, #ff00c1, #9600ff, #4900ff, #00b8ff, #00fff9)",
                        },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() =>
                            onDesignSettingsChange({
                              ...designSettings,
                              rainbowColors: preset.value,
                            })
                          }
                          className="flex flex-col items-center p-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-white hover:border-gray-600"
                          aria-label={`Use ${preset.name} gradient preset`}
                          type="button"
                        >
                          <div
                            className="w-full h-6 rounded-sm mb-1"
                            style={{ background: preset.value }}
                            aria-hidden="true"
                          />
                          <span className="text-xs text-white">
                            {preset.name}
                          </span>
                        </button>
                      ))}

                    {selectedDesign === "chrome" &&
                      [
                        {
                          name: "Silver",
                          value:
                            "linear-gradient(45deg, #FFFFFF, #CCCCCC, #999999)",
                        },
                        {
                          name: "Gold",
                          value:
                            "linear-gradient(45deg, #FFD700, #FFC000, #FFDB58)",
                        },
                        {
                          name: "Bronze",
                          value:
                            "linear-gradient(45deg, #CD7F32, #A46628, #B87333)",
                        },
                        {
                          name: "Platinum",
                          value:
                            "linear-gradient(45deg, #E5E4E2, #B9B9B8, #CECECE)",
                        },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() =>
                            onDesignSettingsChange({
                              ...designSettings,
                              chromeColors: preset.value,
                            })
                          }
                          className="flex flex-col items-center p-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-white hover:border-gray-600"
                          aria-label={`Use ${preset.name} gradient preset`}
                          type="button"
                        >
                          <div
                            className="w-full h-6 rounded-sm mb-1"
                            style={{ background: preset.value }}
                            aria-hidden="true"
                          />
                          <span className="text-xs text-white">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                  </div>

                  <div className="bg-[#111] rounded-md p-3 border border-gray-800">
                    <Label
                      htmlFor={`${selectedDesign}-custom-gradient`}
                      className="text-xs text-gray-400 mb-2 block"
                    >
                      Advanced: Custom CSS Gradient
                    </Label>
                <Input
                      id={`${selectedDesign}-custom-gradient`}
                  value={
                        selectedDesign === "gradient"
                          ? designSettings.gradientColors ||
                            "linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7)"
                          : selectedDesign === "fire"
                          ? designSettings.fireColors ||
                            "linear-gradient(45deg, #FF4444, #FF8800, #FFFF00)"
                          : selectedDesign === "rainbow"
                          ? designSettings.rainbowColors ||
                            "linear-gradient(45deg, #FF0000, #FF8800, #FFFF00, #00FF00, #0088FF, #8800FF, #FF0088)"
                          : designSettings.chromeColors ||
                            "linear-gradient(45deg, #FFFFFF, #CCCCCC, #999999)"
                  }
                  onChange={(e) => {
                        const key =
                          selectedDesign === "gradient"
                            ? "gradientColors"
                            : selectedDesign === "fire"
                            ? "fireColors"
                            : selectedDesign === "rainbow"
                            ? "rainbowColors"
                            : "chromeColors";
                    onDesignSettingsChange({
                      ...designSettings,
                          [key]: e.target.value,
                    });
                  }}
                  placeholder="linear-gradient(...)"
                  className="bg-[#181818] border-gray-600 text-white text-xs"
                      aria-label="Custom gradient CSS value"
                />
                    <p className="text-xs text-gray-500 mt-2">
                      Format: linear-gradient(angle, color1, color2, ...)
                    </p>
                  </div>
              </div>
              </>
            )}

            {selectedDesign === "fire" && (
              <div className="space-y-2">
                <Label
                  htmlFor="fire-glow"
                  className="text-white flex items-center justify-between"
                >
                  <span>Fire Glow</span>
                  <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                    {designSettings.fireGlow || 10}px
                  </span>
                </Label>
                <Slider
                  id="fire-glow"
                  value={[designSettings.fireGlow || 10]}
                  onValueChange={([glow]) =>
                    onDesignSettingsChange({
                      ...designSettings,
                      fireGlow: glow,
                    })
                  }
                  min={0}
                  max={30}
                  step={1}
                  className="w-full"
                  aria-label="Adjust fire glow intensity"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>No Glow</span>
                  <span>Maximum Glow</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Effect Preview */}
      <Card className="!bg-[#101010] border-gray-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base font-medium">
            Preview: {selectedDesignObj?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="!bg-[#181818]/60 rounded-lg p-6 flex items-center justify-center min-h-[100px]">
            <div className="scale-150">{selectedDesignObj?.preview}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignPreview;
