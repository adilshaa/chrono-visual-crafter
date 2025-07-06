import React, { useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/glass-card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Auth = () => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-gray-900 flex items-center justify-center p-4">
      <div className="absolute top-6 left-6">
        <Button
          variant="ghost"
          className="text-white hover:text-islandblue-300 flex items-center gap-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Button>
      </div>

      <div className="w-full max-w-md">
        <GlassCard variant="breathing" className="relative overflow-hidden p-4">
          {/* Animated background particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-islandblue-400/30"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${
                  Math.random() * 10 + 5
                }s infinite ease-in-out ${Math.random() * 5}s`,
              }}
            />
          ))}

          {/* Shimmer border */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-shimmer-gradient animate-shimmer"></div>
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-shimmer-gradient animate-shimmer"></div>
          <div className="absolute inset-y-0 left-0 w-[1px] bg-shimmer-gradient animate-shimmer"></div>
          <div className="absolute inset-y-0 right-0 w-[1px] bg-shimmer-gradient animate-shimmer"></div>

          <div className="relative z-10 mb-6 text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-islandblue-200 to-white bg-clip-text text-transparent mb-2">
              Welcome to Timer Studio
            </h1>
            <p className="text-gray-400">
              {activeTab === "signin"
                ? "Sign in to continue your journey"
                : "Create an account to get started"}
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "signin" | "signup")
            }
            className="relative z-10"
          >
            <TabsList className="grid w-full grid-cols-2 bg-black/40 backdrop-blur-md mb-6 border border-gray-800">
              <TabsTrigger
                value="signin"
                className="data-[state=active]:bg-islandblue-900/50 data-[state=active]:border-b data-[state=active]:border-islandblue-400"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-islandblue-900/50 data-[state=active]:border-b data-[state=active]:border-islandblue-400"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-0">
              <SignIn
                appearance={{
                  elements: {
                    formButtonPrimary:
                      "bg-islandblue-600 hover:bg-islandblue-700 text-sm normal-case",
                    footerActionLink: "text-islandblue-400",
                    card: "bg-transparent shadow-none",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton:
                      "border border-gray-700 bg-black hover:bg-islandblue-900/30 text-white",
                    formFieldInput:
                      "bg-black/60 border-gray-700 text-white focus:border-islandblue-400/70",
                    formFieldLabel: "text-gray-300",
                    formFieldLabelRow: "text-gray-300",
                    identityPreview: "bg-black/40 border border-gray-700",
                  },
                }}
                signUpUrl={null}
                afterSignInUrl="/studio"
                routing="virtual"
              />
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <SignUp
                appearance={{
                  elements: {
                    formButtonPrimary:
                      "bg-islandblue-600 hover:bg-islandblue-700 text-sm normal-case",
                    footerActionLink: "text-islandblue-400",
                    card: "bg-transparent shadow-none",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton:
                      "border border-gray-700 bg-black hover:bg-islandblue-900/30 text-white",
                    formFieldInput:
                      "bg-black/60 border-gray-700 text-white focus:border-islandblue-400/70",
                    formFieldLabel: "text-gray-300",
                    formFieldLabelRow: "text-gray-300",
                  },
                }}
                signInUrl={null}
                afterSignUpUrl="/studio"
                routing="virtual"
              />
            </TabsContent>
          </Tabs>
        </GlassCard>
      </div>
    </div>
  );
};

export default Auth;
