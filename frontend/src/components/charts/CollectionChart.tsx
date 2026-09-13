import React from 'react';

interface DataPoint {
  month: string;
  amount: number;
}

interface CollectionChartProps {
  title: string;
  subtitle: string;
  data: DataPoint[];
}

export default function CollectionChart({ title, subtitle, data }: CollectionChartProps) {
  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  function formatAmount(value: number) {
    if (value === 0) return '0';
    if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `₦${(value / 1000).toFixed(0)}k`;
    return `₦${value}`;
  }

  const yAxisLabels = [
    maxAmount,
    maxAmount * 0.75,
    maxAmount * 0.5,
    maxAmount * 0.25,
    0,
  ].map(val => formatAmount(val));

  return (
    <div className="bg-white rounded-xl shadow-card p-6 w-full">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex" style={{ height: '200px' }}>
        {/* Y Axis Labels */}
        <div className="flex flex-col justify-between pr-3 text-right flex-shrink-0" style={{ width: '52px' }}>
          {yAxisLabels.map((label, i) => (
            <span key={i} className="text-[10px] text-gray-400 leading-none">{label}</span>
          ))}
        </div>

        {/* Chart Area */}
        <div className="flex-1 flex flex-col h-full min-h-[160px]">
          {/* Bars container */}
          <div className="flex-1 flex items-end gap-1.5 relative border-l border-gray-100 h-full min-h-[160px]">
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full border-b border-gray-100" />
              ))}
            </div>

            {/* Bars */}
            {data.map((item, index) => {
              const heightPercent = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
              const hasAmount = item.amount > 0;
              return (
                <div
                  key={index}
                  className="flex-1 flex items-end justify-center relative z-10 group h-full"
                >
                  <div
                    className={`w-full max-w-[28px] rounded-t-sm transition-all duration-500 ease-out cursor-pointer ${
                      hasAmount 
                        ? 'bg-[#0F172A] group-hover:bg-blue-600' 
                        : 'bg-slate-200 group-hover:bg-slate-300'
                    }`}
                    style={{ height: hasAmount ? `${Math.max(heightPercent, 4)}%` : '3px' }}
                    title={`${item.month}: ₦${(item.amount || 0).toLocaleString()}`}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                    {item.month}: ₦{(item.amount || 0).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month Labels */}
          <div className="flex gap-1.5 mt-2 pl-0">
            {data.map((item, index) => (
              <div key={index} className="flex-1 text-center">
                <span className="text-[10px] font-medium text-gray-500">{item.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
