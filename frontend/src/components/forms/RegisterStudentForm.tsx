/**
 * RegisterStudentForm Component
 * Reusable form for student registration
 * Features: Email/password validation, phone number formatting, profile picture upload
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from './FileUpload';

const registerStudentSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: z.string(),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  phone_number: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (use +234...)'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type RegisterStudentFormData = z.infer<typeof registerStudentSchema>;

interface RegisterStudentFormProps {
  onSubmit: (data: RegisterStudentFormData & { profile_picture?: File }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function RegisterStudentForm({
  onSubmit,
  isLoading = false,
  error
}: RegisterStudentFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterStudentFormData>({
    resolver: zodResolver(registerStudentSchema),
  });

  const handleFormSubmit = async (data: RegisterStudentFormData) => {
    await onSubmit({
      ...data,
      ...(profilePicture && { profile_picture: profilePicture })
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Picture */}
      <FileUpload
        label="Profile Picture (Optional)"
        accept="image/*"
        maxSize={2 * 1024 * 1024} // 2MB
        onFileSelect={setProfilePicture}
        onRemove={() => setProfilePicture(null)}
        currentFile={profilePicture}
        disabled={isLoading}
        description="Upload a profile photo"
      />

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            {...register('first_name')}
            disabled={isLoading}
            autoComplete="given-name"
          />
          {errors.first_name && (
            <p className="text-sm text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            {...register('last_name')}
            disabled={isLoading}
            autoComplete="family-name"
          />
          {errors.last_name && (
            <p className="text-sm text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          disabled={isLoading}
          autoComplete="email"
          placeholder="student@example.com"
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number *</Label>
        <Input
          id="phone_number"
          type="tel"
          {...register('phone_number')}
          disabled={isLoading}
          autoComplete="tel"
          placeholder="+2348012345678"
        />
        {errors.phone_number && (
          <p className="text-sm text-red-600">{errors.phone_number.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Include country code (e.g., +234 for Nigeria)
        </p>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            disabled={isLoading}
            className="pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Must be 8+ characters with uppercase, lowercase, and numbers
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm Password *</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirm_password')}
            disabled={isLoading}
            className="pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.confirm_password && (
          <p className="text-sm text-red-600">{errors.confirm_password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full bg-[#1e3a8a] hover:bg-[#1e293b] text-white transition-colors" disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
}
