/**
 * 404 Not Found Page
 * Displayed when user navigates to a non-existent route
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-blue-600 mb-4">404</div>
          <div className="flex justify-center mb-6">
            <Search className="h-24 w-24 text-gray-400" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. The page may have been moved, deleted, or never existed.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Link to="/dashboard">
            <Button className="gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please{' '}
            <Link to="/help" className="text-blue-600 hover:text-blue-800 font-medium">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
