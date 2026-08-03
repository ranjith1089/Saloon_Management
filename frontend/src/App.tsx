import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleGuard from '@/components/RoleGuard';
import DashboardLayout from '@/layouts/DashboardLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Bookings from '@/pages/Bookings';
import Branches from '@/pages/Branches';
import Services from '@/pages/Services';
import Staff from '@/pages/Staff';
import Customers from '@/pages/Customers';
import Coupons from '@/pages/Coupons';
import Reviews from '@/pages/Reviews';
import Earnings from '@/pages/Earnings';
import Payouts from '@/pages/Payouts';
import Products from '@/pages/Products';
import ProductSales from '@/pages/ProductSales';
import Memberships from '@/pages/Memberships';
import AccessControl from '@/pages/AccessControl';
import Inquiries from '@/pages/Inquiries';
import ServicePaymentCollection from '@/pages/ServicePaymentCollection';
import Growth from '@/pages/Growth';
import Reports from '@/pages/Reports';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import MyBookings from '@/pages/my/MyBookings';
import MyProfile from '@/pages/my/MyProfile';
import MyMembership from '@/pages/my/MyMembership';
import MyHistory from '@/pages/my/MyHistory';

const ADMIN_MGR = ['ADMIN', 'MANAGER'] as const;
const STAFF_UP = ['ADMIN', 'MANAGER', 'STAFF'] as const;
const ADMIN_ONLY = ['ADMIN'] as const;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/branches"      element={<RoleGuard allow={[...ADMIN_MGR]}><Branches /></RoleGuard>} />
        <Route path="/services"      element={<RoleGuard allow={[...ADMIN_MGR]}><Services /></RoleGuard>} />
        <Route path="/staff"         element={<RoleGuard allow={[...ADMIN_MGR]}><Staff /></RoleGuard>} />
        <Route path="/customers"     element={<RoleGuard allow={[...STAFF_UP]}><Customers /></RoleGuard>} />
        <Route path="/earnings"      element={<RoleGuard allow={[...STAFF_UP]}><Earnings /></RoleGuard>} />
        <Route path="/payouts"       element={<RoleGuard allow={[...STAFF_UP]}><Payouts /></RoleGuard>} />
        <Route path="/products"      element={<RoleGuard allow={[...ADMIN_MGR]}><Products /></RoleGuard>} />
        <Route path="/product-sales" element={<RoleGuard allow={[...STAFF_UP]}><ProductSales /></RoleGuard>} />
        <Route path="/service-payment-collection" element={<RoleGuard allow={[...STAFF_UP]}><ServicePaymentCollection /></RoleGuard>} />
        <Route path="/growth" element={<RoleGuard allow={[...ADMIN_MGR]}><Growth /></RoleGuard>} />
        <Route path="/memberships"   element={<RoleGuard allow={[...ADMIN_MGR]}><Memberships /></RoleGuard>} />
        <Route path="/access-control" element={<RoleGuard allow={[...ADMIN_ONLY]}><AccessControl /></RoleGuard>} />
        <Route path="/inquiries"     element={<RoleGuard allow={[...ADMIN_MGR]}><Inquiries /></RoleGuard>} />
        <Route path="/coupons"       element={<RoleGuard allow={[...ADMIN_MGR]}><Coupons /></RoleGuard>} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/reports"       element={<RoleGuard allow={[...ADMIN_MGR]}><Reports /></RoleGuard>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />

        {/* Customer portal — dedicated /my/* space */}
        <Route path="/my/bookings"    element={<RoleGuard allow={['CUSTOMER']}><MyBookings /></RoleGuard>} />
        <Route path="/my/profile"     element={<RoleGuard allow={['CUSTOMER']}><MyProfile /></RoleGuard>} />
        <Route path="/my/membership"  element={<RoleGuard allow={['CUSTOMER']}><MyMembership /></RoleGuard>} />
        <Route path="/my/history"     element={<RoleGuard allow={['CUSTOMER']}><MyHistory /></RoleGuard>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
