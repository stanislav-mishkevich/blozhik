import { useState } from "react";
import { rustApi } from "@/lib/rustBack";
import AdminHeader from "@/components/AdminHeader";
import AdminNav from "@/components/AdminNav";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminAnnouncements() {
  const [location] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"info" | "warning" | "error" | "success">("info");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "new_users" | "admins" | "specific">("all");
  const [targetUserIds, setTargetUserIds] = useState("");

  const { data: announcements, refetch } = rustApi.admin.announcements.list.useQuery();

  const createMutation = rustApi.admin.announcements.create.useMutation({
    onSuccess: () => {
      toast.success("Announcement created");
      refetch();
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create announcement");
    },
  });

  const deleteMutation = rustApi.admin.announcements.delete.useMutation({
    onSuccess: () => {
      toast.success("Announcement deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete announcement");
    },
  });

  const handleClose = () => {
    setIsCreateOpen(false);
    setTitle("");
    setContent("");
    setType("info");
    setStartDate("");
    setEndDate("");
    setTargetAudience("all");
    setTargetUserIds("");
  };

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    let parsedUserIds: number[] | undefined = undefined;
    if (targetAudience === "specific" && targetUserIds.trim()) {
      try {
        parsedUserIds = targetUserIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (parsedUserIds.length === 0) {
          toast.error("Please enter valid user IDs (comma-separated numbers)");
          return;
        }
      } catch (e) {
        toast.error("Invalid user IDs format");
        return;
      }
    }

    createMutation.mutate({
      title,
      content,
      type,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      targetAudience: targetAudience === "specific" ? "all" : targetAudience,
      targetUserIds: parsedUserIds ? JSON.stringify(parsedUserIds) : undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getTypeIcon = (announcementType: string) => {
    switch (announcementType) {
      case "info":
        return <Info className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (announcementType: string) => {
    switch (announcementType) {
      case "info":
        return "bg-white dark:bg-gray-900 text-black dark:text-white border-2 border-black rounded-lg";
      case "warning":
        return "bg-white dark:bg-gray-900 text-black dark:text-white border-2 border-black rounded-lg";
      case "error":
        return "bg-white dark:bg-gray-900 text-black dark:text-white border-2 border-black rounded-lg";
      case "success":
        return "bg-white dark:bg-gray-900 text-black dark:text-white border-2 border-black rounded-lg";
      default:
        return "bg-white dark:bg-gray-900 text-black dark:text-white border-2 border-black rounded-lg";
    }
  };

  return (
    <AdminHeader title="Announcements" backUrl="/admin">
      <div className="flex bg-slate-50 dark:bg-slate-900">
        <AdminNav currentPath={location} />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-600">Manage site-wide announcements and banners</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="border-2 border-black rounded-lg">
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <div className="space-y-4">
        {announcements && announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white border-2 border-black rounded-lg p-6 sketch-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getTypeIcon(announcement.type)}
                    <h3 className="text-xl font-bold">{announcement.title}</h3>
                    <Badge className={`border ${getTypeBadgeColor(announcement.type)}`}>
                      {announcement.type}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{announcement.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Target: {announcement.targetAudience || "all"}</span>
                    {announcement.startDate && (
                      <span>Start: {new Date(announcement.startDate).toLocaleDateString()}</span>
                    )}
                    {announcement.endDate && (
                      <span>End: {new Date(announcement.endDate).toLocaleDateString()}</span>
                    )}
                    <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(announcement.id)}
                  className="border-2 border-black rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No announcements yet</p>
          </div>
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
            <DialogDescription>
              Create a site-wide announcement that will be visible to users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder="Announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-2 border-black"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                placeholder="Announcement content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="border-2 border-black min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Target Audience</label>
                <Select value={targetAudience} onValueChange={(v: any) => setTargetAudience(v)}>
                  <SelectTrigger className="border-2 border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="new_users">New Users</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                    <SelectItem value="specific">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {targetAudience === "specific" && (
              <div>
                <label className="text-sm font-medium mb-2 block">User IDs (comma-separated)</label>
                <Input
                  placeholder="1, 2, 3, 4"
                  value={targetUserIds}
                  onChange={(e) => setTargetUserIds(e.target.value)}
                  className="border-2 border-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter user IDs separated by commas (e.g., 1, 5, 10)
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date (Optional)</label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-2 border-black"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date (Optional)</label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-2 border-black"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </div>
        </main>
      </div>
    </AdminHeader>
  );
}
