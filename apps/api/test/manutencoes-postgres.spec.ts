import { randomUUID } from "node:crypto";
import type { IdentidadeAutenticada } from "@repo/contracts";
import { createDatabaseClient, type DatabaseClient } from "@repo/database";
import { ComissoesRepository } from "../src/modules/comissoes/comissoes.repository";
import { ComissoesService } from "../src/modules/comissoes/comissoes.service";
import { InventariosPolicyService } from "../src/modules/inventarios/inventarios-policy.service";
import { InventariosRepository } from "../src/modules/inventarios/inventarios.repository";
import { ManutencoesRepository } from "../src/modules/manutencoes/manutencoes.repository";
import { ManutencoesService } from "../src/modules/manutencoes/manutencoes.service";
import { PatrimoniosRepository } from "../src/modules/patrimonios/patrimonios.repository";
import { PatrimoniosService } from "../src/modules/patrimonios/patrimonios.service";
import { CoordenadorDocumentosService } from "../src/common/storage/coordenador-documentos.service";
import type { ArmazenamentoDocumentosPorta } from "../src/common/storage/armazenamento-documentos.port";

const url = process.env.MANUTENCOES_INTEGRATION_DATABASE_URL;
const describeComBanco = url ? describe : describe.skip;

describeComBanco("manutenção no PostgreSQL descartável", () => {
  let db: DatabaseClient;
  let service: ManutencoesService;
  let identidade: IdentidadeAutenticada;
  let comissaoId: string;
  let setorId: string;
  let especieId: string;
  let fornecedorId: string;

  jest.setTimeout(60_000);

  beforeAll(async () => {
    if (!url || !ehBancoIsolado(url))
      throw new Error(
        "O teste só pode usar o PostgreSQL descartável de manutenção na porta 5434.",
      );
    db = createDatabaseClient(url);
    await db.$connect();
    service = new ManutencoesService(
      new ManutencoesRepository(db),
      new PatrimoniosService(new PatrimoniosRepository(db)),
      new ComissoesService(new ComissoesRepository(db)),
      new InventariosPolicyService(new InventariosRepository(db)),
      {} as CoordenadorDocumentosService,
      {} as ArmazenamentoDocumentosPorta,
    );
    const tag = randomUUID();
    const usuario = await db.usuario.create({
      data: {
        nome: "Diretor de teste",
        email: `${tag}@example.test`,
        senha: "hash-de-teste",
        perfil: "DIRETOR_PATRIMONIO",
        trocaSenhaObrigatoria: false,
      },
    });
    identidade = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      trocaSenhaObrigatoria: false,
    };
    const responsavel = await db.responsavel.create({
      data: {
        nome: "Responsável",
        matricula: tag.slice(0, 20),
        createdById: usuario.id,
      },
    });
    const setor = await db.setor.create({
      data: {
        nome: "Setor de teste",
        responsavelId: responsavel.id,
        createdById: usuario.id,
      },
    });
    setorId = setor.id;
    const natureza = await db.natureza.create({
      data: {
        nome: `Natureza ${tag}`,
        nomeNormalizado: tag,
        createdById: usuario.id,
      },
    });
    const especie = await db.especie.create({
      data: {
        nome: `Espécie ${tag}`,
        nomeNormalizado: tag,
        naturezaId: natureza.id,
        createdById: usuario.id,
      },
    });
    especieId = especie.id;
    const comissao = await db.comissao.create({
      data: {
        nome: "Comissão de teste",
        dataVigenciaInicio: new Date("2020-01-01T00:00:00.000Z"),
        dataVigenciaFim: new Date("2026-10-28T00:00:00.000Z"),
        createdById: usuario.id,
      },
    });
    comissaoId = comissao.id;
    const fornecedor = await db.fornecedor.create({
      data: { razaoSocial: "Oficina de teste", createdById: usuario.id },
    });
    fornecedorId = fornecedor.id;
  });
  afterAll(async () => db?.$disconnect());

  async function bem(numero: string) {
    return db.patrimonio.create({
      data: {
        numeroPatrimonio: numero,
        tipoNumeroPatrimonial: "OFICIAL",
        descricao: `Bem ${numero}`,
        dataTombamento: new Date("2025-01-01T00:00:00.000Z"),
        valorIncorporacao: "1000",
        especieId,
        setorAtualId: setorId,
        createdById: identidade.id,
      },
    });
  }

  it("cria dois itens, preserva orçamento, recebe parcialmente e conclui sem alterar valor patrimonial", async () => {
    const primeiro = await bem(String(Date.now()).slice(-9));
    const segundo = await bem(String(Date.now() + 1).slice(-9));
    const chaveIdempotencia = randomUUID();
    const pedidoDados = {
      chaveIdempotencia,
      dataEnvio: "2026-10-20",
      comissaoId,
      itens: [
        {
          patrimonioId: primeiro.id,
          tipo: "CORRETIVA" as const,
          fornecedorId,
          previsaoRetorno: "2026-10-25",
          descricaoProblema: "Falha",
          orcamentoInicial: {
            dataOrcamento: "2026-10-20",
            descricaoOrcamento: "Peça",
            valorOrcamento: "10.00",
          },
        },
        {
          patrimonioId: segundo.id,
          tipo: "PREVENTIVA" as const,
          descricaoProblema: "Revisão",
        },
      ],
    };
    const pedido = await service.criar(pedidoDados, identidade);
    expect(pedido.itens).toHaveLength(2);
    await expect(service.criar(pedidoDados, identidade)).rejects.toMatchObject({
      response: { codigo: "OPERACAO_JA_PROCESSADA" },
    });
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: primeiro.id } }))
        .status,
    ).toBe("EM_MANUTENCAO");
    const item1 = pedido.itens.find(
      (item) => item.patrimonio.id === primeiro.id,
    )!;
    const item2 = pedido.itens.find(
      (item) => item.patrimonio.id === segundo.id,
    )!;
    expect(item1.versaoOrcamento).toBe(1);
    await service.atualizarOrcamento(
      pedido.id,
      item1.id,
      {
        versaoEsperada: 1,
        dataOrcamento: "2026-10-21",
        descricaoOrcamento: "Peça nova",
        valorOrcamento: "20.00",
      },
      identidade,
    );
    await expect(
      service.atualizarOrcamento(
        pedido.id,
        item1.id,
        {
          versaoEsperada: 1,
          dataOrcamento: "2026-10-21",
          descricaoOrcamento: "Conflito",
          valorOrcamento: "30",
        },
        identidade,
      ),
    ).rejects.toMatchObject({ status: 409 });
    const retorno1 = {
      chaveIdempotencia: randomUUID(),
      dataRetorno: "2026-10-22",
      descricaoServicoRealizado: "Peça trocada",
      valorRealizado: "20",
      garantia: { descricao: "90 dias", dataFim: "2027-01-20" },
    };
    const parcial = await service.registrarRetorno(
      pedido.id,
      item1.id,
      retorno1,
      identidade,
    );
    expect(parcial.statusPedido).toBe("EM_ANDAMENTO");
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: primeiro.id } }))
        .status,
    ).toBe("ATIVO");
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: segundo.id } }))
        .status,
    ).toBe("EM_MANUTENCAO");
    await expect(
      service.registrarRetorno(pedido.id, item1.id, retorno1, identidade),
    ).rejects.toMatchObject({
      response: { codigo: "OPERACAO_JA_PROCESSADA" },
    });
    await expect(
      service.atualizarOrcamento(
        pedido.id,
        item1.id,
        {
          versaoEsperada: 2,
          dataOrcamento: "2026-10-23",
          descricaoOrcamento: "Tarde",
          valorOrcamento: "1",
        },
        identidade,
      ),
    ).rejects.toMatchObject({ status: 409 });
    const final = await service.registrarRetorno(
      pedido.id,
      item2.id,
      {
        chaveIdempotencia: randomUUID(),
        dataRetorno: "2026-10-23",
        descricaoServicoRealizado: "Revisão",
        valorRealizado: "0",
        garantia: null,
      },
      identidade,
    );
    expect(final.statusPedido).toBe("CONCLUIDA");
    expect(final.dataRetornoPedido).toBe("2026-10-23");
    expect(
      (
        await db.patrimonio.findUniqueOrThrow({ where: { id: primeiro.id } })
      ).valorIncorporacao.toString(),
    ).toBe("1000");
  });

  it("reverte o pedido inteiro se um item for inválido e impede dois envios concorrentes do mesmo bem", async () => {
    const primeiro = await bem(String(Date.now()).slice(-9));
    const segundo = await bem(String(Date.now() + 1).slice(-9));
    const base = { dataEnvio: "2026-10-20", comissaoId };
    await expect(
      service.criar(
        {
          ...base,
          chaveIdempotencia: randomUUID(),
          itens: [
            { patrimonioId: primeiro.id, tipo: "CORRETIVA" },
            {
              patrimonioId: segundo.id,
              tipo: "PREVENTIVA",
              fornecedorId: randomUUID(),
            },
          ],
        },
        identidade,
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: primeiro.id } }))
        .status,
    ).toBe("ATIVO");
    expect(
      await db.itemManutencao.count({ where: { patrimonioId: primeiro.id } }),
    ).toBe(0);

    const resultados = await Promise.allSettled(
      [1, 2].map(() =>
        service.criar(
          {
            ...base,
            chaveIdempotencia: randomUUID(),
            itens: [{ patrimonioId: primeiro.id, tipo: "CORRETIVA" }],
          },
          identidade,
        ),
      ),
    );
    expect(
      resultados.filter((resultado) => resultado.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      resultados.filter((resultado) => resultado.status === "rejected"),
    ).toHaveLength(1);
    expect(
      await db.itemManutencao.count({
        where: { patrimonioId: primeiro.id, dataRetorno: null },
      }),
    ).toBe(1);
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: primeiro.id } }))
        .status,
    ).toBe("EM_MANUTENCAO");
  });

  it("permite setor pendente e bloqueia retorno durante conferência ativa", async () => {
    const patrimonio = await bem(String(Date.now()).slice(-9));
    const inventario = await db.inventario.create({
      data: {
        nome: "Inventário isolado de manutenção",
        comissaoId,
        createdById: identidade.id,
      },
    });
    const setor = await db.setorInventario.create({
      data: {
        inventarioId: inventario.id,
        setorId,
        status: "PENDENTE",
      },
    });
    const pedido = await service.criar(
      {
        chaveIdempotencia: randomUUID(),
        dataEnvio: "2026-10-20",
        comissaoId,
        itens: [{ patrimonioId: patrimonio.id, tipo: "PREVENTIVA" }],
      },
      identidade,
    );
    await db.setorInventario.update({
      where: { id: setor.id },
      data: {
        status: "EM_ANDAMENTO",
        dataInicio: new Date(),
        iniciadoPorId: identidade.id,
      },
    });
    const retorno = {
      chaveIdempotencia: randomUUID(),
      dataRetorno: "2026-10-22",
      descricaoServicoRealizado: "Revisão",
      valorRealizado: "0",
      garantia: null,
    };
    await expect(
      service.registrarRetorno(
        pedido.id,
        pedido.itens[0]!.id,
        retorno,
        identidade,
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect(
      (await db.patrimonio.findUniqueOrThrow({ where: { id: patrimonio.id } }))
        .status,
    ).toBe("EM_MANUTENCAO");
    expect(
      (
        await db.itemManutencao.findUniqueOrThrow({
          where: { id: pedido.itens[0]!.id },
        })
      ).dataRetorno,
    ).toBeNull();
    await db.setorInventario.update({
      where: { id: setor.id },
      data: {
        status: "CONCLUIDO",
        dataFim: new Date(),
        concluidoPorId: identidade.id,
      },
    });
    expect(
      (
        await service.registrarRetorno(
          pedido.id,
          pedido.itens[0]!.id,
          retorno,
          identidade,
        )
      ).statusPedido,
    ).toBe("CONCLUIDA");
  });
});

function ehBancoIsolado(valor: string): boolean {
  const url = new URL(valor);
  return (
    url.protocol === "postgresql:" &&
    url.hostname === "127.0.0.1" &&
    url.port === "5434" &&
    url.pathname === "/sipat_test" &&
    url.username === "sipat_test" &&
    url.searchParams.get("schema") === "public"
  );
}
