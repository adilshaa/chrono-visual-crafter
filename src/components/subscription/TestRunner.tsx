import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { runSubscriptionTests } from "@/utils/testHelpers";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FileText,
  AlertTriangle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

interface TestSummary {
  passed: number;
  failed: number;
  results: TestResult[];
}

export const TestRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestSummary | null>(null);
  const [progress, setProgress] = useState(0);

  const handleRunTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const testResults = await runSubscriptionTests();
      
      clearInterval(progressInterval);
      setProgress(100);
      setResults(testResults);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (passed: boolean) => {
    return (
      <Badge 
        className={`${
          passed 
            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border-red-500/30'
        }`}
      >
        {passed ? 'PASS' : 'FAIL'}
      </Badge>
    );
  };

  return (
    <Card className="bg-white/[0.03] border border-white/[0.08]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Subscription System Tests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleRunTests}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>

          {results && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">
                {results.passed}/{results.passed + results.failed} passed
              </span>
              <Badge 
                className={`${
                  results.failed === 0
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {results.failed === 0 ? 'ALL PASS' : `${results.failed} FAILED`}
              </Badge>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Running tests...</span>
                <span className="text-white/60">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="bg-white/[0.05] rounded-lg p-4 border border-white/[0.08]">
                <h3 className="text-white font-medium mb-2">Test Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {results.passed}
                    </div>
                    <div className="text-xs text-white/60">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {results.failed}
                    </div>
                    <div className="text-xs text-white/60">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {((results.passed / (results.passed + results.failed)) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-white/60">Pass Rate</div>
                  </div>
                </div>
              </div>

              {/* Individual Test Results */}
              <div className="space-y-2">
                <h3 className="text-white font-medium">Test Results</h3>
                {results.results.map((result, index) => (
                  <motion.div
                    key={result.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.08] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.passed)}
                      <span className="text-white text-sm">{result.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.error && (
                        <div className="group relative">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <div className="absolute right-0 top-6 w-64 p-2 bg-black border border-white/20 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            {result.error}
                          </div>
                        </div>
                      )}
                      {getStatusBadge(result.passed)}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Failed Tests Details */}
              {results.failed > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-red-200 font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Failed Tests
                  </h3>
                  <div className="space-y-2">
                    {results.results
                      .filter(result => !result.passed)
                      .map(result => (
                        <div key={result.name} className="text-sm">
                          <div className="text-red-200 font-medium">{result.name}</div>
                          {result.error && (
                            <div className="text-red-200/60 text-xs mt-1">
                              Error: {result.error}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test Categories */}
        <div className="bg-white/[0.05] rounded-lg p-4 border border-white/[0.08]">
          <h3 className="text-white font-medium mb-3">Test Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="text-white/80">• Paddle SDK Integration</div>
              <div className="text-white/80">• Webhook Validation</div>
              <div className="text-white/80">• Error Handling</div>
              <div className="text-white/80">• Network Failure Simulation</div>
            </div>
            <div className="space-y-1">
              <div className="text-white/80">• Video Export Alpha Channel</div>
              <div className="text-white/80">• Concurrent Request Prevention</div>
              <div className="text-white/80">• Email Delivery</div>
              <div className="text-white/80">• Status Transitions</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};