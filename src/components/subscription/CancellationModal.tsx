import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CancellationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: {
    id: string;
    plan_name: string;
    current_period_end: string;
    status: string;
  } | null;
  onCancellationComplete: () => void;
}

type CancellationState = 'idle' | 'confirming' | 'processing' | 'success' | 'error';

const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_using', label: 'Not using the service' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'poor_support', label: 'Poor customer support' },
  { value: 'technical_issues', label: 'Technical issues' },
  { value: 'switching_competitor', label: 'Switching to competitor' },
  { value: 'temporary_pause', label: 'Temporary pause' },
  { value: 'other', label: 'Other' },
];

export const CancellationModal: React.FC<CancellationModalProps> = ({
  open,
  onOpenChange,
  subscription,
  onCancellationComplete,
}) => {
  const [state, setState] = useState<CancellationState>('idle');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const maxRetries = 3;
  const timeoutDuration = 30000; // 30 seconds

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setState('idle');
      setReason('');
      setCustomReason('');
      setFeedback('');
      setConfirmText('');
      setRetryCount(0);
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  }, [open, timeoutId]);

  const calculateGracePeriodEnd = () => {
    if (!subscription?.current_period_end) return null;
    return new Date(subscription.current_period_end);
  };

  const handleCancel = async () => {
    if (!subscription) return;

    // Validation
    if (!reason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for cancellation.",
        variant: "destructive",
      });
      return;
    }

    if (reason === 'other' && !customReason.trim()) {
      toast({
        title: "Custom Reason Required",
        description: "Please provide a custom reason for cancellation.",
        variant: "destructive",
      });
      return;
    }

    if (confirmText.toLowerCase() !== 'cancel my subscription') {
      toast({
        title: "Confirmation Required",
        description: "Please type 'cancel my subscription' to confirm.",
        variant: "destructive",
      });
      return;
    }

    setState('processing');

    // Set timeout for API call
    const timeout = setTimeout(() => {
      setState('error');
      toast({
        title: "Request Timeout",
        description: "The cancellation request timed out. Please try again.",
        variant: "destructive",
      });
    }, timeoutDuration);

    setTimeoutId(timeout);

    try {
      await performCancellation();
    } catch (error) {
      console.error('Cancellation error:', error);
      handleCancellationError(error);
    } finally {
      clearTimeout(timeout);
      setTimeoutId(null);
    }
  };

  const performCancellation = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.Paddle) {
        reject(new Error('Paddle SDK not loaded'));
        return;
      }

      // Check which Paddle API method is available
      if (window.Paddle.Subscription && typeof window.Paddle.Subscription.cancel === 'function') {
        // Use the modern Paddle API
        window.Paddle.Subscription.cancel({
          subscriptionId: subscription!.id,
          effectiveFrom: 'next_billing_period',
          customData: {
            cancelReason: reason === 'other' ? customReason : reason,
            feedback: feedback,
            timestamp: new Date().toISOString(),
          },
          eventCallback: (data: any) => {
            console.log('Paddle cancellation event:', data);

            if (data.name === 'subscription.cancel.completed' || data.name === 'cancel.complete') {
              setState('success');
              toast({
                title: "Subscription Cancelled",
                description: "Your subscription has been cancelled successfully.",
              });
              
              // Notify parent component
              setTimeout(() => {
                onCancellationComplete();
                onOpenChange(false);
              }, 2000);
              
              resolve();
            } else if (data.name === 'subscription.cancel.error' || data.name === 'cancel.error') {
              reject(new Error(data.error?.message || 'Cancellation failed'));
            }
          }
        });
      }
      
      // Fallback: Try the legacy cancelPreview method
      else if (window.Paddle.Subscription && typeof window.Paddle.Subscription.cancelPreview === 'function') {
        window.Paddle.Subscription.cancelPreview({
          subscriptionId: subscription!.id,
          effectiveFrom: 'next_billing_period',
          eventCallback: (data: any) => {
            console.log('Paddle cancelPreview event:', data);

            if (data.name === 'cancel.complete') {
              setState('success');
              toast({
                title: "Subscription Cancelled",
                description: "Your subscription has been cancelled successfully.",
              });
              
              // Notify parent component
              setTimeout(() => {
                onCancellationComplete();
                onOpenChange(false);
              }, 2000);
              
              resolve();
            } else if (data.name === 'cancel.error') {
              reject(new Error(data.error?.message || 'Cancellation failed'));
            }
          }
        });
      }
      
      // If no client-side method is available, use server-side approach
      else {
        console.warn("No Paddle client-side cancellation methods available");
        reject(new Error('Paddle cancellation methods not available. Please contact support.'));
      }
    });
  };

  const handleCancellationError = async (error: any) => {
    console.error('Cancellation failed:', error);
    
    if (retryCount < maxRetries) {
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      
      toast({
        title: "Retrying...",
        description: `Attempt ${retryCount + 1} of ${maxRetries}. Retrying in ${delay / 1000} seconds.`,
      });

      setTimeout(async () => {
        setRetryCount(prev => prev + 1);
        try {
          await performCancellation();
        } catch (retryError) {
          handleCancellationError(retryError);
        }
      }, delay);
    } else {
      setState('error');
      toast({
        title: "Cancellation Failed",
        description: "Unable to cancel subscription after multiple attempts. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const gracePeriodEnd = calculateGracePeriodEnd();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription className="text-white/60">
            We're sorry to see you go. Please help us understand why you're cancelling.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Subscription Details */}
              <div className="bg-white/[0.05] rounded-lg p-4 border border-white/[0.08]">
                <h3 className="text-white font-medium mb-2">Subscription Details</h3>
                <div className="space-y-1 text-sm text-white/60">
                  <p>Plan: <span className="text-white">{subscription?.plan_name}</span></p>
                  <p>Status: <span className="text-white capitalize">{subscription?.status}</span></p>
                  {gracePeriodEnd && (
                    <p>Access until: <span className="text-white">{gracePeriodEnd.toLocaleDateString()}</span></p>
                  )}
                </div>
              </div>

              {/* Cancellation Reason */}
              <div className="space-y-2">
                <Label className="text-white">Reason for cancellation *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCELLATION_REASONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Reason */}
              {reason === 'other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-white">Please specify *</Label>
                  <Input
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Tell us more about your reason"
                    className="bg-white/[0.03] border-white/[0.08] text-white"
                  />
                </motion.div>
              )}

              {/* Feedback */}
              <div className="space-y-2">
                <Label className="text-white">Additional feedback (optional)</Label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="How could we have done better? Your feedback helps us improve."
                  className="bg-white/[0.03] border-white/[0.08] text-white min-h-[80px]"
                />
              </div>

              {/* Confirmation */}
              <div className="space-y-2">
                <Label className="text-white">
                  Type "cancel my subscription" to confirm *
                </Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="cancel my subscription"
                  className="bg-white/[0.03] border-white/[0.08] text-white"
                />
              </div>

              {/* Warning */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-amber-200 font-medium mb-1">Important:</p>
                    <ul className="text-amber-200/80 space-y-1">
                      <li>• Your subscription will remain active until {gracePeriodEnd?.toLocaleDateString()}</li>
                      <li>• You'll lose access to all premium features after this date</li>
                      <li>• You can reactivate anytime during the grace period</li>
                      <li>• No refunds will be issued for the current billing period</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-white"
                >
                  Keep Subscription
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={!reason || (reason === 'other' && !customReason.trim()) || confirmText.toLowerCase() !== 'cancel my subscription'}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Cancel Subscription
                </Button>
              </div>
            </motion.div>
          )}

          {state === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-8"
            >
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">Processing Cancellation</h3>
              <p className="text-white/60">Please wait while we process your request...</p>
              {retryCount > 0 && (
                <p className="text-amber-400 text-sm mt-2">
                  Retry attempt {retryCount} of {maxRetries}
                </p>
              )}
            </motion.div>
          )}

          {state === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">Subscription Cancelled</h3>
              <p className="text-white/60 mb-4">
                Your subscription has been cancelled successfully. You'll continue to have access until {gracePeriodEnd?.toLocaleDateString()}.
              </p>
              <p className="text-sm text-white/40">
                You'll receive a confirmation email shortly.
              </p>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-8"
            >
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">Cancellation Failed</h3>
              <p className="text-white/60 mb-4">
                We couldn't process your cancellation request. Please try again or contact support.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setState('idle')}
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Contact Support
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};