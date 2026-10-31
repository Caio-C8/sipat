import { focusManager, QueryObserver } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { AppStateStatus } from "react-native";
import { createMobileQueryClient } from "./mobile-query-client";
import { installNativeQueryFocusLifecycle } from "./native-query-focus";

function createAppState(initial: AppStateStatus) {
  let listener: ((state: AppStateStatus) => void) | undefined;
  const remove = vi.fn();
  return {
    source: {
      currentState: initial,
      addEventListener: vi.fn(
        (_type: "change", nextListener: (state: AppStateStatus) => void) => {
          listener = nextListener;
          return { remove };
        },
      ),
    },
    change(state: AppStateStatus) {
      listener?.(state);
    },
    remove,
  };
}

describe("installNativeQueryFocusLifecycle", () => {
  it("publica foco somente no nativo e restaura o comportamento padrão", () => {
    const appState = createAppState("active");
    const setFocused = vi.fn();

    const cleanup = installNativeQueryFocusLifecycle(
      "android",
      appState.source,
      setFocused,
    );
    appState.change("background");
    appState.change("active");
    cleanup();

    expect(setFocused.mock.calls).toEqual([
      [true],
      [false],
      [true],
      [undefined],
    ]);
    expect(appState.remove).toHaveBeenCalledOnce();
  });

  it("preserva o lifecycle do navegador", () => {
    const appState = createAppState("active");
    const setFocused = vi.fn();

    installNativeQueryFocusLifecycle("web", appState.source, setFocused)();

    expect(appState.source.addEventListener).not.toHaveBeenCalled();
    expect(setFocused).not.toHaveBeenCalled();
  });

  it("não refaz uma query ainda fresca quando o app recupera foco", async () => {
    const client = createMobileQueryClient();
    client.mount();
    const queryFn = vi.fn(async () => "confirmado");
    const observer = new QueryObserver(client, {
      queryKey: ["fresh-on-focus"],
      queryFn,
      staleTime: 30_000,
    });
    const unsubscribe = observer.subscribe(() => undefined);
    await observer.refetch();

    focusManager.setFocused(false);
    focusManager.setFocused(true);
    await Promise.resolve();

    expect(queryFn).toHaveBeenCalledOnce();

    unsubscribe();
    client.unmount();
    focusManager.setFocused(undefined);
  });
});
