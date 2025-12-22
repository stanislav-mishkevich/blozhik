import { useState, useEffect } from 'react';
import { rustApi } from '../lib/rustBack';

export interface BanStatus {
  isBanned: boolean;
  isPermanent?: boolean;
  reason?: string | null;
  bannedAt?: string | null;
  bannedUntil?: string | null;
  remainingMs?: number;
  remainingDays?: number;
  remainingHours?: number;
  remainingMinutes?: number;
}

export function useBanStatus(userId?: number) {
  const [banStatus, setBanStatus] = useState<BanStatus>({ isBanned: false });
  const [showBanModal, setShowBanModal] = useState(false);

  const { data, isLoading } = rustApi.admin.bans.checkStatus.useQuery(
    { userId: userId! },
    { enabled: !!userId, refetchInterval: 60000 } // Refetch every minute
  );

  useEffect(() => {
    if (data) {
      setBanStatus(data);
      if (data.isBanned && !showBanModal) {
        setShowBanModal(true);
      }
    }
  }, [data]);

  // Handle ban error from any mutation/query
  const handleBanError = (error: any) => {
    if (error?.message === 'BANNED' || error?.data?.code === 'FORBIDDEN' || error?.data?.code === 10002) {
      const cause = error?.cause || error?.data?.cause;
      if (cause?.isBanned) {
        setBanStatus(cause);
        setShowBanModal(true);
        return true;
      }
    }
    return false;
  };

  return {
    banStatus,
    showBanModal,
    setShowBanModal,
    handleBanError,
    isLoading,
  };
}
