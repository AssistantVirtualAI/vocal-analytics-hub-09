
import React from 'react';
import { cn } from '@/lib/utils';

interface AIDecorationProps {
  className?: string;
  variant?: 'circuit' | 'nodes' | 'waves';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'blue' | 'indigo' | 'purple' | 'mixed';
  opacity?: number;
}

export function AIDecoration({
  className,
  variant = 'circuit',
  size = 'md',
  color = 'primary',
  opacity = 0.1,
}: AIDecorationProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-40 h-40',
    lg: 'w-80 h-80',
  };

  // Color classes
  const colorClasses = {
    primary: `bg-primary/${opacity * 100}`,
    blue: `bg-blue-500/${opacity * 100}`,
    indigo: `bg-indigo-500/${opacity * 100}`,
    purple: `bg-purple-500/${opacity * 100}`,
    mixed: `bg-gradient-to-br from-blue-500/${opacity * 100} to-purple-500/${opacity * 100}`,
  };

  // Different patterns
  let patternClass = '';
  switch (variant) {
    case 'circuit':
      patternClass = 'rounded-full [mask-image:url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%23fff\' stroke-width=\'2\'%3E%3Cpath d=\'M20 20h160v160H20z\'/%3E%3Cpath d=\'M80 20v160M120 20v160M20 80h160M20 120h160M60 20v20h80v40h-20v80h20v20H60v-20h20V80H60V40h20V20M60 180h80\'/%3E%3C/g%3E%3C/svg%3E")]';
      break;
    case 'nodes':
      patternClass = 'rounded-full [mask-image:url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%23fff\' stroke-width=\'2\'%3E%3Ccircle cx=\'100\' cy=\'100\' r=\'80\'/%3E%3Ccircle cx=\'100\' cy=\'100\' r=\'40\'/%3E%3Ccircle cx=\'60\' cy=\'60\' r=\'10\'/%3E%3Ccircle cx=\'140\' cy=\'60\' r=\'10\'/%3E%3Ccircle cx=\'140\' cy=\'140\' r=\'10\'/%3E%3Ccircle cx=\'60\' cy=\'140\' r=\'10\'/%3E%3Cpath d=\'M60 60l40 40M140 60l-40 40M140 140l-40-40M60 140l40-40\'/%3E%3C/g%3E%3C/svg%3E")]';
      break;
    case 'waves':
      patternClass = 'rounded-full [mask-image:url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath fill=\'none\' stroke=\'%23fff\' stroke-width=\'2\' d=\'M0 100c20 0 20-40 40-40s20 40 40 40 20-40 40-40 20 40 40 40 20-40 40-40M0 60c20 0 20-40 40-40s20 40 40 40 20-40 40-40 20 40 40 40 20-40 40-40M0 140c20 0 20-40 40-40s20 40 40 40 20-40 40-40 20 40 40 40 20-40 40-40\'/%3E%3C/svg%3E")]';
      break;
  }

  return (
    <div
      className={cn(
        'absolute blur-3xl -z-10',
        sizeClasses[size],
        colorClasses[color],
        patternClass,
        className
      )}
    />
  );
}
