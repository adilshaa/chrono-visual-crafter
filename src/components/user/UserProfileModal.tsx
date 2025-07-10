import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserCircle2 } from "lucide-react";
import UserProfile from "@/pages/UserProfile";

interface UserProfileModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const UserProfileModal = ({
  trigger,
  open,
  onOpenChange,
}: UserProfileModalProps) => {
  const [isLocalOpen, setIsLocalOpen] = useState(false);

  // Use either the controlled props or local state
  const isOpen = open !== undefined ? open : isLocalOpen;
  const handleOpenChange = onOpenChange || setIsLocalOpen;

  return (
    <>
      {trigger && <div onClick={() => handleOpenChange(true)}>{trigger}</div>}

      <UserProfile open={isOpen} onOpenChange={handleOpenChange} />
    </>
  );
};

export default UserProfileModal;
