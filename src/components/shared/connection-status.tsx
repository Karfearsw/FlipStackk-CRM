"use client"

import { Signal, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";

export function ConnectionStatus() {
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const handleOnline = () => setConnected(true);
    const handleOffline = () => setConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setConnected(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center" title={connected ? "Connected" : "Disconnected"}>
      {connected ? (
        <Signal className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      )}
    </div>
  );
}
