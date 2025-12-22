import { useEffect, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

interface BanNotificationProps {
  banInfo: {
    isBanned: boolean;
    isPermanent?: boolean;
    reason?: string | null;
    bannedAt?: string | null;
    bannedUntil?: string | null;
    remainingMs?: number;
    remainingDays?: number;
    remainingHours?: number;
    remainingMinutes?: number;
  };
}

export default function BanNotification({ banInfo }: BanNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(banInfo.remainingMs || 0);

  useEffect(() => {
    if (!banInfo.isPermanent && banInfo.bannedUntil) {
      const interval = setInterval(() => {
        const remaining = new Date(banInfo.bannedUntil!).getTime() - Date.now();
        if (remaining <= 0) {
          window.location.reload(); // Refresh when ban expires
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [banInfo]);

  const formatTimeLeft = (ms: number) => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (!banInfo.isBanned) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 max-w-md border-2 border-black dark:border-white bg-white dark:bg-gray-900 rounded-lg p-8 sketch-shadow">
        <div className="mb-4 flex items-center gap-3">
          <AlertCircle className="h-8 w-8 flex-shrink-0 text-black dark:text-white" />
          <h2 className="text-2xl font-bold">
            {banInfo.isPermanent ? 'Permanent Ban' : 'Temporary Ban'}
          </h2>
        </div>

        <div className="mb-6 space-y-4">
          <div>
            <p className="mb-1 text-sm font-bold uppercase">Reason:</p>
            <p className="border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-800 rounded-lg p-3 font-mono text-sm">
              {banInfo.reason || 'Not specified'}
            </p>
          </div>

          {!banInfo.isPermanent && banInfo.bannedUntil && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase">
                <Clock className="h-4 w-4" />
                Unban in:
              </p>
              <div className="border-2 border-black dark:border-white bg-white dark:bg-gray-900 rounded-lg p-4 text-center">
                <p className="font-mono text-3xl font-black tabular-nums text-black dark:text-white">
                  {formatTimeLeft(timeLeft)}
                </p>
                <p className="mt-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                  {new Date(banInfo.bannedUntil).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}

          {banInfo.isPermanent && (
            <div className="border-2 border-black dark:border-white bg-white dark:bg-gray-900 rounded-lg p-4 text-center">
              <p className="font-mono text-xl font-bold uppercase text-black dark:text-white">
                Permanent Ban
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Contact administration to appeal
              </p>
            </div>
          )}
        </div>

        <div className="border-t-2 border-black dark:border-white pt-4">
          <p className="text-sm font-bold text-black dark:text-white">
            ⚠️ Account Suspended
          </p>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            All actions are blocked while your account is banned
          </p>
        </div>
      </div>
    </div>
  );
}
