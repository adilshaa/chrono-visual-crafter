/**
 * Debug panel for testing session management features
 * This component can be used during development to test session persistence and synchronization
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSessionManager } from "@/hooks/useSessionManager";
import { logger } from "@/lib/logger";

interface SessionDebugPanelProps {
  className?: string;
}

export const SessionDebugPanel: React.FC<SessionDebugPanelProps> = ({
  className = "",
}) => {
  const [debugResults, setDebugResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const {
    session,
    isSessionValid,
    refreshSession,
    recoverSession,
    debugSession,
    healthCheck,
    validateForDatabaseCall,
    checkSync,
    forceSync,
  } = useSessionManager();

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(true);
    try {
      logger.info(`Running test: ${testName}`);
      const result = await testFn();
      setDebugResults({ testName, result, success: true });
      logger.info(`Test completed: ${testName}`, result);
    } catch (error) {
      logger.error(`Test failed: ${testName}`, { error });
      setDebugResults({ testName, error: error.message, success: false });
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: "Debug Session",
      fn: debugSession,
    },
    {
      name: "Health Check",
      fn: healthCheck,
    },
    {
      name: "Validate for Database",
      fn: validateForDatabaseCall,
    },
    {
      name: "Check Synchronization",
      fn: checkSync,
    },
    {
      name: "Force Sync",
      fn: forceSync,
    },
    {
      name: "Refresh Session",
      fn: refreshSession,
    },
    {
      name: "Recover Session",
      fn: recoverSession,
    },
  ];

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Session Debug Panel</h3>

      {/* Session Status */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Current Session Status</h4>
        <div className="space-y-1 text-sm">
          <div>Session Exists: {session ? "✅ Yes" : "❌ No"}</div>
          <div>Session Valid: {isSessionValid() ? "✅ Yes" : "❌ No"}</div>
          <div>User ID: {session?.user?.id || "N/A"}</div>
          <div>
            Expires At:{" "}
            {session?.expires_at
              ? new Date(session.expires_at * 1000).toLocaleString()
              : "N/A"}
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Session Tests</h4>
        <div className="grid grid-cols-2 gap-2">
          {tests.map((test) => (
            <Button
              key={test.name}
              variant="outline"
              size="sm"
              onClick={() => runTest(test.name, test.fn)}
              disabled={loading}
            >
              {test.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      {debugResults && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">
            Last Test: {debugResults.testName}
            {debugResults.success ? " ✅" : " ❌"}
          </h4>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(debugResults.result || debugResults.error, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-600">
        <p>
          <strong>Instructions:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Use "Debug Session" to see current session info</li>
          <li>Use "Health Check" for comprehensive session validation</li>
          <li>Use "Check Synchronization" to test cross-tab sync</li>
          <li>Use "Force Sync" to manually synchronize session</li>
          <li>Use "Recover Session" if session issues occur</li>
        </ul>
      </div>
    </Card>
  );
};
