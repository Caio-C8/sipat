import { QueryClient } from "@tanstack/react-query";

export function createMobileQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const mobileQueryClient = createMobileQueryClient();
