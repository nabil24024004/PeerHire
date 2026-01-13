import { ReactNode, useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, Radio, MessageSquare,
  Wallet, Settings, Bell, Search, LogOut, User, Pin, PinOff, Menu, X
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationPanel } from "@/components/NotificationPanel";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "freelancer" | "hirer";
}

export const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(() => {
    const stored = localStorage.getItem("sidebarPinned");
    return stored === "true";
  });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Memoize current path to prevent re-renders
  const currentPath = location.pathname;

  // Batch fetch counts for better performance
  const fetchCounts = useCallback(async (userId: string) => {
    try {
      const [messagesResult, notificationsResult] = await Promise.all([
        (supabase as any)
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userId)
          .eq('read', false),
        (supabase as any)
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('read', false)
      ]);

      setUnreadCount(messagesResult.count || 0);
      setNotificationCount(notificationsResult.count || 0);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  }, []);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (profileData?.full_name) {
          setUserName(profileData.full_name);
        }
        if (profileData?.avatar_url) {
          setAvatarUrl(profileData.avatar_url);
        }

        // Load initial counts in parallel
        fetchCounts(session.user.id);

        // Set up real-time subscription for profile changes
        const profileChannel = supabase
          .channel('profile-changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${session.user.id}`,
            },
            (payload) => {
              if (payload.new.full_name) {
                setUserName(payload.new.full_name);
              }
              // Update avatar in real-time
              setAvatarUrl(payload.new.avatar_url || null);
            }
          )
          .subscribe();

        // Set up real-time subscription for messages
        const messagesChannel = supabase
          .channel('messages-unread')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages',
            },
            () => {
              fetchCounts(session.user.id);
            }
          )
          .subscribe();

        // Set up real-time subscription for notifications
        const notificationsChannel = supabase
          .channel('notifications-unread')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${session.user.id}`,
            },
            () => {
              fetchCounts(session.user.id);
            }
          )
          .subscribe();

        cleanupFn = () => {
          supabase.removeChannel(profileChannel);
          supabase.removeChannel(messagesChannel);
          supabase.removeChannel(notificationsChannel);
        };
      }
    };

    fetchUserProfile();

    return () => {
      cleanupFn?.();
    };
  }, [fetchCounts]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleSidebarMouseEnter = () => {
    if (!isPinned) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setIsExpanded(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (!isPinned) {
      const timeout = setTimeout(() => {
        setIsExpanded(false);
      }, 300);
      setHoverTimeout(timeout);
    }
  };

  const togglePin = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    localStorage.setItem("sidebarPinned", String(newPinned));
    if (newPinned) {
      setIsExpanded(true);
    }
  };

  useEffect(() => {
    if (isPinned) {
      setIsExpanded(true);
    }
  }, [isPinned]);

  // Memoize menu items to prevent re-renders
  const menuItems = useMemo(() => {
    const freelancerMenuItems = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/freelancer/dashboard" },
      { icon: Search, label: "Find Work", path: "/freelancer/browse-jobs" },
      { icon: User, label: "Profile", path: "/freelancer/profile" },
      { icon: Briefcase, label: "My Jobs", path: "/freelancer/jobs" },
      { icon: MessageSquare, label: "Messages", path: "/freelancer/messages", badge: unreadCount > 0 ? unreadCount.toString() : undefined },
      { icon: Wallet, label: "Payments", path: "/freelancer/payments" },
      { icon: Settings, label: "Settings", path: "/freelancer/settings" },
    ];

    const hirerMenuItems = [
      { icon: LayoutDashboard, label: "Dashboard", path: "/hirer/dashboard" },
      { icon: User, label: "Profile", path: "/hirer/profile" },
      { icon: Briefcase, label: "My Tasks", path: "/hirer/tasks" },
      { icon: Radio, label: "Live Board", path: "/hirer/live-board" },
      { icon: MessageSquare, label: "Messages", path: "/hirer/messages", badge: unreadCount > 0 ? unreadCount.toString() : undefined },
      { icon: Wallet, label: "Payments", path: "/hirer/payments" },
      { icon: Settings, label: "Settings", path: "/hirer/settings" },
    ];

    return role === "freelancer" ? freelancerMenuItems : hirerMenuItems;
  }, [role, unreadCount]);

  const sidebarExpanded = isPinned || isExpanded;

  const renderNavItems = (inDrawer = false) => (
    <>
      {menuItems.map((item, idx) => {
        const isActive = currentPath === item.path;
        const navButton = (
          <button
            key={idx}
            onClick={() => {
              navigate(item.path);
              if (inDrawer) setIsMobileMenuOpen(false);
            }}
            aria-current={isActive ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive
              ? role === "freelancer"
                ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-400 border border-green-500/20"
                : "bg-gradient-to-r from-purple-500/20 to-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive
              ? role === "freelancer"
                ? "bg-green-500/20"
                : "bg-primary/20"
              : "bg-white/5 group-hover:bg-white/10"
              }`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
            </div>

            {(sidebarExpanded || inDrawer) && (
              <span className="font-medium text-sm flex-1 text-left whitespace-nowrap">
                {item.label}
              </span>
            )}

            {(sidebarExpanded || inDrawer) && item.badge && (
              <Badge className={`text-xs px-2 py-0.5 ${role === "freelancer" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-primary/20 text-primary border-primary/30"}`}>
                {item.badge}
              </Badge>
            )}
          </button>
        );

        if (!sidebarExpanded && !inDrawer) {
          return (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>{navButton}</TooltipTrigger>
              <TooltipContent side="right" className="bg-card text-foreground border-white/10">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        }

        return navButton;
      })}
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background flex w-full">
        {/* Desktop Sidebar - Hidden on mobile */}
        {!isMobile && (
          <aside
            className={`bg-card/80 backdrop-blur-xl border-r border-white/5 flex-shrink-0 sticky top-0 h-screen transition-all duration-300 ease-in-out ${sidebarExpanded ? "w-64" : "w-20"
              }`}
            onMouseEnter={handleSidebarMouseEnter}
            onMouseLeave={handleSidebarMouseLeave}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex flex-col h-full p-4">
              {/* Logo */}
              <div className="mb-6 flex items-center justify-center">
                <button
                  onClick={() => navigate("/")}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                >
                  {sidebarExpanded ? (
                    <h1 className={`text-2xl font-black whitespace-nowrap ${role === "freelancer" ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-purple-400 to-primary"} bg-clip-text text-transparent`}>
                      PeerHire
                    </h1>
                  ) : (
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-primary/20 border border-white/10">
                      <img src="/logo.png" alt="P" className="w-full h-full object-cover" />
                    </div>
                  )}
                </button>
              </div>

              {/* Nav Items */}
              <nav className="space-y-1 flex-1">
                {renderNavItems(false)}
              </nav>

              {/* Pin & Logout Section */}
              <div className="border-t border-white/5 pt-4 space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={togglePin}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isPinned
                        ? role === "freelancer"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPinned ? "bg-primary/20" : "bg-white/5"}`}>
                        {isPinned ? (
                          <Pin className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <PinOff className="w-4 h-4 flex-shrink-0" />
                        )}
                      </div>
                      {sidebarExpanded && (
                        <span className="font-medium text-sm text-left whitespace-nowrap">
                          {isPinned ? "Unpin" : "Pin Sidebar"}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  {!sidebarExpanded && (
                    <TooltipContent side="right" className="bg-card text-foreground border-white/10">
                      <p>{isPinned ? "Unpin Sidebar" : "Pin Sidebar"}</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full ${sidebarExpanded ? "justify-start" : "justify-center px-0"} hover:bg-red-500/10 hover:text-red-400 text-muted-foreground`}
                      onClick={handleLogout}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
                        <LogOut className="w-4 h-4 flex-shrink-0" />
                      </div>
                      {sidebarExpanded && <span className="ml-3 text-sm font-medium">Logout</span>}
                    </Button>
                  </TooltipTrigger>
                  {!sidebarExpanded && (
                    <TooltipContent side="right" className="bg-card text-foreground border-white/10">
                      <p>Logout</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </div>
          </aside>
        )}

        {/* Mobile Drawer Overlay */}
        {isMobile && isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <aside
            className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            <div className="flex flex-col h-full p-4">
              <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-bold gradient-text">PeerHire</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="space-y-2 flex-1">
                {renderNavItems(true)}
              </nav>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen w-full">
          {/* Top Bar */}
          <header className="bg-card border-b border-border sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 md:px-8 py-4 gap-3">
              {/* Mobile Menu Button */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </Button>
              )}

              {/* Logo on mobile */}
              {isMobile && (
                <h1 className="flex-1 text-center text-xl font-bold gradient-text">PeerHire</h1>
              )}

              {/* Search - Hidden on small mobile, shown on larger screens */}
              {!isMobile && (
                <div className="flex-1 max-w-xl relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs, students, subjects..."
                    className="pl-10 bg-background"
                  />
                </div>
              )}

              {/* Right Side */}
              <div className="flex items-center gap-2 md:gap-4">
                {/* Role Switcher */}
                <RoleSwitcher />

                {role === "freelancer" && !isMobile && (
                  <Badge className="bg-success/20 text-success border-success">
                    <div className="w-2 h-2 rounded-full bg-success mr-2" />
                    Available
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setIsNotificationPanelOpen(true)}
                >
                  <Bell className="w-5 h-5" />
                  {(notificationCount + unreadCount) > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                      {(notificationCount + unreadCount) > 99 ? '99+' : (notificationCount + unreadCount)}
                    </Badge>
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={userName || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        )}
                      </div>
                      {!isMobile && (
                        <div className="text-left">
                          <p className="font-semibold text-sm">
                            {userName || (role === "freelancer" ? "Freelancer" : "Hirer")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {role === "freelancer" ? "Freelancer" : "Hirer"}
                          </p>
                        </div>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(`/${role}/profile`)}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/${role}/settings`)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>

        {/* Notification Panel */}
        <NotificationPanel
          isOpen={isNotificationPanelOpen}
          onClose={() => setIsNotificationPanelOpen(false)}
          userId={currentUserId}
          role={role}
        />
      </div>
    </TooltipProvider>
  );
};