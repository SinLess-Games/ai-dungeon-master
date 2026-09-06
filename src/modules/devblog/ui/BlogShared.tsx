export function BlogError({ error, retry }: { error: Error | null; retry: () => void }) {
  return (
    <div role="alert" className="blog-error">
      <p>{error?.message || "Unable to load this page."}</p>
      <button type="button" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
export function Pagination({
  page,
  total,
  size,
  change,
  busy = false,
}: {
  page: number;
  total: number;
  size: number;
  change: (page: number) => void;
  busy?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="blog-pagination">
      <button type="button" disabled={page === 0 || busy} onClick={() => change(page - 1)}>
        Previous
      </button>
      <span>
        Page {page + 1} of {pages}
      </span>
      <button type="button" disabled={page + 1 >= pages || busy} onClick={() => change(page + 1)}>
        Next
      </button>
    </div>
  );
}
