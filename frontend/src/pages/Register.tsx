import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Scissors, Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Min 6 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await authService.register(data);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-800 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
              <Scissors className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input className="input" {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" className="input" {...register('email')} />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Phone</label>
              <input className="input" {...register('phone')} />
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" className="input" {...register('password')} />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
