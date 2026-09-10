/**
 * AttendanceChart Component
 * Charts for displaying attendance rates and trends
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Attendance rate over time (line chart)
interface AttendanceTrendData {
  date: string;
  rate: number;
}

interface AttendanceTrendChartProps {
  data: AttendanceTrendData[];
  title?: string;
  height?: number;
}

export function AttendanceTrendChart({
  data,
  title = 'Attendance Rate Trend',
  height = 300,
}: AttendanceTrendChartProps) {
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
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Attendance Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Course attendance comparison (horizontal bar chart)
interface CourseAttendanceData {
  course: string;
  rate: number;
}

interface CourseAttendanceChartProps {
  data: CourseAttendanceData[];
  title?: string;
  height?: number;
}

export function CourseAttendanceChart({
  data,
  title = 'Attendance by Course',
  height = 300,
}: CourseAttendanceChartProps) {
  const getColor = (rate: number) => {
    if (rate >= 80) return '#10b981'; // green
    if (rate >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              domain={[0, 100]}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="course"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance Rate']}
            />
            <Bar
              dataKey="rate"
              radius={[0, 8, 8, 0]}
              name="Attendance Rate"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Attendance status breakdown (pie chart)
interface AttendanceStatusData {
  name: string;
  value: number;
}

interface AttendanceStatusChartProps {
  data: AttendanceStatusData[];
  title?: string;
  height?: number;
}

const STATUS_COLORS = {
  Present: '#10b981',
  Absent: '#ef4444',
  Late: '#f59e0b',
  Excused: '#8b5cf6',
};

export function AttendanceStatusChart({
  data,
  title = 'Attendance Status Breakdown',
  height = 300,
}: AttendanceStatusChartProps) {
  const COLORS = data.map(
    (entry) => STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#6b7280'
  );

  const renderLabel = (entry: any) => {
    return `${entry.name}: ${entry.value}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
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
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
