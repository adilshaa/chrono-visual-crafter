import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval_type: string;
  features: string[];
  paddle_product_id?: string;
}

interface CheckoutPageProps {
  plan: Plan;
  onBack: () => void;
  onClose: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ plan, onBack, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to complete your purchase.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // This would typically integrate with Paddle's checkout
      // For demo purposes, we'll simulate the process
      toast({
        title: "Checkout initiated",
        description: "Redirecting to Paddle checkout...",
      });

      // Simulate checkout process
      setTimeout(() => {
        toast({
          title: "Subscription activated!",
          description: `Welcome to ${plan.name}! Your subscription is now active.`,
        });
        onClose();
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const tax = plan.price * 0.1; // 10% tax simulation
  const total = plan.price + tax;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl z-10"
        >
          ✕
        </button>
        
        <div className="text-center mb-8">
          <Button
            onClick={onBack}
            className="absolute left-0 top-0 bg-white/20 hover:bg-white/30 text-white border border-white/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>
          
          <h1 className="text-4xl font-bold text-white mb-4">Complete Your Order</h1>
          <p className="text-gray-300 text-lg">
            Review your subscription details and complete payment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-white/5 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    <p className="text-gray-300 text-sm">{plan.description}</p>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300">
                    ${plan.price}/{plan.interval_type}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Included features:</h4>
                  <ul className="space-y-1">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-300 text-sm">
                        <Check className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-gray-400 text-sm ml-5">
                        +{plan.features.length - 4} more features
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="space-y-3 border-t border-white/20 pt-4">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>${plan.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-semibold text-lg border-t border-white/20 pt-3">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Billing Information
              </CardTitle>
              <CardDescription className="text-gray-300">
                Your subscription will be processed securely through Paddle
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {user && (
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-white">Account Details</h4>
                  <p className="text-gray-300 text-sm">Email: {user.email}</p>
                  {profile?.full_name && (
                    <p className="text-gray-300 text-sm">Name: {profile.full_name}</p>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-300">Secure Payment</h4>
                      <p className="text-blue-200 text-sm">
                        Your payment is secured by Paddle with 256-bit SSL encryption
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-400 mr-2" />
                    Cancel anytime, no hidden fees
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-400 mr-2" />
                    30-day money-back guarantee
                  </div>
                  <div className="flex items-center">
                    <Check className="w-4 h-4 text-green-400 mr-2" />
                    Instant access to all features
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-md transition-all duration-200 transform hover:scale-105"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Complete Purchase - ${total.toFixed(2)}
                  </>
                )}
              </Button>
              
              <p className="text-gray-400 text-xs text-center">
                By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                Your subscription will automatically renew each {plan.interval_type}.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;