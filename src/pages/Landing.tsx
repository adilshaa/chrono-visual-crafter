import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GlassCard from "@/components/ui/glass-card";
import AuthButton from "@/components/auth/AuthButton";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  Play,
  Zap,
  Palette,
  Download,
  Users,
  Star,
  ArrowRight,
  Circle,
  ChevronRight,
  Mail,
  Instagram,
  Twitter,
  Github,
} from "lucide-react";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { StarBorder } from "@/components/ui/star-border";
import { cn } from "@/lib/utils";
import SiteHeader from "@/components/ui/site-header";
import { useTheme } from "@/contexts/ThemeContext";

const Landing = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate("/studio");
    } else {
      navigate("/auth");
    }
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "20+ Transition Effects",
      description:
        "From smooth slides to dramatic flips, create stunning counter animations",
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Professional Designs",
      description:
        "Neon glows, gradients, fire effects and more built-in designs",
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: "Export Ready",
      description: "Download as high-quality videos or optimized GIFs",
    },
  ];

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Content Creator",
      content:
        "This tool saved me hours of work. The transitions are absolutely stunning!",
      rating: 5,
    },
    {
      name: "Mark Johnson",
      role: "Video Editor",
      content:
        "Perfect for countdown timers in my projects. Love the professional quality.",
      rating: 5,
    },
  ];

  // Elegant shape component from shape-landing-hero
  const ElegantShape = ({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
  }: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
  }) => {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: -150,
          rotate: rotate - 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
          rotate: rotate,
        }}
        transition={{
          duration: 2.4,
          delay,
          ease: [0.23, 0.86, 0.39, 0.96],
          opacity: { duration: 1.2 },
        }}
        className={cn("absolute", className)}
      >
        <motion.div
          animate={{
            y: [0, 15, 0],
          }}
          transition={{
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          style={{
            width,
            height,
          }}
          className="relative"
        >
          <div
            className={cn(
              "absolute inset-0 rounded-full",
              "bg-gradient-to-r to-transparent",
              gradient,
              "backdrop-blur-[2px] border-2 border-white/[0.15]",
              "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
              "after:absolute after:inset-0 after:rounded-full",
              "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
            )}
          />
        </motion.div>
      </motion.div>
    );
  };

  const pricingPlans = [
    {
      name: "Free",
      price: "0",
      features: ["1 Project", "Basic Effects", "720p Export"],
      cta: "Start Free",
    },
    {
      name: "Pro",
      price: "19",
      isPopular: true,
      features: [
        "Unlimited Projects",
        "All Effects",
        "4K Export",
        "Priority Support",
      ],
      cta: "Get Pro",
    },
    {
      name: "Team",
      price: "49",
      features: [
        "Everything in Pro",
        "5 Team Members",
        "White Label Export",
        "API Access",
      ],
      cta: "Get Team",
    },
  ];

  return (
    <div
      className={cn(
        "min-h-screen overflow-hidden flex flex-col",
        isDark ? "bg-[#030303] text-white" : "bg-gray-50 text-gray-900"
      )}
    >
      {/* Background gradients */}
      <div
        className={cn(
          "absolute inset-0 blur-3xl",
          isDark
            ? "bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05]"
            : "bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-rose-500/[0.03]"
        )}
      />

      {/* Navigation - Using our new SiteHeader component */}
      <SiteHeader transparent={true} />

      {/* Hero Section */}
      <section className="relative z-10 min-h-[80vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <ElegantShape
            delay={0.3}
            width={600}
            height={140}
            rotate={12}
            gradient={
              isDark ? "from-indigo-500/[0.15]" : "from-indigo-500/[0.1]"
            }
            className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
          />

          <ElegantShape
            delay={0.5}
            width={500}
            height={120}
            rotate={-15}
            gradient={isDark ? "from-rose-500/[0.15]" : "from-rose-500/[0.1]"}
            className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
          />

          <ElegantShape
            delay={0.4}
            width={300}
            height={80}
            rotate={-8}
            gradient={
              isDark ? "from-violet-500/[0.15]" : "from-violet-500/[0.1]"
            }
            className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
          />

          <ElegantShape
            delay={0.6}
            width={200}
            height={60}
            rotate={20}
            gradient={isDark ? "from-amber-500/[0.15]" : "from-amber-500/[0.1]"}
            className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
          />

          <ElegantShape
            delay={0.7}
            width={150}
            height={40}
            rotate={-25}
            gradient={isDark ? "from-cyan-500/[0.15]" : "from-cyan-500/[0.1]"}
            className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              custom={0}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8 md:mb-12",
                isDark
                  ? "bg-white/[0.03] border border-white/[0.08]"
                  : "bg-black/[0.03] border border-black/[0.08]"
              )}
            >
              <Circle
                className={cn(
                  "h-2 w-2",
                  isDark ? "fill-rose-500/80" : "fill-rose-500"
                )}
              />
              <span
                className={cn(
                  "text-sm tracking-wide",
                  isDark ? "text-white/60" : "text-gray-700"
                )}
              >
                Counter Studio Pro
              </span>
            </motion.div>

            <motion.div
              custom={1}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
            >
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
                <span
                  className={cn(
                    "bg-clip-text text-transparent",
                    isDark
                      ? "bg-gradient-to-b from-white to-white/80"
                      : "bg-gradient-to-b from-gray-900 to-gray-700"
                  )}
                >
                  Create Stunning
                </span>
                <br />
                <span
                  className={cn(
                    "bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300",
                    !isDark && "from-indigo-600 via-blue-700 to-rose-500"
                  )}
                >
                  Animated Counters
                </span>
              </h1>
            </motion.div>

            <motion.div
              custom={2}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
            >
              <p
                className={cn(
                  "text-base sm:text-lg md:text-xl mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto",
                  isDark ? "text-white/40" : "text-gray-600"
                )}
              >
                Perfect for videos, presentations, and social media content with
                professional transitions, effects, and designs.
              </p>
            </motion.div>

            <motion.div
              custom={3}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.button
                onClick={handleGetStarted}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-rose-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => navigate("/pricing")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-8 py-4 rounded-full backdrop-blur-sm font-medium",
                  isDark
                    ? "border border-white/10 bg-white/5 hover:bg-white/10 text-white"
                    : "border border-black/10 bg-black/5 hover:bg-black/10 text-gray-800"
                )}
              >
                View All Features
              </motion.button>
            </motion.div>
          </div>
        </div>

        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t via-transparent pointer-events-none",
            isDark
              ? "from-[#030303] to-[#030303]/80"
              : "from-gray-50 to-gray-50/80"
          )}
        />
      </section>

      {/* Features Section */}
      <section
        id="features"
        className={cn(
          "relative z-10 py-24",
          isDark ? "bg-[#030303]" : "bg-gray-50"
        )}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className={cn(
                "text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent",
                isDark
                  ? "bg-gradient-to-r from-white to-white/80"
                  : "bg-gradient-to-r from-gray-900 to-gray-700"
              )}
            >
              Powerful Features
            </h2>
            <p
              className={cn(
                "max-w-xl mx-auto",
                isDark ? "text-white/40" : "text-gray-600"
              )}
            >
              Everything you need to create professional animated counters for
              your projects.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={cn(
                  "rounded-2xl backdrop-blur-sm p-8",
                  isDark
                    ? "border border-white/10 bg-white/5"
                    : "border border-black/5 bg-black/5"
                )}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-rose-500 rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className={isDark ? "text-white/40" : "text-gray-600"}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className={cn(
          "relative z-10 py-24",
          isDark ? "bg-[#030303]" : "bg-gray-50"
        )}
      >
        <div className="absolute right-[-10%] md:right-[-5%] top-[20%]">
          <ElegantShape
            width={300}
            height={80}
            rotate={-15}
            gradient={isDark ? "from-cyan-500/[0.1]" : "from-cyan-500/[0.07]"}
          />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className={cn(
                "text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent",
                isDark
                  ? "bg-gradient-to-r from-white to-white/80"
                  : "bg-gradient-to-r from-gray-900 to-gray-700"
              )}
            >
              What Creators Say
            </h2>
            <p
              className={cn(
                "max-w-xl mx-auto",
                isDark ? "text-white/40" : "text-gray-600"
              )}
            >
              Join thousands of content creators who love our tool.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={cn(
                  "rounded-2xl backdrop-blur-sm p-8",
                  isDark
                    ? "border border-white/10 bg-white/5"
                    : "border border-black/5 bg-black/5"
                )}
              >
                <div className="flex mb-4">
                  {Array(testimonial.rating)
                    .fill(null)
                    .map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-amber-400 fill-amber-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.45 4.73L5.82 21 12 17.27z" />
                      </svg>
                    ))}
                </div>
                <p
                  className={cn(
                    "italic mb-4",
                    isDark ? "text-white/70" : "text-gray-700"
                  )}
                >
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p
                    className={cn(
                      "text-sm",
                      isDark ? "text-white/40" : "text-gray-500"
                    )}
                  >
                    {testimonial.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className={cn(
          "relative z-10 py-24",
          isDark ? "bg-[#030303]" : "bg-gray-50"
        )}
      >
        <div className="absolute left-[-10%] md:left-[-5%] bottom-[10%]">
          <ElegantShape
            width={400}
            height={100}
            rotate={12}
            gradient={
              isDark ? "from-indigo-500/[0.1]" : "from-indigo-500/[0.07]"
            }
          />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className={cn(
                "text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent",
                isDark
                  ? "bg-gradient-to-r from-white to-white/80"
                  : "bg-gradient-to-r from-gray-900 to-gray-700"
              )}
            >
              Simple, Transparent Pricing
            </h2>
            <p
              className={cn(
                "max-w-xl mx-auto",
                isDark ? "text-white/40" : "text-gray-600"
              )}
            >
              No hidden fees. Start free and upgrade when you need more.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={cn(
                  "rounded-2xl backdrop-blur-sm flex flex-col",
                  isDark
                    ? "border border-white/10 bg-white/5"
                    : "border border-black/5 bg-black/5",
                  plan.isPopular
                    ? "ring-2 ring-indigo-500/50 scale-105 md:-mt-4 relative"
                    : ""
                )}
              >
                {plan.isPopular && (
                  <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-rose-500 px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                )}
                <div className="mb-8 p-8">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                </div>
                <div className="mb-6 px-8">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className={isDark ? "text-white/40" : "text-gray-500"}>
                    /month
                  </span>
                </div>
                <ul className="mb-8 space-y-3 px-8">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-center gap-3",
                        isDark ? "text-white/70" : "text-gray-700"
                      )}
                    >
                      <ChevronRight className="w-4 h-4 text-indigo-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto p-8">
                  <StarBorder
                    onClick={handleGetStarted}
                    color="#6366f1" // indigo-500
                    className="w-full py-3"
                  >
                    {plan.cta}
                  </StarBorder>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={cn(
          "relative z-10 pt-24 pb-12 border-t",
          isDark ? "bg-[#030303] border-white/5" : "bg-gray-50 border-black/5"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3
                className={cn(
                  "text-xl font-bold mb-6 bg-clip-text text-transparent",
                  isDark
                    ? "bg-gradient-to-r from-white to-white/80"
                    : "bg-gradient-to-r from-gray-900 to-gray-700"
                )}
              >
                Timer Studio
              </h3>
              <p
                className={cn(
                  "mb-6",
                  isDark ? "text-white/40" : "text-gray-600"
                )}
              >
                Creating professional animated counters for your content has
                never been easier.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                    isDark
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-black/5 hover:bg-black/10"
                  )}
                >
                  <Twitter
                    className={
                      isDark ? "w-4 h-4 text-white/70" : "w-4 h-4 text-gray-700"
                    }
                  />
                </a>
                <a
                  href="#"
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                    isDark
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-black/5 hover:bg-black/10"
                  )}
                >
                  <Instagram
                    className={
                      isDark ? "w-4 h-4 text-white/70" : "w-4 h-4 text-gray-700"
                    }
                  />
                </a>
                <a
                  href="#"
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                    isDark
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-black/5 hover:bg-black/10"
                  )}
                >
                  <Github
                    className={
                      isDark ? "w-4 h-4 text-white/70" : "w-4 h-4 text-gray-700"
                    }
                  />
                </a>
              </div>
            </div>
            <div>
              <h4
                className={cn(
                  "font-semibold mb-4",
                  isDark ? "text-white/90" : "text-gray-900"
                )}
              >
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className={cn(
                      "hover:text-primary transition-colors",
                      isDark ? "text-white/40" : "text-gray-600"
                    )}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={cn(
                      "hover:text-primary transition-colors",
                      isDark ? "text-white/40" : "text-gray-600"
                    )}
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={cn(
                      "hover:text-primary transition-colors",
                      isDark ? "text-white/40" : "text-gray-600"
                    )}
                  >
                    Tutorials
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={cn(
                      "hover:text-primary transition-colors",
                      isDark ? "text-white/40" : "text-gray-600"
                    )}
                  >
                    Releases
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className={cn(
                  "font-semibold mb-4",
                  isDark ? "text-white/90" : "text-gray-900"
                )}
              >
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className={cn(
                      "hover:text-primary transition-colors",
                      isDark ? "text-white/40" : "text-gray-600"
                    )}
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={cn(
                      "hover:text-primary transition-colors",
                      isDark ? "text-white/40" : "text-gray-600"
                    )}
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={cn(
                      "hover:text-primary transition-colors",
                      isDark ? "text-white/40" : "text-gray-600"
                    )}
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={cn(
                      "hover:text-primary transition-colors",
                      isDark ? "text-white/40" : "text-gray-600"
                    )}
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className={cn(
                  "font-semibold mb-4",
                  isDark ? "text-white/90" : "text-gray-900"
                )}
              >
                Legal
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className={cn(
                      "hover:text-primary transition-colors",
                      isDark ? "text-white/40" : "text-gray-600"
                    )}
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={cn(
                      "hover:text-primary transition-colors",
                      isDark ? "text-white/40" : "text-gray-600"
                    )}
                  >
                    Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={cn(
                      "hover:text-primary transition-colors",
                      isDark ? "text-white/40" : "text-gray-600"
                    )}
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center sm:text-left sm:flex sm:justify-between border-t-white/5">
            <p
              className={cn(
                "text-sm",
                isDark ? "text-white/40" : "text-gray-500"
              )}
            >
              © 2025 Timer Studio. All rights reserved.
            </p>
            <div className="mt-4 sm:mt-0">
              <a
                href="#"
                className={cn(
                  "text-sm flex items-center justify-center sm:justify-start gap-2 transition-colors",
                  isDark
                    ? "text-white/40 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Mail className="w-4 h-4" />
                contact@timerstudio.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
