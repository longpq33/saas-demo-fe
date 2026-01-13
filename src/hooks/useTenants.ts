import { useQuery } from '@tanstack/react-query';
import { api, type Tenant } from '@/lib/api-client';

/**
 * Hook to fetch all tenants (React Query)
 * - Uses backend on port 4000 via api-client
 * - Returns cached data with loading/error state
 */
export const useTenants = () => {
  const { data, isLoading, error } = useQuery<Tenant[], Error>({
    queryKey: ['tenants'],
    queryFn: () => api.getTenants(),
    staleTime: 60_000, // 1 phút
    refetchOnWindowFocus: false,
  });

  return {
    tenants: data ?? [],
    isLoading,
    error: error?.message ?? null,
  };
};

