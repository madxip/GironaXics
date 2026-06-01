"use client";

import React, { useRef, useEffect, useState } from "react";
import { Bold, Italic, List } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  hasError?: boolean;
}

// --- HELPER DE CONVERSIÓ: MARKDOWN A HTML ---
function parseInlineMarkdown(text: string): string {
  let formatted = text
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>");
  
  formatted = formatted
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
    
  return formatted;
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return "<p><br></p>";
  
  // Dividim primer per paràgrafs (doble salt de línia)
  const paragraphs = markdown.split(/\n\s*\n/);
  const htmlParts = paragraphs.map(p => {
    const lines = p.split("\n");
    let inList = false;
    const listItems: string[] = [];
    const nonListParts: string[] = [];
    
    for (const line of lines) {
      // Reconeixem qualsevol llista amb guions, asteriscs o punts de llista
      const bulletMatch = line.match(/^(\s*[-*•]\s+)(.*)/);
      if (bulletMatch) {
        inList = true;
        listItems.push(`<li>${parseInlineMarkdown(bulletMatch[2])}</li>`);
      } else {
        if (inList) {
          nonListParts.push(`<ul>${listItems.join("")}</ul>`);
          listItems.length = 0;
          inList = false;
        }
        if (line.trim() !== "") {
          nonListParts.push(`<p>${parseInlineMarkdown(line)}</p>`);
        }
      }
    }
    if (inList) {
      nonListParts.push(`<ul>${listItems.join("")}</ul>`);
    }
    return nonListParts.join("");
  });
  
  return htmlParts.join("");
}

// --- HELPER DE CONVERSIÓ: HTML A MARKDOWN (DOM-based) ---
function nodeToMarkdown(node: Node): string {
  let text = "";
  
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.nodeValue;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as HTMLElement;
      const tagName = element.tagName.toUpperCase();
      
      const childContent = nodeToMarkdown(element);
      
      switch (tagName) {
        case "B":
        case "STRONG":
          if (childContent.trim()) {
            text += `**${childContent.trim()}**`;
          }
          break;
        case "I":
        case "EM":
          if (childContent.trim()) {
            text += `*${childContent.trim()}*`;
          }
          break;
        case "LI":
          text += `- ${childContent.trim()}\n`;
          break;
        case "UL":
          text += `\n${childContent}\n`;
          break;
        case "P":
        case "DIV":
          if (childContent.trim() === "" || childContent === "\n") {
            text += "\n";
          } else {
            text += `${childContent.trim()}\n\n`;
          }
          break;
        case "BR":
          text += "\n";
          break;
        default:
          text += childContent;
          break;
      }
    }
  }
  
  return text;
}

export function htmlToMarkdown(html: string): string {
  if (typeof window === "undefined") return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  
  const rawMd = nodeToMarkdown(tempDiv);
  return rawMd
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n") // Reduïm salts de línia consecutius a màxim 2
    .trim();
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Explica els detalls aquí...",
  disabled = false,
  id,
  hasError = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const isInitialized = useRef(false);

  // Inicialitzem el contingut HTML un sol cop al muntar
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = markdownToHtml(value);
      isInitialized.current = true;
    }
  }, [value]);

  // Si el valor exterior esdevé buit (ex: form reset), reinicialitzem
  useEffect(() => {
    if (editorRef.current && value === "") {
      editorRef.current.innerHTML = "<p><br></p>";
    }
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    // Si el contingut és només un br buit o està buit, passem string buida
    if (html === "<p><br></p>" || html.trim() === "" || html === "<div><br></div>") {
      onChange("");
    } else {
      const markdown = htmlToMarkdown(html);
      onChange(markdown);
    }
  };

  const executeCommand = (command: string) => {
    if (disabled) return;
    document.execCommand(command, false);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleInput();
  };

  return (
    <div
      style={{
        border: hasError
          ? "2.5px solid #b91c1c"
          : isFocused
          ? "1px solid var(--verd)"
          : "1px solid rgba(26, 107, 58, 0.2)",
        borderRadius: "8px",
        backgroundColor: disabled ? "#f9fafb" : "white",
        boxShadow: isFocused && !hasError ? "0 0 0 3px rgba(26, 107, 58, 0.15)" : "none",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      {/* TOOLBAR PREMIUM */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "8px",
          borderBottom: "1px solid rgba(26, 107, 58, 0.1)",
          backgroundColor: "#fafbfa",
          userSelect: "none"
        }}
      >
        <button
          type="button"
          onClick={() => executeCommand("bold")}
          disabled={disabled}
          title="Negreta (Ctrl+B)"
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            color: "var(--verd-fosc)",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease"
          }}
          className="toolbar-btn"
        >
          <Bold size={16} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("italic")}
          disabled={disabled}
          title="Cursiva (Ctrl+I)"
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            color: "var(--verd-fosc)",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease"
          }}
          className="toolbar-btn"
        >
          <Italic size={16} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand("insertUnorderedList")}
          disabled={disabled}
          title="Llista amb punts"
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            color: "var(--verd-fosc)",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease"
          }}
          className="toolbar-btn"
        >
          <List size={16} />
        </button>
      </div>

      {/* CANVAS D'EDICIÓ CONTENTEDITABLE */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleInput();
        }}
        id={id}
        style={{
          padding: "14px",
          minHeight: "180px",
          maxHeight: "350px",
          overflowY: "auto",
          outline: "none",
          fontSize: "15px",
          lineHeight: "1.6",
          fontFamily: "var(--font-sans)",
          color: "var(--fosc)",
          backgroundColor: "transparent"
        }}
        className="rich-editor-canvas"
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .toolbar-btn:hover {
          background-color: var(--crema-fosca) !important;
          color: var(--verd) !important;
        }
        .rich-editor-canvas p {
          margin: 0 0 12px 0;
        }
        .rich-editor-canvas p:last-child {
          margin-bottom: 0;
        }
        .rich-editor-canvas ul {
          margin: 4px 0 12px 20px;
          padding: 0;
          list-style-type: disc;
        }
        .rich-editor-canvas li {
          margin-bottom: 4px;
        }
        .rich-editor-canvas strong {
          font-weight: 700;
        }
        .rich-editor-canvas em {
          font-style: italic;
        }
        /* Estil placeholder si buit */
        .rich-editor-canvas:empty:before {
          content: "${placeholder}";
          color: var(--muted);
          opacity: 0.7;
          pointer-events: none;
        }
      `}} />
    </div>
  );
}
