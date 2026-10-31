import { ConflictException } from "@nestjs/common";
import { Prisma } from "@repo/database";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ArmazenamentoDocumentosPorta } from "../../../common/storage/armazenamento-documentos.port";
import { CoordenadorDocumentosService } from "../../../common/storage/coordenador-documentos.service";
import type { FornecedoresService } from "../../fornecedores/fornecedores.service";
import { ProcessoCompraResponseMapper } from "../mappers";
import { ProcessosCompraRepository } from "../processos-compra.repository";
import { ProcessosCompraService } from "../processos-compra.service";

const USUARIO_ID = "28df5e9c-3e60-4a8e-a4d4-8ca70221f4f0";
const FORNECEDOR_ID = "6c167f7a-0e4b-46bb-8c78-bc33585c91fa";
const PROCESSO_ID = "1d71109f-c8e1-4200-bde7-38ed95a4d083";
const NOTA_ID = "8c719276-86c2-427a-8255-d8ad6dff2fd1";

describe("ProcessosCompraService", () => {
  let diretorio: string;
  let arquivo: string;
  let repository: jest.Mocked<ProcessosCompraRepository>;
  let fornecedores: jest.Mocked<FornecedoresService>;
  let documentos: jest.Mocked<CoordenadorDocumentosService>;
  let service: ProcessosCompraService;

  const detalhe = {
    id: PROCESSO_ID,
    numeroProcesso: "123/2026",
    anoProcesso: 2026,
    numeroEmpenho: null,
    anoEmpenho: null,
    valorTotal: new Prisma.Decimal("100.5"),
    observacao: null,
    createdAt: new Date("2026-10-19T12:00:00.000Z"),
    updatedAt: null,
    notasFiscais: [
      {
        id: NOTA_ID,
        numeroNotaFiscal: "NF-1",
        anoNotaFiscal: 2026,
        dataEmissao: new Date("2026-10-19T00:00:00.000Z"),
        caminhoAnexoNotaFiscal: "uploads/notas-fiscais/segredo.pdf",
        fornecedor: { id: FORNECEDOR_ID, razaoSocial: "Fornecedor" },
      },
    ],
    _count: { notasFiscais: 1 },
  };

  beforeEach(async () => {
    diretorio = await mkdtemp(path.join(os.tmpdir(), "sipat-compras-"));
    arquivo = path.join(diretorio, "nota.pdf");
    await writeFile(arquivo, "%PDF-1.7\nconteudo");

    repository = {
      executarTransacao: jest.fn(),
      tentarBloquearChaveCriacao: jest.fn().mockResolvedValue(true),
      buscarPorChaveCriacao: jest.fn().mockResolvedValue(null),
      bloquearFornecedoresAtivos: jest.fn(),
      criar: jest.fn(),
      listar: jest.fn(),
      contar: jest.fn(),
      buscarPorId: jest.fn(),
      alterar: jest.fn(),
    } as unknown as jest.Mocked<ProcessosCompraRepository>;
    repository.executarTransacao.mockImplementation(async (operacao) =>
      operacao(repository),
    );
    repository.bloquearFornecedoresAtivos.mockResolvedValue(
      new Set([FORNECEDOR_ID]),
    );
    repository.criar.mockResolvedValue(detalhe);

    fornecedores = {
      consultarAtivoParaVinculo: jest.fn().mockResolvedValue({ ativo: true }),
    } as unknown as jest.Mocked<FornecedoresService>;
    documentos = {
      criarMuitos: jest
        .fn()
        .mockImplementation(async (_arquivos, persistir) => persistir()),
    } as unknown as jest.Mocked<CoordenadorDocumentosService>;
    service = new ProcessosCompraService(repository, fornecedores, documentos);
  });

  afterEach(async () => rm(diretorio, { recursive: true, force: true }));

  function multipart() {
    return {
      body: {
        dados: JSON.stringify({
          chaveIdempotencia: randomUUID(),
          numeroProcesso: "123/2026",
          anoProcesso: 2026,
          valorTotal: "100.5",
          notas: [
            {
              numeroNotaFiscal: "NF-1",
              anoNotaFiscal: 2026,
              dataEmissao: "2026-10-19",
              fornecedorId: FORNECEDOR_ID,
              anexoIndice: 0,
            },
          ],
        }),
      },
      anexos: [
        {
          originalname: "nota.pdf",
          mimetype: "application/pdf",
          path: arquivo,
          size: 18,
        },
      ],
    };
  }

  it("cria processo, notas e referência do PDF na mesma operação lógica", async () => {
    const entrada = multipart();
    const criado = await service.criar(entrada.body, entrada.anexos, {
      id: USUARIO_ID,
      nome: "Diretor",
      email: "diretor@example.com",
      perfil: "DIRETOR_PATRIMONIO",
      trocaSenhaObrigatoria: false,
    });

    expect(criado).toBe(detalhe);
    expect(fornecedores.consultarAtivoParaVinculo).toHaveBeenCalledWith(
      FORNECEDOR_ID,
    );
    expect(documentos.criarMuitos).toHaveBeenCalledTimes(1);
    expect(repository.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        createdBy: { connect: { id: USUARIO_ID } },
        notasFiscais: {
          create: [
            expect.objectContaining({
              fornecedor: { connect: { id: FORNECEDOR_ID } },
              caminhoAnexoNotaFiscal: expect.stringMatching(
                /^uploads\/notas-fiscais\/NF-1_\d{8}_[0-9a-f-]+\.pdf$/,
              ),
            }),
          ],
        },
      }),
    );

    expect(ProcessoCompraResponseMapper.paraDetalhe(criado)).toEqual(
      expect.objectContaining({
        notas: [
          expect.objectContaining({
            anexoUrl: `/api/notas-fiscais/${NOTA_ID}/anexo`,
          }),
        ],
      }),
    );
  });

  it("rejeita conteúdo que apenas declara ser PDF", async () => {
    await writeFile(arquivo, "arquivo malicioso");
    const entrada = multipart();

    await expect(
      service.criar(entrada.body, entrada.anexos, {
        id: USUARIO_ID,
        nome: "Diretor",
        email: "diretor@example.com",
        perfil: "DIRETOR_PATRIMONIO",
        trocaSenhaObrigatoria: false,
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(documentos.criarMuitos).not.toHaveBeenCalled();
    expect(repository.criar).not.toHaveBeenCalled();
  });

  it("interrompe a criação quando o fornecedor está inativo", async () => {
    fornecedores.consultarAtivoParaVinculo.mockRejectedValue(
      new ConflictException("inativo"),
    );
    const entrada = multipart();

    await expect(
      service.criar(entrada.body, entrada.anexos, {
        id: USUARIO_ID,
        nome: "Diretor",
        email: "diretor@example.com",
        perfil: "DIRETOR_PATRIMONIO",
        trocaSenhaObrigatoria: false,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(documentos.criarMuitos).not.toHaveBeenCalled();
  });

  it("compensa o PDF quando o fornecedor muda antes da transação", async () => {
    const armazenamento: jest.Mocked<ArmazenamentoDocumentosPorta> = {
      gravar: jest.fn().mockResolvedValue(undefined),
      abrir: jest.fn(),
      substituir: jest.fn(),
      remover: jest.fn().mockResolvedValue(undefined),
      reconciliar: jest.fn(),
    };
    repository.bloquearFornecedoresAtivos.mockResolvedValue(new Set());
    service = new ProcessosCompraService(
      repository,
      fornecedores,
      new CoordenadorDocumentosService(armazenamento),
    );
    const entrada = multipart();

    await expect(
      service.criar(entrada.body, entrada.anexos, {
        id: USUARIO_ID,
        nome: "Diretor",
        email: "diretor@example.com",
        perfil: "DIRETOR_PATRIMONIO",
        trocaSenhaObrigatoria: false,
      }),
    ).rejects.toMatchObject({ status: 409 });

    expect(armazenamento.gravar).toHaveBeenCalledTimes(1);
    expect(armazenamento.remover).toHaveBeenCalledWith(
      expect.stringMatching(/^uploads\/notas-fiscais\//),
    );
    expect(repository.criar).not.toHaveBeenCalled();
  });
});
import { randomUUID } from "node:crypto";
