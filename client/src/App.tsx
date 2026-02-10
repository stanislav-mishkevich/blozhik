import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Forbidden from "@/pages/Forbidden";
import ServerError from "@/pages/ServerError";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import BanNotification from "./components/BanNotification";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useBanStatus } from "./hooks/useBanStatus";
import { useAuthState } from "./hooks/useAuthState";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Feed from "./pages/Feed";
import Write from "./pages/Write";
import PostView from "./pages/PostView";
import PostHistory from "./pages/PostHistory";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import Search from "./pages/Search";
import Analytics from "./pages/Analytics";
import Drafts from "./pages/Drafts";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminRoles from "./pages/AdminRoles";
import AdminBans from "./pages/AdminBans";
import AdminPosts from "./pages/AdminPosts";
import AdminReports from "./pages/AdminReports";
import AdminStatistics from "./pages/AdminStatistics";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminActivityLogs from "./pages/AdminActivityLogs";
import AdminComments from "./pages/AdminComments";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminCreatePost from "./pages/AdminCreatePost";
import AdminCreateUser from "./pages/AdminCreateUser";
import AdminSettings from "./pages/AdminSettings";
import AdminGuard from "./components/AdminGuard";
import Notifications from "./pages/Notifications";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/feed" component={Feed} />
      <Route path="/write" component={Write} />
      <Route path="/posts/:id" component={PostView} />
      <Route path="/posts/:id/edit" component={Write} />
      <Route path="/posts/:id/history" component={PostHistory} />
      <Route path="/drafts" component={Drafts} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/users/:username" component={UserProfile} />
      <Route path="/settings" component={Settings} />
      <Route path="/search" component={Search} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/admin" component={() => (
        <AdminGuard minRole="moderator"><AdminDashboard /></AdminGuard>
      )} />
      <Route path="/admin/create-post" component={() => (
        <AdminGuard minRole="admin"><AdminCreatePost /></AdminGuard>
      )} />
      <Route path="/admin/create-user" component={() => (
        <AdminGuard minRole="superadmin"><AdminCreateUser /></AdminGuard>
      )} />
      <Route path="/admin/users" component={() => (
        <AdminGuard minRole="moderator"><AdminUsers /></AdminGuard>
      )} />
      <Route path="/admin/roles" component={() => (
        <AdminGuard minRole="admin"><AdminRoles /></AdminGuard>
      )} />
      <Route path="/admin/bans" component={() => (
        <AdminGuard minRole="moderator"><AdminBans /></AdminGuard>
      )} />
      <Route path="/admin/posts" component={() => (
        <AdminGuard minRole="moderator"><AdminPosts /></AdminGuard>
      )} />
      <Route path="/admin/comments" component={() => (
        <AdminGuard minRole="moderator"><AdminComments /></AdminGuard>
      )} />
      <Route path="/admin/reports" component={() => (
        <AdminGuard minRole="moderator"><AdminReports /></AdminGuard>
      )} />
      <Route path="/admin/statistics" component={() => (
        <AdminGuard minRole="moderator"><AdminStatistics /></AdminGuard>
      )} />
      <Route path="/admin/activity-logs" component={() => (
        <AdminGuard minRole="admin"><AdminActivityLogs /></AdminGuard>
      )} />
      <Route path="/admin/audit-logs" component={() => (
        <AdminGuard minRole="admin"><AdminAuditLogs /></AdminGuard>
      )} />
      <Route path="/admin/announcements" component={() => (
        <AdminGuard minRole="moderator"><AdminAnnouncements /></AdminGuard>
      )} />
      <Route path="/admin/analytics" component={() => (
        <AdminGuard minRole="moderator"><AdminAnalytics /></AdminGuard>
      )} />
      <Route path="/admin/settings" component={() => (
        <AdminGuard minRole="superadmin"><AdminSettings /></AdminGuard>
      )} />
      <Route path="/404" component={NotFound} />
      <Route path="/403" component={Forbidden} />
      <Route path="/500" component={ServerError} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useKeyboardShortcuts();
  const { user } = useAuthState();
  const { banStatus, showBanModal } = useBanStatus(user?.id);
  
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          {showBanModal && <BanNotification banInfo={banStatus} />}
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
