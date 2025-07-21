import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ArrowRight, Sparkles, Target, Heart } from "lucide-react";
import { Footer } from "@/components/ui/footer-section";
import { BackgroundEffects } from "@/components/landing/BackgroundEffects";
import { StoryTimeline } from "@/components/about/StoryTimeline";
import { ValueCards } from "@/components/about/ValueCards";
import { StatsSection } from "@/components/about/StatsSection";

const About = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useSupabaseAuth();

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate("/studio");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative bg-black overflow-hidden">
      {/* Reuse optimized background effects from landing page */}
      <BackgroundEffects />

      {/* Hero section */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-white/80">About Chrono Visual</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">
              Empowering Creators Worldwide
            </h1>
            <p className="text-xl md:text-2xl text-white/60 mb-8 leading-relaxed">
              We're on a mission to democratize professional animation tools,
              making high-quality counter animations accessible to creators
              everywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-white text-black hover:bg-white/90 px-8 py-3"
              >
                Start Creating
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-gray-600 text-white hover:bg-white/10"
                onClick={() =>
                  document
                    .getElementById("story")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Our Story
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              Trusted by Creators Globally
            </h2>
            <p className="max-w-2xl mx-auto text-white/60">
              Our platform has become the go-to solution for professional
              counter animations.
            </p>
          </motion.div>
          <StatsSection />
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              Our Mission
            </h2>
            <p className="max-w-2xl mx-auto text-white/60 text-lg">
              Empowering creators with professional-grade animation tools that
              are powerful yet simple to use.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Accessibility
                </h3>
                <p className="text-white/60">
                  Making professional animation tools available to creators at
                  every level
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-sky-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Innovation
                </h3>
                <p className="text-white/60">
                  Continuously pushing the boundaries of web-based animation
                  technology
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Community
                </h3>
                <p className="text-white/60">
                  Building tools that grow with our community's needs and
                  feedback
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              Our Values
            </h2>
            <p className="max-w-xl mx-auto text-white/60">
              The principles that guide everything we build and every decision
              we make.
            </p>
          </motion.div>
          <ValueCards />
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="relative z-10 py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              Our Journey
            </h2>
            <p className="max-w-2xl mx-auto text-white/60">
              From a simple idea to a global platform serving creators
              worldwide.
            </p>
          </motion.div>
          <div className="max-w-4xl mx-auto">
            <StoryTimeline />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              Ready to Create Something Amazing?
            </h2>
            <p className="text-white/60 mb-8 text-lg">
              Join thousands of creators who trust Chrono Visual for their
              professional animations.
            </p>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-black hover:bg-white/90 px-8 py-3"
            >
              Start Creating Now
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-white/10 relative z-10 mt-20">
        <Footer />
      </div>
    </div>
  );
};

export default About;
