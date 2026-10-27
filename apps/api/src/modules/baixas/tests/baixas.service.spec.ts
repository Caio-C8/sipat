import { ConflictException } from "@nestjs/common";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import type { ArmazenamentoDocumentosPorta } from "../../../common/storage/armazenamento-documentos.port";
import { CoordenadorDocumentosService } from "../../../common/storage/coordenador-documentos.service";
import type { ComissoesService } from "../../comissoes/comissoes.service";
import type { InventariosPolicyService } from "../../inventarios/inventarios-policy.service";
import { BaixasRepository } from "../baixas.repository";
import { BaixasService } from "../baixas.service";

const PATRIMONIO_ID = "00000000-0000-4000-8000-000000000001";
const COMISSAO_ID = "00000000-0000-4000-8000-000000000002";
const BAIXA_ID = "00000000-0000-4000-8000-000000000003";
const IDENTIDADE: IdentidadeAutenticada = {
  id: "00000000-0000-4000-8000-000000000004",
  nome: "Diretor",
  email: "diretor@example.com",
  perfil: "DIRETOR_PATRIMONIO",
  trocaSenhaObrigatoria: false,
};

function detalhe(caminhoAnexoDocumento: string | null = null) {
  return {
    id: BAIXA_ID,
    dataBaixa: new Date("2026-10-27T00:00:00.000Z"),
    tipo: "ALIENACAO" as const,
    motivo: "Alienação autorizada",
    observacao: null,
    caminhoAnexoDocumento,
    createdById: IDENTIDADE.id,
    createdAt: new Date("2026-10-27T12:00:00.000Z"),
    patrimonio: {
      id: PATRIMONIO_ID,
      numeroPatrimonio: "123",
      descricao: "Notebook",
    },
    comissao: { id: COMISSAO_ID, nome: "Comissão" },
  };
}

