import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
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
import Reports from '@/pages/Reports';
import Notifications from '@/pages/Notifications';
import Placeholder from '@/pages/Placeholder';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/services" element={<Services />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Placeholder title="Settings" />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
