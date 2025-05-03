
import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DateRange } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateRangeSelectorProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

type PresetOption = {
  label: string;
  value: string;
  range: DateRange;
};

export function DateRangeSelector({ dateRange, onDateRangeChange, className }: DateRangeSelectorProps) {
  const today = new Date();
  
  // Calcul de la date d'il y a 30 jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  // Calcul de la date d'il y a 7 jours
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  // Calcul du premier jour du mois en cours
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Calcul du premier jour du mois précédent
  const firstDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  
  // Calcul du dernier jour du mois précédent
  const lastDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const presets: PresetOption[] = [
    {
      label: '7 derniers jours',
      value: '7days',
      range: { from: sevenDaysAgo, to: today },
    },
    {
      label: '30 derniers jours',
      value: '30days',
      range: { from: thirtyDaysAgo, to: today },
    },
    {
      label: 'Mois en cours',
      value: 'currentMonth',
      range: { from: firstDayOfMonth, to: today },
    },
    {
      label: 'Mois précédent',
      value: 'previousMonth',
      range: { from: firstDayOfPreviousMonth, to: lastDayOfPreviousMonth },
    },
    {
      label: 'Personnalisé',
      value: 'custom',
      range: { from: dateRange.from, to: dateRange.to },
    },
  ];

  const handlePresetChange = (value: string) => {
    const preset = presets.find(p => p.value === value);
    if (preset) {
      onDateRangeChange(preset.range);
    }
  };

  // Trouver le preset qui correspond à la plage de dates actuelle
  const findCurrentPreset = (): string => {
    if (!dateRange.from || !dateRange.to) return 'custom';

    const currentFrom = dateRange.from.setHours(0, 0, 0, 0);
    const currentTo = dateRange.to.setHours(0, 0, 0, 0);

    for (const preset of presets) {
      if (preset.value === 'custom') continue;

      const presetFrom = preset.range.from?.setHours(0, 0, 0, 0);
      const presetTo = preset.range.to?.setHours(0, 0, 0, 0);

      if (currentFrom === presetFrom && currentTo === presetTo) {
        return preset.value;
      }
    }
    
    return 'custom';
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <Select defaultValue={findCurrentPreset()} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sélectionner une période" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-from"
              variant="outline"
              className="w-[130px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                format(dateRange.from, 'dd/MM/yyyy', { locale: fr })
              ) : (
                <span>Du</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.from || undefined}
              onSelect={(date) => onDateRangeChange({ ...dateRange, from: date || undefined })}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <span className="text-sm">au</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-to"
              variant="outline"
              className="w-[130px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.to ? (
                format(dateRange.to, 'dd/MM/yyyy', { locale: fr })
              ) : (
                <span>Au</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.to || undefined}
              onSelect={(date) => onDateRangeChange({ ...dateRange, to: date || undefined })}
              initialFocus
              className="pointer-events-auto"
              disabled={(date) => (dateRange.from ? date < dateRange.from : false)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
