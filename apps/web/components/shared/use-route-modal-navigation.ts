"use client";

import { useRouter } from "next/navigation";

export function useRouteModalNavigation() {
  const router = useRouter();
  return {
    close: () => router.back(),
    success: () => {
      router.refresh();
      router.back();
    },
  };
}
