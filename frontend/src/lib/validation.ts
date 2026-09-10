/**
 * Form Validation Utilities - PRODUCTION READY
 * Centralized validation functions for consistent error handling
 */

import { showToast } from './toast';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  date?: boolean;
  futureDate?: boolean;
  pastDate?: boolean;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate a single field
 */
export const validateField = (
  fieldName: string,
  value: any,
  rules: ValidationRule,
  customLabel?: string
): string | null => {
  const label = customLabel || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Required validation
  if (rules.required) {
    if (value === null || value === undefined || value === '') {
      return `${label} is required`;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return `${label} is required`;
    }
    if (Array.isArray(value) && value.length === 0) {
      return `${label} must have at least one item`;
    }
  }

  // Skip other validations if value is empty and not required
  if (!value && !rules.required) {
    return null;
  }

  // Min length validation
  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    return `${label} must be at least ${rules.minLength} characters`;
  }

  // Max length validation
  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    return `${label} must not exceed ${rules.maxLength} characters`;
  }

  // Min value validation
  if (rules.min !== undefined && Number(value) < rules.min) {
    return `${label} must be at least ${rules.min}`;
  }

  // Max value validation
  if (rules.max !== undefined && Number(value) > rules.max) {
    return `${label} must not exceed ${rules.max}`;
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(String(value))) {
    return `${label} format is invalid`;
  }

  // Email validation
  if (rules.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(String(value))) {
      return `${label} must be a valid email address`;
    }
  }

  // Phone validation (Nigerian format)
  if (rules.phone) {
    const phonePattern = /^(\+234|0)[789]\d{9}$/;
    if (!phonePattern.test(String(value).replace(/\s/g, ''))) {
      return `${label} must be a valid Nigerian phone number`;
    }
  }

  // Date validation
  if (rules.date) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `${label} must be a valid date`;
    }
  }

  // Future date validation
  if (rules.futureDate) {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return `${label} must be in the future`;
    }
  }

  // Past date validation
  if (rules.pastDate) {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
      return `${label} must be in the past`;
    }
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return customError;
    }
  }

  return null;
};

/**
 * Validate multiple fields
 */
export const validateForm = (
  data: { [key: string]: any },
  rules: ValidationRules,
  labels?: { [key: string]: string }
): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach(fieldName => {
    const error = validateField(
      fieldName,
      data[fieldName],
      rules[fieldName],
      labels?.[fieldName]
    );
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};

/**
 * Validate form and show toast for first error
 */
export const validateFormWithToast = (
  data: { [key: string]: any },
  rules: ValidationRules,
  labels?: { [key: string]: string }
): boolean => {
  const errors = validateForm(data, rules, labels);
  
  if (Object.keys(errors).length > 0) {
    // Show first error as toast
    const firstError = Object.values(errors)[0];
    showToast.error(firstError);
    return false;
  }

  return true;
};

/**
 * Pre-defined validation rules for common fields
 */
export const commonValidations = {
  email: {
    required: true,
    email: true,
  },
  phone: {
    required: true,
    phone: true,
  },
  password: {
    required: true,
    minLength: 8,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  amount: {
    required: true,
    min: 0,
  },
  positiveNumber: {
    required: true,
    min: 1,
  },
  code: {
    required: true,
    minLength: 2,
    maxLength: 20,
    pattern: /^[A-Z0-9]+$/,
  },
  date: {
    required: true,
    date: true,
  },
  futureDate: {
    required: true,
    date: true,
    futureDate: true,
  },
  pastDate: {
    required: true,
    date: true,
    pastDate: true,
  },
};

/**
 * Validation rules for student registration
 */
export const studentValidationRules: ValidationRules = {
  first_name: commonValidations.name,
  last_name: commonValidations.name,
  email: commonValidations.email,
  phone: commonValidations.phone,
  date_of_birth: {
    required: true,
    date: true,
    pastDate: true,
    custom: (value) => {
      const dob = new Date(value);
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age < 16) {
        return 'Student must be at least 16 years old';
      }
      if (age > 100) {
        return 'Invalid date of birth';
      }
      return null;
    },
  },
  guardian_name: {
    minLength: 2,
    maxLength: 100,
  },
  guardian_phone: {
    phone: true,
  },
};

/**
 * Validation rules for course creation
 */
export const courseValidationRules: ValidationRules = {
  code: commonValidations.code,
  name: {
    required: true,
    minLength: 3,
    maxLength: 200,
  },
  level: {
    required: true,
  },
  duration: {
    required: true,
    min: 1,
    max: 52,
  },
};

/**
 * Validation rules for session creation
 */
export const sessionValidationRules: ValidationRules = {
  label: {
    required: true,
    minLength: 4,
    maxLength: 50,
    pattern: /^\d{4}\/\d{4}$/,
  },
  start_date: {
    required: true,
    date: true,
  },
  end_date: {
    required: true,
    date: true,
    custom: (value, data?: any) => {
      if (data?.start_date && value) {
        const start = new Date(data.start_date);
        const end = new Date(value);
        if (end <= start) {
          return 'End date must be after start date';
        }
      }
      return null;
    },
  },
};

/**
 * Validation rules for enrollment
 */
export const enrollmentValidationRules: ValidationRules = {
  session: {
    required: true,
  },
  level: {
    required: true,
  },
  courses: {
    required: true,
    custom: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'Please select at least one course';
      }
      return null;
    },
  },
};

/**
 * Validation rules for payment
 */
export const paymentValidationRules: ValidationRules = {
  amount: {
    required: true,
    min: 1,
    custom: (value) => {
      if (isNaN(Number(value))) {
        return 'Amount must be a valid number';
      }
      return null;
    },
  },
  payment_method: {
    required: true,
  },
};

/**
 * Validation rules for class creation
 */
export const classValidationRules: ValidationRules = {
  course_offering: {
    required: true,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
};

/**
 * Validation rules for schedule creation
 */
export const scheduleValidationRules: ValidationRules = {
  class_instance: {
    required: true,
  },
  date: {
    required: true,
    date: true,
  },
  start_time: {
    required: true,
  },
  end_time: {
    required: true,
    custom: (value, data?: any) => {
      if (data?.start_time && value) {
        if (value <= data.start_time) {
          return 'End time must be after start time';
        }
      }
      return null;
    },
  },
};

export default {
  validateField,
  validateForm,
  validateFormWithToast,
  commonValidations,
  studentValidationRules,
  courseValidationRules,
  sessionValidationRules,
  enrollmentValidationRules,
  paymentValidationRules,
  classValidationRules,
  scheduleValidationRules,
};
