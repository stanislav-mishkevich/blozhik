import { useAuthState } from "@/hooks/useAuthState";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  LogOut, 
  Home, 
  ArrowLeft,
  Crown,
  Star,
  User
} from "lucide-react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

interface AdminHeaderProps {
  title?: string;
  showBack?: boolean;
  backUrl?: string;
  children?: React.ReactNode;
}

export default function AdminHeader({ title, showBack = true, backUrl, children }: AdminHeaderProps) {
  const { user } = useAuthState();
  const [location, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "god":
        return <Crown className="h-4 w-4" />;
      case "superadmin":
        return <Star className="h-4 w-4" />;
      case "admin":
      case "moderator":
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    // Нейтральный черно-белый стиль для всех ролей
    return "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white";
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "god":
        return "GOD";
      case "superadmin":
        return "SUPER ADMIN";
      case "admin":
        return "ADMIN";
      case "moderator":
        return "MODERATOR";
      default:
        return role?.toUpperCase() || "USER";
    }
  };

  const handleBack = () => {
    if (backUrl) {
      setLocation(backUrl);
    } else {
      window.history.back();
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b-2 border-black bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="rounded-lg border-2 border-black sketch-shadow-sm hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {title && (
            <h1 className="text-2xl font-bold">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Role Badge */}
          <Badge className={`h-9 px-3 flex items-center gap-2 border-2 ${getRoleBadgeColor(user?.role)} font-bold text-sm`}>
            {getRoleIcon(user?.role)}
            <span>{getRoleLabel(user?.role)}</span>
          </Badge>

          {/* Quick Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/")}
            className="h-9 rounded-lg border-2 border-black sketch-shadow-sm"
          >
            <Home className="h-4 w-4 mr-2" />
            View Site
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-3 h-9 hover:bg-gray-100 transition-colors border-2 border-black sketch-shadow-sm">
                <Avatar className="h-6 w-6 border-2 border-black">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gray-200 text-black font-bold text-xs">
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium leading-tight">
                    {user?.name || user?.username || "Admin"}
                  </span>
                  <span className="text-xs text-gray-600 leading-tight">
                    {user?.email || "admin@example.com"}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-2 border-black">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{user?.name || user?.username || "Admin"}</span>
                  <span className="text-xs font-normal text-gray-600">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-black" />
              <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                Admin Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-black" />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {children}
    </div>
  );
}
