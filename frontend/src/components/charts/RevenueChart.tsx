/**
 * RevenueChart Component
 * Line chart showing revenue trends over time
 * Uses recharts for declarative, responsive charts
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  payments: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  title?: string;
  height?: number;
  showLegend?: boolean;
}

export function RevenueChart({
  data,
  title = 'Revenue Trend',
  height = 300,
  showLegend = true,
}: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return `₦${(value / 1000).toFixed(0)}k`;
  };

  const formatTooltipValue = (value: number) => {
    return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={formatTooltipValue}
              labelStyle={{ fontWeight: 600, marginBottom: '8px' }}
            />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
            )}
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Total Revenue"
            />
            <Line
              type="monotone"
              dataKey="payments"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Payments Received"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Sparkline variant for compact display
interface SparklineData {
  value: number;
}

interface RevenueSparklineProps {
  data: SparklineData[];
  color?: string;
  height?: number;
}

export function RevenueSparkline({
  data,
  color = '#3b82f6',
  height = 60,
}: RevenueSparklineProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
