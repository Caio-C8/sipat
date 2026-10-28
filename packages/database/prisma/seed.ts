import { createDatabaseClient } from "../src";

const database = createDatabaseClient();
const DEMO = {
  responsavel: "ad85ba10-457b-4dd6-8af8-000000000001",
  origem: "ad85ba10-457b-4dd6-8af8-000000000002",
  destino: "ad85ba10-457b-4dd6-8af8-000000000003",
  natureza: "ad85ba10-457b-4dd6-8af8-000000000004",
  especie: "ad85ba10-457b-4dd6-8af8-000000000005",
  comissao: "ad85ba10-457b-4dd6-8af8-000000000006",
  patrimonio: "ad85ba10-457b-4dd6-8af8-000000000007",
} as const;

async function main() {
  if (process.env.SIPAT_SEED_MOVIMENTACOES !== "true") {
    console.info(
      "Nenhum dado inicial foi inserido. SIPAT_SEED_MOVIMENTACOES=true habilita o patrimônio de demonstração local.",
    );
    return;
  }
  const destino = new URL(process.env.DATABASE_URL!);
  if (
    process.env.APP_ENV !== "development" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(destino.hostname) ||
    destino.pathname !== "/sipat"
  ) {
    throw new Error(
      "O seed de demonstração exige APP_ENV=development e o banco sipat em um servidor local.",
    );
  }

  const resultado = await database.$transaction(async (tx) => {
    // O lock evita duas execuções simultâneas criarem a mesma demonstração.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(28102026, 13001)`;
    const autor = await tx.usuario.findFirst({
      where: { ativo: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    if (!autor)
      throw new Error(
        "Cadastre um usuário antes de executar o seed de demonstração.",
      );
    const createdById = autor.id;
    await tx.responsavel.upsert({
      where: { id: DEMO.responsavel },
      update: {},
      create: {
        id: DEMO.responsavel,
        nome: "DEMO - Responsável de teste",
        matricula: "DEMO-MOV-001",
        ativo: true,
        createdById,
      },
    });
    const origem = await tx.setor.upsert({
      where: { id: DEMO.origem },
      update: {},
      create: {
        id: DEMO.origem,
        nome: "DEMO - Almoxarifado",
        ativo: true,
        responsavelId: DEMO.responsavel,
        createdById,
      },
    });
    const setorDestino = await tx.setor.upsert({
      where: { id: DEMO.destino },
      update: {},
      create: {
        id: DEMO.destino,
        nome: "DEMO - Secretaria",
        ativo: true,
        responsavelId: DEMO.responsavel,
        createdById,
      },
    });
    await tx.natureza.upsert({
      where: { id: DEMO.natureza },
      update: {},
      create: {
        id: DEMO.natureza,
        nome: "DEMO - Equipamentos",
        nomeNormalizado: "demo - equipamentos",
        createdById,
      },
    });
    await tx.especie.upsert({
      where: { id: DEMO.especie },
      update: {},
      create: {
        id: DEMO.especie,
        nome: "DEMO - Notebook",
        nomeNormalizado: "demo - notebook",
        naturezaId: DEMO.natureza,
        createdById,
      },
    });
    const comissao = await tx.comissao.upsert({
      where: { id: DEMO.comissao },
      update: {},
      create: {
        id: DEMO.comissao,
        nome: "DEMO - Comissão de movimentação",
        descricao: "Comissão fictícia para testes manuais locais.",
        dataVigenciaInicio: new Date("2026-01-01T00:00:00.000Z"),
        dataVigenciaFim: new Date("2036-12-31T00:00:00.000Z"),
        createdById,
      },
    });
    let patrimonio = await tx.patrimonio.findUnique({
      where: { id: DEMO.patrimonio },
    });
    if (!patrimonio) {
      const [proximo] = await tx.$queryRaw<
        { valor: bigint }[]
      >`SELECT nextval('patrimonios_sem_numero_oficial_seq') AS valor`;
      if (!proximo)
        throw new Error("Não foi possível gerar o número de demonstração.");
      patrimonio = await tx.patrimonio.create({
        data: {
          id: DEMO.patrimonio,
          numeroPatrimonio: `SP-${proximo.valor}`,
          tipoNumeroPatrimonial: "SEM_NUMERO_OFICIAL",
          descricao: "Notebook de teste para movimentação",
          marca: "DEMO",
          modelo: "Teste local",
          textoBusca: "notebook de teste para movimentacao demo teste local",
          status: "ATIVO",
          tipoIncorporacao: "AQUISICAO",
          dataTombamento: new Date("2026-10-28T00:00:00.000Z"),
          valorIncorporacao: "1000",
          especieId: DEMO.especie,
          setorAtualId: DEMO.origem,
          createdById,
          situacaoContabil: {
            create: { valorBrutoAtual: "1000", depreciacaoAcumuladaAtual: "0" },
          },
        },
      });
    }
    // Reexecutar o seed preserva inclusive o setor e o status após testes manuais.
    return {
      numeroPatrimonio: patrimonio.numeroPatrimonio,
      descricao: patrimonio.descricao,
      status: patrimonio.status,
      origemInicial: origem.nome,
      destinoSugerido: setorDestino.nome,
      comissao: comissao.nome,
    };
  });
  console.info("Demonstração local disponível:", resultado);
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Falha no seed local.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
