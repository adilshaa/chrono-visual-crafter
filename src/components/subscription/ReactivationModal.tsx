import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, CheckCircle } from "lucide-react";

interface ReactivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: {
    plan_name: string;
    current_period_end: string;
  } | null;
  onReactivation: () => void;
}

export const ReactivationModal: React.FC<ReactivationModalProps> = ({
  open,
  onOpenChange,
  subscription,
  onReactivation,
}) => {
  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Reactivate Subscription
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Welcome back! Reactivate your subscription to continue enjoying premium features.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Benefits */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-green-200 font-medium mb-3">What you'll get back:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-200/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Immediate access to all premium features</span>
              </div>
              <div className="flex items-center gap-2 text-green-200/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Unlimited exports and downloads</span>
              </div>
              <div className="flex items-center gap-2 text-green-200/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Priority customer support</span>
              </div>
              <div className="flex items-center gap-2 text-green-200/80">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm">Access to new features and updates</span>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="bg-white/[0.05] rounded-lg p-4 border border-white/[0.08]">
            <h3 className="text-white font-medium mb-2">Subscription Details</h3>
            <div className="space-y-1 text-sm text-white/60">
              <p>Plan: <span className="text-white">{subscription.plan_name}</span></p>
              <p>Next billing: <span className="text-white">{new Date(subscription.current_period_end).toLocaleDateString()}</span></p>
              <p className="text-xs text-white/40 mt-2">
                No additional charges will be applied. Your billing cycle will continue as normal.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              Maybe Later
            </Button>
            <Button
              onClick={onReactivation}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Reactivate Now
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};