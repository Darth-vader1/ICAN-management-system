import React from 'react';
import { Link } from 'react-router-dom';

interface Action {
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

interface QuickActionsProps {
  actions: Action[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {actions.map((action, index) => (
        <Link 
          key={index} 
          to={action.href}
          className="bg-white rounded-xl py-6 px-4 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.color}`}>
            {action.icon}
          </div>
          <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
