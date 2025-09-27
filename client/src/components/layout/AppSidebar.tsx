import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Target,
  BarChart3,
  Settings,
  ChevronDown,
  Zap,
  FileText,
  TrendingUp,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, roles: ['admin'] },
  { title: "DashBoard", url: "/publisher", icon: Users, roles: ['publisher', 'admin'] },
  { title: "DashBoard", url: "/advertiser", icon: Megaphone, roles: ['advertiser', 'admin'] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ['publisher', 'advertiser', 'admin'] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ['publisher', 'advertiser', 'admin'] },
];

const publisherNavItems = [
  { title: "My Content", url: "/publisher", icon: FileText },
  { title: "Performance", url: "/reports", icon: TrendingUp },
  { title: "Compliance", url: "/matching", icon: Shield },
];

const advertiserNavItems = [
  { title: "Campaigns", url: "/advertiser", icon: Megaphone },
  { title: "Analytics", url: "/reports", icon: TrendingUp },
  { title: "Targeting", url: "/matching", icon: Target },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { userType, isLoggedIn } = useUser();

  const isCollapsed = state === "collapsed";
  const isActive = (path: string) => currentPath === path;
  const getNavClass = (path: string) =>
    isActive(path)
      ? "bg-gradient-mixed text-primary-foreground font-medium shadow-glow"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  // Filter navigation items based on user role (no cross-role leakage)
  const getVisibleNavItems = () => {
    if (!isLoggedIn || !userType) return [];
    return mainNavItems.filter(item => item.roles.includes(userType));
  };

  // Get role-specific navigation items
  const getRoleSpecificItems = () => {
    if (userType === 'publisher') return publisherNavItems;
    if (userType === 'advertiser') return advertiserNavItems;
    return [];
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-mixed rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-semibold text-sidebar-accent-foreground">
                Prachaar AI
              </h1>
              <p className="text-xs text-sidebar-foreground">
                {userType ? `${userType.charAt(0).toUpperCase() + userType.slice(1)} Portal` : 'Prachaar AI Platform'}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-wider text-xs">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getVisibleNavItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Role-specific Navigation removed */}

        {/* Logout button removed from sidebar */}
      </SidebarContent>
    </Sidebar>
  );
}