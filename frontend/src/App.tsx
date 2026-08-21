import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
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
import AdminReferrals from '@/pages/AdminReferrals';
import MyReferrals from '@/pages/my/MyReferrals';
import NotificationTemplates from '@/pages/NotificationTemplates';
import Reports from '@/pages/Reports';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import MyBookings from '@/pages/my/MyBookings';
import MyProfile from '@/pages/my/MyProfile';
import MyMembership from '@/pages/my/MyMembership';
import MyHistory from '@/pages/my/MyHistory';
import PublicBooking from '@/pages/PublicBooking';
import PublicLayout from '@/layouts/PublicLayout';
import PublicHome from '@/pages/public/Home';
import PublicAbout from '@/pages/public/About';
import PublicFeatures from '@/pages/public/Features';
import PublicPricing from '@/pages/public/Pricing';
import PublicBlog from '@/pages/public/Blog';
import PublicBlogPost from '@/pages/public/BlogPost';
import PublicContact from '@/pages/public/Contact';
import StartSalon from '@/pages/public/StartSalon';
import Onboarding from '@/pages/Onboarding';
import Billing from '@/pages/Billing';
import SuperAdmin from '@/pages/SuperAdmin';
import DataPrivacy from '@/pages/DataPrivacy';
import Legal from '@/pages/public/Legal';
import Sales from '@/pages/Sales';

const ADMIN_MGR = ['ADMIN', 'MANAGER'] as const;
const STAFF_UP = ['ADMIN', 'MANAGER', 'STAFF'] as const;
const ADMIN_ONLY = ['ADMIN'] as const;

export default function App() {
  return (
    <>
      <Routes>
        {/* Public marketing pages — wrapped in PublicLayout (nav + footer) */}
        <Route element={<PublicLayout />}>
        <Route path="/"         element={<PublicHome />} />
        <Route path="/about"    element={<PublicAbout />} />
        <Route path="/features" element={<PublicFeatures />} />
        <Route path="/pricing"  element={<PublicPricing />} />
        <Route path="/blog"     element={<PublicBlog />} />
        <Route path="/blog/:slug" element={<PublicBlogPost />} />
        <Route path="/contact"  element={<PublicContact />} />
        <Route path="/start-salon" element={<StartSalon />} />
        <Route path="/legal/:doc"  element={<Legal />} />
      </Route>

      {/* Onboarding wizard — full screen, requires auth but sits outside DashboardLayout */}
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Auth screens — full-page, no layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/book/:branchId" element={<PublicBooking />} />

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/branches"      element={<RoleGuard allow={[...ADMIN_MGR]}><Branches /></RoleGuard>} />
        <Route path="/services"      element={<RoleGuard allow={[...ADMIN_MGR]}><Services /></RoleGuard>} />
        <Route path="/staff"         element={<RoleGuard allow={[...ADMIN_MGR]}><Staff /></RoleGuard>} />
        <Route path="/customers"     element={<RoleGuard allow={[...STAFF_UP]}><Customers /></RoleGuard>} />
        <Route path="/earnings"      element={<RoleGuard allow={[...STAFF_UP]}><Earnings /></RoleGuard>} />
        <Route path="/payouts"       element={<RoleGuard allow={[...STAFF_UP]}><Payouts /></RoleGuard>} />
        <Route path="/products"      element={<RoleGuard allow={[...ADMIN_MGR]}><Products /></RoleGuard>} />
        <Route path="/sales" element={<RoleGuard allow={[...STAFF_UP]}><Sales /></RoleGuard>} />
        {/* Old routes redirect to the unified Sales page */}
        <Route path="/product-sales" element={<Navigate to="/sales" replace />} />
        <Route path="/service-payment-collection" element={<Navigate to="/sales" replace />} />
        <Route path="/growth" element={<RoleGuard allow={[...ADMIN_MGR]}><Growth /></RoleGuard>} />
        <Route path="/referrals" element={<RoleGuard allow={[...ADMIN_MGR]}><AdminReferrals /></RoleGuard>} />
        <Route path="/notification-templates" element={<RoleGuard allow={[...ADMIN_MGR]}><NotificationTemplates /></RoleGuard>} />
        <Route path="/memberships"   element={<RoleGuard allow={[...ADMIN_MGR]}><Memberships /></RoleGuard>} />
        <Route path="/access-control" element={<RoleGuard allow={[...ADMIN_ONLY]}><AccessControl /></RoleGuard>} />
        <Route path="/inquiries"     element={<RoleGuard allow={[...ADMIN_MGR]}><Inquiries /></RoleGuard>} />
        <Route path="/coupons"       element={<RoleGuard allow={[...ADMIN_MGR]}><Coupons /></RoleGuard>} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/reports"       element={<RoleGuard allow={[...ADMIN_MGR]}><Reports /></RoleGuard>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/billing"  element={<RoleGuard allow={[...ADMIN_MGR]}><Billing /></RoleGuard>} />
        <Route path="/data-privacy" element={<RoleGuard allow={['OWNER', 'ADMIN']}><DataPrivacy /></RoleGuard>} />
        <Route path="/super-admin" element={<RoleGuard allow={['SUPERADMIN']}><SuperAdmin /></RoleGuard>} />

        {/* Customer portal — dedicated /my/* space */}
        <Route path="/my/bookings"    element={<RoleGuard allow={['CUSTOMER']}><MyBookings /></RoleGuard>} />
        <Route path="/my/profile"     element={<RoleGuard allow={['CUSTOMER']}><MyProfile /></RoleGuard>} />
        <Route path="/my/membership"  element={<RoleGuard allow={['CUSTOMER']}><MyMembership /></RoleGuard>} />
        <Route path="/my/history"     element={<RoleGuard allow={['CUSTOMER']}><MyHistory /></RoleGuard>} />
        <Route path="/my/referrals"   element={<RoleGuard allow={['CUSTOMER']}><MyReferrals /></RoleGuard>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Analytics />
    </>
  );
}
