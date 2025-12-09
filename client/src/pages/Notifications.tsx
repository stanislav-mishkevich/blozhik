import { Header } from "@/components/Header";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/hooks/useAuthState";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Home, ChevronRight, Bell, Heart, MessageCircle, User, Bookmark, UserPlus, Info, AlertTriangle, XCircle, CheckCircle, Megaphone } from "lucide-react";

export default function Notifications() {
  const { user } = useAuthState();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: notifications, refetch } = trpc.notification.list.useQuery({ limit: 50, offset: 0 }, { enabled: !!user });
  const { data: announcements } = trpc.announcement.getActive.useQuery();
  const markReadMutation = trpc.notification.markRead.useMutation({ 
    onSuccess: () => {
      refetch();
      utils.notification.unreadCount.invalidate();
    }
  });
  const clearAllMutation = trpc.notification.clearAll.useMutation({ 
    onSuccess: () => {
      refetch();
      utils.notification.unreadCount.invalidate();
    }
  });

  useEffect(() => {
    // Subscribe to SSE stream for notifications
    let es: EventSource | null = null;
    if (typeof window !== 'undefined') {
      try {
        es = new EventSource('/api/notifications/stream');
        es.addEventListener('notification', (e: any) => {
          try {
            const data = JSON.parse(e.data);
            refetch();
          } catch (err) {
            refetch();
          }
        });
      } catch (err) {
        console.warn('SSE not available', err);
      }
    }
    return () => {
      es?.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Breadcrumbs */}
        <div className="mb-4 flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <button onClick={() => setLocation('/')} className="hover:text-gray-900 flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium flex items-center gap-1">
            <Bell className="h-4 w-4" />
            Notifications
          </span>
        </div>
        <div className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Notifications</h2>
            {notifications && notifications.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => clearAllMutation.mutate()} 
                disabled={clearAllMutation.isPending}
                className="border-2 border-black"
              >
                Clear all
              </Button>
            )}
          </div>
          
          {/* Announcements Section */}
          {announcements && announcements.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Announcements
              </h3>
              <div className="space-y-3">
                {announcements.map((announcement) => {
                  const getIcon = () => {
                    switch (announcement.type) {
                      case "info":
                        return <Info className="h-5 w-5 text-blue-500" />;
                      case "warning":
                        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
                      case "error":
                        return <XCircle className="h-5 w-5 text-red-500" />;
                      case "success":
                        return <CheckCircle className="h-5 w-5 text-green-500" />;
                      default:
                        return <Info className="h-5 w-5 text-blue-500" />;
                    }
                  };

                  const getStyles = () => {
                    switch (announcement.type) {
                      case "info":
                        return "border-blue-500 bg-blue-50";
                      case "warning":
                        return "border-yellow-500 bg-yellow-50";
                      case "error":
                        return "border-red-500 bg-red-50";
                      case "success":
                        return "border-green-500 bg-green-50";
                      default:
                        return "border-blue-500 bg-blue-50";
                    }
                  };

                  return (
                    <div
                      key={announcement.id}
                      className={`p-3 sm:p-4 border-2 rounded-lg ${getStyles()}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">{getIcon()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm mb-1">{announcement.title}</p>
                          <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Regular Notifications */}
          {notifications && notifications.length > 0 && (
            <h3 className="font-bold text-lg mb-3">Activity</h3>
          )}

          {notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((item: any) => {
                const n = item.notification;
                const actor = item.actor;
                const post = item.post;
                
                const getNotificationIcon = () => {
                  switch (n.type) {
                    case 'like': return <Heart className="h-5 w-5 text-red-500" />;
                    case 'comment': return <MessageCircle className="h-5 w-5 text-blue-500" />;
                    case 'follow': return <UserPlus className="h-5 w-5 text-green-500" />;
                    case 'bookmark': return <Bookmark className="h-5 w-5 text-yellow-500" />;
                    default: return <Bell className="h-5 w-5 text-gray-500" />;
                  }
                };
                
                const getNotificationText = () => {
                  const actorName = actor ? (actor.username || actor.name) : 'Someone';
                  switch (n.type) {
                    case 'like': return `${actorName} liked your post`;
                    case 'comment': return `${actorName} commented on your post`;
                    case 'follow': return `${actorName} started following you`;
                    case 'bookmark': return `${actorName} bookmarked your post`;
                    default: return n.type;
                  }
                };
                
                const handleClick = () => {
                  if (!n.read) {
                    markReadMutation.mutate({ notificationId: n.id });
                  }
                  if (n.type === 'follow' && actor) {
                    setLocation(`/profile/${actor.id}`);
                  } else if (post) {
                    setLocation(`/posts/${post.id}`);
                  }
                };
                
                return (
                  <button
                    key={n.id}
                    onClick={handleClick}
                    className={`w-full text-left p-3 sm:p-4 border-2 rounded-lg transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                      n.read ? 'border-gray-200 bg-white' : 'border-black bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm mb-1">{getNotificationText()}</p>
                        {post && (
                          <p className="text-sm text-gray-600 line-clamp-1 mb-1">
                            "{post.title}"
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(n.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 font-bold">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">We'll notify you when something happens</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
