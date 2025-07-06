import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface FloatingShapeProps {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
  duration?: number;
}

export const FloatingShape = ({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-indigo-500/[0.08] to-transparent",
  duration = 20,
}: FloatingShapeProps) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -50,
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
      className={cn("absolute pointer-events-none", className)}
    >
      <motion.div
        animate={{
          y: [0, 15, -15, 0],
        }}
        transition={{
          duration,
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
            "bg-gradient-to-r",
            gradient,
            "backdrop-blur-[2px] border border-white/[0.1]",
            "shadow-[0_8px_32px_0_rgba(31,38,135,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
};

interface StudioBackgroundProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
  animated?: boolean;
}

export function StudioBackground({
  className,
  intensity = "medium",
  animated = true,
}: StudioBackgroundProps) {
  // Determine number of shapes based on intensity
  const shapeCount = intensity === "low" ? 3 : intensity === "medium" ? 5 : 8;

  // Generate shapes based on intensity
  const shapes = [];
  for (let i = 0; i < shapeCount; i++) {
    const width = Math.floor(Math.random() * 300) + 100; // 100-400
    const height = Math.floor(width / (Math.random() * 2 + 1.5)); // Aspect ratio between 1.5-3.5
    const rotate = Math.floor(Math.random() * 60) - 30; // -30 to 30 degrees
    const delay = i * 0.2;

    // Randomize position
    const top = `${Math.floor(Math.random() * 90)}%`;
    const left = `${Math.floor(Math.random() * 90)}%`;

    // Choose gradient type
    const gradientColors = [
      "from-indigo-500/[0.08] to-transparent",
      "from-rose-500/[0.08] to-transparent",
      "from-violet-500/[0.08] to-transparent",
      "from-blue-500/[0.08] to-transparent",
      "from-cyan-500/[0.08] to-transparent",
    ];

    const gradient =
      gradientColors[Math.floor(Math.random() * gradientColors.length)];

    shapes.push(
      <FloatingShape
        key={i}
        width={width}
        height={height}
        rotate={rotate}
        delay={delay}
        gradient={gradient}
        className={`absolute top-[${top}] left-[${left}]`}
        style={{ top, left }}
      />
    );
  }

  return (
    <div className={cn("absolute inset-0 overflow-hidden z-0", className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-rose-500/[0.03]" />

      {/* Animated background shapes */}
      {animated && (
        <div className="absolute inset-0">
          {shapes.map((shape, i) => (
            <FloatingShape
              key={i}
              width={shape.props.width}
              height={shape.props.height}
              rotate={shape.props.rotate}
              delay={shape.props.delay}
              gradient={shape.props.gradient}
              className={`absolute`}
              style={{
                top: shape.props.style?.top,
                left: shape.props.style?.left,
              }}
            />
          ))}
        </div>
      )}

      {/* Overlay to soften shapes */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
    </div>
  );
}
