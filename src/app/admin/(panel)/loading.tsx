/**
 * Shown instantly on every admin navigation while the page loads on the
 * server, so a click never looks like it did nothing.
 */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-56 rounded-[4px] bg-muted" />
        <div className="h-4 w-full max-w-md rounded-full bg-muted/70" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-[4px] border border-border bg-card p-5">
            <div className="h-3 w-20 rounded-full bg-muted" />
            <div className="mt-5 h-6 w-14 rounded-[4px] bg-muted" />
          </div>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-[4px] border border-border bg-card">
        <div className="h-12 border-b border-border bg-muted/20" />
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-0">
            <div className="size-9 shrink-0 rounded-[4px] bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/3 rounded-full bg-muted" />
              <div className="h-3 w-1/3 rounded-full bg-muted/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
