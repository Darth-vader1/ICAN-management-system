/**
 * PaymentMethodChart Component
 * Doughnut/Pie chart showing payment method distribution
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
}

interface PaymentMethodChartProps {
  data: PaymentMethodData[];
  title?: string;
  height?: number;
  showAmount?: boolean; // Show amount vs count
}

const METHOD_COLORS: Record<string, string> = {
  paystack: '#3b82f6',
  bank_transfer: '#10b981',
  cash: '#f59e0b',
  pos: '#8b5cf6',
  cheque: '#ec4899',
  other: '#6b7280',
};

export function PaymentMethodChart({
  data,
  title = 'Payment Methods',
  height = 300,
  showAmount = true,
}: PaymentMethodChartProps) {
  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const COLORS = data.map(
    (entry) => METHOD_COLORS[entry.method.toLowerCase()] || METHOD_COLORS.other
  );

  const renderLabel = (entry: any) => {
    const percentage = ((entry.value / data.reduce((sum, d) => sum + (showAmount ? d.amount : d.count), 0)) * 100).toFixed(1);
    return `${entry.method}: ${percentage}%`;
  };

  const chartData = data.map((d) => ({
    ...d,
    value: showAmount ? d.amount : d.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number) => 
                showAmount ? formatCurrency(value) : `${value} transactions`
              }
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const item = data.find(d => d.method === value);
                if (!item) return value;
                return `${value} (${showAmount ? formatCurrency(item.amount) : `${item.count} txns`})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
