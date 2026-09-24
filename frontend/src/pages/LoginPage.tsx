import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../lib/api';
import type { LoginCredentials } from '../types/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data);
      // Redirect to home - HomeRedirect component will handle role-based routing
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[#F5F2EB] font-sans">
      {/* Left Column — Hero Banner (Desktop Only) */}
      <div className="hidden lg:flex lg:col-span-5 bg-[#0B1320] text-white p-12 lg:p-14 flex-col justify-between relative overflow-hidden border-r border-slate-800/50 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_52px]">
        {/* Top Logo Badge */}
        <div className="relative z-10">
          <div className="w-11 h-11 rounded-full border border-[#C49A45]/80 flex items-center justify-center text-[#C49A45] font-serif font-bold text-sm tracking-wider shadow-sm">
            IC
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 my-auto py-12 max-w-sm space-y-4">
          <h2 className="text-4xl lg:text-5xl font-serif text-white font-normal leading-tight tracking-tight">
            ICAN Tutorial Centre
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed pt-2">
            Structured, disciplined preparation for the Institute of Chartered Accountants of Nigeria examinations.
          </p>
        </div>

        {/* Bottom Quote & Level Indicators */}
        <div className="relative z-10 pt-8 border-t border-slate-800/80 space-y-6">
          <p className="text-white font-serif italic text-base lg:text-lg tracking-wide leading-snug">
            “Discipline in the ledger builds discipline in the profession.”
          </p>
          <p className="text-[#C49A45] text-xs font-bold tracking-widest uppercase">
            FOUNDATION · SKILLS · PROFESSIONAL
          </p>
        </div>

        {/* Decorative Background Arc */}
        <svg
          className="absolute -bottom-20 -right-20 w-[440px] h-[440px] text-[#C49A45]/15 pointer-events-none z-0"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="0.4" strokeDasharray="3 3" />
        </svg>
      </div>

      {/* Right Column — Form Area */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="max-w-md w-full space-y-8">
          {/* Header Section */}
          <div>
            <p className="text-[#C49A45] font-bold text-xs tracking-widest uppercase">
              WELCOME BACK
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#1C1C1C] font-normal tracking-tight mt-3 mb-2">
              Sign in to your account
            </h1>
            <p className="text-[#75726B] text-sm sm:text-base font-normal">
              Enter your details to access your dashboard.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#66635C] tracking-wide mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full bg-transparent border-0 border-b border-[#D6D1C7] focus:border-[#1C1C1C] focus:ring-0 px-0 py-2.5 text-[#1C1C1C] text-sm sm:text-base placeholder-[#9C988F] rounded-none outline-none transition-colors"
                  placeholder="olufemibiodungbolahan@gmail.com"
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#66635C] tracking-wide mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full bg-transparent border-0 border-b border-[#D6D1C7] focus:border-[#1C1C1C] focus:ring-0 px-0 py-2.5 text-[#1C1C1C] text-sm sm:text-base placeholder-[#9C988F] rounded-none outline-none transition-colors"
                  placeholder="••••••••••••"
                />
                {errors.password && (
                  <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
                )}

                {/* Forgot Password Link */}
                <div className="flex justify-end pt-2">
                  <Link
                    to="/password-reset"
                    className="text-[#75726B] hover:text-[#1C1C1C] text-xs sm:text-sm font-normal transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-sm tracking-wide rounded-none sm:rounded-md transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-[#75726B]">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-[#1C1C1C] underline hover:text-[#C49A45] underline-offset-4 transition-colors"
                >
                  Register as a student
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
