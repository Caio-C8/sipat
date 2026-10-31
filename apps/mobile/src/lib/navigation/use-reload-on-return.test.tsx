import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { useReloadOnReturn } from "./use-reload-on-return";

const focus = vi.hoisted(
  () =>
    ({ callback: null }) as {
      callback: (() => void) | null;
    },
);

vi.mock("expo-router", () => ({
  useFocusEffect: (callback: () => void) => {
    focus.callback = callback;
  },
}));

function Subject({ reload }: Readonly<{ reload(): void }>) {
  useReloadOnReturn(reload);
  return null;
}

describe("useReloadOnReturn", () => {
  it("ignora o foco inicial e recarrega ao retornar para a rota", () => {
    const reload = vi.fn();
    renderToStaticMarkup(<Subject reload={reload} />);

    expect(focus.callback).not.toBeNull();
    focus.callback?.();
    expect(reload).not.toHaveBeenCalled();

    focus.callback?.();
    expect(reload).toHaveBeenCalledOnce();
  });
});
