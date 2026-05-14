import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
}

// Lightweight syntax highlighter — tokenizes a small grammar, no extra deps.
function highlight(code: string, language: string) {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  if (language === "html") {
    return escape(code)
      .replace(
        /(&lt;\/?)([a-zA-Z0-9-]+)/g,
        '$1<span class="text-[oklch(0.78_0.14_85)]">$2</span>',
      )
      .replace(
        /([a-zA-Z-]+)=(&quot;|")(.*?)(&quot;|")/g,
        '<span class="text-[oklch(0.75_0.08_180)]">$1</span>=<span class="text-[oklch(0.82_0.12_60)]">"$3"</span>',
      );
  }
  if (language === "url") {
    return escape(code).replace(
      /([?&])([a-zA-Z_]+)=([^&]+)/g,
      '$1<span class="text-[oklch(0.75_0.08_180)]">$2</span>=<span class="text-[oklch(0.82_0.12_60)]">$3</span>',
    );
  }
  return escape(code);
}

export function CodeBlock({ code, language = "html" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-[oklch(0.14_0.005_60)]">
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-3 py-2">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {language}
        </span>
        <Button
          onClick={handleCopy}
          size="lg"
          className={
            "h-10 gap-2 px-4 text-sm font-semibold transition-all duration-200 " +
            (copied
              ? "bg-emerald-500 text-white hover:bg-emerald-500 shadow-[0_0_20px_oklch(0.7_0.18_150_/_0.5)] scale-105"
              : "btn-gold")
          }
          aria-label={copied ? "Code copied to clipboard" : "Copy code to clipboard"}
        >
          {copied ? (
            <>
              <Check className="h-5 w-5" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" /> Copy
            </>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-[0.95rem] leading-relaxed">
        <code
          className="font-mono text-foreground/95"
          dangerouslySetInnerHTML={{ __html: highlight(code, language) }}
        />
      </pre>
    </div>
  );
}
