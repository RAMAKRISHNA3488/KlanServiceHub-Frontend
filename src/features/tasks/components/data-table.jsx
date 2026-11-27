'use client';
import { useTable, } from '@tanstack/react-table';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { features } from './data-table-features';
export function DataTable({ columns, data, onOpenTask }) {
    const [sorting, setSorting] = useState([]);
    const [columnFilters, setColumnFilters] = useState([]);
    const table = useTable({
        features,
        data,
        columns,
        meta: {
            onOpenTask: (task) => onOpenTask?.(task),
        },
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        state: {
            columnFilters,
            sorting,
        },
    });
    return (<div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (<TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                return (<TableHead key={header.id}>
                      {header.isPlaceholder ? null : <table.FlexRender header={header}/>}
                    </TableHead>);
            })}
              </TableRow>))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (table.getRowModel().rows.map((row) => (<TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="hover:bg-neutral-50/70 transition-colors">
                  {row.getVisibleCells().map((cell) => (<TableCell key={cell.id}>
                      <table.FlexRender cell={cell}/>
                    </TableCell>))}
                </TableRow>))) : (<TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-neutral-500">
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <span className="text-xs font-semibold text-neutral-600">No issues found</span>
                    <span className="text-[11px] text-neutral-400">Try adjusting your filters or create a new issue</span>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="secondary" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>);
}
