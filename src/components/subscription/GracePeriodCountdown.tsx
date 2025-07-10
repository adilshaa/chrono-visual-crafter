import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface GracePeriodCountdownProps {
  endDate: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const GracePeriodCountdown: React.FC<GracePeriodCountdownProps> = ({ endDate }) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-red-400">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">Grace period expired</span>
      </div>
    );
  }

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-amber-200">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">Time remaining to reactivate:</span>
      </div>
      
      <div className="flex gap-2">
        {timeRemaining.days > 0 && (
          <motion.div
            key={timeRemaining.days}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="bg-amber-500/20 rounded-lg px-3 py-2 text-center min-w-[60px]"
          >
            <div className="text-lg font-bold text-amber-200">{formatNumber(timeRemaining.days)}</div>
            <div className="text-xs text-amber-200/60">days</div>
          </motion.div>
        )}
        
        <motion.div
          key={timeRemaining.hours}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="bg-amber-500/20 rounded-lg px-3 py-2 text-center min-w-[60px]"
        >
          <div className="text-lg font-bold text-amber-200">{formatNumber(timeRemaining.hours)}</div>
          <div className="text-xs text-amber-200/60">hours</div>
        </motion.div>
        
        <motion.div
          key={timeRemaining.minutes}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="bg-amber-500/20 rounded-lg px-3 py-2 text-center min-w-[60px]"
        >
          <div className="text-lg font-bold text-amber-200">{formatNumber(timeRemaining.minutes)}</div>
          <div className="text-xs text-amber-200/60">mins</div>
        </motion.div>
        
        <motion.div
          key={timeRemaining.seconds}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="bg-amber-500/20 rounded-lg px-3 py-2 text-center min-w-[60px]"
        >
          <div className="text-lg font-bold text-amber-200">{formatNumber(timeRemaining.seconds)}</div>
          <div className="text-xs text-amber-200/60">secs</div>
        </motion.div>
      </div>
    </div>
  );
};