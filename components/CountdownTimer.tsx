'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Function to calculate the time difference
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      // Check if the event has already happened
      if (difference <= 0) {
        setIsExpired(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        };
      }
      
      // Calculate time units
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    // Set the initial time left
    setTimeLeft(calculateTimeLeft());

    // Set up the interval
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Clean up the interval
    return () => clearInterval(timer);
  }, [targetDate]);

  // Early return if the event has already happened
  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-900 to-red-700 rounded-xl p-4 text-white text-center shadow-lg">
        <div className="flex items-center justify-center mb-2">
          <Clock className="w-5 h-5 mr-2" />
          <h3 className="text-lg font-bold">Event Started</h3>
        </div>
        <p className="text-sm">This event is happening now!</p>
      </div>
    );
  }

  // Format the time values for display (add leading zeros)
  const formatTimeValue = (value: number): string => {
    return value < 10 ? `0${value}` : value.toString();
  };

  return (
    <div className="bg-gradient-to-r from-gray-900 to-black rounded-xl p-4 text-white shadow-lg border border-gray-800">
      <div className="flex items-center justify-center mb-2">
        <Clock className="w-5 h-5 mr-2 text-red-500" />
        <h3 className="text-lg font-bold">Event Countdown</h3>
      </div>
      
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-black/40 rounded-lg p-2">
          <div className="text-2xl font-bold">{formatTimeValue(timeLeft.days)}</div>
          <div className="text-xs text-gray-400">DAYS</div>
        </div>
        <div className="bg-black/40 rounded-lg p-2">
          <div className="text-2xl font-bold">{formatTimeValue(timeLeft.hours)}</div>
          <div className="text-xs text-gray-400">HOURS</div>
        </div>
        <div className="bg-black/40 rounded-lg p-2">
          <div className="text-2xl font-bold">{formatTimeValue(timeLeft.minutes)}</div>
          <div className="text-xs text-gray-400">MINS</div>
        </div>
        <div className="bg-black/40 rounded-lg p-2">
          <div className="text-2xl font-bold">{formatTimeValue(timeLeft.seconds)}</div>
          <div className="text-xs text-gray-400">SECS</div>
        </div>
      </div>
    </div>
  );
}
