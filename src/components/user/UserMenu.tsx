import React, { useState, useRef, useEffect } from "react";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Crown,
  Home,
} from "lucide-react";
import UserProfileModal from "./UserProfileModal";

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, profile, signOut } = useClerkAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLandingPage =
    location.pathname === "/" || location.pathname === "/pricing";

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate("/");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleOpenProfile = () => {
    setShowProfileModal(true);
    setIsOpen(false);
  };

  if (!user) return null;

  // Determine subscription badge style
  const isPro = (profile?.subscription_plan || "")
    .toLowerCase()
    .includes("pro");
  const isTeam = (profile?.subscription_plan || "")
    .toLowerCase()
    .includes("team");
  let planBadgeStyle = "from-gray-400 to-gray-500";

  if (isPro) {
    planBadgeStyle = isLandingPage
      ? "from-cyan-400 to-blue-600"
      : "from-indigo-500 to-blue-600";
  } else if (isTeam) {
    planBadgeStyle = isLandingPage
      ? "from-amber-400 to-orange-500"
      : "from-amber-500 to-orange-600";
  }

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full pl-1 pr-3 transition-all",
          "backdrop-blur-sm shadow-lg",
          isLandingPage
            ? "bg-white/[0.08] border border-white/[0.1] hover:bg-white/[0.15]"
            : isDark
            ? "bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1]"
            : "bg-black/[0.05] border border-black/[0.05] hover:bg-black/[0.1]"
        )}
      >
        <div className="relative">
          <img
            src={user.imageUrl}
            alt={user.fullName || "User"}
            className={cn(
              "w-8 h-8 rounded-full",
              isLandingPage
                ? "border border-white/30"
                : "border border-white/20"
            )}
          />
          {(isPro || isTeam) && (
            <div
              className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full",
                "flex items-center justify-center",
                "bg-gradient-to-r",
                planBadgeStyle
              )}
            >
              <Crown className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        <div className="hidden sm:flex items-center">
          <span
            className={cn(
              "max-w-[100px] truncate text-sm font-medium",
              isLandingPage ? "text-white" : ""
            )}
          >
            {user.fullName || "User"}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 ml-1 transition-transform",
              isOpen ? "rotate-180" : "rotate-0",
              isLandingPage ? "text-white/70" : ""
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute right-0 mt-2 w-64 rounded-xl overflow-hidden z-50 shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
              "backdrop-blur-md border",
              isLandingPage
                ? "bg-black/90 border-white/[0.1]"
                : isDark
                ? "bg-black/80 border-white/[0.08]"
                : "bg-white/90 border-black/[0.05]"
            )}
          >
            <div className="overflow-hidden relative">
              {/* Gradient background effect */}
              <div
                className={cn(
                  "absolute inset-0 opacity-40",
                  isLandingPage
                    ? "bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10"
                    : "bg-gradient-to-br from-indigo-500/10 to-rose-500/10"
                )}
              />

              <div
                className={cn(
                  "p-4 border-b relative z-10",
                  isLandingPage
                    ? "border-white/[0.1]"
                    : isDark
                    ? "border-white/[0.08]"
                    : "border-gray-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || "User"}
                      className={cn(
                        "w-12 h-12 rounded-full",
                        isLandingPage
                          ? "shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                          : "shadow-[0_0_15px_rgba(99,102,241,0.5)]",
                        "border-2",
                        isPro || isTeam
                          ? isLandingPage
                            ? "border-cyan-400/70"
                            : "border-indigo-500/70"
                          : "border-white/20"
                      )}
                    />
                    {(isPro || isTeam) && (
                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full",
                          "flex items-center justify-center",
                          "bg-gradient-to-r",
                          planBadgeStyle
                        )}
                      >
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {user.fullName || "User"}
                    </p>
                    <p
                      className={cn(
                        "text-xs truncate",
                        isLandingPage
                          ? "text-white/50"
                          : isDark
                          ? "text-white/40"
                          : "text-gray-600"
                      )}
                    >
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex justify-between items-center">
                  <div
                    className={cn(
                      "py-1 px-3 rounded-full text-xs font-medium",
                      "bg-gradient-to-r",
                      isPro || isTeam
                        ? planBadgeStyle
                        : "from-gray-500/80 to-gray-600/80",
                      "text-white"
                    )}
                  >
                    <span className="capitalize">
                      {profile?.subscription_plan || "Free"} Plan
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigate("/pricing")}
                    className={cn(
                      "text-xs py-1 px-3 rounded-full",
                      "border transition-colors",
                      isLandingPage
                        ? "border-white/15 bg-white/10 hover:bg-white/15"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    {isPro || isTeam ? "Manage Plan" : "Upgrade"}
                  </motion.button>
                </div>
              </div>

              <div className="p-2 relative z-10">
                {/* My Profile */}
                <MenuButton
                  icon={<User className="w-4 h-4" />}
                  label="My Profile"
                  onClick={handleOpenProfile}
                  isLandingPage={isLandingPage}
                />

                {/* Account Settings */}
                <MenuButton
                  icon={<Settings className="w-4 h-4" />}
                  label="Account Settings"
                  onClick={() => handleNavigate("/account")}
                  isLandingPage={isLandingPage}
                />

                {/* Dashboard */}
                {location.pathname !== "/studio" && (
                  <MenuButton
                    icon={<Home className="w-4 h-4" />}
                    label="Go to Dashboard"
                    onClick={() => handleNavigate("/studio")}
                    isLandingPage={isLandingPage}
                  />
                )}

                {/* Billing */}
                <MenuButton
                  icon={<CreditCard className="w-4 h-4" />}
                  label="Billing & Payments"
                  onClick={() => handleNavigate("/pricing")}
                  isLandingPage={isLandingPage}
                />

                {/* Help & Support */}
                <MenuButton
                  icon={<HelpCircle className="w-4 h-4" />}
                  label="Help & Support"
                  onClick={() => handleNavigate("/help")}
                  isLandingPage={isLandingPage}
                />

                <div
                  className={cn(
                    "my-1 border-t",
                    isLandingPage
                      ? "border-white/[0.1]"
                      : isDark
                      ? "border-white/[0.08]"
                      : "border-gray-100"
                  )}
                />

                {/* Sign Out */}
                <MenuButton
                  icon={<LogOut className="w-4 h-4" />}
                  label="Sign Out"
                  onClick={handleSignOut}
                  dangerous={true}
                  isLandingPage={isLandingPage}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <UserProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
    </div>
  );
}

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  dangerous?: boolean;
  isLandingPage?: boolean;
}

function MenuButton({
  icon,
  label,
  onClick,
  className,
  dangerous = false,
  isLandingPage = false,
}: MenuButtonProps) {
  const { isDark } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full p-2 text-sm rounded-md transition-colors",
        isLandingPage
          ? dangerous
            ? "hover:bg-rose-500/20 text-rose-300"
            : "hover:bg-white/10 text-white"
          : isDark
          ? dangerous
            ? "hover:bg-rose-500/20 text-rose-400"
            : "hover:bg-white/10 text-white"
          : dangerous
          ? "hover:bg-rose-500/10 text-rose-600"
          : "hover:bg-black/5 text-gray-700",
        className
      )}
    >
      {icon}
      {label}
    </motion.button>
  );
}

export default UserMenu;
