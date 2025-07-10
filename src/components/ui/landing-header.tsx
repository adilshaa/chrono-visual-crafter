import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import AuthButton from "@/components/auth/AuthButton";
import ThemeToggle from "@/components/theme/ThemeToggle";

function NavItem({ label, href }: { label: string; href?: string }) {
  return (
    <a
      href={href}
      className="flex items-center text-sm text-gray-300 hover:text-white"
    >
      <span>{label}</span>
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

export const LandingHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

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
    <>
      {/* Navigation */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 mx-auto flex items-center justify-between px-4 py-4 transition-colors duration-300 ${
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
            {/* <NavItem label="Features" href="#features" />
            <NavItem label="Testimonials" href="#testimonials" /> */}
            <NavItem label="Pricing" href="#pricing" />
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

      {/* Mobile Navigation Menu */}
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
              {/* <MobileNavItem label="Features" href="#features" />
              <MobileNavItem label="Testimonials" href="#testimonials" /> */}
              <MobileNavItem label="Pricing" href="#pricing" />
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
    </>
  );
};
