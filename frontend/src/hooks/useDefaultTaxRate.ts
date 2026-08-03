import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

const FALLBACK_RATE = 18; // India GST default

/**
 * Returns the salon's default tax rate (from the Tax table, if any active tax is
 * marked default). Falls back to 18% so the "GST" button on checkout modals is
 * always usable even before Settings > Tax has been configured.
 */
export function useDefaultTaxRate() {
  const { data, isLoading } = useQuery({
    queryKey: ['tax-default'],
    queryFn: async () => (await api.get('/finance/taxes/default')).data.data as any,
    staleTime: 60_000,
  });

  const configured = !!data;
  const rate = configured ? Number(data.rate) : FALLBACK_RATE;
  const name = configured ? (data.name as string) : 'GST';
  return { rate, name, configured, isLoading };
}
