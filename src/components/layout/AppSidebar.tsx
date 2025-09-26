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

const mainNavItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, roles: ['admin'] },
  { title: "Publisher", url: "/publisher", icon: Users, roles: ['publisher', 'admin'] },
  { title: "Advertiser", url: "/advertiser", icon: Megaphone, roles: ['advertiser', 'admin'] },
  { title: "Matching", url: "/matching", icon: Target, roles: ['publisher', 'advertiser', 'admin'] },
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

  // Filter navigation items based on user role
  const getVisibleNavItems = () => {
    if (!isLoggedIn || !userType) return [];
    
    return mainNavItems.filter(item => 
      item.roles.includes(userType) || item.roles.includes('admin')
    );
  };

  // Get role-specific navigation items
  const getRoleSpecificItems = () => {
    if (userType === 'publisher') return publisherNavItems;
    if (userType === 'advertiser') return advertiserNavItems;
    return [];
  };

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-72"} collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-mixed rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-semibold text-sidebar-accent-foreground">
                Dual-Score
              </h1>
              <p className="text-xs text-sidebar-foreground">
                {userType ? `${userType.charAt(0).toUpperCase() + userType.slice(1)} Portal` : 'AdTech Platform'}
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

        {/* Role-specific Navigation */}
        {!isCollapsed && getRoleSpecificItems().length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-wider text-xs">
              {userType === 'publisher' ? 'Publisher Tools' : 'Advertiser Tools'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {getRoleSpecificItems().map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={getNavClass(item.url)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="ml-2">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}