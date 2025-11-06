"use client";

import { useEffect, useRef } from "react";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import "highlight.js/styles/atom-one-dark.css";

hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);

interface CodeBlockProps {
  code: string;
  language?: "json" | "bash";
}

function dedent(str: string): string {
  const lines = str.split("\n");

  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();

  if (!lines.length) return "";

  const minIndent = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => line.match(/^\s*/)?.[0].length ?? 0),
  );

  return lines
    .map((line) => (line.trim() ? "  " + line.slice(minIndent) : ""))
    .join("\n");
}

export default function CodeBlock({ code, language = "json" }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) hljs.highlightElement(codeRef.current);
  }, [code]);

  return (
    <pre className="code">
      <code ref={codeRef} className={`language-${language}`}>
        {dedent(code)}
      </code>
    </pre>
  );
}
