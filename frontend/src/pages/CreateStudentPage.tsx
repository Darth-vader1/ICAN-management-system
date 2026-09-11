/**
 * Create Student Page
 * Form for staff to create a new student account
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateStudent } from '../hooks/queries';
import { ButtonWithLoading } from '../components/LoadingSpinner';

interface StudentFormData {
  email: string;
  password: string;
  password_confirm: string;
  phone: string;
  first_name: string;
  last_name: string;
  gender?: 'M' | 'F' | '';
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export default function CreateStudentPage() {
  const navigate = useNavigate();
  const createStudentMutation = useCreateStudent();

  const [formData, setFormData] = useState<StudentFormData>({
    email: '',
    password: '',
    password_confirm: '',
    phone: '',
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
    
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 10) newErrors.password = 'Password must be at least 10 characters';
    
    if (!formData.password_confirm) newErrors.password_confirm = 'Please confirm password';
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }
    
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const student = await createStudentMutation.mutateAsync({
        data: formData,
      });
      
      // Navigate to student detail page
      navigate(`/students/${student.id}`);
    } catch (error: any) {
      // Handle API errors
      if (error.response?.data) {
        const apiErrors: Record<string, string> = {};
        Object.keys(error.response.data).forEach((key) => {
          const errorValue = error.response.data[key];
          apiErrors[key] = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        });
        setErrors(apiErrors);
      }
    }
  };

  const handleCancel = () => {
    navigate('/students');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Students
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Student</h1>
          <p className="mt-2 text-gray-600">Add a new student to the system</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="email" className="label">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="student@example.com"
                  />
                  {errors.email && <p className="error-text">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="label">
                    Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Min. 10 characters"
                  />
                  {errors.password && <p className="error-text">{errors.password}</p>}
                </div>

                <div>
                  <label htmlFor="password_confirm" className="label">
                    Confirm Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="password"
                    id="password_confirm"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    className={`input ${errors.password_confirm ? 'border-red-500' : ''}`}
                    placeholder="Re-enter password"
                  />
                  {errors.password_confirm && <p className="error-text">{errors.password_confirm}</p>}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="label">
                    First Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`input ${errors.first_name ? 'border-red-500' : ''}`}
                    placeholder="John"
                  />
                  {errors.first_name && <p className="error-text">{errors.first_name}</p>}
                </div>

                <div>
                  <label htmlFor="last_name" className="label">
                    Last Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`input ${errors.last_name ? 'border-red-500' : ''}`}
                    placeholder="Doe"
                  />
                  {errors.last_name && <p className="error-text">{errors.last_name}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="label">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+234 800 000 0000"
                  />
                  {errors.phone && <p className="error-text">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="gender" className="label">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="date_of_birth" className="label">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="label">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="input"
                    placeholder="Street address, city, state"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="emergency_contact_name" className="label">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    className="input"
                    placeholder="Emergency contact person"
                  />
                </div>

                <div>
                  <label htmlFor="emergency_contact_phone" className="label">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    className="input"
                    placeholder="+234 800 000 0000"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
                disabled={createStudentMutation.isPending}
              >
                Cancel
              </button>
              <ButtonWithLoading
                type="submit"
                loading={createStudentMutation.isPending}
                className="bg-navy hover:bg-navy-dark text-white rounded-lg px-6 py-3 text-base font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2"
              >
                Create Student
              </ButtonWithLoading>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
