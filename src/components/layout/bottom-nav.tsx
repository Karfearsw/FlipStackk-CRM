"use client"

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  UserSearch,
  Phone,
  Menu,
  BarChart3,
  Calculator,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BottomNavProps {
  onMenuToggle?: () => void;
}

export function BottomNav({ onMenuToggle }: BottomNavProps) {
  const pathname = usePathname();
  
  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/leads", icon: UserSearch, label: "Leads" },
    { href: "/calls", icon: Phone, label: "Calls" },
    { href: "/communication", icon: MessageCircle, label: "Messages" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 z-20 h-16">
      <div className="grid grid-cols-6 h-full">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className="flex flex-col items-center justify-center"
          >
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-2 w-full h-full",
                pathname === item.href
                  ? "text-primary"
                  : "text-neutral-500 dark:text-neutral-400",
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
        
        <Button
          variant="ghost"
          className="flex flex-col items-center justify-center gap-1 px-2 h-full w-full rounded-none text-neutral-500 hover:text-primary dark:text-neutral-400"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs font-medium">Menu</span>
        </Button>
      </div>
    </div>
  );
}
