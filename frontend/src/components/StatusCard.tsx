import React from 'react';

interface StatusCardProps {
  title: string;
  value: number;
  icon: string;
  bgColor: string;
  borderColor: string;
  subtitle?: string;
}

function StatusCard({
  title,
  value,
  icon,
  bgColor,
  borderColor,
  subtitle,
}: StatusCardProps) {
  return (
    <div
      className={`stat-card ${bgColor} border ${borderColor} rounded-lg p-6 text-white transition-all hover:shadow-lg hover:scale-105`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-300">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

export default StatusCard;
