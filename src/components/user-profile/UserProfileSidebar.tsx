import React from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { UserProfileNavigation } from "./UserProfileNavigation";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  credits: number | null;
  paddle_customer_id: string | null;
  ref_id: string | null;
  ref_credits: number | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfileSidebarProps {
  user: User;
  profile?: Profile | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
}

export const UserProfileSidebar: React.FC<UserProfileSidebarProps> = ({
  user,
  profile,
  activeTab,
  onTabChange,
  onSignOut,
}) => {
  return (
    <div className="hidden lg:flex w-64 flex-shrink-0 border-r border-white/[0.08] flex-col bg-[#101010] backdrop-blur-sm">
      {/* User info */}
      <div className="p-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
            <img
              src={
                profile?.avatar_url ||
                user.user_metadata?.avatar_url ||
                "/placeholder.svg"
              }
              alt={
                profile?.full_name || user.user_metadata?.full_name || "User"
              }
              className="w-full h-full object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm font-medium text-white truncate">
              {profile?.full_name || user.user_metadata?.full_name || "User"}
            </h3>
            <p className="text-xs text-white/50 truncate">
              {profile?.email || user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <UserProfileNavigation activeTab={activeTab} onTabChange={onTabChange} />

      {/* Sign Out Button */}
      <div className="p-4 border-t border-white/[0.08]">
        <Button
          variant="outline"
          onClick={onSignOut}
          className="w-full border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
