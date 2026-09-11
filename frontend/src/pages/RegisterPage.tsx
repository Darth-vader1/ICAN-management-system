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
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">
              Registration successful! Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your student account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Register to access ICAN tutorial courses
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="label">
                  First Name
                </label>
                <input
                  id="first_name"
                  type="text"
                  {...register('first_name')}
                  className="input"
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="error-text">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="label">
                  Last Name
                </label>
                <input
                  id="last_name"
                  type="text"
                  {...register('last_name')}
                  className="input"
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="error-text">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="input"
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="error-text">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Phone Number <span className="text-red-600">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                maxLength={20}
                {...register('phone')}
                className="input"
                placeholder="+234 801 234 5678"
              />
              {errors.phone && (
                <p className="error-text">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className="input"
                placeholder="At least 10 characters"
              />
              {errors.password && (
                <p className="error-text">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password_confirm" className="label">
                Confirm Password
              </label>
              <input
                id="password_confirm"
                type="password"
                autoComplete="new-password"
                {...register('password_confirm')}
                className="input"
                placeholder="Re-enter your password"
              />
              {errors.password_confirm && (
                <p className="error-text">{errors.password_confirm.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
