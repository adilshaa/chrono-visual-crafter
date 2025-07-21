import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, Bell, Mail } from "lucide-react";
import { UpdateProfileForm } from "../forms/UpdateProfileForm";
import { ChangeEmailForm } from "../forms/ChangeEmailForm";
import { PasswordManagementForm } from "../forms/PasswordManagementForm";

interface SecurityTabProps {
  user: any;
  profile: any;
  onProfileUpdate?: (updates: any) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  user,
  profile,
  onProfileUpdate = () => {},
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Account & Security</h2>

      {/* Profile Information Form */}
      <UpdateProfileForm profile={profile} onProfileUpdate={onProfileUpdate} />

      {/* Change Email Form */}
      {/* <ChangeEmailForm profile={profile} onProfileUpdate={onProfileUpdate} /> */}

      {/* Password Management Form */}
      {/* <PasswordManagementForm /> */}

      {/* Additional Security Options */}
    </div>
  );
};
