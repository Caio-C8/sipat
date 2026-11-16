import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: Readonly<{
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  className?: string;
}>) {
  return (
    <header
      className={cn(
        "flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl leading-tight font-bold tracking-tight text-brand-deep sm:text-3xl">
          {title}
        </h1>
        <div className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {description}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
