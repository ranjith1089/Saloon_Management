import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import {
  LayoutDashboard,
  Calendar,
  Building2,
  Scissors,
  Users,
  UserCircle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Ticket,
  Star,
  DollarSign,
  Wallet,
  Package,
  ShoppingBag,
  Crown,
  ShieldCheck,
  Mail,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  // CUSTOMER's Bookings link is relabeled below at render time.
  { path: '/bookings', label: 'Bookings', icon: Calendar },
  { path: '/branches', label: 'Branches', icon: Building2, roles: ['ADMIN', 'MANAGER'] },
  { path: '/services', label: 'Services', icon: Scissors, roles: ['ADMIN', 'MANAGER'] },
  { path: '/staff', label: 'Staff', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { path: '/products', label: 'Products', icon: Package, roles: ['ADMIN', 'MANAGER'] },
  { path: '/product-sales', label: 'Product Sales', icon: ShoppingBag, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  // Customers is now hidden from CUSTOMER (their own data was leaking here).
  { path: '/customers', label: 'Customers', icon: UserCircle, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  // CUSTOMER sees only their own membership via the drawer/detail — not the admin list.
  { path: '/memberships', label: 'Memberships', icon: Crown, roles: ['ADMIN', 'MANAGER'] },
  { path: '/earnings', label: 'Earnings', icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/payouts', label: 'Payouts', icon: Wallet, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/coupons', label: 'Coupons', icon: Ticket, roles: ['ADMIN', 'MANAGER'] },
  { path: '/reviews', label: 'Reviews', icon: Star },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { path: '/inquiries', label: 'Inquiries', icon: Mail, roles: ['ADMIN', 'MANAGER'] },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/access-control', label: 'Access Control', icon: ShieldCheck, roles: ['ADMIN'] },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const filteredMenu = menuItems
    .filter((item) => !item.roles || item.roles.includes(user?.role || ''))
    .map((item) =>
      user?.role === 'CUSTOMER' && item.path === '/bookings'
        ? { ...item, label: 'My Bookings' }
        : item
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Salon</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredMenu.map((item) => (
            <SidebarLink key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1"></div>

          <NotificationBell />

          <div className="relative ml-3">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {user?.profile?.firstName?.[0]}{user?.profile?.lastName?.[0]}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium">{user?.profile?.firstName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ item, onClick }: { item: any; onClick: () => void }) {
  // Only Staff shows the unverified-count red dot for now.
  const showUnverifiedBadge = item.path === '/staff';
  const { data: unverifiedCount = 0 } = useQuery({
    queryKey: ['staff-unverified-count'],
    queryFn: async () => {
      const r = await api.get('/staff', { params: { isVerified: false, limit: 1 } });
      return r.data?.meta?.pagination?.total ?? r.data?.data?.length ?? 0;
    },
    enabled: showUnverifiedBadge,
    refetchInterval: 60_000,
  });

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {showUnverifiedBadge && unverifiedCount > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded-full">
          {unverifiedCount}
        </span>
      )}
    </NavLink>
  );
}

function NotificationBell() {
  const { data } = useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => (await api.get('/notifications?limit=1')).data,
    refetchInterval: 30000,
  });
  const unread = data?.data?.unreadCount || 0;

  return (
    <Link to="/notifications" className="relative p-2 hover:bg-gray-100 rounded-lg">
      <Bell className="w-5 h-5 text-gray-700" />
      {unread > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
