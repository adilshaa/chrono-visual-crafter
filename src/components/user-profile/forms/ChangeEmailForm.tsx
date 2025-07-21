import React, { useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface ChangeEmailFormProps {
  profile: any;
  onProfileUpdate: (updates: any) => void;
}

export const ChangeEmailForm: React.FC<ChangeEmailFormProps> = ({
  profile,
  onProfileUpdate,
}) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [isChanging, setIsChanging] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const handleChangeEmail = async () => {
    if (!user || !newEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Email Change Initiated",
        description: `A confirmation email has been sent to ${newEmail}. Please check your inbox and click the confirmation link to complete the email change.`,
      });

      // Update the profile in the database
      const result = await onProfileUpdate({
        email: newEmail,
        updated_at: new Date().toISOString(),
      });

      if (result?.error) {
        console.warn("Profile update warning:", result.error);
      }

      setNewEmail("");
    } catch (error: any) {
      console.error("Error changing email:", error);
      toast({
        title: "Email Change Failed",
        description:
          error.message || "Failed to change email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center text-white">
          <Mail className="w-5 h-5 mr-2 text-gray-400" />
          Change Email Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white/80">Current Email</Label>
          <div className="p-3 rounded-lg bg-[#181818] border border-white/[0.08] text-white/60">
            {user?.email}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newEmail" className="text-white/80">
            New Email Address
          </Label>
          <Input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="bg-[#181818] border-white/[0.08] text-white"
            placeholder="Enter your new email address"
          />
        </div>

        <Alert className="bg-yellow-500/10 border-yellow-500/20">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            You will receive a confirmation email at the new address. You must
            click the confirmation link before the change takes effect.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleChangeEmail}
          disabled={isChanging || !newEmail}
          className="w-full bg-[#2BA6FF] hover:bg-[#2BA6FF]/90 text-white"
        >
          {isChanging ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending Confirmation...
            </>
          ) : (
            "Change Email Address"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