describe("BaixasService", () => {
  let diretorio: string;
  let arquivo: string;
  let repository: jest.Mocked<BaixasRepository>;
  let comissoes: jest.Mocked<ComissoesService>;
  let policy: jest.Mocked<InventariosPolicyService>;
  let coordenador: jest.Mocked<CoordenadorDocumentosService>;
  let armazenamento: jest.Mocked<ArmazenamentoDocumentosPorta>;
  let service: BaixasService;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-27T15:00:00.000Z"));
    diretorio = await mkdtemp(path.join(os.tmpdir(), "sipat-baixas-"));
    arquivo = path.join(diretorio, "baixa.pdf");
    await writeFile(arquivo, "%PDF-1.7\nconteudo");

    repository = {
      executarTransacao: jest.fn(),
      bloquearPatrimonio: jest.fn().mockResolvedValue({
        id: PATRIMONIO_ID,
        status: "ATIVO",
      }),
      bloquearComissao: jest.fn().mockResolvedValue({
        id: COMISSAO_ID,
        dataVigenciaInicio: new Date("2026-01-01T00:00:00.000Z"),
        dataVigenciaFim: new Date("2026-12-31T00:00:00.000Z"),
      }),
      buscarPorPatrimonio: jest.fn().mockResolvedValue(null),
      criar: jest.fn().mockResolvedValue(detalhe()),
      marcarPatrimonioBaixado: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<BaixasRepository>;
    repository.executarTransacao.mockImplementation(async (operacao) =>
      operacao(repository),
    );
    comissoes = {
      consultarVigente: jest.fn().mockResolvedValue({ id: COMISSAO_ID }),
    } as unknown as jest.Mocked<ComissoesService>;
    policy = {
      exigirPatrimonioPodeSerBaixado: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<InventariosPolicyService>;
    coordenador = {
      criar: jest
        .fn()
        .mockImplementation(async (_documento, persistir) => persistir()),
    } as unknown as jest.Mocked<CoordenadorDocumentosService>;
    armazenamento = {
      gravar: jest.fn(),
      abrir: jest.fn().mockResolvedValue({
        conteudo: Readable.from("%PDF-1.7"),
        tamanho: 8,
      }),
      substituir: jest.fn(),
      remover: jest.fn(),
      reconciliar: jest.fn(),
    };
    service = new BaixasService(
      repository,
      comissoes,
      policy,
      coordenador,
      armazenamento,
    );
  });

  afterEach(async () => {
    jest.useRealTimers();
    await rm(diretorio, { recursive: true, force: true });
  });

  function body(dataBaixa = "2026-10-27") {
    return {
      dados: JSON.stringify({
        dataBaixa,
        tipo: "ALIENACAO",
        motivo: "Alienação autorizada",
        comissaoId: COMISSAO_ID,
      }),
    };
  }

  it("registra baixa e status atomicamente com auditoria da sessão", async () => {
    await expect(
      service.criar(PATRIMONIO_ID, body(), undefined, IDENTIDADE),
    ).resolves.toEqual(detalhe());

    expect(repository.executarTransacao).toHaveBeenCalledTimes(1);
    expect(repository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        patrimonioId: PATRIMONIO_ID,
        comissaoId: COMISSAO_ID,
        createdById: IDENTIDADE.id,
      }),
    );
    expect(repository.marcarPatrimonioBaixado).toHaveBeenCalledWith(
      PATRIMONIO_ID,
    );
  });

  it("rejeita data futura antes de consultar relações", async () => {
    await expect(
      service.criar(PATRIMONIO_ID, body("2026-10-28"), undefined, IDENTIDADE),
    ).rejects.toMatchObject({ response: { codigo: "DATA_BAIXA_FUTURA" } });
    expect(comissoes.consultarVigente).not.toHaveBeenCalled();
  });

  it("produz conflito estável quando a baixa já existe após o lock", async () => {
    repository.buscarPorPatrimonio.mockResolvedValue(detalhe());

    await expect(
      service.criar(PATRIMONIO_ID, body(), undefined, IDENTIDADE),
    ).rejects.toMatchObject({ response: { codigo: "BAIXA_JA_EXISTENTE" } });
    expect(repository.criar).not.toHaveBeenCalled();
  });

  it("revalida a vigência da comissão dentro da transação", async () => {
    repository.bloquearComissao.mockResolvedValue({
      id: COMISSAO_ID,
      dataVigenciaInicio: new Date("2025-01-01T00:00:00.000Z"),
      dataVigenciaFim: new Date("2025-12-31T00:00:00.000Z"),
    });

    await expect(
      service.criar(PATRIMONIO_ID, body(), undefined, IDENTIDADE),
    ).rejects.toMatchObject({ response: { codigo: "COMISSAO_INVALIDA" } });
    expect(repository.criar).not.toHaveBeenCalled();
  });

  it("prepara o PDF fora da transação e persiste somente sua chave lógica", async () => {
    repository.criar.mockResolvedValue(detalhe("uploads/baixas/documento.pdf"));
    const documento = {
      originalname: "baixa.pdf",
      mimetype: "application/pdf",
      path: arquivo,
      size: 18,
    };

    await service.criar(PATRIMONIO_ID, body(), documento, IDENTIDADE);

    expect(coordenador.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        chave: expect.stringMatching(
          new RegExp(
            `^uploads/baixas/${PATRIMONIO_ID}_\\d{8}_[0-9a-f-]+\\.pdf$`,
          ),
        ),
      }),
      expect.any(Function),
    );
    expect(repository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        caminhoAnexoDocumento: expect.stringMatching(/^uploads\/baixas\//),
      }),
    );
  });

  it("mantém o conflito da policy de inventário e não inicia transação", async () => {
    policy.exigirPatrimonioPodeSerBaixado.mockRejectedValue(
      new ConflictException({
        codigo: "PATRIMONIO_EM_INVENTARIO_ABERTO",
        mensagem: "Conflito",
        erros: [],
      }),
    );

    await expect(
      service.criar(PATRIMONIO_ID, body(), undefined, IDENTIDADE),
    ).rejects.toMatchObject({
      response: { codigo: "PATRIMONIO_EM_INVENTARIO_ABERTO" },
    });
    expect(repository.executarTransacao).not.toHaveBeenCalled();
  });
});
