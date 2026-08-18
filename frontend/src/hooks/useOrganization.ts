/**
 * Fetch the current tenant + trial state. Cached for 60s so the trial
 * banner + billing page don't hammer the API on every navigation.
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  plan: 'TRIAL' | 'STARTER' | 'GROWTH' | 'PRO';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  trialExpired: boolean;
  country?: string | null;
  currency?: string;
  _count?: { users: number; branches: number };
}

export function useOrganization() {
  const q = useQuery<Organization>({
    queryKey: ['organization-me'],
    queryFn: async () => (await api.get('/organizations/me')).data.data,
    staleTime: 60_000,
    retry: false,
  });
  return { organization: q.data, isLoading: q.isLoading, error: q.error };
}
