import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../lib/api';
import type { RegisterData } from '../types/auth';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(10, 'Password must be at least 10 characters'),
  password_confirm: z.string(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number cannot exceed 20 characters')
    .regex(/^[+0-9\s-()]+$/, 'Enter a valid phone number (e.g. +234 801 234 5678)'),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await registerUser(data as RegisterData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/enrollments');
      }, 1200);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F2EB] py-12 px-4 font-sans">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-xl">
            ✓
          </div>
          <h2 className="text-2xl font-serif text-[#1C1C1C]">Registration Successful</h2>
          <p className="text-sm text-[#75726B]">
            Your student account has been created. Accessing your student portal...
          </p>
        </div>
      </div>
    );
  }

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
        <div className="relative z-10 my-auto py-8 max-w-sm space-y-4">
          <h2 className="text-4xl lg:text-5xl font-serif text-white font-normal leading-tight tracking-tight">
            Begin your ICAN journey
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed pt-2">
            Register once to access every course, invoice, and class schedule across your enrollment.
          </p>
        </div>

        {/* 3-Step Process List */}
        <div className="relative z-10 pt-8 border-t border-slate-800/80 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full border border-[#C49A45] text-[#C49A45] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Create your account</h4>
              <p className="text-slate-400 text-xs mt-0.5">Verify your email and set a password.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full border border-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Choose your level</h4>
              <p className="text-slate-400 text-xs mt-0.5">Foundation, Skills, or Professional.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-7 h-7 rounded-full border border-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Pay and enroll</h4>
              <p className="text-slate-400 text-xs mt-0.5">Get your invoice and start classes.</p>
            </div>
          </div>
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
              NEW STUDENT
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#1C1C1C] font-normal tracking-tight mt-3 mb-2">
              Create your student account
            </h1>
            <p className="text-[#75726B] text-sm sm:text-base font-normal">
              Register to access ICAN tutorial courses.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* First & Last Name Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-xs font-semibold text-[#66635C] tracking-wide mb-1">
                    First name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    {...register('first_name')}
                    className="w-full bg-transparent border-0 border-b border-[#D6D1C7] focus:border-[#1C1C1C] focus:ring-0 px-0 py-2.5 text-[#1C1C1C] text-sm sm:text-base placeholder-[#9C988F] rounded-none outline-none transition-colors"
                    placeholder="John"
                  />
                  {errors.first_name && (
                    <p className="text-xs text-rose-600 mt-1">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-xs font-semibold text-[#66635C] tracking-wide mb-1">
                    Last name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    {...register('last_name')}
                    className="w-full bg-transparent border-0 border-b border-[#D6D1C7] focus:border-[#1C1C1C] focus:ring-0 px-0 py-2.5 text-[#1C1C1C] text-sm sm:text-base placeholder-[#9C988F] rounded-none outline-none transition-colors"
                    placeholder="Doe"
                  />
                  {errors.last_name && (
                    <p className="text-xs text-rose-600 mt-1">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Email Address */}
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
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-[#66635C] tracking-wide mb-1">
                  Phone number <span className="text-rose-600">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={20}
                  {...register('phone')}
                  className="w-full bg-transparent border-0 border-b border-[#D6D1C7] focus:border-[#1C1C1C] focus:ring-0 px-0 py-2.5 text-[#1C1C1C] text-sm sm:text-base placeholder-[#9C988F] rounded-none outline-none transition-colors"
                  placeholder="+234 801 234 5678"
                />
                {errors.phone && (
                  <p className="text-xs text-rose-600 mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#66635C] tracking-wide mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className="w-full bg-transparent border-0 border-b border-[#D6D1C7] focus:border-[#1C1C1C] focus:ring-0 px-0 py-2.5 text-[#1C1C1C] text-sm sm:text-base placeholder-[#9C988F] rounded-none outline-none transition-colors"
                  placeholder="At least 10 characters"
                />
                {errors.password && (
                  <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="password_confirm" className="block text-xs font-semibold text-[#66635C] tracking-wide mb-1">
                  Confirm password
                </label>
                <input
                  id="password_confirm"
                  type="password"
                  autoComplete="new-password"
                  {...register('password_confirm')}
                  className="w-full bg-transparent border-0 border-b border-[#D6D1C7] focus:border-[#1C1C1C] focus:ring-0 px-0 py-2.5 text-[#1C1C1C] text-sm sm:text-base placeholder-[#9C988F] rounded-none outline-none transition-colors"
                  placeholder="Re-enter your password"
                />
                {errors.password_confirm && (
                  <p className="text-xs text-rose-600 mt-1">{errors.password_confirm.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-sm tracking-wide rounded-none sm:rounded-md transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-[#75726B]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[#1C1C1C] underline hover:text-[#C49A45] underline-offset-4 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
