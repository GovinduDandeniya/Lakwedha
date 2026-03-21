import React from 'react';

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: StatCardProps) {
  return (
    <div className="rounded-[32px] bg-white p-6 shadow-sm border border-background hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest leading-none mb-1">{title}</p>
          <p className="text-3xl font-black text-secondary tracking-tight">
            {value}
          </p>
        </div>
        {icon && (
          <div className="p-3 rounded-2xl bg-background text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-sm border border-background/50">
            {icon}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-center gap-2">
         {trend && (
           <div className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase flex items-center gap-1 ${trend === 'up' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {trend === 'up' ? '↑' : '↓'} 12%
           </div>
         )}
         <p className="text-[11px] font-bold text-secondary/40">
           {subtitle}
         </p>
      </div>
    </div>
  );
}
