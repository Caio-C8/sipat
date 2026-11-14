import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../lib/api/api-error";
import {
  PdfEmissionCoordinator,
  relatorioPdfErrorMessage,
} from "./use-relatorio-pdf";

vi.mock("../../../config/public-app-config", () => ({
  publicAppConfig: { apiBaseUrl: "https://api.example.test/api" },
}));
vi.mock("expo-crypto", () => ({ randomUUID: vi.fn() }));
vi.mock("expo-file-system", () => ({
  Directory: class {},
  File: class {},
  Paths: { cache: {} },
}));
vi.mock("expo-sharing", () => ({
  isAvailableAsync: vi.fn(),
  shareAsync: vi.fn(),
}));

describe("PdfEmissionCoordinator", () => {
  it("ignora uma segunda emissão enquanto a primeira está pendente", async () => {
    const coordinator = new PdfEmissionCoordinator();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const operation = vi.fn(async () => pending);

    const first = coordinator.run(operation);
    await expect(coordinator.run(operation)).resolves.toBe(false);
    expect(operation).toHaveBeenCalledOnce();
    release();
    await expect(first).resolves.toBe(true);
    await expect(coordinator.run(operation)).resolves.toBe(true);
  });

  it("aborta a emissão ativa no cancelamento", async () => {
    const coordinator = new PdfEmissionCoordinator();
    let capturedSignal: AbortSignal | undefined;
    const running = coordinator.run(
      (signal) =>
        new Promise<void>((resolve) => {
          capturedSignal = signal;
          signal.addEventListener("abort", () => resolve(), { once: true });
        }),
    );

    coordinator.cancel();
    expect(capturedSignal?.aborted).toBe(true);
    await expect(running).resolves.toBe(true);
  });
});

describe("relatorioPdfErrorMessage", () => {
  it("apresenta Retry-After e diferencia falhas públicas", () => {
    expect(
      relatorioPdfErrorMessage(
        new ApiError("http", 429, "RELATORIO_LIMITE_EXCEDIDO", [], 9),
      ),
    ).toContain("9 segundos");
    expect(relatorioPdfErrorMessage(new ApiError("timeout"))).toContain(
      "25 segundos",
    );
    expect(
      relatorioPdfErrorMessage(new ApiError("invalid-response")),
    ).toContain("PDF válido");
  });
});
