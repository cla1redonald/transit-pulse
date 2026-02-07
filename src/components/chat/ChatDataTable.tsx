'use client';

import { cn } from '@/lib/utils';

interface ChatDataTableProps {
  headers: string[];
  rows: string[][];
}

export function ChatDataTable({ headers, rows }: ChatDataTableProps) {
  if (!headers.length || !rows.length) return null;

  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/50">
            {headers.map((header, i) => (
              <th
                key={i}
                className={cn(
                  'px-3 py-2 text-left font-medium text-foreground',
                  i > 0 && 'text-right'
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={cn(
                'border-b border-border last:border-0',
                rowIdx % 2 === 1 && 'bg-muted/20'
              )}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className={cn(
                    'px-3 py-2 text-foreground',
                    cellIdx > 0 && 'text-right tabular-nums'
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
