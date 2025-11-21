"use client"

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  UserSearch,
  Phone,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Map,
  Calculator,
  X,
  Clock,
  FileText,
  LifeBuoy,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Video,
  BookOpen,
  Megaphone
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  return name.split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ open, onOpenChange, collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [avatarError, setAvatarError] = useState(false);
  
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth');
  };
  
  const navItems = [
    { href: "/dashboard", icon: <LayoutDashboard className="mr-3 text-lg" />, label: "Dashboard" },
    { href: "/pipeline", icon: <BarChart3 className="mr-3 text-lg" />, label: "Pipeline" },
    { href: "/leads", icon: <UserSearch className="mr-3 text-lg" />, label: "Leads" },
    { href: "/communication", icon: <MessageCircle className="mr-3 text-lg" />, label: "Communication" },
    { href: "/communication/video", icon: <Video className="mr-3 text-lg" />, label: "Video" },
    { href: "/marketing-automation", icon: <Megaphone className="mr-3 text-lg" />, label: "Marketing" },
    { href: "/calls", icon: <Phone className="mr-3 text-lg" />, label: "Calls" },
    { href: "/team", icon: <Users className="mr-3 text-lg" />, label: "Team" },
    { href: "/map", icon: <Map className="mr-3 text-lg" />, label: "Property Map" },
    { href: "/calculator", icon: <Calculator className="mr-3 text-lg" />, label: "Calculator" },
    { href: "/timesheets", icon: <Clock className="mr-3 text-lg" />, label: "Timesheets" },
    { href: "/analytics", icon: <BarChart3 className="mr-3 text-lg" />, label: "Analytics" },
    { href: "/documentation", icon: <FileText className="mr-3 text-lg" />, label: "Documentation" },
    { href: "/training", icon: <BookOpen className="mr-3 text-lg" />, label: "Training" },
    { href: "/help", icon: <LifeBuoy className="mr-3 text-lg" />, label: "Help Center" },
    { href: "/error-guidance", icon: <AlertTriangle className="mr-3 text-lg" />, label: "Error Guidance" },
    { href: "/error-examples", icon: <LifeBuoy className="mr-3 text-lg" />, label: "Error Examples" },
    { href: "/settings", icon: <Settings className="mr-3 text-lg" />, label: "Settings" },
  ];
  
  return (
    <aside 
      className={cn(
        `sidebar ${collapsed ? "w-20" : "w-64"} bg-white dark:bg-neutral-900 shadow-md fixed inset-y-0 left-0 z-40 transform transition-transform duration-300`,
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            {collapsed ? (
              <img
                src="/flipstackk_mark.jpg"
                width={56}
                height={56}
                alt="FlipStackk"
                className="h-14 w-14 rounded-sm object-contain"
                loading="eager"
              />
            ) : (
              <h1 className="text-lg font-bold text-primary">FlipStackk</h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => onCollapsedChange?.(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
            <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            {user?.id && !avatarError ? (
              <img
                src={`/uploads/user-${user.id}.jpg`}
                width={40}
                height={40}
                alt="Avatar"
                className="h-10 w-10 rounded-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="flex-shrink-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold">{user ? getInitials(user.name) : "??"}</span>
              </div>
            )}
            {!collapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{user?.name || "User"}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize truncate">{user?.email || "No email"}</p>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 scroll-smooth custom-scrollbar">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <div 
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer",
                      pathname === item.href
                        ? "bg-primary bg-opacity-10 text-primary"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    {item.icon}
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          {!collapsed && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Theme</span>
              <ThemeToggle />
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <LogOut className="mr-3 text-lg" />
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <div className="h-7 w-7 flex items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          d="M3 11l9-7 9 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />
        <path
          d="M5 20V12h14v8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />
        <path
          d="M13 8l4 0 0 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />
      </svg>
    </div>
  );
}
