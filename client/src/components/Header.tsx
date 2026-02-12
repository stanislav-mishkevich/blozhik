import { useLocation } from "wouter";
import { Search, PenSquare, User, LogOut, Bell, Moon, Sun, Shield, BookMarked, FileText, Settings, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthState } from "@/hooks/useAuthState";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, isAuthenticated } = useAuthState();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const logoutMutation = trpc.auth.logout.useMutation();
  const { data: unread, refetch: refetchUnread } = trpc.notification.unreadCount.useQuery(undefined, { enabled: isAuthenticated });

  // Subscribe to SSE to update unread count in header
  useEffect(() => {
    let es: EventSource | null = null;
    if (!isAuthenticated) return;
    try {
      es = new EventSource('/api/notifications/stream');
      es.addEventListener('notification', () => {
        refetchUnread();
      });
      es.onopen = () => { /* no-op */ };
    } catch (err) {
      console.warn('SSE not available in Header', err);
    }
    return () => {
      es?.close();
    };
  }, [isAuthenticated, refetchUnread]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="border-b-2 border-black bg-white sticky top-0 z-50 sketch-shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <button
            onClick={() => setLocation(isAuthenticated ? "/feed" : "/")}
            className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer"
          >
            <span className="sketch-underline">BLOZHIK</span>
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-black rounded-lg"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => setLocation("/write")}
                  className="hidden sm:flex border-2 border-black sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  style={{ backgroundColor: "var(--sketch-blue)", color: "white" }}
                >
                  <PenSquare className="h-4 w-4 mr-2" />
                  Write
                </Button>

                <Button onClick={() => setLocation(`/notifications`)} variant="outline" className="border-2 border-black sketch-shadow">
                  <Bell className="h-4 w-4" style={{ fill: unread?.count ? 'var(--sketch-pink)' : 'none', stroke: 'currentColor' }} />
                  {unread?.count ? <span className="ml-2 font-semibold">{unread.count}</span> : null}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-2 border-black sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                    >
                      <User className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">{user?.username || user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="border-2 border-black w-56">
                    <DropdownMenuItem onClick={() => setLocation(`/users/${user?.username}`)}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation('/drafts')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Drafts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation(`/users/${user?.username}?tab=bookmarks`)}>
                      <BookMarked className="h-4 w-4 mr-2" />
                      Bookmarks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/settings")}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleTheme}>
                      {theme === 'dark' ? (
                        <>
                          <Sun className="h-4 w-4 mr-2" />
                          Light Mode
                        </>
                      ) : (
                        <>
                          <Moon className="h-4 w-4 mr-2" />
                          Dark Mode
                        </>
                      )}
                    </DropdownMenuItem>
                    {(user?.role === 'moderator' || user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'god') && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => setLocation("/admin")}
                          className="text-purple-600 font-semibold"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setLocation("/login")}
                  variant="outline"
                  className="border-2 border-black sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  Login
                </Button>
                <Button
                  onClick={() => setLocation("/register")}
                  className="border-2 border-black sketch-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  style={{ backgroundColor: "var(--sketch-blue)", color: "white" }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden mt-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-2 border-black rounded-lg"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
