/**
 * EnrollmentChart Component
 * Bar chart showing enrollment statistics by level or status
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface EnrollmentDataPoint {
  name: string;
  count: number;
  label?: string;
}

interface EnrollmentChartProps {
  data: EnrollmentDataPoint[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  barColor?: string;
  multiColor?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function EnrollmentChart({
  data,
  title = 'Enrollments by Level',
  height = 300,
  showLegend = false,
  barColor = '#3b82f6',
  multiColor = false,
}: EnrollmentChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            />
            {showLegend && <Legend />}
            <Bar
              dataKey="count"
              fill={barColor}
              radius={[8, 8, 0, 0]}
              name="Enrollments"
            >
              {multiColor && data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Stacked Bar Chart for enrollment status breakdown
interface StackedEnrollmentData {
  name: string;
  active: number;
  draft: number;
  withdrawn: number;
  completed: number;
}

interface StackedEnrollmentChartProps {
  data: StackedEnrollmentData[];
  title?: string;
  height?: number;
}

export function StackedEnrollmentChart({
  data,
  title = 'Enrollment Status by Level',
  height = 300,
}: StackedEnrollmentChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
            />
            <Legend />
            <Bar
              dataKey="active"
              stackId="status"
              fill="#10b981"
              name="Active"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="draft"
              stackId="status"
              fill="#f59e0b"
              name="Draft"
            />
            <Bar
              dataKey="withdrawn"
              stackId="status"
              fill="#ef4444"
              name="Withdrawn"
            />
            <Bar
              dataKey="completed"
              stackId="status"
              fill="#8b5cf6"
              name="Completed"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
