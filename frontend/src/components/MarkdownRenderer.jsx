import React from "react";

/**
 * Parses a string into segments of plain markdown or details blocks.
 */
function parseMarkdown(text) {
  if (!text) return [];
  
  const segments = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    const detailsStart = text.indexOf("<details>", currentIndex);
    if (detailsStart === -1) {
      segments.push({
        type: "markdown",
        content: text.substring(currentIndex)
      });
      break;
    }
    
    // Add text before the details block
    if (detailsStart > currentIndex) {
      segments.push({
        type: "markdown",
        content: text.substring(currentIndex, detailsStart)
      });
    }
    
    // Find details end
    const detailsEnd = text.indexOf("</details>", detailsStart);
    if (detailsEnd === -1) {
      segments.push({
        type: "markdown",
        content: text.substring(detailsStart)
      });
      break;
    }
    
    const detailsBody = text.substring(detailsStart + 9, detailsEnd);
    
    // Parse summary and content from detailsBody
    const summaryStart = detailsBody.indexOf("<summary>");
    const summaryEnd = detailsBody.indexOf("</summary>");
    
    let summaryText = "Explanation";
    let bodyText = detailsBody;
    
    if (summaryStart !== -1 && summaryEnd !== -1) {
      summaryText = detailsBody.substring(summaryStart + 9, summaryEnd);
      bodyText = detailsBody.substring(0, summaryStart) + detailsBody.substring(summaryEnd + 10);
    }
    
    segments.push({
      type: "details",
      summary: summaryText.trim(),
      body: bodyText.trim()
    });
    
    currentIndex = detailsEnd + 10;
  }
  
  return segments;
}

/**
 * Formats inline styles like **bold** and `code`
 */
function renderInline(text) {
  if (!text) return "";
  
  // Clean up raw HTML tags inside text
  let cleaned = text
    .replace(/<\/?strong>/gi, "")
    .replace(/<\/?b>/gi, "")
    .replace(/<\/?em>/gi, "")
    .replace(/<\/?i>/gi, "")
    .replace(/<\/?p>/gi, "");
    
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = cleaned.split(regex);
  
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-[var(--color-text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 text-[11px] font-mono rounded bg-[rgba(99,102,241,0.12)] text-[var(--color-primary-light)] border border-[rgba(99,102,241,0.15)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Processes markdown line-by-line (headings, lists, code blocks, dividers, MCQ options)
 */
function renderMarkdownContent(text) {
  if (!text) return null;
  
  const lines = text.split("\n");
  const elements = [];
  
  let inCodeBlock = false;
  let codeLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Code block start / end
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="p-3.5 my-2.5 rounded-xl bg-[var(--color-base-950)] border border-[var(--color-border-subtle)] text-xs font-mono text-[var(--color-text-secondary)] overflow-x-auto whitespace-pre-wrap leading-normal"
          >
            {codeLines.join("\n")}
          </pre>
        );
        inCodeBlock = false;
        codeLines = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    
    // Horizontal rule
    if (line.trim() === "---") {
      elements.push(<hr key={i} className="my-3 border-[rgba(255,255,255,0.06)]" />);
      continue;
    }
    
    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const sizeClass =
        level === 1
          ? "text-base font-bold text-[var(--color-text-primary)] mt-4 mb-2"
          : level === 2
          ? "text-sm font-semibold text-[var(--color-text-primary)] mt-3 mb-1.5"
          : "text-xs font-semibold text-[var(--color-text-primary)] mt-2.5 mb-1";
      elements.push(
        <h4
          key={i}
          className={`${sizeClass} flex items-center gap-2 border-b border-[rgba(255,255,255,0.03)] pb-1`}
        >
          {renderInline(headingText)}
        </h4>
      );
      continue;
    }
    
    // Multiple choice option: A) option text or A. option text
    const mcMatch = line.match(/^([A-D])[).]\s+(.*)/);
    if (mcMatch) {
      const optionLetter = mcMatch[1];
      const optionText = mcMatch[2];
      elements.push(
        <div
          key={i}
          className="flex items-start gap-2.5 my-2 pl-2.5 pr-4 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(99,102,241,0.03)] hover:border-[rgba(99,102,241,0.15)] transition-all"
        >
          <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold bg-[rgba(99,102,241,0.08)] text-[var(--color-primary-light)] border border-[rgba(99,102,241,0.15)] font-mono">
            {optionLetter}
          </span>
          <span className="text-xs text-[var(--color-text-secondary)] pt-0.5 leading-relaxed">
            {renderInline(optionText)}
          </span>
        </div>
      );
      continue;
    }
    
    // Bullet item
    const bulletMatch = line.match(/^([-*])\s+(.*)/);
    if (bulletMatch) {
      const itemText = bulletMatch[2];
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 pl-3">
          <span className="text-[var(--color-primary-light)] select-none pt-0.5 text-sm">•</span>
          <span className="text-xs text-[var(--color-text-secondary)]">{renderInline(itemText)}</span>
        </div>
      );
      continue;
    }
    
    // Numbered list item
    const numListMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numListMatch) {
      const num = numListMatch[1];
      const itemText = numListMatch[2];
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 pl-3">
          <span className="text-[var(--color-primary-light)] font-semibold select-none pt-0.5 font-mono text-[10px]">{num}.</span>
          <span className="text-xs text-[var(--color-text-secondary)]">{renderInline(itemText)}</span>
        </div>
      );
      continue;
    }
    
    // Empty line
    if (!line.trim()) {
      elements.push(<div key={i} className="h-1.5" />);
      continue;
    }
    
    // Normal paragraph
    elements.push(
      <p key={i} className="text-xs text-[var(--color-text-secondary)] leading-relaxed my-1">
        {renderInline(line)}
      </p>
    );
  }
  
  return <div className="space-y-1">{elements}</div>;
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null;
  const segments = parseMarkdown(content);
  
  return (
    <div className="space-y-3">
      {segments.map((seg, idx) => {
        if (seg.type === "details") {
          return (
            <details
              key={idx}
              className="group my-3 border border-[var(--color-border-subtle)] rounded-xl bg-[rgba(99,102,241,0.03)] overflow-hidden transition-all duration-300"
            >
              <summary className="px-4 py-3 text-xs font-semibold text-[var(--color-primary-light)] cursor-pointer hover:bg-[rgba(99,102,241,0.06)] flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-emerald)] shadow-[0_0_6px_var(--color-accent-emerald)]" />
                  {renderInline(seg.summary)}
                </div>
                <span className="transition-transform duration-200 group-open:rotate-180 text-[var(--color-text-muted)] text-[8px]">
                  ▼
                </span>
              </summary>
              <div className="px-4 py-3.5 border-t border-[var(--color-border-subtle)] bg-[rgba(8,10,18,0.3)]">
                {renderMarkdownContent(seg.body)}
              </div>
            </details>
          );
        }
        
        return (
          <div key={idx}>
            {renderMarkdownContent(seg.content)}
          </div>
        );
      })}
    </div>
  );
}
