import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  User,
  Settings,
  LogOut,
  Bell,
  Lock,
  CreditCard,
  Shield,
  Key,
  UserCircle,
  Camera,
  Check,
  Mail,
  FileText,
  RefreshCcw,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";
import { StudioBackground } from "@/components/ui/studio-background";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Smartphone } from "lucide-react";
import { SubscriptionManager } from "@/components/subscription/SubscriptionManager";
import { TestRunner } from "@/components/subscription/TestRunner";

export interface UserManagementDashboardProps {
  className?: string;
}

export function UserManagementDashboard({
  className,
}: UserManagementDashboardProps) {
  const { user, profile, signOut, updateProfile } = useClerkAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formValues, setFormValues] = useState({
    fullName: user?.fullName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    password: "••••••••••",
    newPassword: "",
    confirmPassword: "",
    notifications: {
      email: true,
      marketing: false,
      security: true,
      updates: true,
    },
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Animation variants for content transitions
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
      },
    },
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  // Handle toggle changes
  const handleToggleChange = (name: string) => {
    setFormValues({
      ...formValues,
      notifications: {
        ...formValues.notifications,
        [name]: !formValues.notifications[name],
      },
    });
  };

  // Handle save profile
  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
    setIsEditing(false);
  };

  // Handle password update
  const handlePasswordUpdate = () => {
    if (formValues.newPassword !== formValues.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password updated",
      description: "Your password has been updated successfully.",
    });

    setFormValues({
      ...formValues,
      password: "••••••••••",
      newPassword: "",
      confirmPassword: "",
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-300">
          Please sign in to view your account settings.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-black">
      {/* Studio Background */}
      <StudioBackground intensity="low" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            Account Management
          </h1>
          <p className="text-white/40 max-w-2xl mx-auto">
            Manage your profile, security settings, and subscription preferences
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* User Profile Summary Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:w-1/3"
          >
            <Card className="bg-white/[0.03] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-rose-500/5 opacity-40" />

              <CardHeader className="relative z-10 pb-0">
                <div className="flex flex-col items-center">
                  <Avatar className="w-24 h-24 border-4 border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-600 text-white text-xl">
                      {user.fullName
                        ?.split(" ")
                        .map((word) => word[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <CardTitle className="mt-4 text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                    {user.fullName || "User"}
                  </CardTitle>
                  <CardDescription className="text-white/50">
                    {user.primaryEmailAddress?.emailAddress || "No email"}
                  </CardDescription>

                  <div className="mt-3">
                    <Badge className="bg-gradient-to-r from-indigo-500 to-rose-500 border-none text-white">
                      {profile?.subscription_plan === "Free" ? "Free" : "Pro"}{" "}
                      Plan
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative z-10 pt-6">
                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors duration-200">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Personal Information
                      </h3>
                      <p className="text-xs text-white/40">
                        Update your personal details
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/40 ml-auto" />
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors duration-200">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Security
                      </h3>
                      <p className="text-xs text-white/40">
                        Manage your account security
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/40 ml-auto" />
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-colors duration-200">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Billing
                      </h3>
                      <p className="text-xs text-white/40">
                        Manage your billing and plan
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/40 ml-auto" />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="relative z-10 border-t border-white/[0.08] mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-white border-white/20 bg-white/5 hover:bg-white/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Main Settings Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:w-2/3"
          >
            <Card className="bg-white/[0.03] border border-white/[0.08] shadow-lg backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-rose-500/5 opacity-30" />

              <CardHeader className="relative z-10 pb-2 border-b border-white/[0.08]">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-4 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                    <TabsTrigger
                      value="profile"
                      className={cn(
                        "data-[state=active]:bg-gradient-to-r from-indigo-500 to-indigo-600 data-[state=active]:text-white",
                        "data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/25",
                        "text-white/60 hover:text-white"
                      )}
                    >
                      Profile
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className={cn(
                        "data-[state=active]:bg-gradient-to-r from-rose-500 to-rose-600 data-[state=active]:text-white",
                        "data-[state=active]:shadow-lg data-[state=active]:shadow-rose-500/25",
                        "text-white/60 hover:text-white"
                      )}
                    >
                      Security
                    </TabsTrigger>
                    <TabsTrigger
                      value="billing"
                      className={cn(
                        "data-[state=active]:bg-gradient-to-r from-amber-500 to-amber-600 data-[state=active]:text-white",
                        "data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/25",
                        "text-white/60 hover:text-white"
                      )}
                    >
                      Billing
                    </TabsTrigger>
                    <TabsTrigger
                      value="notifications"
                      className={cn(
                        "data-[state=active]:bg-gradient-to-r from-cyan-500 to-cyan-600 data-[state=active]:text-white",
                        "data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25",
                        "text-white/60 hover:text-white"
                      )}
                    >
                      Notifications
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent className="pt-6 relative z-10">
                <TabsContent value="profile">
                  <motion.div
                    key="profile"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white/70">First name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formValues.fullName.split(" ")[0] || ""}
                            onChange={handleInputChange}
                            className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/30 focus-visible:ring-indigo-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/70">Last name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formValues.fullName.split(" ")[1] || ""}
                            onChange={handleInputChange}
                            className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/30 focus-visible:ring-indigo-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/70">Email address</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formValues.email}
                            onChange={handleInputChange}
                            className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/30 focus-visible:ring-indigo-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/70">Username</Label>
                          <Input
                            id="username"
                            name="username"
                            value={user.username || ""}
                            onChange={handleInputChange}
                            className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/30 focus-visible:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Profile Photo
                      </h3>
                      <div className="flex items-center gap-6">
                        <Avatar className="w-20 h-20 border-2 border-white/10">
                          <AvatarImage src={user.imageUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-600 text-lg">
                            {user.fullName
                              ?.split(" ")
                              .map((word) => word[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            variant="outline"
                            className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                          >
                            Change
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-white/60 hover:text-white/90 hover:bg-white/5"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem
                        value="advanced"
                        className="border-white/[0.08]"
                      >
                        <AccordionTrigger className="text-lg font-medium text-white hover:text-white/90 hover:no-underline">
                          Advanced Settings
                        </AccordionTrigger>
                        <AccordionContent className="text-white/60">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  API Access
                                </h4>
                                <p className="text-xs text-white/40">
                                  Enable API access for third-party apps
                                </p>
                              </div>
                              <Switch />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  Developer Mode
                                </h4>
                                <p className="text-xs text-white/40">
                                  Access to development features and debugging
                                  tools
                                </p>
                              </div>
                              <Switch />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        className="text-white/60 hover:text-white/90 hover:bg-white/5"
                      >
                        Cancel
                      </Button>
                      <Button className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25">
                        Save Changes
                      </Button>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="security">
                  <motion.div
                    key="security"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Change Password
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-white/70">
                            Current password
                          </Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/30 focus-visible:ring-rose-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/70">New password</Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/30 focus-visible:ring-rose-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/70">
                            Confirm new password
                          </Label>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="bg-white/[0.03] border-white/[0.08] text-white placeholder-white/30 focus-visible:ring-rose-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Two-Factor Authentication
                      </h3>
                      <Card className="bg-white/[0.03] border border-white/[0.08]">
                        <CardContent className="pt-6 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                                <Smartphone className="h-5 w-5 text-rose-400" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  Authenticator App
                                </h4>
                                <p className="text-xs text-white/40">
                                  Use an authenticator app to generate
                                  verification codes
                                </p>
                              </div>
                            </div>
                            <Switch />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="mt-4 bg-white/[0.03] border border-white/[0.08]">
                        <CardContent className="pt-6 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-rose-400" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  SMS Authentication
                                </h4>
                                <p className="text-xs text-white/40">
                                  Receive codes via SMS for verification
                                </p>
                              </div>
                            </div>
                            <Switch />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Sessions
                      </h3>
                      <Card className="bg-white/[0.03] border border-white/[0.08]">
                        <CardContent className="pt-6 pb-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                  <Globe className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-white">
                                    Chrome on Windows
                                  </h4>
                                  <p className="text-xs text-white/40">
                                    Active now • Current session
                                  </p>
                                </div>
                              </div>
                              <Badge className="bg-emerald-500/80 text-white">
                                Active
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                  <Smartphone className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-white">
                                    iPhone 14 Pro • Safari
                                  </h4>
                                  <p className="text-xs text-white/40">
                                    Last active 2 hours ago
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/60 hover:text-white/90 hover:bg-white/5"
                              >
                                Sign Out
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="border-t border-white/[0.08] pt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/60 hover:text-white/90 hover:bg-white/5"
                          >
                            Sign Out All Other Devices
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25">
                        Save Security Settings
                      </Button>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="billing">
                  <motion.div
                    key="billing"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-8"
                  >
                    {/* Subscription Management Component */}
                    <SubscriptionManager />

                    {/* Test Runner for Development */}
                    {process.env.NODE_ENV === 'development' && (
                      <TestRunner />
                    )}

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Payment Method
                      </h3>
                      <Card className="bg-white/[0.03] border border-white/[0.08]">
                        <CardContent className="pt-6 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-8 bg-white/[0.08] rounded flex items-center justify-center">
                                <svg
                                  width="28"
                                  height="20"
                                  viewBox="0 0 28 20"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <rect
                                    width="28"
                                    height="20"
                                    rx="3"
                                    fill="#252525"
                                  />
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M11 14H17V13H11V14Z"
                                    fill="#EBEBEB"
                                  />
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M9 12H19V11H9V12Z"
                                    fill="#EBEBEB"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  Visa ending in 4242
                                </h4>
                                <p className="text-xs text-white/40">
                                  Expires 09/2028
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/60 hover:text-white/90 hover:bg-white/5"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/60 hover:text-white/90 hover:bg-white/5"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="border-t border-white/[0.08] pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                          >
                            Add Payment Method
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Billing History
                      </h3>
                      <Card className="bg-white/[0.03] border border-white/[0.08]">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/[0.08]">
                                <th className="text-left py-3 px-4 font-medium text-white/70 text-sm">
                                  Date
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-white/70 text-sm">
                                  Description
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-white/70 text-sm">
                                  Amount
                                </th>
                                <th className="text-right py-3 px-4 font-medium text-white/70 text-sm">
                                  Receipt
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {profile?.subscription_plan !== "Free" && (
                                <>
                                  <tr className="border-b border-white/[0.08]">
                                    <td className="py-3 px-4 text-white/80 text-sm">
                                      Aug 30, 2025
                                    </td>
                                    <td className="py-3 px-4 text-white/80 text-sm">
                                      Pro Plan - Monthly
                                    </td>
                                    <td className="py-3 px-4 text-white/80 text-sm">
                                      $19.00
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-white/60 hover:text-white/90 hover:bg-white/5"
                                      >
                                        Download
                                      </Button>
                                    </td>
                                  </tr>
                                  <tr className="border-b border-white/[0.08]">
                                    <td className="py-3 px-4 text-white/80 text-sm">
                                      Jul 30, 2025
                                    </td>
                                    <td className="py-3 px-4 text-white/80 text-sm">
                                      Pro Plan - Monthly
                                    </td>
                                    <td className="py-3 px-4 text-white/80 text-sm">
                                      $19.00
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-white/60 hover:text-white/90 hover:bg-white/5"
                                      >
                                        Download
                                      </Button>
                                    </td>
                                  </tr>
                                </>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="notifications">
                  <motion.div
                    key="notifications"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Email Notifications
                      </h3>
                      <Card className="bg-white/[0.03] border border-white/[0.08]">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  Product Updates
                                </h4>
                                <p className="text-xs text-white/40">
                                  Receive emails about new features and
                                  improvements
                                </p>
                              </div>
                              <Switch defaultChecked />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  Account Activity
                                </h4>
                                <p className="text-xs text-white/40">
                                  Get notified about sign-ins from new devices
                                </p>
                              </div>
                              <Switch defaultChecked />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  Marketing Emails
                                </h4>
                                <p className="text-xs text-white/40">
                                  Promotional offers and discount information
                                </p>
                              </div>
                              <Switch />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">
                        Push Notifications
                      </h3>
                      <Card className="bg-white/[0.03] border border-white/[0.08]">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  Project Comments
                                </h4>
                                <p className="text-xs text-white/40">
                                  When someone comments on your projects
                                </p>
                              </div>
                              <Switch defaultChecked />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  Project Likes
                                </h4>
                                <p className="text-xs text-white/40">
                                  When someone likes your projects
                                </p>
                              </div>
                              <Switch defaultChecked />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-white">
                                  Mentions
                                </h4>
                                <p className="text-xs text-white/40">
                                  When someone mentions you in comments
                                </p>
                              </div>
                              <Switch defaultChecked />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/25">
                        Save Notification Settings
                      </Button>
                    </div>
                  </motion.div>
                </TabsContent>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
