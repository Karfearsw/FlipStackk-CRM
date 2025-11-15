"use client"

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { LiveTime } from "@/components/ui/live-time";
import { ConnectionStatus } from "@/components/shared/connection-status";
import { ActivityNotification } from "@/components/shared/activity-notification";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <main className="main-content">
        <div className="page-container">
          <div className="content-container">
            <div className="mb-4 flex justify-between items-center">
              <LiveTime />
              <div className="flex items-center gap-3">
                <ActivityNotification />
                <ConnectionStatus />
              </div>
            </div>
            
            <div className="scrollable-page">
              {children}
            </div>
          </div>
        </div>
      </main>
      
      <BottomNav onMenuToggle={handleMenuToggle} />
    </div>
  );
}
