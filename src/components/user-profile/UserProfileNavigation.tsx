import React from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  LineChart,
  CreditCard as BillingIcon,
  ShieldAlert,
} from "lucide-react";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface UserProfileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobile?: boolean;
}

const navItems: NavigationItem[] = [
  { id: "overview", label: "Overview", icon: <Home className="w-4 h-4" /> },
  { id: "usage", label: "Usage", icon: <LineChart className="w-4 h-4" /> },
  {
    id: "billing",
    label: "Billing",
    icon: <BillingIcon className="w-4 h-4" />,
  },
  {
    id: "security",
    label: "Security",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
];

export const UserProfileNavigation: React.FC<UserProfileNavigationProps> = ({
  activeTab,
  onTabChange,
  isMobile = false,
}) => {
  if (isMobile) {
    return (
      <div className="lg:hidden border-b border-white/[0.08] bg-[#101010]">
        <div className="flex overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap transition-colors border-b-2 min-w-0 flex-shrink-0",
                activeTab === item.id
                  ? "border-[#2BA6FF] text-[#2BA6FF] bg-[#2BA6FF]/10"
                  : "border-transparent text-white/60 hover:text-white hover:bg-white/5"
              )}
              onClick={() => onTabChange(item.id)}
            >
              {React.cloneElement(item.icon, {
                className: "w-3.5 h-3.5 flex-shrink-0",
              })}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <nav className="flex-1 py-4">
      <ul className="space-y-1 px-2">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              className={cn(
                "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm transition-colors",
                activeTab === item.id
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
              onClick={() => onTabChange(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
