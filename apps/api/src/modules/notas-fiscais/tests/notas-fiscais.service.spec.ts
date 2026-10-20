import { ConflictException } from "@nestjs/common";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import type { ArmazenamentoDocumentosPorta } from "../../../common/storage/armazenamento-documentos.port";
import { CoordenadorDocumentosService } from "../../../common/storage/coordenador-documentos.service";
import type { FornecedoresService } from "../../fornecedores/fornecedores.service";
import { NotasFiscaisRepository } from "../notas-fiscais.repository";
import { NotasFiscaisService } from "../notas-fiscais.service";

const USUARIO_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const FORNECEDOR_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const PROCESSO_ID = "1d71109f-c8e1-4200-bde7-38ed95a4d083";
const NOTA_ID = "8c719276-86c2-427a-8255-d8ad6dff2fd1";
const CHAVE_ANTIGA = "uploads/notas-fiscais/antiga.pdf";

function detalhe(caminhoAnexoNotaFiscal: string | null = CHAVE_ANTIGA) {
  return {
    id: NOTA_ID,
    numeroNotaFiscal: "NF-1",
    anoNotaFiscal: 2026,
    dataEmissao: new Date("2026-10-19T00:00:00.000Z"),
    caminhoAnexoNotaFiscal,
    fornecedor: { id: FORNECEDOR_ID, razaoSocial: "Fornecedor" },
    processoCompra: {
      id: PROCESSO_ID,
      numeroProcesso: "123/2026",
      anoProcesso: 2026,
    },
    createdAt: new Date("2026-10-19T12:00:00.000Z"),
    updatedAt: null,
  };
}

