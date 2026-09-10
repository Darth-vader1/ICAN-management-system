/**
 * useFormValidation Hook - PRODUCTION READY
 * React hook for form validation with real-time feedback
 */

import { useState, useCallback } from 'react';
import { validateForm, validateField, ValidationRules, ValidationErrors } from '../lib/validation';
import { showToast } from '../lib/toast';

interface UseFormValidationOptions {
  rules: ValidationRules;
  labels?: { [key: string]: string };
  showToastOnError?: boolean;
}

interface UseFormValidationReturn {
  errors: ValidationErrors;
  validate: (data: { [key: string]: any }) => boolean;
  validateSingleField: (fieldName: string, value: any) => string | null;
  clearErrors: () => void;
  clearFieldError: (fieldName: string) => void;
  setFieldError: (fieldName: string, error: string) => void;
}

export const useFormValidation = ({
  rules,
  labels,
  showToastOnError = true,
}: UseFormValidationOptions): UseFormValidationReturn => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Validate entire form
   */
  const validate = useCallback(
    (data: { [key: string]: any }): boolean => {
      const validationErrors = validateForm(data, rules, labels);

      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        if (showToastOnError) {
          // Show first error as toast
          const firstError = Object.values(validationErrors)[0];
          showToast.error(firstError);
        }
        return false;
      }

      return true;
    },
    [rules, labels, showToastOnError]
  );

  /**
   * Validate single field
   */
  const validateSingleField = useCallback(
    (fieldName: string, value: any): string | null => {
      const rule = rules[fieldName];
      if (!rule) return null;

      const error = validateField(fieldName, value, rule, labels?.[fieldName]);

      setErrors(prev => {
        if (error) {
          return { ...prev, [fieldName]: error };
        } else {
          const { [fieldName]: removed, ...rest } = prev;
          return rest;
        }
      });

      return error;
    },
    [rules, labels]
  );

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Clear specific field error
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const { [fieldName]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Set specific field error manually
   */
  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  return {
    errors,
    validate,
    validateSingleField,
    clearErrors,
    clearFieldError,
    setFieldError,
  };
};

export default useFormValidation;
