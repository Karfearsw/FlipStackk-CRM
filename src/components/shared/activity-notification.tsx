"use client"

import { useState } from 'react';
import { Bell } from 'lucide-react';

export function ActivityNotification() {
  const [unread] = useState(0);

  return (
    <button 
      className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      title="Activity notifications"
    >
      <Bell className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
      {unread > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-primary rounded-full">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
