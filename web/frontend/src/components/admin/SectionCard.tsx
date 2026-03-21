import React from 'react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export default function SectionCard({
  title,
  children,
  icon,
  className = "",
}: SectionCardProps) {
  return (
    <div className={`rounded-[32px] bg-white p-8 shadow-sm border border-background flex flex-col hover:shadow-xl transition-all duration-500 overflow-hidden relative group/section ${className}`}>
      <div className="flex items-center gap-4 mb-8">
        {icon && (
          <div className="p-2.5 rounded-xl bg-background text-secondary group-hover/section:scale-110 transition-transform duration-500 shadow-sm border border-background/50">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-black text-secondary tracking-tight">
          {title}
        </h3>
        <div className="h-px flex-1 bg-background/50 ml-2 group-hover/section:scale-x-110 origin-left transition-transform duration-500" />
      </div>
      
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Subtle Background Decoration */}
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-background/30 rounded-full blur-3xl opacity-0 group-hover/section:opacity-100 transition-opacity duration-1000 -z-0 pointer-events-none" />
    </div>
  );
}
