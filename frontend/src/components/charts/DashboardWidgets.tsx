/**
 * Dashboard Widgets
 * Reusable stat cards and summary widgets for dashboards
 */

import React from 'react';
import type { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RevenueSparkline } from './RevenueChart';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  link?: {
    text: string;
    href: string;
  };
  footer?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  trend,
  link,
  footer,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-gray-500 ml-1">vs last month</span>
              </div>
            )}

            {footer && !trend && (
              <p className="text-xs text-gray-500 mt-2">{footer}</p>
            )}
          </div>

          {Icon && (
            <div className={`flex-shrink-0 ${iconBgColor} rounded-full p-3`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
          )}
        </div>

        {link && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href={link.href}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {link.text} →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Stat card with sparkline
interface StatCardWithSparklineProps extends Omit<StatCardProps, 'icon'> {
  sparklineData: { value: number }[];
  sparklineColor?: string;
}

export function StatCardWithSparkline({
  title,
  value,
  trend,
  sparklineData,
  sparklineColor = '#3b82f6',
  link,
}: StatCardWithSparklineProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            </div>

            {trend && (
              <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
                trend.isPositive 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-red-50 text-red-600'
              }`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="font-medium text-xs">
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>

          <RevenueSparkline data={sparklineData} color={sparklineColor} height={50} />

          {link && (
            <div className="pt-2 border-t border-gray-200">
              <a
                href={link.href}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {link.text} →
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Mini summary card for collections/financials
interface CollectionSummaryProps {
  title: string;
  invoiced: number;
  paid: number;
  pending: number;
  overdue: number;
  currency?: string;
}

export function CollectionSummaryCard({
  title,
  invoiced,
  paid,
  pending,
  overdue,
  currency = '₦',
}: CollectionSummaryProps) {
  const collectionRate = invoiced > 0 ? (paid / invoiced) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Collection Rate */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Collection Rate</span>
            <span className="font-semibold">{collectionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                collectionRate >= 80 ? 'bg-green-600' :
                collectionRate >= 60 ? 'bg-yellow-600' : 'bg-red-600'
              }`}
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </div>

        {/* Amounts */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Invoiced</span>
            <span className="text-sm font-semibold">{formatCurrency(invoiced)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Paid</span>
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(paid)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Pending</span>
            <span className="text-sm font-semibold text-yellow-700">
              {formatCurrency(pending)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Overdue</span>
            <span className="text-sm font-semibold text-red-600">
              {formatCurrency(overdue)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
