import { cn } from "@/lib/utils";
import { normalizePostContentHtml } from "@/lib/post-content-html";

type PostContentHtmlProps = {
  html: string;
  className?: string;
};

export function PostContentHtml({ html, className }: PostContentHtmlProps) {
  const sanitized = normalizePostContentHtml(html);
  if (!sanitized) {
    return null;
  }

  return (
    <div
      className={cn(
        "min-w-0 max-w-none text-sm",
        "prose prose-sm dark:prose-invert",
        "[&_h1]:text-2xl [&_h1]:font-semibold",
        "[&_h2]:text-xl [&_h2]:font-semibold",
        "[&_h3]:text-lg [&_h3]:font-semibold",
        "[&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:list-decimal [&_ol]:pl-6",
        "[&_a]:underline [&_a]:break-all",
        "[&_hr]:my-4 [&_hr]:border-border",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
