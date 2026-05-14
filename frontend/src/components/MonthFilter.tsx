'use client';

import { useAppStore } from '@/stores/app';
import { formatMonthLabel, cn } from '@/lib/utils';
import type { MonthGroup } from '@/types';

interface MonthFilterProps {
  months: MonthGroup[];
}

export function MonthFilter({ months }: MonthFilterProps) {
  const { selectedMonth, setSelectedMonth } = useAppStore();

  if (months.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setSelectedMonth(null)}
        className={cn('month-tab', !selectedMonth && 'active')}
      >
        All Months
      </button>
      {months.map((month) => (
        <button
          key={month.month}
          onClick={() => setSelectedMonth(month.month)}
          className={cn('month-tab', selectedMonth === month.month && 'active')}
        >
          {month.label}
          <span className="ml-1 text-text-muted">({month.postCount})</span>
        </button>
      ))}
    </div>
  );
}