describe("NotasFiscaisService", () => {
  let diretorio: string;
  let arquivo: string;
  let repository: jest.Mocked<NotasFiscaisRepository>;
  let fornecedores: jest.Mocked<FornecedoresService>;
  let coordenador: jest.Mocked<CoordenadorDocumentosService>;
  let armazenamento: jest.Mocked<ArmazenamentoDocumentosPorta>;
  let service: NotasFiscaisService;

  beforeEach(async () => {
    diretorio = await mkdtemp(path.join(os.tmpdir(), "sipat-notas-"));
    arquivo = path.join(diretorio, "nota.pdf");
    await writeFile(arquivo, "%PDF-1.7\nconteudo");

    repository = {
      executarTransacao: jest.fn(),
      bloquearFornecedorAtivo: jest.fn().mockResolvedValue(true),
      processoExiste: jest.fn().mockResolvedValue({ id: PROCESSO_ID }),
      criar: jest.fn().mockResolvedValue(detalhe()),
      listar: jest.fn(),
      contar: jest.fn(),
      buscarPorId: jest.fn().mockResolvedValue(detalhe()),
      alterar: jest.fn(),
      alterarAnexoSeAtual: jest.fn().mockResolvedValue(true),
      listarChavesAnexos: jest.fn().mockResolvedValue([CHAVE_ANTIGA]),
    } as unknown as jest.Mocked<NotasFiscaisRepository>;
    repository.executarTransacao.mockImplementation(async (operacao) =>
      operacao(repository),
    );

    fornecedores = {
      consultarAtivoParaVinculo: jest.fn().mockResolvedValue({ ativo: true }),
    } as unknown as jest.Mocked<FornecedoresService>;
    coordenador = {
      criar: jest
        .fn()
        .mockImplementation(async (_documento, persistir) => persistir()),
      substituir: jest
        .fn()
        .mockImplementation(async (_atual, _novo, persistir) => persistir()),
      remover: jest.fn().mockImplementation(async (_chave, limpar) => limpar()),
    } as unknown as jest.Mocked<CoordenadorDocumentosService>;
    armazenamento = {
      gravar: jest.fn(),
      abrir: jest.fn().mockResolvedValue({
        conteudo: Readable.from("%PDF-1.7"),
        tamanho: 8,
      }),
      substituir: jest.fn(),
      remover: jest.fn(),
      reconciliar: jest.fn().mockResolvedValue({
        temporariosRemovidos: 0,
        orfaosRemovidos: 0,
      }),
    };
    service = new NotasFiscaisService(
      repository,
      fornecedores,
      coordenador,
      armazenamento,
    );
  });

  afterEach(async () => rm(diretorio, { recursive: true, force: true }));

  function multipart() {
    return {
      body: {
        dados: JSON.stringify({
          processoCompraId: PROCESSO_ID,
          numeroNotaFiscal: "NF-1",
          anoNotaFiscal: 2026,
          dataEmissao: "2026-10-19",
          fornecedorId: FORNECEDOR_ID,
        }),
      },
      arquivo: {
        originalname: "nota.pdf",
        mimetype: "application/pdf",
        path: arquivo,
        size: 18,
      },
    };
  }

  it("cria a nota com auditoria e referência compensável do PDF", async () => {
    const entrada = multipart();

    await expect(
      service.criar(entrada.body, entrada.arquivo, {
        id: USUARIO_ID,
        nome: "Diretor",
        email: "diretor@example.com",
        perfil: "DIRETOR_PATRIMONIO",
      }),
    ).resolves.toEqual(detalhe());

    expect(coordenador.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        chave: expect.stringMatching(
          /^uploads\/notas-fiscais\/NF-1_\d{8}_[0-9a-f-]+\.pdf$/,
        ),
      }),
      expect.any(Function),
    );
    expect(repository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        processoCompra: { connect: { id: PROCESSO_ID } },
        fornecedor: { connect: { id: FORNECEDOR_ID } },
        createdBy: { connect: { id: USUARIO_ID } },
      }),
    );
  });

  it("substitui a referência antes de remover o anexo anterior", async () => {
    const entrada = multipart();
    repository.buscarPorId
      .mockResolvedValueOnce(detalhe())
      .mockResolvedValueOnce(detalhe("uploads/notas-fiscais/nova.pdf"));

    await service.substituirAnexo(NOTA_ID, entrada.arquivo);

    expect(coordenador.substituir).toHaveBeenCalledWith(
      CHAVE_ANTIGA,
      expect.objectContaining({
        chave: expect.stringMatching(/^uploads\/notas-fiscais\//),
      }),
      expect.any(Function),
    );
    expect(repository.alterarAnexoSeAtual).toHaveBeenCalledWith(
      NOTA_ID,
      CHAVE_ANTIGA,
      expect.stringMatching(/^uploads\/notas-fiscais\//),
    );
  });

  it("compensa o arquivo novo quando a referência muda concorrentemente", async () => {
    repository.alterarAnexoSeAtual.mockResolvedValue(false);
    armazenamento.gravar.mockResolvedValue(undefined);
    armazenamento.remover.mockResolvedValue(undefined);
    service = new NotasFiscaisService(
      repository,
      fornecedores,
      new CoordenadorDocumentosService(armazenamento),
      armazenamento,
    );
    const entrada = multipart();

    await expect(
      service.substituirAnexo(NOTA_ID, entrada.arquivo),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(armazenamento.remover).toHaveBeenCalledTimes(1);
    expect(armazenamento.remover).not.toHaveBeenCalledWith(CHAVE_ANTIGA);
  });

  it("remove o anexo de forma idempotente sem excluir a nota", async () => {
    repository.buscarPorId.mockResolvedValue(detalhe(null));

    await expect(service.removerAnexo(NOTA_ID)).resolves.toEqual(detalhe(null));

    expect(coordenador.remover).not.toHaveBeenCalled();
    expect(repository.alterar).not.toHaveBeenCalled();
  });

  it("abre somente a chave referenciada e reconcilia órfãos com carência", async () => {
    await expect(service.abrirAnexo(NOTA_ID)).resolves.toMatchObject({
      tamanho: 8,
    });
    expect(armazenamento.abrir).toHaveBeenCalledWith(CHAVE_ANTIGA);

    await service.onApplicationBootstrap();
    expect(armazenamento.reconciliar).toHaveBeenCalledWith(
      expect.objectContaining({
        chavesReferenciadas: new Set([CHAVE_ANTIGA]),
        temporariosModificadosAntesDe: expect.any(Date),
        orfaosModificadosAntesDe: expect.any(Date),
      }),
    );
  });
});
