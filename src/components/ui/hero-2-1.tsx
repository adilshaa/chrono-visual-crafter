"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import AuthButton from "@/components/auth/AuthButton";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/theme/ThemeToggle";

const Hero2 = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate("/studio");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Gradient background with grain effect */}
      <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0 ">
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/10 to-[#1FB4FF]/10"></div>
        <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-[#1FB4FF] to-[#1FB4FF]/40"></div>
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-[#1FB4FF]/50 to-[#1FB4FF]/10"></div>
      </div>
      <div className="absolute inset-0 z-0 bg-noise opacity-30"></div>

      {/* Deep black overlay to maintain deep black background */}
      <div className="absolute inset-0 z-1 bg-black/50"></div>

      {/* Content container */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav
          className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-4 mx-auto transition-colors duration-300 ${
            scrolled
              ? "bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-transparent"
              : "bg-transparent"
          }`}
        >
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
              <span className="font-bold">⚡</span>
            </div>
            <span className="ml-2 text-xl font-bold text-white">
              Chrono Visual
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-6">
              <NavItem label="Features" href="#features" />
              <NavItem label="Testimonials" href="#testimonials" />
              <NavItem label="Pricing" href="/pricing" />
              <NavItem label="Studio" href="/studio" />
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </nav>

        {/* Mobile Navigation Menu with animation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex flex-col p-4 bg-black/95 md:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">
                    <span className="font-bold">⚡</span>
                  </div>
                  <span className="ml-2 text-xl font-bold text-white">
                    Chrono Visual
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="mt-8 flex flex-col space-y-6">
                <MobileNavItem label="Features" href="#features" />
                <MobileNavItem label="Testimonials" href="#testimonials" />
                <MobileNavItem label="Pricing" href="/pricing" />
                <MobileNavItem label="Studio" href="/studio" />
                <div className="pt-4 flex items-center justify-between">
                  <ThemeToggle />
                </div>
                <button
                  onClick={handleGetStarted}
                  className="h-12 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        <div className="mx-auto mt-6 flex max-w-fit items-center justify-center space-x-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
          <span className="text-sm font-medium text-white">
            Create stunning animated counters
          </span>
          <ArrowRight className="h-4 w-4 text-white" />
        </div>

        {/* Hero section */}
        <div className="container mx-auto mt-12 px-4 text-center">
          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">
              Create Stunning Animated Counters
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            Perfect for videos, presentations, and social media content with
            professional transitions, effects, and designs.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button
              onClick={handleGetStarted}
              className="h-12 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90"
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate("/pricing")}
              className="h-12 rounded-full border border-gray-600 px-8 text-base font-medium text-white hover:bg-white/10"
            >
              View All Features
            </button>
          </div>

          <div className="relative mx-auto my-20 w-full max-w-6xl">
            <div className="absolute inset-0 rounded shadow-lg bg-white blur-[10rem] bg-grainy opacity-20" />

            {/* Hero Image */}
            <img
              src="/studio.png"
              alt="Counter Animation Studio"
              className="relative w-full h-auto shadow-md rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function NavItem({
  label,
  hasDropdown,
  href,
}: {
  label: string;
  hasDropdown?: boolean;
  href?: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center text-sm text-gray-300 hover:text-white"
    >
      <span>{label}</span>
      {hasDropdown && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      )}
    </a>
  );
}

function MobileNavItem({ label, href }: { label: string; href?: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-gray-400" />
    </a>
  );
}

export { Hero2 };
export default Hero2;
