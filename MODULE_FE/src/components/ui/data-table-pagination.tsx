import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemName?: string;
}

export function DataTablePagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  itemName = 'items',
}: DataTablePaginationProps) {
  if (totalPages <= 1 && totalItems === undefined) {
    return null;
  }

  // Generate page numbers with ellipsis
  const getPageItems = (): (number | string)[] => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
        pages.push(i);
      }
    }

    const items: (number | string)[] = [];
    pages.forEach((p, idx) => {
      if (idx > 0 && p - pages[idx - 1] > 1) {
        items.push(`ellipsis-${p}`);
      }
      items.push(p);
    });

    return items;
  };

  return (
    <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground select-none">
      <div>
        {totalItems !== undefined ? (
          <span>
            Page <strong>{page}</strong> of <strong>{Math.max(1, totalPages)}</strong> ({totalItems} {itemName})
          </span>
        ) : (
          <span>
            Page <strong>{page}</strong> of <strong>{Math.max(1, totalPages)}</strong>
          </span>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => page > 1 && onPageChange(page - 1)}
                className={page <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
              />
            </PaginationItem>

            {getPageItems().map((item) =>
              typeof item === 'string' ? (
                <PaginationItem key={item}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={page === item}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => page < totalPages && onPageChange(page + 1)}
                className={page >= totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
