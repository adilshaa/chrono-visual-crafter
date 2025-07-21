import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Share2, Gift } from "lucide-react";

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, refreshProfile } = useSupabaseAuth();
  const { toast } = useToast();
  const [referralId, setReferralId] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);

      // Check if user already has a referral ID
      if (profile?.ref_id) {
        setReferralId(profile.ref_id);
        setReferralLink(
          `${window.location.origin}/register?ref=${profile.ref_id}`
        );
        setLoading(false);
      } else {
        // Generate a new referral ID and save it
        generateReferralId();
      }
    }
  }, [isOpen, user, profile]);

  const generateReferralId = async () => {
    if (!user) return;

    try {
      // Generate a unique referral ID with ref_ prefix and timestamp for uniqueness
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 8);
      const newRefId = `ref_${timestamp}_${randomStr}`;

      // Save to database
      const { error } = await supabase
        .from("profiles")
        .update({ ref_id: newRefId })
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setReferralId(newRefId);
      setReferralLink(`${window.location.origin}/register?ref=${newRefId}`);

      // Refresh profile to get updated data
      refreshProfile();

      toast({
        title: "Success!",
        description: "Your referral link has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating referral ID:", error);
      toast({
        title: "Error",
        description: "Failed to generate referral link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const shareReferralLink = async () => {
    if (!navigator.share) {
      // Fallback for browsers that don't support the Web Share API
      copyToClipboard();
      return;
    }

    try {
      await navigator.share({
        title: "Join me on Countable",
        text: "Sign up using my referral link and get 20 free credits!",
        url: referralLink,
      });

      toast({
        title: "Shared!",
        description: "Thanks for sharing your referral link",
      });
    } catch (error) {
      console.error("Error sharing:", error);
      // Fallback to copy if sharing fails or is cancelled
      copyToClipboard();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#171717] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#2BA6FF]/80" />
            Share & Earn Credits
          </DialogTitle>
          <DialogDescription className="text-gray-300 mt-2">
            Share your referral link with friends. When they sign up, you both
            get 20 credits!
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Your Referral ID:
                </span>
                <span className="font-mono bg-[#171717]/50 border border-gray-700 px-2 py-1 rounded text-sm text-[#2BA6FF]">
                  {referralId}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Your Referral Link:
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-l-md bg-[#171717]  text-gray-200 focus:outline-none focus:border-[#2BA6FF]/10"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="default"
                    className="rounded-l-none bg-[#2BA6FF]/80 hover:bg-[#2BA6FF]/60"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex justify-center gap-2 mt-3">
                  <Button
                    onClick={shareReferralLink}
                    variant="outline"
                    className="flex items-center gap-2 border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-[#2BA6FF]/80"
                  >
                    <Share2 className="h-4 w-4" />
                    Share with friends
                  </Button>
                </div>
              </div>

              <div className="bg-[#171717]/50 border border-gray-700 p-4 rounded-md">
                <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                  <Gift className="h-4 w-4 text-[#2BA6FF]/80" />
                  How it works
                </h4>
                <ul className="text-sm space-y-2 list-disc pl-4 text-gray-300">
                  <li>Share your unique referral link with friends</li>
                  <li>
                    When they sign up using your link, you get{" "}
                    <span className="text-[#2BA6FF]/80 font-medium">
                      20 credits
                    </span>
                  </li>
                  <li>
                    They also receive{" "}
                    <span className="text-[#2BA6FF]/80 font-medium">
                      20 credits
                    </span>{" "}
                    to start with
                  </li>
                  <li>Credits can be used for exports and premium features</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralModal;
