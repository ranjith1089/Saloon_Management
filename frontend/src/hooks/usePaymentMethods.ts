import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

const FALLBACK: string[] = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

/**
 * Returns the list of enabled payment method names from Settings.
 * Falls back to a sensible default set when nothing is configured yet.
 *
 * `configured` tells the caller whether the list came from Settings or the
 * fallback — useful for showing a "configure real methods in Settings" hint.
 */
export function usePaymentMethods() {
  const { data, isLoading } = useQuery({
    queryKey: ['payment-methods-enabled'],
    queryFn: async () => (await api.get('/settings/payment-methods')).data.data as any[],
    staleTime: 60_000,
  });

  const configured = Array.isArray(data) && data.length > 0;
  const methods = configured
    ? data!.filter((m) => m.enabled).map((m) => m.name as string)
    : FALLBACK;

  return { methods, configured, isLoading };
}
