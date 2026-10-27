import { ConfigService } from "@nestjs/config";
import {
  lstat,
  mkdtemp,
  readdir,
  rm,
  symlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import type { EnvironmentVariables } from "../../../environment";
import { ErroArmazenamentoDocumentos } from "../erro-armazenamento-documentos";
import { SistemaArquivosLocalAdapter } from "../sistema-arquivos-local.adapter";

function criarAdapter(raiz: string): SistemaArquivosLocalAdapter {
  const config = {
    getOrThrow: jest.fn().mockReturnValue(raiz),
  } as unknown as ConfigService<EnvironmentVariables, true>;
  return new SistemaArquivosLocalAdapter(config);
}

async function ler(stream: Readable): Promise<string> {
  const partes: Buffer[] = [];
  for await (const parte of stream) partes.push(Buffer.from(parte));
  return Buffer.concat(partes).toString("utf8");
}

describe("SistemaArquivosLocalAdapter", () => {
  let raiz: string;
  let adapter: SistemaArquivosLocalAdapter;

  beforeEach(async () => {
    raiz = await mkdtemp(path.join(os.tmpdir(), "sipat-storage-"));
    adapter = criarAdapter(raiz);
    await adapter.onModuleInit();
  });

  afterEach(async () => {
    await rm(raiz, { recursive: true, force: true });
  });

  it("grava por staging, abre e remove uma chave permitida", async () => {
    const chave = "uploads/notas-fiscais/documento.pdf";

    await adapter.gravar(chave, Readable.from("%PDF-conteudo"));

    const aberto = await adapter.abrir(chave);
    expect(aberto.tamanho).toBe(Buffer.byteLength("%PDF-conteudo"));
    await expect(ler(aberto.conteudo)).resolves.toBe("%PDF-conteudo");
    await expect(readdir(path.join(raiz, ".staging"))).resolves.toEqual([]);

    await adapter.remover(chave);
    await expect(
      lstat(path.join(raiz, "notas-fiscais", "documento.pdf")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("isola documentos de baixa no diretório lógico permitido", async () => {
    const chave = "uploads/baixas/documento.pdf";

    await adapter.gravar(chave, Readable.from("%PDF-baixa"));

    await expect(ler((await adapter.abrir(chave)).conteudo)).resolves.toBe(
      "%PDF-baixa",
    );
    await expect(
      lstat(path.join(raiz, "baixas", "documento.pdf")),
    ).resolves.toMatchObject({});
  });

  it.each([
    "../fora.pdf",
    "/tmp/fora.pdf",
    "C:\\fora.pdf",
    "uploads/../fora.pdf",
    "uploads/outro/fora.pdf",
    "uploads/notas-fiscais/subdiretorio/fora.pdf",
    "uploads/notas-fiscais/..\\fora.pdf",
  ])("rejeita chave que não pertence à raiz permitida: %s", async (chave) => {
    await expect(
      adapter.gravar(chave, Readable.from("conteudo")),
    ).rejects.toBeInstanceOf(ErroArmazenamentoDocumentos);
  });

  it("não sobrescreve um arquivo válido existente", async () => {
    const chave = "uploads/notas-fiscais/existente.pdf";
    await adapter.gravar(chave, Readable.from("original"));

    await expect(adapter.gravar(chave, Readable.from("novo"))).rejects.toThrow(
      "Não foi possível gravar",
    );
    await expect(ler((await adapter.abrir(chave)).conteudo)).resolves.toBe(
      "original",
    );
  });

  it("remove o temporário quando o stream falha", async () => {
    const conteudo = new Readable({
      read() {
        this.destroy(new Error("falha simulada"));
      },
    });

    await expect(
      adapter.gravar("uploads/notas-fiscais/falha.pdf", conteudo),
    ).rejects.toThrow("Não foi possível gravar");
    await expect(readdir(path.join(raiz, ".staging"))).resolves.toEqual([]);
  });

  it("substitui usando uma nova chave e preserva a antiga se a nova falhar", async () => {
    const antiga = "uploads/notas-fiscais/antiga.pdf";
    const nova = "uploads/notas-fiscais/nova.pdf";
    await adapter.gravar(antiga, Readable.from("antiga"));
    await adapter.gravar(nova, Readable.from("já existe"));

    await expect(
      adapter.substituir(antiga, nova, Readable.from("nova")),
    ).rejects.toThrow();
    await expect(ler((await adapter.abrir(antiga)).conteudo)).resolves.toBe(
      "antiga",
    );
  });

  it("rejeita arquivo e diretório permitido que sejam symlink", async () => {
    const externo = await mkdtemp(
      path.join(os.tmpdir(), "sipat-storage-fora-"),
    );
    try {
      await writeFile(path.join(externo, "fora.pdf"), "fora");
      const linkArquivo = path.join(raiz, "notas-fiscais", "link.pdf");
      try {
        await symlink(path.join(externo, "fora.pdf"), linkArquivo, "file");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EPERM") return;
        throw error;
      }

      await expect(
        adapter.abrir("uploads/notas-fiscais/link.pdf"),
      ).rejects.toThrow("Documento inválido");
    } finally {
      await rm(externo, { recursive: true, force: true });
    }
  });

  it("reconcilia temporários e órfãos vencidos de forma idempotente", async () => {
    const referenciada = "uploads/notas-fiscais/referenciada.pdf";
    const orfa = "uploads/notas-fiscais/orfa.pdf";
    const recente = "uploads/notas-fiscais/recente.pdf";
    await adapter.gravar(referenciada, Readable.from("referenciada"));
    await adapter.gravar(orfa, Readable.from("orfa"));
    await adapter.gravar(recente, Readable.from("recente"));

    const temporario = path.join(raiz, ".staging", "interrompido.tmp");
    await writeFile(temporario, "temporario");
    const antigo = new Date("2025-01-01T00:00:00.000Z");
    await utimes(
      path.join(raiz, "notas-fiscais", "referenciada.pdf"),
      antigo,
      antigo,
    );
    await utimes(path.join(raiz, "notas-fiscais", "orfa.pdf"), antigo, antigo);
    await utimes(temporario, antigo, antigo);

    const opcoes = {
      chavesReferenciadas: new Set([referenciada]),
      temporariosModificadosAntesDe: new Date("2025-01-02T00:00:00.000Z"),
      orfaosModificadosAntesDe: new Date("2025-01-02T00:00:00.000Z"),
    };
    await expect(adapter.reconciliar(opcoes)).resolves.toEqual({
      temporariosRemovidos: 1,
      orfaosRemovidos: 1,
    });
    await expect(adapter.reconciliar(opcoes)).resolves.toEqual({
      temporariosRemovidos: 0,
      orfaosRemovidos: 0,
    });
    await expect(
      ler((await adapter.abrir(referenciada)).conteudo),
    ).resolves.toBe("referenciada");
    await expect(ler((await adapter.abrir(recente)).conteudo)).resolves.toBe(
      "recente",
    );
  });

  it("falha na inicialização quando a raiz não existe", async () => {
    const ausente = path.join(raiz, "ausente");
    await expect(criarAdapter(ausente).onModuleInit()).rejects.toThrow(
      "UPLOADS_ROOT_PATH deve existir",
    );
  });
});
