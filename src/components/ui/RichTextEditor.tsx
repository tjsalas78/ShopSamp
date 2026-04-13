"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "", className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      isUpdatingRef.current = false;
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const formatButtons = [
    { command: "bold", icon: "B", title: "Bold" },
    { command: "italic", icon: "I", title: "Italic" },
    { command: "underline", icon: "U", title: "Underline" },
    { command: "insertUnorderedList", icon: "•", title: "Bullet List" },
  ];

  return (
    <div className={cn("flex flex-col gap-2 rounded-lg border border-surface-variant bg-surface-low overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-surface-variant bg-surface">
        {formatButtons.map((btn) => (
          <button
            key={btn.command}
            onClick={() => applyFormat(btn.command)}
            title={btn.title}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded text-sm font-semibold text-secondary hover:bg-surface-variant hover:text-on-surface transition-colors"
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className="min-h-[120px] max-h-[240px] overflow-y-auto p-3 outline-none text-sm text-on-surface whitespace-pre-wrap break-words"
      />
    </div>
  );
}
