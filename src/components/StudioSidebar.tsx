import React, { useState } from "react";
import {
  X,
  Type,
  Hash,
  Palette,
  ChevronRight,
  ChevronLeft,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import ControlPanel from "./ControlPanel";
import DesignPreview from "./DesignPreview";
import TextControls from "./TextControls";

interface StudioSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  counterSettings: any;
  onCounterSettingsChange: (settings: any) => void;
  textSettings: any;
  onTextSettingsChange: (settings: any) => void;
  designSettings?: any;
  onDesignSettingsChange?: (settings: any) => void;
}

const StudioSidebar: React.FC<StudioSidebarProps> = ({
  isOpen,
  onToggle,
  counterSettings,
  onCounterSettingsChange,
  textSettings,
  onTextSettingsChange,
  designSettings = {},
  onDesignSettingsChange = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("counter");

  // Handle keyboard navigation for sidebar toggle
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      if (isOpen) onToggle();
    }
  };

  return (
    <>
      {/* Backdrop - improved with aria labels */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
          aria-label="Close sidebar"
          role="button"
          tabIndex={-1}
        />
      )}

      {/* Sidebar - improved with ARIA role, tab index and keyboard support */}
      <div
        className={`
        fixed left-0 top-0 h-full w-80 bg-[#171717] border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:z-auto
        ${!isOpen && "lg:w-0 lg:border-r-0"}
      `}
        role="region"
        aria-label="Studio Controls Sidebar"
        onKeyDown={handleKeyDown}
        tabIndex={isOpen ? 0 : -1}
      >
        <div className="flex flex-col h-full">
          {/* Header with improved accessibility */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
            <h2 className="text-white font-semibold px-3 py-1 rounded border border-gray-700/50 flex items-center">
              <Settings className="w-4 h-4 mr-2" aria-hidden="true" />
              Studio Controls
            </h2>

            {/* Close button - larger target, visible focus, accessible */}
            <Button
              onClick={onToggle}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[#101010] hover:bg-[#2BA6FF]/20 focus:ring-2 focus:ring-[#2BA6FF] border border-gray-700/50"
              size="sm"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Tabs - improved with accessible labels but reverted alignment */}
          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <TabsList
                className="grid grid-cols-3 gap-x-2 m-4 bg-[#101010] border border-gray-700/50"
                aria-label="Editor Sections"
              >
                <TabsTrigger
                  value="counter"
                  className="flex items-center gap-1 text-xs border data-[state=active]:border-[#2BA6FF] border-transparent data-[state=active]:bg-[#2BA6FF]/20 data-[state=active]:text-[#2BA6FF] focus:ring-2 focus:ring-[#2BA6FF]/50"
                  aria-label="Counter settings tab"
                >
                  <Hash className="w-3 h-3" aria-hidden="true" />
                  Counter
                </TabsTrigger>
                <TabsTrigger
                  value="text"
                  className="flex items-center gap-1 text-xs border data-[state=active]:border-[#2BA6FF] border-transparent data-[state=active]:bg-[#2BA6FF]/20 data-[state=active]:text-[#2BA6FF] focus:ring-2 focus:ring-[#2BA6FF]/50"
                  aria-label="Text settings tab"
                >
                  <Type className="w-3 h-3" aria-hidden="true" />
                  Text
                </TabsTrigger>
                <TabsTrigger
                  value="design"
                  className="flex items-center gap-1 text-xs border data-[state=active]:border-[#2BA6FF] border-transparent data-[state=active]:bg-[#2BA6FF]/20 data-[state=active]:text-[#2BA6FF] focus:ring-2 focus:ring-[#2BA6FF]/50"
                  aria-label="Design settings tab"
                >
                  <Palette className="w-3 h-3" aria-hidden="true" />
                  Design
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden px-4 pb-4">
                <ScrollArea className="h-full custom-scrollbar">
                  <TabsContent
                    value="counter"
                    className="mt-0"
                    role="tabpanel"
                    aria-label="Counter settings"
                  >
                    <ControlPanel
                      settings={counterSettings}
                      onSettingsChange={onCounterSettingsChange}
                    />
                  </TabsContent>

                  <TabsContent
                    value="text"
                    className="mt-0"
                    role="tabpanel"
                    aria-label="Text settings"
                  >
                    <TextControls
                      settings={textSettings}
                      onSettingsChange={onTextSettingsChange}
                    />
                  </TabsContent>

                  <TabsContent
                    value="design"
                    className="mt-0"
                    role="tabpanel"
                    aria-label="Design settings"
                  >
                    <DesignPreview
                      selectedDesign={counterSettings.design}
                      onDesignChange={(design) =>
                        onCounterSettingsChange({ ...counterSettings, design })
                      }
                      designSettings={designSettings}
                      onDesignSettingsChange={onDesignSettingsChange}
                    />
                  </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Toggle Button (when sidebar is closed) - enhanced for accessibility */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          className="fixed left-4 top-20 z-30 bg-[#171717] hover:bg-[#2BA6FF]/20 border border-[#2BA6FF]/30 text-white p-3 h-auto focus:ring-2 focus:ring-[#2BA6FF]"
          size="default"
          aria-label="Open studio controls sidebar"
        >
          <ChevronRight className="w-5 h-5 mr-1" aria-hidden="true" />
          <span className="text-sm">Studio Controls</span>
        </Button>
      )}

      {/* Keyboard shortcut help - screen reader only */}
      <div className="sr-only">
        Press Escape to close the sidebar. Use Tab to navigate between controls.
      </div>
    </>
  );
};

export default StudioSidebar;
