import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Segment =
  | { type: "text"; content: string }
  | { type: "code"; content: string; language: string };

export function MarkdownContent({
  content,
  className
}: {
  content: string;
  className?: string;
}) {
  const segments = splitFencedCode(content);

  return (
    <div className={cn("space-y-4 text-sm leading-7 text-slate-300", className)}>
      {segments.map((segment, index) =>
        segment.type === "code" ? (
          <div
            className="overflow-hidden rounded-md border border-white/10 bg-[#06080D]"
            key={`${segment.type}-${index}`}
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.035] px-3 py-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {segment.language || "code"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70 shadow-[0_0_12px_rgba(103,232,249,0.55)]" />
            </div>
            <pre className="max-h-[360px] overflow-x-auto p-4 text-xs leading-6 text-slate-200">
              <code>{segment.content}</code>
            </pre>
          </div>
        ) : (
          <TextSegment content={segment.content} key={`${segment.type}-${index}`} />
        )
      )}
    </div>
  );
}

function splitFencedCode(content: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /```([\w.+-]*)\n?([\s\S]*?)```/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: "text", content: content.slice(cursor, match.index) });
    }
    segments.push({
      type: "code",
      language: match[1]?.trim() ?? "",
      content: match[2]?.replace(/\n$/, "") ?? ""
    });
    cursor = regex.lastIndex;
  }

  if (cursor < content.length) {
    segments.push({ type: "text", content: content.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: "text", content }];
}

function TextSegment({ content }: { content: string }) {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <>
      {blocks.map((block, index) => (
        <TextBlock block={block} key={index} />
      ))}
    </>
  );
}

function TextBlock({ block }: { block: string }) {
  const lines = block.split("\n").map((line) => line.trimEnd());
  const heading = block.match(/^(#{1,4})\s+(.+)$/);

  if (heading) {
    const level = heading[1].length;
    const Tag = level <= 2 ? "h3" : "h4";
    return (
      <Tag className="pt-1 text-sm font-semibold text-white">
        {renderInline(heading[2])}
      </Tag>
    );
  }

  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return (
      <ul className="space-y-2 pl-4">
        {lines.map((line, index) => (
          <li className="list-disc marker:text-cyan-300/80" key={index}>
            {renderInline(line.replace(/^[-*]\s+/, ""))}
          </li>
        ))}
      </ul>
    );
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return (
      <ol className="space-y-2 pl-4">
        {lines.map((line, index) => (
          <li className="list-decimal marker:text-cyan-300/80" key={index}>
            {renderInline(line.replace(/^\d+\.\s+/, ""))}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <p className="whitespace-pre-wrap">
      {lines.map((line, index) => (
        <span key={index}>
          {index > 0 ? <br /> : null}
          {renderInline(line)}
        </span>
      ))}
    </p>
  );
}

function renderInline(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong className="font-semibold text-white" key={index}>
          {token.slice(2, -2)}
        </strong>
      );
    }

    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code
          className="rounded border border-white/10 bg-white/[0.07] px-1.5 py-0.5 text-[0.86em] text-cyan-100"
          key={index}
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    return token;
  });
}
