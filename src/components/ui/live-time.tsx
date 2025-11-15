"use client"

import { useState, useEffect } from 'react';

export function LiveTime() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true
    };
    return date.toLocaleTimeString(undefined, options);
  };
  
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return date.toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="text-center p-2 md:p-3 bg-primary/5 rounded-md text-sm md:text-base font-medium w-full">
      <div className="inline-flex items-center gap-2 md:gap-3 justify-center">
        <span className="text-primary font-semibold">{formatTime(currentTime)}</span>
        <span className="text-neutral-500 dark:text-neutral-400">|</span>
        <span>{formatDate(currentTime)}</span>
      </div>
    </div>
  );
}
