import { beforeEach, describe, expect, it, vi } from "vitest";
import { openRelatorioPdf } from "./pdf-platform";

const native = vi.hoisted(() => ({
  canPreview: true,
  previewFails: false,
  preview: vi.fn(),
  share: vi.fn(),
  sharingAvailable: true,
  deleted: vi.fn(),
  writeFails: false,
}));

vi.mock("react-native", () => ({ Platform: { OS: "android" } }));
vi.mock("expo-crypto", () => ({
  randomUUID: () => "00000000-0000-4000-8000-000000000123",
}));
vi.mock("expo-sharing", () => ({
  isAvailableAsync: async () => native.sharingAvailable,
  shareAsync: native.share,
}));
vi.mock("expo-file-system", () => {
  class Directory {
    exists = false;
    create() {
      this.exists = true;
    }
    delete() {
      native.deleted();
      this.exists = false;
    }
  }
  class File {
    exists = false;
    size = 0;
    uri = "file:///cache/relatorios-pdf/opaque.pdf";
    create() {
      this.exists = true;
    }
    async write(bytes: Uint8Array) {
      if (native.writeFails) throw new Error("gravação falhou");
      this.size = bytes.length;
    }
    delete() {
      this.exists = false;
      native.deleted();
    }
    async canPreview() {
      return native.canPreview;
    }
    async preview() {
      native.preview();
      if (native.previewFails) throw new Error("viewer falhou");
    }
  }
  return { Directory, File, Paths: { cache: {} } };
});

beforeEach(() => {
  native.canPreview = true;
  native.previewFails = false;
  native.sharingAvailable = true;
  native.writeFails = false;
});

describe("PDF nativo", () => {
  it("grava em cache e usa o preview compatível", async () => {
    await expect(openRelatorioPdf(new Uint8Array([1, 2, 3]))).resolves.toBe(
      "preview",
    );
    expect(native.preview).toHaveBeenCalledOnce();
    expect(native.share).not.toHaveBeenCalled();
  });

  it("usa compartilhamento somente quando o viewer não está disponível", async () => {
    native.canPreview = false;
    await expect(openRelatorioPdf(new Uint8Array([1, 2, 3]))).resolves.toBe(
      "sharing",
    );
    expect(native.share).toHaveBeenCalledWith(
      "file:///cache/relatorios-pdf/opaque.pdf",
      expect.objectContaining({ mimeType: "application/pdf" }),
    );
  });

  it("também cai no fallback quando o preview falha", async () => {
    native.previewFails = true;
    await expect(openRelatorioPdf(new Uint8Array([1, 2, 3]))).resolves.toBe(
      "sharing",
    );
    expect(native.share).toHaveBeenCalledOnce();
  });

  it("distingue falha de gravação de falha do visualizador", async () => {
    native.writeFails = true;
    await expect(
      openRelatorioPdf(new Uint8Array([1, 2, 3])),
    ).rejects.toMatchObject({ kind: "file-write" });
  });

  it("informa indisponibilidade quando preview e compartilhamento falham", async () => {
    native.previewFails = true;
    native.share.mockRejectedValueOnce(new Error("compartilhamento falhou"));
    await expect(
      openRelatorioPdf(new Uint8Array([1, 2, 3])),
    ).rejects.toMatchObject({ kind: "viewer-unavailable" });
  });
});
