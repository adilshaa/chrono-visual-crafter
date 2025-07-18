import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

interface WaitingListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WaitingListModal: React.FC<WaitingListModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(true);
  const { toast } = useToast();

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    // Only validate if there's input (to avoid showing error when field is empty)
    if (newEmail) {
      setIsEmailValid(validateEmail(newEmail));
    } else {
      setIsEmailValid(true); // Reset validation when field is empty
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !validateEmail(email)) {
      setIsEmailValid(false);
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("waiting_list").insert([{ email }]);

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          toast({
            title: "Already Registered",
            description: "This email is already on our waiting list.",
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        setIsSuccess(true);
        toast({
          title: "Success!",
          description: "You've been added to our waiting list.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error submitting to waiting list:", error);
      toast({
        title: "Something went wrong",
        description:
          "We couldn't add you to the waiting list. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset state after animation completes
      setTimeout(() => {
        setIsSuccess(false);
        setEmail("");
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#171717] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#2BA6FF]" />
            <span>Join Our Waiting List</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Be among the first to access exclusive features and benefits when
            they launch.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-[#2BA6FF]/20 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-[#2BA6FF]" />
            </div>
            <h3 className="text-lg font-medium text-white">Thank You!</h3>
            <p className="text-gray-400">
              You're now on our waiting list. We'll notify you when new features
              are available.
            </p>
            <Button
              onClick={handleClose}
              className="bg-[#2BA6FF] hover:bg-[#2BA6FF]/80 text-white"
            >
              Continue
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                Explore the advantages of being an early user: priority access
                to new features, exclusive promotions, and the opportunity to
                shape the future of our platform.
              </p>

              <div className="bg-[#0c0c0c] p-4 rounded-lg border border-gray-800">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="email" className="text-sm text-gray-300">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="your@email.com"
                    className={`bg-[#1a1a1a] text-white ${
                      isEmailValid
                        ? "border-gray-700 focus:border-[#2BA6FF]"
                        : "border-red-500 focus:border-red-500"
                    }`}
                    required
                  />
                  {!isEmailValid && (
                    <p className="text-xs text-red-500 mt-1">
                      Please enter a valid email address
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#2BA6FF] hover:bg-[#2BA6FF]/80 text-white"
              >
                {isSubmitting ? "Submitting..." : "Join Waiting List"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WaitingListModal;
