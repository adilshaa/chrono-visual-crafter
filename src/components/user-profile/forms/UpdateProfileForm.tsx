import React, { useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UpdateProfileFormProps {
  profile: any;
  onProfileUpdate: (updates: any) => void;
}

export const UpdateProfileForm: React.FC<UpdateProfileFormProps> = ({
  profile,
  onProfileUpdate,
}) => {
  const { user, profile: userProfile } = useSupabaseAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userProfile?.first_name || "",
    lastName: userProfile?.last_name || "",
    fullName: userProfile?.full_name || profile?.full_name || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // Use the updateProfile function from useSupabaseAuth hook
      // This will update the database and local state in one call
      const result = await onProfileUpdate({
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name:
          formData.fullName ||
          `${formData.firstName} ${formData.lastName}`.trim(),
        updated_at: new Date().toISOString(),
      });

      if (result?.error) {
        throw result.error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="bg-[#151515] border border-white/[0.08] shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center text-white">
          <User className="w-5 h-5 mr-2 text-gray-400" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-white/80">
              First Name
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className="bg-[#181818] border-white/[0.08] text-white"
              placeholder="Enter your first name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-white/80">
              Last Name
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className="bg-[#181818] border-white/[0.08] text-white"
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-white/80">
            Display Name
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            className="bg-[#181818] border-white/[0.08] text-white"
            placeholder="Enter your display name"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">Current Email</Label>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#181818] border border-white/[0.08]">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-white/60">{user?.email}</span>
          </div>
        </div>

        <Button
          onClick={handleUpdateProfile}
          disabled={isUpdating}
          className="w-full bg-[#2BA6FF] hover:bg-[#2BA6FF]/90 text-white"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Profile"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
