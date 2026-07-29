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
  Bell,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/bookings', label: 'Bookings', icon: Calendar },
  { path: '/branches', label: 'Branches', icon: Building2, roles: ['ADMIN', 'MANAGER'] },
  { path: '/services', label: 'Services', icon: Scissors, roles: ['ADMIN', 'MANAGER'] },
  { path: '/staff', label: 'Staff', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { path: '/customers', label: 'Customers', icon: UserCircle },
  { path: '/earnings', label: 'Earnings', icon: DollarSign, roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/coupons', label: 'Coupons', icon: Ticket, roles: ['ADMIN', 'MANAGER'] },
  { path: '/reviews', label: 'Reviews', icon: Star },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
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

  const filteredMenu = menuItems.filter((item) => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
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

        <nav className="p-4 space-y-1">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
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
