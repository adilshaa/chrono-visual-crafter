import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import OTPVerificationForm from "@/components/auth/OTPVerificationForm";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get email and type from location state
  const email = location.state?.email || "";
  const type = location.state?.type || "signup";

  const handleBack = () => {
    if (type === "signup") {
      navigate("/register");
    } else if (type === "recovery") {
      navigate("/reset-password");
    } else {
      navigate("/login");
    }
  };

  const handleSuccess = () => {
    if (type === "signup") {
      navigate("/studio");
    } else if (type === "recovery") {
      navigate("/reset-password", {
        state: {
          email,
          verified: true,
        },
      });
    } else {
      navigate("/studio");
    }
  };

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-screen overflow-hidden bg-black flex items-center justify-center p-4"
    >
      {/* Background effects - matching the existing Auth page design */}
      <div className="absolute inset-0 z-0">
        <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0">
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-[#1FB4FF] to-sky-400"></div>
          <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/10 to-sky-400"></div>
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/10 to-sky-400"></div>
        </div>
        <div className="absolute inset-0 z-0 bg-noise opacity-30"></div>

        {/* Additional gradients for more visual interest */}
        <div className="absolute bottom-0 left-0 h-[30rem] w-[30rem] rounded-full blur-[8rem] bg-gradient-to-tr from-purple-600/10 to-transparent"></div>
        <div className="absolute top-1/2 left-1/4 h-[20rem] w-[20rem] rounded-full blur-[7rem] bg-gradient-to-br from-cyan-500/10 to-transparent"></div>

        {/* Deep black overlay to maintain deep black background */}
        <div className="absolute inset-0 z-1 bg-black/50"></div>
      </div>

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Button
          variant="ghost"
          className="text-white hover:text-blue-300 flex items-center gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        <OTPVerificationForm
          email={email}
          type={type}
          onSuccess={handleSuccess}
          onBack={handleBack}
        />
      </div>
    </motion.div>
  );
};

export default VerifyOTP;
