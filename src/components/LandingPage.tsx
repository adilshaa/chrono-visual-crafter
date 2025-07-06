import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Play, Zap, Palette, Download, Users, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { cn } from "@/lib/utils";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const navigate = useNavigate();
  const [demoCounter, setDemoCounter] = useState(0);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({
    hero: false,
    features: false,
    testimonials: false,
    cta: false,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoCounter((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 50);

    // Set visibility with delay for animations
    setTimeout(() => setIsVisible((prev) => ({ ...prev, hero: true })), 100);
    setTimeout(
      () => setIsVisible((prev) => ({ ...prev, features: true })),
      600
    );
    setTimeout(
      () => setIsVisible((prev) => ({ ...prev, testimonials: true })),
      1100
    );
    setTimeout(() => setIsVisible((prev) => ({ ...prev, cta: true })), 1600);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-gray-900 text-white overflow-y-auto">
      {/* Navigation with shimmer border */}
      <nav className="flex justify-between items-center p-6 relative">
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-shimmer-gradient animate-shimmer"></div>
        <div className="text-2xl font-bold text-white flex items-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-islandblue-400 to-white">
            Timer Studio
          </span>
        </div>
        <div className="space-x-4">
          <Button
            variant="ghost"
            className="text-white hover:text-islandblue-300"
          >
            Features
          </Button>
          <Button
            variant="ghost"
            className="text-white hover:text-islandblue-300"
            onClick={() => navigate("/pricing")}
          >
            Pricing
          </Button>
          <AnimatedButton variant="outline" onClick={() => navigate("/auth")}>
            Sign In
          </AnimatedButton>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div
          className={cn(
            "text-center mb-16 transition-all duration-1000 transform",
            isVisible.hero
              ? "translate-y-0 opacity-100"
              : "translate-y-20 opacity-0"
          )}
        >
          <Badge className="mb-4 bg-black border border-islandblue-400 text-islandblue-200 px-4 py-1 animate-pulse-glow">
            Professional Studio
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-islandblue-200 to-white bg-clip-text text-transparent">
            Counter Studio Pro
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Create stunning animated counters with professional transitions,
            effects, and designs. Perfect for videos, presentations, and social
            media content.
          </p>

          {/* Demo Counter */}
          <div className="mb-12">
            <GlassCard variant="pulsing" className="max-w-md mx-auto p-8">
              <p className="text-sm text-gray-400 mb-4">Live Demo</p>
              <div className="text-6xl font-bold font-orbitron text-transparent bg-gradient-to-r from-islandblue-400 to-white bg-clip-text animate-pulse">
                {demoCounter}
              </div>
              <p className="text-sm text-gray-400 mt-4">
                Auto-counting preview
              </p>
            </GlassCard>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AnimatedButton
              onClick={onGetStarted}
              variant="glow"
              size="lg"
              className="rounded-full px-8"
            >
              Get Started Free
            </AnimatedButton>
            <AnimatedButton
              onClick={() => navigate("/pricing")}
              variant="outline"
              size="lg"
              className="rounded-full px-8"
            >
              View Pricing
            </AnimatedButton>
          </div>
        </div>

        {/* Features Grid */}
        <div
          className={cn(
            "grid md:grid-cols-3 gap-8 mb-20 transition-all duration-1000 transform",
            isVisible.features
              ? "translate-y-0 opacity-100"
              : "translate-y-20 opacity-0"
          )}
        >
          {features.map((feature, index) => (
            <GlassCard
              key={index}
              variant={
                index === 0 ? "shimmer" : index === 1 ? "breathing" : "floating"
              }
              className="p-6"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-islandblue-600 to-islandblue-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Testimonials */}
        <div
          className={cn(
            "mb-20 transition-all duration-1000 transform",
            isVisible.testimonials
              ? "translate-y-0 opacity-100"
              : "translate-y-20 opacity-0"
          )}
        >
          <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-white via-islandblue-200 to-white">
            What Creators Say
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <GlassCard
                key={index}
                variant={index === 0 ? "shimmer" : "breathing"}
                className="p-6"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-islandblue-400 text-islandblue-400"
                    />
                  ))}
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div
          className={cn(
            "text-center mb-20 relative transition-all duration-1000 transform",
            isVisible.cta
              ? "translate-y-0 opacity-100"
              : "translate-y-20 opacity-0"
          )}
        >
          <GlassCard variant="pulsing" className="p-12">
            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-islandblue-200 to-white">
              Ready to Create Amazing Counters?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Join thousands of creators using Counter Studio Pro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AnimatedButton
                onClick={onGetStarted}
                variant="glow"
                size="lg"
                className="rounded-full px-8"
              >
                Get Started Free
              </AnimatedButton>
              <AnimatedButton
                onClick={() => navigate("/auth")}
                variant="outline"
                size="lg"
                className="rounded-full px-8"
              >
                Sign In to Pro
              </AnimatedButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
