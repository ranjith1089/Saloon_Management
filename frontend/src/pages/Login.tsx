import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Scissors, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch {
      // error handled by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
              <Scissors className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Salon Management</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="admin@salon.com" {...register('email')} />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 border-t pt-6">
            <p className="text-xs text-gray-500 mb-3 text-center">Demo Accounts (Click to fill)</p>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => fillDemo('admin@salon.com', 'admin123')} className="text-xs bg-gray-100 hover:bg-gray-200 rounded-lg py-2 px-3 text-left">
                <span className="font-medium">Admin:</span> admin@salon.com / admin123
              </button>
              <button onClick={() => fillDemo('manager@salon.com', 'manager123')} className="text-xs bg-gray-100 hover:bg-gray-200 rounded-lg py-2 px-3 text-left">
                <span className="font-medium">Manager:</span> manager@salon.com / manager123
              </button>
              <button onClick={() => fillDemo('staff@salon.com', 'staff123')} className="text-xs bg-gray-100 hover:bg-gray-200 rounded-lg py-2 px-3 text-left">
                <span className="font-medium">Staff:</span> staff@salon.com / staff123
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:underline font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
