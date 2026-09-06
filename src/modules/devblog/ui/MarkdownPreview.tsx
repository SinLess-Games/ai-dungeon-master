import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
export function MarkdownPreview({ markdown }: { markdown: string }) {
  return (
    <div className="blog-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url, key) =>
          key === "src"
            ? /^\/api\/devblog\/media\/[a-f0-9-]{36}$/.test(url)
              ? url
              : ""
            : defaultUrlTransform(url)
        }
        components={{
          a: ({ children, href }) => (
            <a href={href} rel="nofollow noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) =>
            src ? (
              <img src={src} alt={alt || ""} loading="lazy" />
            ) : (
              <span>[Image unavailable: {alt}]</span>
            ),
          table: ({ children }) => (
            <div className="blog-table">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
