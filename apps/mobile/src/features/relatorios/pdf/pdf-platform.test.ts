import { afterEach, describe, expect, it, vi } from "vitest";
import { openRelatorioPdf, releaseWebPdfUrls } from "./pdf-platform";

vi.mock("expo-crypto", () => ({
  randomUUID: () => "00000000-0000-4000-8000-000000000123",
}));
vi.mock("expo-file-system", () => ({
  Directory: class {},
  File: class {},
  Paths: { cache: {} },
}));
vi.mock("expo-sharing", () => ({
  isAvailableAsync: vi.fn(),
  shareAsync: vi.fn(),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("PDF no Web", () => {
  it("inicia download opaco e revoga a Object URL", async () => {
    vi.useFakeTimers();
    const click = vi.fn();
    const remove = vi.fn();
    const append = vi.fn();
    const link = { href: "", download: "", rel: "", style: {}, click, remove };
    const createObjectURL = vi.fn(() => "blob:relatorio");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("document", {
      createElement: vi.fn(() => link),
      body: { append },
    });
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    await expect(
      openRelatorioPdf(new TextEncoder().encode("%PDF-1.7\n%%EOF")),
    ).resolves.toBe("download");
    expect(link.download).toBe("00000000-0000-4000-8000-000000000123.pdf");
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1_000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:relatorio");
  });

  it("revoga URLs pendentes na desmontagem ou troca de sessão", async () => {
    vi.useFakeTimers();
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("document", {
      createElement: () => ({
        href: "",
        download: "",
        rel: "",
        style: {},
        click: vi.fn(),
        remove: vi.fn(),
      }),
      body: { append: vi.fn() },
    });
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:pendente",
      revokeObjectURL,
    });
    await openRelatorioPdf(new Uint8Array([1, 2, 3]));

    releaseWebPdfUrls();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:pendente");
  });
});
