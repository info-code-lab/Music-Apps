import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut,
  Download,
  Smartphone
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    section: "menu"
  },
  {
    name: "Tasks",
    href: "/admin/tasks",
    icon: CheckSquare,
    badge: "02",
    section: "menu"
  },
  {
    name: "Calendar",
    href: "/admin/calendar", 
    icon: Calendar,
    section: "menu"
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    section: "menu"
  },
  {
    name: "Team",
    href: "/admin/team",
    icon: Users,
    section: "menu"
  }
];

const generalItems = [
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    section: "general"
  },
  {
    name: "Help", 
    href: "/admin/help",
    icon: HelpCircle,
    section: "general"
  },
  {
    name: "Logout",
    href: "/logout",
    icon: LogOut,
    section: "general"
  }
];

export default function FloatingSidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/admin" && location === "/admin") return true;
    if (href !== "/admin" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="fixed left-4 top-4 bottom-4 w-64 bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 flex flex-col overflow-hidden">
      {/* Header with Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            </div>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white text-lg">
            Donezo
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-6">
        {/* Menu Section */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
            MENU
          </h3>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                      active
                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                    data-testid={`sidebar-${item.name.toLowerCase()}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 h-5"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* General Section */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
            GENERAL
          </h3>
          <nav className="space-y-1">
            {generalItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                      active
                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                    data-testid={`sidebar-${item.name.toLowerCase()}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile App Promotion Card */}
      <div className="p-4">
        <div className="bg-gray-900 dark:bg-gray-800 rounded-xl p-4 text-white">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Download our</h4>
              <h4 className="font-medium text-sm">Mobile App</h4>
              <p className="text-xs text-gray-300 mt-1">
                Get the mobile experience
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            data-testid="button-download-app"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}