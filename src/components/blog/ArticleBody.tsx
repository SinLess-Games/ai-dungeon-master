import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Long-form article typography for the Developer Chronicle.
 * Markdown only — raw HTML is never rendered, so posts cannot inject scripts.
 * A blockquote beginning with [!NOTE], [!TIP] or [!WARNING] renders as a callout.
 */
export function ArticleBody({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("max-w-none text-[1.02rem] leading-8 text-foreground/90", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mt-10 mb-3 font-display text-2xl font-bold tracking-wide text-primary sm:text-3xl">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="mt-10 mb-3 font-display text-2xl font-bold tracking-wide text-primary sm:text-3xl">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 mb-2 font-display text-xl font-semibold tracking-wide text-primary/90">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-6 mb-2 font-display text-lg font-semibold tracking-wide text-foreground">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="mt-5 mb-2 font-display text-base font-semibold tracking-wide text-foreground">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="mt-5 mb-2 font-display text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {children}
            </h6>
          ),
          p: ({ children }) => <p className="mb-5 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="opacity-70">{children}</del>,
          ul: ({ children }) => (
            <ul className="mb-5 list-disc space-y-2 pl-6 marker:text-primary/70">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-5 list-decimal space-y-2 pl-6 marker:text-primary/70">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => {
            const raw = extractText(children);
            const kind = /^\[!(note|tip|warning|important|caution)\]/i.exec(raw.trim());
            if (kind) {
              const label = kind[1]!.toUpperCase();
              return (
                <aside className="mb-6 rounded-lg border border-primary/40 bg-primary/10 px-5 py-4 shadow-[0_0_24px_-16px_rgba(217,169,77,0.8)]">
                  <p className="mb-1 font-display text-xs uppercase tracking-[0.22em] text-primary">
                    {label}
                  </p>
                  <div className="[&>p]:mb-0 [&>p:first-of-type]:mt-0">
                    {stripMarker(children)}
                  </div>
                </aside>
              );
            }
            return (
              <blockquote className="mb-6 rounded-r-lg border-l-2 border-primary/60 bg-primary/5 px-5 py-3 font-serif italic text-foreground/90">
                {children}
              </blockquote>
            );
          },
          code: ({ children, className: codeClass }) => {
            if (codeClass?.includes("language-")) {
              return <code className="block font-mono text-[0.85rem] leading-6">{children}</code>;
            }
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-6 overflow-x-auto rounded-lg border border-primary/25 bg-black/60 p-4">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="mb-6 overflow-x-auto rounded-lg border border-primary/25">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-primary/30 bg-primary/10">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wider text-primary">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border/40 px-3 py-2 align-top">{children}</td>
          ),
          hr: () => <hr className="my-10 border-primary/30" />,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {children}
            </a>
          ),
          img: ({ src, alt, title }) => (
            <figure className="my-8">
              <img
                src={typeof src === "string" ? src : ""}
                alt={alt ?? ""}
                loading="lazy"
                className="w-full rounded-lg border border-primary/30 object-cover shadow-lg shadow-black/50"
              />
              {title || alt ? (
                <figcaption className="mt-2 text-center text-xs italic text-muted-foreground">
                  {title || alt}
                </figcaption>
              ) : null}
            </figure>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in (node as any)) {
    return extractText((node as any).props?.children);
  }
  return "";
}

/** Removes the leading [!NOTE]-style marker from callout content. */
function stripMarker(children: unknown): any {
  const replaceIn = (node: any): any => {
    if (typeof node === "string") {
      return node.replace(/^\s*\[!(note|tip|warning|important|caution)\]\s*/i, "");
    }
    if (Array.isArray(node)) {
      let done = false;
      return node.map((child) => {
        if (done) return child;
        const next = replaceIn(child);
        if (next !== child) done = true;
        return next;
      });
    }
    if (node && typeof node === "object" && node.props) {
      const inner = replaceIn(node.props.children);
      if (inner === node.props.children) return node;
      return { ...node, props: { ...node.props, children: inner } };
    }
    return node;
  };
  return replaceIn(children);
}
