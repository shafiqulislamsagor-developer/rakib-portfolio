import type { ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { createHeadingSlugger } from "@/lib/markdown";
import { cn } from "@/lib/utils";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

/**
 * Renders admin-authored Markdown. Raw HTML is not rendered (react-markdown
 * escapes it by default) and unsafe URL schemes are stripped, so stored
 * content cannot inject scripts. h2/h3 get stable ids for anchors.
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  const slug = createHeadingSlugger();
  const headingId = (children: ReactNode) => slug(textOf(children));

  return (
    <div className={cn("prose-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => defaultUrlTransform(url)}
        components={{
          h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
          h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
          a: ({ href, children, ...props }) => {
            const external = typeof href === "string" && /^https?:\/\//.test(href);
            return (
              <a href={href} {...props} {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
                {children}
              </a>
            );
          },
          img: ({ src, alt }) =>
            typeof src === "string" && src ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary author-provided images
              <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" />
            ) : null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
