import React, { useState } from 'react';
import { Database, Table, Key, ChevronDown, ChevronRight } from 'lucide-react';
import type { TableSchema } from '../sql-engine/types';

export interface SqlSchemaPreviewProps {
  tables: TableSchema[];
  isLoading?: boolean;
}

export const SqlSchemaPreview: React.FC<SqlSchemaPreviewProps> = ({
  tables,
  isLoading = false,
}) => {
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>(() => {
    // Default: expand first table
    if (tables.length > 0) {
      return { [tables[0].tableName]: true };
    }
    return {};
  });

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <Database className="w-4 h-4 animate-spin text-primary" />
        <span>Loading database schema...</span>
      </div>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground">
        No tables found in this lab environment.
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans text-xs">
      <div className="flex items-center gap-2 px-1 text-muted-foreground font-medium uppercase tracking-wider text-[11px]">
        <Database className="w-3.5 h-3.5 text-primary" />
        <span>Database Schema ({tables.length} tables)</span>
      </div>

      <div className="space-y-2">
        {tables.map((table) => {
          const isExpanded = !!expandedTables[table.tableName];
          const sampleRows = table.sampleRows || [];
          const columns = table.columns || [];

          return (
            <div
              key={table.tableName}
              className="border border-border rounded-md bg-card overflow-hidden transition-all shadow-sm"
            >
              {/* Header Accordion Button */}
              <button
                type="button"
                onClick={() => toggleTable(table.tableName)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-2 font-mono font-semibold text-foreground">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <Table className="w-3.5 h-3.5 text-blue-500" />
                  <span>{table.tableName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {table.totalRows !== undefined
                      ? `${table.totalRows} rows`
                      : `${columns.length} cols`}
                  </span>
                </div>
              </button>

              {/* Table Schema Details */}
              {isExpanded && (
                <div className="p-3 border-t border-border bg-background/50 space-y-3">
                  {/* Columns List */}
                  <div>
                    <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Columns ({columns.length})
                    </h5>
                    <div className="rounded border border-border/80 overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-muted/60 text-muted-foreground border-b border-border/80">
                            <th className="py-1 px-2 font-medium">Name</th>
                            <th className="py-1 px-2 font-medium">Type</th>
                            <th className="py-1 px-2 font-medium">Attributes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                          {columns.map((col) => (
                            <tr key={col.name} className="hover:bg-muted/30">
                              <td className="py-1 px-2 flex items-center gap-1 text-foreground font-semibold">
                                {col.isPrimaryKey && (
                                  <span title="Primary Key" className="inline-flex">
                                    <Key className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                  </span>
                                )}
                                <span>{col.name}</span>
                              </td>
                              <td className="py-1 px-2 text-muted-foreground">{col.type}</td>
                              <td className="py-1 px-2 text-[10px]">
                                {col.isPrimaryKey && (
                                  <span className="text-amber-500 font-medium mr-1.5">PK</span>
                                )}
                                {!col.nullable ? (
                                  <span className="text-destructive font-medium">NOT NULL</span>
                                ) : (
                                  <span className="text-muted-foreground">NULLABLE</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sample Data Preview */}
                  {sampleRows.length > 0 && (
                    <div>
                      <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Sample Data (First {sampleRows.length} rows)
                      </h5>
                      <div className="rounded border border-border/80 overflow-x-auto max-h-36">
                        <table className="w-full text-left text-[10px] font-mono border-collapse">
                          <thead>
                            <tr className="bg-muted/60 text-muted-foreground border-b border-border/80 sticky top-0">
                              {columns.map((col) => (
                                <th key={col.name} className="py-1 px-2 font-medium">
                                  {col.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {sampleRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-muted/30">
                                {columns.map((col) => {
                                  const val = row[col.name];
                                  return (
                                    <td key={col.name} className="py-0.5 px-2 truncate max-w-[120px]">
                                      {val === null || val === undefined ? (
                                        <span className="text-muted-foreground italic">null</span>
                                      ) : (
                                        String(val)
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
