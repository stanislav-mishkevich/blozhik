import { useEffect, useState } from "react";
import { Info, AlertTriangle, XCircle, CheckCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AnnouncementPopupProps {
  announcement: {
    id: number;
    title: string;
    content: string;
    type: string;
    createdAt: string;
  };
  onClose: (id: number) => void;
}

export function AnnouncementPopup({ announcement, onClose }: AnnouncementPopupProps) {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose(announcement.id);
  };

  const getIcon = () => {
    switch (announcement.type) {
      case "info":
        return <Info className="h-6 w-6 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case "error":
        return <XCircle className="h-6 w-6 text-red-500" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-2 border-black sketch-shadow max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {announcement.title}
          </DialogTitle>
          <DialogDescription className="whitespace-pre-wrap text-left mt-4">
            {announcement.content}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button
            onClick={handleClose}
            className="border-2 border-black"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
