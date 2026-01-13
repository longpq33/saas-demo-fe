import { useQuery } from '@tanstack/react-query';
import { api, type Site } from '@/lib/api-client';

/**
 * Hook to fetch sites filtered by tenant (React Query)
 * - Returns empty list when tenantId is null
 */
export const useSitesByTenant = (tenantId: string | null) => {
  // Nếu chưa chọn tenant → trả về rỗng, không gọi API
  const shouldFetch = Boolean(tenantId);

  const { data, isLoading, error } = useQuery<Site[], Error>({
    queryKey: ['sites', 'by-tenant', tenantId],
    queryFn: () => api.getSites(tenantId as string),
    enabled: shouldFetch,
    staleTime: 60_000, // 1 phút
    refetchOnWindowFocus: false,
  });

  return {
    sites: shouldFetch ? data ?? [] : [],
    isLoading: shouldFetch ? isLoading : false,
    error: error?.message ?? null,
  };
};

