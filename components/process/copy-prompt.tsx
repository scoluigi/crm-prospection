"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyPrompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Prompt copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  return (
    <div className="relative">
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 pr-12 text-sm leading-relaxed text-slate-700">
        {text}
      </pre>
      <Button
        size="sm"
        variant="secondary"
        onClick={copy}
        className="absolute right-2 top-2"
      >
        {copied ? <Check className="text-emerald-600" /> : <Copy />}
        <span className="hidden sm:inline">{copied ? "Copié" : "Copier"}</span>
      </Button>
    </div>
  );
}
