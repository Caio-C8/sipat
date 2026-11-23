"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function RouteModal({
  title,
  description,
  children,
  onClose,
  contentClassName,
}: {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  onClose: () => void;
  contentClassName?: string;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-h-[min(92vh,52rem)] max-w-2xl overflow-y-auto",
          contentClassName,
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
