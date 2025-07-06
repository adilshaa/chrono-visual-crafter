interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: any;
}

class PersistentLogger {
  private maxLogs = 100;

  private getLogsFromStorage(): LogEntry[] {
    try {
      const logs = localStorage.getItem("app_logs");
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  private saveLogs(logs: LogEntry[]) {
    try {
      localStorage.setItem("app_logs", JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to save logs to localStorage:", error);
    }
  }

  private addLog(level: LogEntry["level"], message: string, data?: any) {
    const logs = this.getLogsFromStorage();
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    logs.push(newLog);

    // Keep only the last maxLogs entries
    if (logs.length > this.maxLogs) {
      logs.splice(0, logs.length - this.maxLogs);
    }

    this.saveLogs(logs);

    // Also log to console for immediate visibility
    const consoleMethod =
      level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || "");
  }

  info(message: string, data?: any) {
    this.addLog("info", message, data);
  }

  warn(message: string, data?: any) {
    this.addLog("warn", message, data);
  }

  error(message: string, data?: any) {
    this.addLog("error", message, data);
  }

  debug(message: string, data?: any) {
    this.addLog("debug", message, data);
  }

  getLogs(): LogEntry[] {
    return this.getLogsFromStorage();
  }

  clearLogs() {
    localStorage.removeItem("app_logs");
  }

  exportLogs(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }
}

export const logger = new PersistentLogger();
