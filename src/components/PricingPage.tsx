import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval_type: string;
  features: string[];
  paddle_price_id?: string;
}

interface PricingPageProps {
  onClose: () => void;
  onSelectPlan: (plan: Plan) => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onClose, onSelectPlan }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;

      setPlans(
        data.map((plan) => ({
          ...plan,
          features: Array.isArray(plan.features)
            ? plan.features
            : JSON.parse(plan.features as string),
        }))
      );
    } catch (error: any) {
      toast({
        title: "Error loading plans",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    if (!user && plan.price > 0) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to a paid plan.",
        variant: "destructive",
      });
      return;
    }
    onSelectPlan(plan);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-white">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl my-8">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl z-10"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-300 text-lg">
            Unlock powerful features to enhance your timer experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card
              key={plan.id}
              className={`relative bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl transition-all duration-300 hover:scale-105 ${
                index === 1 ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {index === 1 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center space-y-4">
                <CardTitle className="text-2xl font-bold text-white">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {plan.description}
                </CardDescription>

                <div className="space-y-2">
                  <div className="text-4xl font-bold text-white">
                    ${plan.price}
                    {plan.price > 0 && (
                      <span className="text-lg font-normal text-gray-300">
                        /{plan.interval_type}
                      </span>
                    )}
                  </div>
                  {plan.price === 0 && (
                    <div className="text-sm text-gray-400">Forever free</div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full font-medium py-2 px-4 rounded-md transition-all duration-200 transform hover:scale-105 ${
                    plan.price === 0
                      ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                      : index === 1
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      : "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                  }`}
                >
                  {plan.price === 0 ? "Get Started" : "Subscribe Now"}
                </Button>

                <div className="space-y-3">
                  <h4 className="font-semibold text-white">
                    Features included:
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-gray-300"
                      >
                        <Check className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            All plans include a 30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
