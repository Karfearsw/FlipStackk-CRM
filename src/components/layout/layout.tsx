"use client"

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import dynamic from "next/dynamic";
import { ConnectionStatus } from "@/components/shared/connection-status";
import { NotificationCenter } from "@/components/communication/notification-center";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = window.localStorage.getItem("sidebar:collapsed");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const LiveTimeClient = dynamic(() => import("@/components/ui/live-time").then(m => m.LiveTime), { ssr: false });
  
  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} collapsed={sidebarCollapsed} onCollapsedChange={(c)=>{setSidebarCollapsed(c); try{window.localStorage.setItem("sidebar:collapsed", String(c));}catch{}}} />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <main className={`main-content ${sidebarCollapsed ? "md:ml-[5rem]" : "md:ml-[16rem]"} sm:ml-0`}>
        <div className="page-container">
          <div className="content-container">
            <div className="mb-2 flex justify-between items-center">
              <LiveTimeClient />
              <div className="flex items-center gap-3">
                <NotificationCenter />
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
