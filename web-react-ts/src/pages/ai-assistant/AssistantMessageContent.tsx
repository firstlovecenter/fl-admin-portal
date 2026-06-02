import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from 'components/lib/utils'

type Props = {
  text: string
  className?: string
}

/**
 * Safely renders the assistant's markdown reply with hand-tuned Shadcn-friendly
 * styling. No raw HTML (`skipHtml`). Bold, italic (citations), headings, lists,
 * code spans, and blockquotes only.
 *
 * We don't use `@tailwindcss/typography` (not installed) — element-level
 * className overrides keep the bundle small.
 */
const AssistantMessageContent = ({ text, className }: Props) => (
  <div
    className={cn(
      'space-y-2 text-sm leading-relaxed text-foreground',
      className
    )}
  >
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={{
        p: ({ children }) => (
          <p className="text-sm leading-relaxed text-foreground">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground/90">{children}</em>
        ),
        h1: ({ children }) => (
          <h3 className="mt-3 mb-1 text-base font-semibold text-foreground">
            {children}
          </h3>
        ),
        h2: ({ children }) => (
          <h4 className="mt-3 mb-1 text-sm font-semibold text-foreground">
            {children}
          </h4>
        ),
        h3: ({ children }) => (
          <h4 className="mt-2 mb-1 text-sm font-semibold text-foreground">
            {children}
          </h4>
        ),
        ul: ({ children }) => (
          <ul className="my-1 list-disc space-y-1 pl-5 text-sm">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-1 list-decimal space-y-1 pl-5 text-sm">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-border pl-3 text-sm italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            {children}
          </code>
        ),
        a: ({ children, href }) => (
          <a
            className="text-primary underline-offset-2 hover:underline"
            href={href}
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  </div>
)

export default AssistantMessageContent
