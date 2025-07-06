import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { usePaddle } from "@/components/payments/PaddleProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Settings,
  Crown,
  Users,
  CreditCard,
  LogOut,
  RefreshCw,
} from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_status: string;
  subscription_plan?: string;
  created_at: string;
}

interface UserManagementProps {
  onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onClose }) => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const { refreshSubscriptionStatus } = usePaddle();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: user?.email || "",
  });

  const isAdmin = profile?.subscription_plan === "admin"; // Simple admin check

  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers();
    }
  }, [isAdmin]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllUsers(data);
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateProfile(formData);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      setAllUsers(allUsers.filter((u) => u.user_id !== userId));
      toast({
        title: "User deleted",
        description: "User has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRefreshSubscription = async () => {
    try {
      setLoading(true);
      const updatedSubscription = await refreshSubscriptionStatus();
      if (updatedSubscription) {
        toast({
          title: "Subscription refreshed",
          description: `Your subscription status has been updated to: ${updatedSubscription.plan} (${updatedSubscription.status})`,
        });
      } else {
        toast({
          title: "No changes detected",
          description: "Your subscription status is already up to date.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error refreshing subscription",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBadge = (status: string, plan?: string) => {
    if (status === "active" && plan) {
      const colors = {
        free: "bg-gray-500",
        pro: "bg-blue-500",
        premium: "bg-purple-500",
      };
      return (
        <Badge className={`${colors[plan as keyof typeof colors]} text-white`}>
          {plan}
        </Badge>
      );
    }
    return <Badge variant="outline">Free</Badge>;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl z-10"
        >
          ✕
        </button>

        <Card className="w-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center">
              <User className="w-6 h-6 mr-2" />
              User Management
            </CardTitle>
            <CardDescription className="text-gray-300">
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm">
                <TabsTrigger
                  value="profile"
                  className="text-white data-[state=active]:bg-white/20"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="subscription"
                  className="text-white data-[state=active]:bg-white/20"
                >
                  <Crown className="w-4 h-4 mr-1" />
                  Subscription
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger
                    value="users"
                    className="text-white data-[state=active]:bg-white/20"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    All Users
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="billing"
                  className="text-white data-[state=active]:bg-white/20"
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Billing
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 max-h-96 overflow-y-auto custom-scrollbar">
                <TabsContent value="profile">
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-white">
                        Full Name
                      </Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 backdrop-blur-sm"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-white/5 border-white/20 text-gray-400 backdrop-blur-sm"
                      />
                      <p className="text-xs text-gray-400">
                        Email cannot be changed
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      >
                        {loading ? "Updating..." : "Update Profile"}
                      </Button>

                      <Button
                        type="button"
                        onClick={handleSignOut}
                        variant="outline"
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="subscription">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-white">
                        Current Plan
                      </h3>
                      <Button
                        onClick={handleRefreshSubscription}
                        size="sm"
                        variant="outline"
                        className="border-white/30 text-white"
                        disabled={loading}
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-1 ${
                            loading ? "animate-spin" : ""
                          }`}
                        />
                        Refresh
                      </Button>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        {getSubscriptionBadge(
                          profile?.subscription_status || "free",
                          profile?.subscription_plan
                        )}
                        <span className="text-gray-300">
                          {profile?.subscription_plan || "Free Plan"}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {profile?.subscription_status === "active"
                          ? "Your subscription is active and will renew automatically."
                          : "Upgrade to a paid plan to unlock premium features."}
                      </p>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white">
                      Upgrade Plan
                    </Button>
                  </div>
                </TabsContent>

                {isAdmin && (
                  <TabsContent value="users">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">
                          All Users
                        </h3>
                        <Button
                          onClick={fetchAllUsers}
                          size="sm"
                          variant="outline"
                          className="border-white/30 text-white"
                        >
                          Refresh
                        </Button>
                      </div>

                      <div className="bg-white/5 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/20">
                              <TableHead className="text-gray-300">
                                Name
                              </TableHead>
                              <TableHead className="text-gray-300">
                                Email
                              </TableHead>
                              <TableHead className="text-gray-300">
                                Plan
                              </TableHead>
                              <TableHead className="text-gray-300">
                                Joined
                              </TableHead>
                              <TableHead className="text-gray-300">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allUsers.map((userProfile) => (
                              <TableRow
                                key={userProfile.id}
                                className="border-white/10"
                              >
                                <TableCell className="text-white">
                                  {userProfile.full_name}
                                </TableCell>
                                <TableCell className="text-gray-300">
                                  {userProfile.email}
                                </TableCell>
                                <TableCell>
                                  {getSubscriptionBadge(
                                    userProfile.subscription_status,
                                    userProfile.subscription_plan
                                  )}
                                </TableCell>
                                <TableCell className="text-gray-300">
                                  {new Date(
                                    userProfile.created_at
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    onClick={() =>
                                      deleteUser(userProfile.user_id)
                                    }
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                                  >
                                    Delete
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="billing">
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Billing Information
                      </h3>
                      <p className="text-gray-400">
                        Your billing is managed through Paddle. All charges will
                        appear as "Paddle" on your statement.
                      </p>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                      Manage Billing
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
