import { useState } from "react";
import { X, Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnnouncementBannerProps {
  announcement: {
    id: number;
    title: string;
    content: string;
    type: string;
    createdAt: string;
  };
  onDismiss: (id: number) => void;
}

export function AnnouncementBanner({ announcement, onDismiss }: AnnouncementBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss(announcement.id);
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (announcement.type) {
      case "info":
        return <Info className="h-5 w-5 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 flex-shrink-0" />;
      case "error":
        return <XCircle className="h-5 w-5 flex-shrink-0" />;
      case "success":
        return <CheckCircle className="h-5 w-5 flex-shrink-0" />;
      default:
        return <Info className="h-5 w-5 flex-shrink-0" />;
    }
  };

  const getStyles = () => {
    switch (announcement.type) {
      case "info":
        return "bg-blue-50 border-blue-500 text-blue-900";
      case "warning":
        return "bg-yellow-50 border-yellow-500 text-yellow-900";
      case "error":
        return "bg-red-50 border-red-500 text-red-900";
      case "success":
        return "bg-green-50 border-green-500 text-green-900";
      default:
        return "bg-blue-50 border-blue-500 text-blue-900";
    }
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 sketch-shadow mb-4 ${getStyles()}`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm mb-1">{announcement.title}</h4>
          <p className="text-sm whitespace-pre-wrap break-words">{announcement.content}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="flex-shrink-0 h-6 w-6 p-0 hover:bg-black/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
