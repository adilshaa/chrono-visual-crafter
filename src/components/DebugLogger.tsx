import React, { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: any;
}

const DebugLogger: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  console.log("DebugLogger component mounted");

  const refreshLogs = () => {
    const storedLogs = localStorage.getItem("app_logs");
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch {
        setLogs([]);
      }
    }
  };

  useEffect(() => {
    console.log("DebugLogger useEffect running");
    logger.info("DebugLogger component initialized");
    refreshLogs();
    // Refresh logs every 2 seconds
    const interval = setInterval(refreshLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  const clearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const exportLogs = () => {
    const logData = logger.exportLogs();
    const blob = new Blob([logData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `app-logs-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-500";
      case "warn":
        return "bg-yellow-500";
      case "info":
        return "bg-blue-500";
      case "debug":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 9999,
          backgroundColor: "white",
          border: "2px solid #3b82f6",
          color: "#2563eb",
        }}
      >
        Debug Logs ({logs.length})
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-96 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm">Debug Logs</CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={exportLogs}>
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={clearLogs}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsVisible(false)}
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="h-80 overflow-y-auto space-y-1">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No logs yet</p>
          ) : (
            logs
              .slice()
              .reverse()
              .map((log, index) => (
                <div
                  key={index}
                  className="text-xs border-b border-gray-200 pb-1"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${getLevelColor(
                        log.level
                      )} text-white text-xs`}
                    >
                      {log.level}
                    </Badge>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-1 font-mono">{log.message}</div>
                  {log.data && (
                    <div className="mt-1 text-gray-600">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugLogger;
