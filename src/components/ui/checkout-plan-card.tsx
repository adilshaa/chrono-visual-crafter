"use client";

import React from "react";
import { Badge } from "./badge";
import { BorderTrail } from "./border-trail";
import { cn } from "@/lib/utils";

interface CheckoutPlanCardProps {
  name: string;
  description: string;
  price: number;
  features: string[];
  isPopular?: boolean;
  className?: string;
  paddleData?: any;
}

export function CheckoutPlanCard({
  name,
  description,
  price,
  features,
  isPopular = false,
  className,
  paddleData,
}: CheckoutPlanCardProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border px-6 pt-6 pb-6",
        isPopular
          ? "border-cyan-400/50 bg-gradient-to-br from-cyan-400/10 to-blue-500/10"
          : "border-white/20 bg-white/10 backdrop-blur-sm",
        className
      )}
    >
      {isPopular && (
        <BorderTrail
          style={{
            boxShadow:
              "0px 0px 60px 30px rgb(6 182 212 / 20%), 0 0 100px 60px rgb(6 182 212 / 10%)",
          }}
          size={100}
          className="bg-gradient-to-r from-cyan-400 to-blue-500"
        />
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">{name}</h3>
            {isPopular && (
              <Badge className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-0">
                Most Popular
              </Badge>
            )}
            {price === 0 && (
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                Free Forever
              </Badge>
            )}
          </div>
          <p className="text-white/80 text-sm leading-relaxed">{description}</p>
        </div>

        {/* Price */}
        <div className="text-center py-4">
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className="text-4xl font-light text-white">
              {paddleData
                ? `${
                    paddleData.currency_code
                  } ${paddleData.totals.subtotal.toFixed(2)}`
                : `$${price.toFixed(2)}`}
            </span>
            <span className="text-white/70 text-sm">per month</span>
          </div>
          {paddleData && (
            <div className="flex flex-col items-center justify-center gap-1 mt-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-white/80 text-sm">Tax:</span>
                <span className="text-white text-sm font-medium">
                  {paddleData.currency_code} {paddleData.totals.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-white/80 text-sm">Total:</span>
                <span className="text-white text-sm font-medium">
                  {paddleData.currency_code}{" "}
                  {paddleData.totals.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
          {!paddleData && price > 0 && (
            <div className="flex items-center justify-center gap-2">
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-medium">
                Save 33%
              </span>
              <span className="text-white/60 text-sm">with annual billing</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
