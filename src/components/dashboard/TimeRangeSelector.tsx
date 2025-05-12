
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export type TimeRange = '24h' | '7d' | '14d' | '30d' | 'all';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  className?: string;
}

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-muted-foreground">Période:</span>
      <Select value={value} onValueChange={(val) => onChange(val as TimeRange)}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Sélectionner..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">24 heures</SelectItem>
          <SelectItem value="7d">7 jours</SelectItem>
          <SelectItem value="14d">14 jours</SelectItem>
          <SelectItem value="30d">30 jours</SelectItem>
          <SelectItem value="all">Tous</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function TimeRangeButtonGroup({ value, onChange, className }: TimeRangeSelectorProps) {
  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: '24h', value: '24h' },
    { label: '7j', value: '7d' },
    { label: '14j', value: '14d' },
    { label: '30j', value: '30d' },
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {timeRanges.map((range) => (
        <Button
          key={range.value}
          variant={value === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(range.value)}
          className="px-3 py-1"
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
