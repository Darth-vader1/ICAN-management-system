import React from 'react';

interface Segment {
  label: string;
  amount: string;
  color: string;
}

interface ProgressBarProps {
  title: string;
  subtitle: string;
  percentage: number;
  segments: Segment[];
}

export default function ProgressBar({ title, subtitle, percentage, segments }: ProgressBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-navy tabular-nums">{percentage.toFixed(1)}%</span>
          <span className="text-sm text-gray-500 ml-1">collected</span>
        </div>
      </div>
      
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-5">
        <div 
          className="h-full bg-navy rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-100">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${segment.color}`} />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">{segment.label}</span>
              <span className="text-sm font-semibold text-gray-900">{segment.amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
