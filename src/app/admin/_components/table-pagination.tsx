"use client";

import * as React from "react";
import { Pagination } from "@/app/admin/_components/ui";

export interface TablePaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize?: number;
  href?: (page: number) => string;
  className?: string;
}

/**
 * Dedicated pagination footer component for data tables.
 */
export function TablePagination({
  page,
  pageCount,
  total,
  pageSize = 20,
  href = (p: number) => `?page=${p}`,
  className,
}: TablePaginationProps) {
  return (
    <Pagination
      page={page}
      pageCount={pageCount}
      total={total}
      pageSize={pageSize}
      href={href}
      className={className}
    />
  );
}

