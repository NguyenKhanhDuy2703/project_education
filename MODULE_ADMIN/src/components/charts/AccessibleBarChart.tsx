import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, Eye } from 'lucide-react';

export interface BarChartItem {
  id: string;
  label: string;
  value: number;
  colorClass?: string;
  badge?: string;
}

export interface AccessibleBarChartProps {
  title: string;
  description?: string;
  items: BarChartItem[];
  totalValue?: number;
  valueUnit?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function AccessibleBarChart({
  title,
  description,
  items,
  totalValue,
  valueUnit = '',
  isLoading = false,
  emptyMessage = 'No data available to display.',
  className,
}: AccessibleBarChartProps) {
  const [showTable, setShowTable] = useState(false);

  const calculatedTotal =
    totalValue !== undefined
      ? totalValue
      : items.reduce((acc, curr) => acc + curr.value, 0);

  const maxValue = Math.max(...items.map((i) => i.value), 1);

  if (isLoading) {
    return (
      <div className={cn('p-5 rounded-2xl border border-border bg-card space-y-4', className)}>
        <div className="space-y-1">
          <div className="h-5 w-40 bg-muted animate-pulse rounded" />
          <div className="h-3.5 w-60 bg-muted/60 animate-pulse rounded" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                <div className="h-3 w-12 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-2.5 w-full bg-muted/40 animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = items.length === 0 || calculatedTotal === 0;

  return (
    <section
      aria-label={title}
      className={cn(
        'p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between space-y-4',
        className
      )}
    >
      {/* Header with Title, Description and Table Toggle */}
      <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowTable((prev) => !prev)}
          className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
          aria-expanded={showTable}
          aria-controls={`table-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {showTable ? (
            <>
              <Eye className="size-3.5" />
              <span>Chart view</span>
            </>
          ) : (
            <>
              <Table className="size-3.5" />
              <span>Table view</span>
            </>
          )}
        </Button>
      </div>

      {isEmpty ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </div>
      ) : showTable ? (
        /* Accessible Visual Table View */
        <div
          id={`table-${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="overflow-x-auto"
        >
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th scope="col" className="py-2 font-semibold">Category</th>
                <th scope="col" className="py-2 text-right font-semibold">Count</th>
                <th scope="col" className="py-2 text-right font-semibold">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((item) => {
                const percent =
                  calculatedTotal > 0
                    ? Math.round((item.value / calculatedTotal) * 100)
                    : 0;
                return (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="py-2 font-medium text-foreground flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {item.badge && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {item.badge}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 text-right text-foreground font-mono">
                      {item.value} {valueUnit}
                    </td>
                    <td className="py-2 text-right text-muted-foreground font-mono">
                      {percent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold text-foreground">
                <td className="py-2">Total</td>
                <td className="py-2 text-right font-mono">
                  {calculatedTotal} {valueUnit}
                </td>
                <td className="py-2 text-right font-mono">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* Accessible Horizontal Bar Chart */
        <div className="space-y-3 pt-1">
          {items.map((item) => {
            const percent =
              calculatedTotal > 0
                ? Math.round((item.value / calculatedTotal) * 100)
                : 0;
            const barWidthPercent =
              maxValue > 0 ? Math.max(Math.round((item.value / maxValue) * 100), 2) : 0;

            const colorClass = item.colorClass || 'bg-primary';

            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                    <span className="font-medium text-foreground truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 h-4 font-semibold uppercase"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="font-mono text-muted-foreground shrink-0 text-right">
                    <span className="font-semibold text-foreground">{item.value}</span>
                    {valueUnit ? ` ${valueUnit}` : ''}
                    <span className="text-[11px] text-muted-foreground/80 ml-1">
                      ({percent}%)
                    </span>
                  </div>
                </div>

                <div
                  role="progressbar"
                  aria-label={`${item.label}: ${item.value} ${valueUnit} (${percent}%)`}
                  aria-valuenow={item.value}
                  aria-valuemin={0}
                  aria-valuemax={maxValue}
                  aria-valuetext={`${item.value} ${valueUnit} (${percent}%)`}
                  className="w-full bg-muted/60 rounded-full h-2.5 overflow-hidden"
                >
                  <div
                    className={cn('h-full rounded-full transition-all duration-300', colorClass)}
                    style={{ width: `${barWidthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Screen-reader Only Equivalent Table always present when chart view is active */}
      {!showTable && (
        <table className="sr-only">
          <caption>{title} - Screen Reader Summary</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Value</th>
              <th scope="col">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const percent =
                calculatedTotal > 0
                  ? Math.round((item.value / calculatedTotal) * 100)
                  : 0;
              return (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>
                    {item.value} {valueUnit}
                  </td>
                  <td>{percent}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
