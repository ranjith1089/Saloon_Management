/**
 * Shared branding pull — used by DashboardLayout for the sidebar logo/name
 * and available anywhere else that needs the salon's identity. Cached for
 * 5 min so navigating between pages doesn't refetch.
 */
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/services/settings.service';

export interface Branding {
  businessName?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  logoUrl?: string;
}

export function useBranding() {
  const { data } = useQuery<Branding>({
    queryKey: ['settings-branding'],
    queryFn: settingsApi.getBranding,
    staleTime: 5 * 60_000,
    // Silent — if the endpoint fails we simply fall back to defaults.
    retry: false,
  });
  return {
    businessName: data?.businessName || 'Salon',
    logoUrl: data?.logoUrl || '',
    tagline: data?.tagline || '',
  };
}
