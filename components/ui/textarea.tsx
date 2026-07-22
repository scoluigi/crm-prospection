import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors",
      "placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:outline-none",
      "disabled:cursor-not-allowed disabled:bg-slate-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
