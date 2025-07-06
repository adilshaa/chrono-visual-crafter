import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Crown,
  Settings,
  LogOut,
  ShieldCheck,
  Calendar,
  Activity,
  ChevronRight,
  CreditCard,
  Clock,
  Video,
  Image,
  Check,
  Bell,
  Lock,
  Mail,
} from "lucide-react";
import { StudioBackground } from "@/components/ui/studio-background";
import { cn } from "@/lib/utils";

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useClerkAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/70"
        >
          <p>Please sign in to view your profile.</p>
        </motion.div>
      </div>
    );
  }

  // Determine subscription tier for styling
  const isPro = (profile?.subscription_plan || "")
    .toLowerCase()
    .includes("pro");
  const isTeam = (profile?.subscription_plan || "")
    .toLowerCase()
    .includes("team");

  // Set gradient based on subscription
  let gradientStyle = "from-gray-400/20 to-gray-500/20";
  let accentColor = "gray";

  if (isPro) {
    gradientStyle = "from-indigo-500/20 to-blue-600/20";
    accentColor = "indigo";
  } else if (isTeam) {
    gradientStyle = "from-amber-500/20 to-orange-600/20";
    accentColor = "amber";
  }

  return (
    <div className="min-h-screen relative bg-black overflow-hidden">
      {/* Studio Background */}
      <StudioBackground intensity="low" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 max-w-5xl mx-auto"
        >
          {/* Back to dashboard button */}
          <motion.button
            onClick={() => navigate("/studio")}
            whileHover={{ x: -5 }}
            className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white/60"
            >
              <path
                d="M15.8332 10.0001H4.1665M4.1665 10.0001L9.99984 15.8334M4.1665 10.0001L9.99984 4.16675"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Dashboard
          </motion.button>

          {/* Profile Header */}
          <Card className="bg-white/[0.03] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-rose-500/5 opacity-40" />

            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div
                    className={cn(
                      "w-28 h-28 rounded-full overflow-hidden",
                      "border-2",
                      isPro || isTeam
                        ? `border-${accentColor}-500/70`
                        : "border-white/20",
                      `shadow-[0_0_20px_rgba(99,102,241,0.3)]`
                    )}
                  >
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || "User"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {(isPro || isTeam) && (
                    <div
                      className={cn(
                        "absolute -bottom-2 -right-2 w-8 h-8 rounded-full",
                        "flex items-center justify-center",
                        "bg-gradient-to-r",
                        isPro
                          ? "from-indigo-500 to-blue-600"
                          : "from-amber-500 to-orange-600"
                      )}
                    >
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  )}
                </motion.div>

                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                    {user.fullName || "User"}
                  </h1>
                  <p className="mb-4 text-white/40">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge
                      className={cn(
                        "py-1.5 px-3",
                        "bg-gradient-to-r",
                        isPro
                          ? "from-indigo-500 to-blue-600"
                          : isTeam
                          ? "from-amber-500 to-orange-600"
                          : "from-gray-500 to-gray-600",
                        "border-none text-white"
                      )}
                    >
                      <Crown className="w-3 h-3 mr-1.5" />
                      {profile?.subscription_plan || "Free"} Plan
                    </Badge>

                    <Badge className="py-1.5 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 border-none text-white">
                      <Check className="w-3 h-3 mr-1.5" />
                      Active Member
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-4 md:mt-0">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/account")}
                    className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/[0.03] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-40" />

              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-xl font-semibold flex items-center text-white">
                  <User className="w-5 h-5 mr-2 text-indigo-400" />
                  Account Details
                </CardTitle>
              </CardHeader>

              <CardContent className="relative z-10 pt-0">
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                    <label className="text-xs text-white/40">Full Name</label>
                    <p className="text-white mt-1">
                      {user.fullName || "Not provided"}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                    <label className="text-xs text-white/40">Email</label>
                    <p className="text-white mt-1">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                    <label className="text-xs text-white/40">
                      Member Since
                    </label>
                    <p className="text-white mt-1 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-white/40" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                    <label className="text-xs text-white/40">Last Login</label>
                    <p className="text-white mt-1 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-white/40" />
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/[0.03] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-40",
                  `from-${accentColor}-500/10 to-transparent`
                )}
              />

              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-xl font-semibold flex items-center text-white">
                  <Crown
                    className={cn(
                      "w-5 h-5 mr-2",
                      isPro
                        ? "text-indigo-400"
                        : isTeam
                        ? "text-amber-400"
                        : "text-gray-400"
                    )}
                  />
                  Subscription
                </CardTitle>
              </CardHeader>

              <CardContent className="relative z-10 pt-0">
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                    <label className="text-xs text-white/40">
                      Current Plan
                    </label>
                    <p className="font-medium text-white mt-1">
                      {profile?.subscription_plan || "Free"} Plan
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                    <label className="text-xs text-white/40">Status</label>
                    <p className="text-emerald-400 mt-1 flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      {profile?.subscription_status || "Active"}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                    <label className="text-xs text-white/40">
                      Next Billing
                    </label>
                    <p className="text-white mt-1 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-white/40" />
                      {profile?.subscription_plan === "Free"
                        ? "N/A"
                        : new Date(
                            Date.now() + 30 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    onClick={() => navigate("/pricing")}
                    className={cn(
                      "w-full text-white shadow-lg",
                      "bg-gradient-to-r",
                      isPro
                        ? "from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-indigo-500/25"
                        : isTeam
                        ? "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/25"
                        : "from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
                    )}
                  >
                    {profile?.subscription_plan === "Free"
                      ? "Upgrade Plan"
                      : "Manage Subscription"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Statistics */}
          <Card className="bg-white/[0.03] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-40" />

            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-xl font-semibold flex items-center text-white">
                <Activity className="w-5 h-5 mr-2 text-violet-400" />
                Usage Statistics
              </CardTitle>
            </CardHeader>

            <CardContent className="relative z-10 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatItem
                  icon={<Video className="w-5 h-5" />}
                  value="12"
                  label="Counters Created"
                  color="indigo"
                />
                <StatItem
                  icon={<Image className="w-5 h-5" />}
                  value="8"
                  label="Videos Exported"
                  color="blue"
                />
                <StatItem
                  icon={<Clock className="w-5 h-5" />}
                  value="24"
                  label="Hours Recorded"
                  color="violet"
                />
                <StatItem
                  icon={<Image className="w-5 h-5" />}
                  value="5"
                  label="GIFs Generated"
                  color="rose"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-white/[0.03] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-40" />

            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-xl font-semibold flex items-center text-white">
                <ShieldCheck className="w-5 h-5 mr-2 text-rose-400" />
                Security Settings
              </CardTitle>
            </CardHeader>

            <CardContent className="relative z-10 pt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-xs text-white/40">
                        Add an extra layer of security
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  >
                    Enable
                  </Button>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Login Notifications
                      </h3>
                      <p className="text-xs text-white/40">
                        Get notified of new logins
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  >
                    Configure
                  </Button>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Recovery Email
                      </h3>
                      <p className="text-xs text-white/40">
                        Set a backup email address
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => navigate("/account")}
              className="bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white shadow-lg shadow-indigo-500/25 px-8"
            >
              Go to Account Management
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: "indigo" | "blue" | "violet" | "rose" | "amber" | "emerald";
}

const StatItem = ({ icon, value, label, color }: StatItemProps) => {
  const colorMap = {
    indigo:
      "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
    violet:
      "from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400",
    rose: "from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400",
    amber:
      "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
    emerald:
      "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-gradient-to-br border",
        "relative overflow-hidden",
        colorMap[color]
      )}
    >
      <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />
      <div className="flex flex-col items-center md:items-start">
        <div className="mb-2">{icon}</div>
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-xs text-white/50 mt-1">{label}</span>
      </div>
    </div>
  );
};

export default UserProfile;
