import { rustApi } from "@/lib/rustBack";

export function useAuthState() {
  const { data: user, isLoading, error } = rustApi.auth.me.useQuery();
  
  return {
    user: user || null,
    loading: isLoading,
    error,
    isAuthenticated: !!user,
  };
}
