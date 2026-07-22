import { cn, initials } from "@/lib/utils";

/** Pastille colorée avec les initiales — pas d'upload de photo, inutile pour 3 personnes. */
export function UserAvatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-6 text-[10px]",
    md: "size-8 text-xs",
    lg: "size-10 text-sm",
  };

  return (
    <span
      title={name}
      style={{ backgroundColor: color ?? "#6366f1" }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
