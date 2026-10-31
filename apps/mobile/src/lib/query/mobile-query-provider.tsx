import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { mobileQueryClient } from "./mobile-query-client";
import { NativeQueryFocusLifecycle } from "./native-query-focus";

export function MobileQueryProvider({ children }: Readonly<PropsWithChildren>) {
  return (
    <QueryClientProvider client={mobileQueryClient}>
      <NativeQueryFocusLifecycle />
      {children}
    </QueryClientProvider>
  );
}
