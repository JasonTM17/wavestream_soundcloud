import * as React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { SearchPageClient } from '@/app/(app)/search/search-page-client';

function SearchPageFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-11 w-full rounded-full" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={<SearchPageFallback />}>
      <SearchPageClient />
    </React.Suspense>
  );
}
