import { Share2, Twitter, Linkedin, Facebook, Link, Check, Send, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

export function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `Прочитайте "${title}" на Бложик!`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(shareText);
  const encodedDescription = encodeURIComponent(description || '');

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}%0A${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    vk: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`,
  };

  const copyToClipboard = async () => {
    try {
      const textToCopy = `${shareText}\n${url}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Ссылка и текст скопированы!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Не удалось скопировать');
    }
  };

  const openShareWindow = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400,location=no,menubar=no,toolbar=no');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="px-3 py-2 rounded-lg hover:bg-gray-100">
          <Share2 className="h-5 w-5 mr-2" />
          <span className="text-sm">Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-2 border-black">
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.twitter)}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.telegram)}>
          <Send className="h-4 w-4 mr-2" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.vk)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          VK
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.facebook)}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openShareWindow(shareLinks.linkedin)}>
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Link className="h-4 w-4 mr-2" />
              Copy link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
