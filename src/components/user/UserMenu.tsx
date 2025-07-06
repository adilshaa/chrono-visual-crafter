import React, { useState, useRef, useEffect } from "react";
import { useClerkAuth } from "@/hooks/useClerkAuth";
import { useNavigate } from "react-router-dom";
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

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, profile, signOut } = useClerkAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    planBadgeStyle = "from-indigo-500 to-blue-600";
  } else if (isTeam) {
    planBadgeStyle = "from-amber-500 to-orange-600";
  }

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full pl-1 pr-3 transition-all",
          "backdrop-blur-sm shadow-lg",
          isDark
            ? "bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1]"
            : "bg-black/[0.05] border border-black/[0.05] hover:bg-black/[0.1]"
        )}
      >
        <div className="relative">
          <img
            src={user.imageUrl}
            alt={user.fullName || "User"}
            className="w-8 h-8 rounded-full border border-white/20"
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
          <span className="max-w-[100px] truncate text-sm font-medium">
            {user.fullName || "User"}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 ml-1 transition-transform",
              isOpen ? "rotate-180" : "rotate-0"
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
              isDark
                ? "bg-black/80 border-white/[0.08]"
                : "bg-white/90 border-black/[0.05]"
            )}
          >
            <div className="overflow-hidden relative">
              {/* Gradient background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-rose-500/10 opacity-40" />

              <div
                className={cn(
                  "p-4 border-b relative z-10",
                  isDark ? "border-white/[0.08]" : "border-gray-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user.imageUrl}
                      alt={user.fullName || "User"}
                      className={cn(
                        "w-12 h-12 rounded-full",
                        "shadow-[0_0_15px_rgba(99,102,241,0.5)]",
                        "border-2",
                        isPro || isTeam
                          ? "border-indigo-500/70"
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
                    <p
                      className={cn(
                        "font-medium",
                        isDark ? "text-white" : "text-gray-900"
                      )}
                    >
                      {user.fullName || "User"}
                    </p>
                    <p
                      className={cn(
                        "text-xs truncate",
                        isDark ? "text-white/40" : "text-gray-600"
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
                      "border border-white/10",
                      "bg-white/5 hover:bg-white/10",
                      "transition-colors"
                    )}
                  >
                    {isPro || isTeam ? "Manage" : "Upgrade"}
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="py-1 relative">
              {/* Subtle divider lines between items */}
              <MenuButton
                icon={<Home size={16} />}
                label="Dashboard"
                onClick={() => handleNavigate("/studio")}
              />
              <MenuButton
                icon={<User size={16} />}
                label="My Profile"
                onClick={() => handleNavigate("/profile")}
              />
              <MenuButton
                icon={<Settings size={16} />}
                label="Account Settings"
                onClick={() => handleNavigate("/account")}
              />
              <MenuButton
                icon={<CreditCard size={16} />}
                label="Subscription"
                onClick={() => handleNavigate("/pricing")}
              />
              <MenuButton
                icon={<HelpCircle size={16} />}
                label="Help & Support"
                onClick={() => window.open("mailto:support@timerstudio.com")}
              />
            </div>

            <div
              className={cn(
                "py-1 mt-1 border-t",
                isDark ? "border-white/[0.08]" : "border-gray-200"
              )}
            >
              <MenuButton
                icon={<LogOut size={16} />}
                label="Sign Out"
                onClick={handleSignOut}
                className={isDark ? "text-rose-400" : "text-rose-500"}
                dangerous
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  dangerous?: boolean;
}

function MenuButton({
  icon,
  label,
  onClick,
  className,
  dangerous = false,
}: MenuButtonProps) {
  const { isDark } = useTheme();

  return (
    <motion.button
      whileHover={{
        x: 3,
        backgroundColor: isDark
          ? dangerous
            ? "rgba(225, 29, 72, 0.2)"
            : "rgba(255, 255, 255, 0.07)"
          : dangerous
          ? "rgba(225, 29, 72, 0.1)"
          : "rgba(0, 0, 0, 0.05)",
      }}
      className={cn(
        "flex items-center w-full px-4 py-2.5 text-sm",
        "transition-colors border-l-2 border-transparent",
        isDark
          ? dangerous
            ? "hover:border-l-rose-500 text-rose-400"
            : "hover:border-l-indigo-500 text-white/80"
          : dangerous
          ? "hover:border-l-rose-500 text-rose-500"
          : "hover:border-l-indigo-500 text-gray-700",
        className
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "mr-3",
          isDark ? "text-white/40" : "text-gray-400",
          dangerous && (isDark ? "text-rose-400" : "text-rose-500")
        )}
      >
        {icon}
      </span>
      {label}
    </motion.button>
  );
}

export default UserMenu;
