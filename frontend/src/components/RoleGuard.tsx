import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface Props {
  allow: Array<'ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER'>;
  children: React.ReactNode;
  fallback?: string;
}

/**
 * Client-side route guard. Server enforces the same rules — this just prevents
 * a wrong-role user from staring at a broken/blank page after typing the URL.
 */
export default function RoleGuard({ allow, children, fallback = '/dashboard' }: Props) {
  const { user } = useAuthStore();
  const role = user?.role as any;
  if (!role || !allow.includes(role)) return <Navigate to={fallback} replace />;
  return <>{children}</>;
}
