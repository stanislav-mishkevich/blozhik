import { trpc } from "@/lib/trpc";

export function useAuthState() {
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();
  
  return {
    user: user || null,
    loading: isLoading,
    error,
    isAuthenticated: !!user,
  };
}
