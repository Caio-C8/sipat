import { createDatabaseClient } from "../src";

const DEMO = {
  responsavel: "ad85ba11-457b-4dd6-8af8-000000000001",
  setor: "ad85ba11-457b-4dd6-8af8-000000000002",
  natureza: "ad85ba11-457b-4dd6-8af8-000000000003",
  especie: "ad85ba11-457b-4dd6-8af8-000000000004",
  comissao: "ad85ba11-457b-4dd6-8af8-000000000005",
  fornecedor: "ad85ba11-457b-4dd6-8af8-000000000006",
  projetor: "ad85ba11-457b-4dd6-8af8-000000000007",
  impressora: "ad85ba11-457b-4dd6-8af8-000000000008",
  pedido: "ad85ba11-457b-4dd6-8af8-000000000009",
  itemProjetor: "ad85ba11-457b-4dd6-8af8-00000000000a",
  itemImpressora: "ad85ba11-457b-4dd6-8af8-00000000000b",
} as const;

async function main() {
  if (process.env.SIPAT_SEED_MANUTENCOES !== "true") {
    console.info(
      "SIPAT_SEED_MANUTENCOES=true habilita os bens fictícios de manutenção local.",
    );
    return;
  }
  const endereco = new URL(process.env.DATABASE_URL ?? "");
  if (
    process.env.APP_ENV !== "development" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(endereco.hostname) ||
    endereco.pathname !== "/sipat"
  )
    throw new Error(
      "O seed de manutenção exige APP_ENV=development e banco local sipat.",
    );

  const db = createDatabaseClient();
  try {
    const resultado = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(28102026, 18001)`;
      const autor = await tx.usuario.findFirst({
        where: { ativo: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      if (!autor)
        throw new Error("Cadastre um usuário antes de executar o seed local.");
      const createdById = autor.id;
      await tx.responsavel.upsert({
        where: { id: DEMO.responsavel },
        update: {},
        create: {
          id: DEMO.responsavel,
          nome: "DEMO - Responsável manutenção",
          matricula: "DEMO-MAN-001",
          createdById,
        },
      });
      await tx.setor.upsert({
        where: { id: DEMO.setor },
        update: {},
        create: {
          id: DEMO.setor,
          nome: "DEMO - Setor manutenção",
          responsavelId: DEMO.responsavel,
          createdById,
        },
      });
      await tx.natureza.upsert({
        where: { id: DEMO.natureza },
        update: {},
        create: {
          id: DEMO.natureza,
          nome: "DEMO - Equipamentos manutenção",
          nomeNormalizado: "demo - equipamentos manutencao",
          createdById,
        },
      });
      await tx.especie.upsert({
        where: { id: DEMO.especie },
        update: {},
        create: {
          id: DEMO.especie,
          nome: "DEMO - Equipamento manutenção",
          nomeNormalizado: "demo - equipamento manutencao",
          naturezaId: DEMO.natureza,
          createdById,
        },
      });
      await tx.comissao.upsert({
        where: { id: DEMO.comissao },
        update: {},
        create: {
          id: DEMO.comissao,
          nome: "DEMO - Comissão de manutenção",
          dataVigenciaInicio: new Date("2026-01-01T00:00:00.000Z"),
          dataVigenciaFim: new Date("2036-12-31T00:00:00.000Z"),
          createdById,
        },
      });
      await tx.fornecedor.upsert({
        where: { id: DEMO.fornecedor },
        update: {},
        create: {
          id: DEMO.fornecedor,
          razaoSocial: "DEMO - Oficina de manutenção",
          createdById,
        },
      });
      for (const [id, descricao, valor] of [
        [DEMO.projetor, "Projetor de teste para manutenção", "1000"],
        [DEMO.impressora, "Impressora de teste para manutenção", "1200"],
      ] as const) {
        let bem = await tx.patrimonio.findUnique({ where: { id } });
        if (!bem) {
          const [proximo] = await tx.$queryRaw<{ valor: bigint }[]>`
            SELECT nextval('patrimonios_sem_numero_oficial_seq') AS valor
          `;
          if (!proximo)
            throw new Error("Não foi possível gerar número de demonstração.");
          bem = await tx.patrimonio.create({
            data: {
              id,
              numeroPatrimonio: `SP-${proximo.valor}`,
              tipoNumeroPatrimonial: "SEM_NUMERO_OFICIAL",
              descricao,
              marca: "DEMO",
              textoBusca: descricao
                .normalize("NFD")
                .replace(/\p{M}/gu, "")
                .toUpperCase(),
              status: "ATIVO",
              dataTombamento: new Date("2026-10-28T00:00:00.000Z"),
              valorIncorporacao: valor,
              especieId: DEMO.especie,
              setorAtualId: DEMO.setor,
              createdById,
              situacaoContabil: {
                create: {
                  valorBrutoAtual: valor,
                  depreciacaoAcumuladaAtual: "0",
                },
              },
            },
          });
        }
      }
      let pedido = await tx.manutencao.findUnique({
        where: { id: DEMO.pedido },
      });
      if (!pedido) {
        const disponiveis = await tx.patrimonio.findMany({
          where: {
            id: { in: [DEMO.projetor, DEMO.impressora] },
            status: "ATIVO",
            itensManutencao: { none: { dataRetorno: null } },
          },
          select: { id: true },
        });
        if (disponiveis.length !== 2)
          throw new Error(
            "Os bens fictícios já estão em uso; o seed preservou as manutenções existentes.",
          );
        const diaLocal = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
        pedido = await tx.manutencao.create({
          data: {
            id: DEMO.pedido,
            numeroRequisicao: "DEMO-MAN-001",
            dataEnvio: new Date(`${diaLocal}T00:00:00.000Z`),
            justificativa: "Pedido fictício para testar o fluxo de manutenção.",
            comissaoId: DEMO.comissao,
            createdById,
            itens: {
              create: [
                {
                  id: DEMO.itemProjetor,
                  patrimonioId: DEMO.projetor,
                  tipo: "CORRETIVA",
                  fornecedorId: DEMO.fornecedor,
                  descricaoProblema: "Imagem intermitente durante a projeção.",
                },
                {
                  id: DEMO.itemImpressora,
                  patrimonioId: DEMO.impressora,
                  tipo: "PREVENTIVA",
                  fornecedorId: DEMO.fornecedor,
                  descricaoProblema:
                    "Revisão preventiva do mecanismo de impressão.",
                },
              ],
            },
          },
        });
        await tx.patrimonio.updateMany({
          where: { id: { in: [DEMO.projetor, DEMO.impressora] } },
          data: { status: "EM_MANUTENCAO" },
        });
      }
      const itens = await tx.itemManutencao.count({
        where: { manutencaoId: pedido.id },
      });
      const situacoes = await tx.patrimonio.findMany({
        where: { id: { in: [DEMO.projetor, DEMO.impressora] } },
        select: { numeroPatrimonio: true, status: true },
        orderBy: { numeroPatrimonio: "asc" },
      });
      return { pedidoId: pedido.id, itens, bens: situacoes };
    });
    console.info("Pedido fictício de manutenção disponível:", resultado);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Falha no seed local de manutenção.",
  );
  process.exitCode = 1;
});
