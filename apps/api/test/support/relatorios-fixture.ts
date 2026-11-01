import { randomUUID } from "node:crypto";
import type { DatabaseClient } from "@repo/database";
import {
  gerarTokenSessao,
  calcularHashTokenSessao,
} from "../../src/modules/auth/token-sessao";

export function exigirBancoRelatorios(
  url: string | undefined,
): asserts url is string {
  if (!url) throw new Error("Informe RELATORIOS_INTEGRATION_DATABASE_URL.");
  const u = new URL(url);
  if (
    u.hostname !== "127.0.0.1" ||
    u.port !== "55420" ||
    u.pathname !== "/sipat_relatorios_test" ||
    u.searchParams.get("schema") !== "public"
  )
    throw new Error(
      "Use somente o banco isolado sipat_relatorios_test na porta 55420.",
    );
}
export async function fixtureRelatorios(
  db: DatabaseClient,
  textosLongos = false,
) {
  const tag = randomUUID();
  const usuarios = await Promise.all(
    (["ADMINISTRADOR", "DIRETOR_PATRIMONIO"] as const).map((perfil) =>
      db.usuario.create({
        data: {
          nome: `Emissor ${perfil}`,
          email: `${tag}-${perfil.toLowerCase()}@example.test`,
          senha: "hash-sintetico",
          perfil,
          trocaSenhaObrigatoria: false,
        },
      }),
    ),
  );
  const u = usuarios[0]!;
  const responsavel = await db.responsavel.create({
    data: {
      nome: "José responsável inativo",
      matricula: tag.slice(0, 20),
      ativo: false,
      createdById: u.id,
    },
  });
  const setor = await db.setor.create({
    data: {
      nome: `Setor atual ${tag}`,
      sala: "Sala de reuniões",
      responsavelId: responsavel.id,
      ativo: false,
      createdById: u.id,
    },
  });
  const destino = await db.setor.create({
    data: {
      nome: `Destino registrado ${tag}`,
      responsavelId: responsavel.id,
      createdById: u.id,
    },
  });
  const natureza = await db.natureza.create({
    data: { nome: tag, nomeNormalizado: tag, createdById: u.id },
  });
  const especie = await db.especie.create({
    data: {
      nome: "Mobiliário",
      nomeNormalizado: tag,
      naturezaId: natureza.id,
      createdById: u.id,
    },
  });
  const comissao = await db.comissao.create({
    data: {
      nome: `Comissão ${tag}`,
      dataVigenciaInicio: new Date("2020-01-01"),
      dataVigenciaFim: new Date("2030-12-31"),
      createdById: u.id,
    },
  });
  const bens = [];
  for (let i = 0; i < 25; i++)
    bens.push(
      await db.patrimonio.create({
        data: {
          numeroPatrimonio: i === 0 ? `SP-${Date.now()}` : `${Date.now()}${i}`,
          tipoNumeroPatrimonial: i === 0 ? "SEM_NUMERO_OFICIAL" : "OFICIAL",
          descricao:
            `${tag} — Cadeira com acentuação: ação, órgão e conservação. <script>texto literal</script> https://example.test/sem-acesso` +
            (i === 0 && textosLongos
              ? " Descrição longa: revisão, condição e órgão; conteúdo literal. ".repeat(
                  80,
                ) + "FIM DO TEXTO LONGO"
              : ""),
          textoBusca: tag.toUpperCase(),
          dataTombamento: new Date("2026-01-01"),
          valorIncorporacao: "1000.1234567",
          especieId: especie.id,
          setorAtualId: setor.id,
          createdById: u.id,
          situacaoContabil:
            i === 24
              ? undefined
              : {
                  create: {
                    valorBrutoAtual: "1000.1234567",
                    depreciacaoAcumuladaAtual: "0.1234567",
                  },
                },
        },
      }),
    );
  const bem = bens[0]!;
  const parametro = await db.parametroDepreciacao.create({
    data: {
      patrimonioId: bem.id,
      metodo: "LINEAR",
      vidaUtilInicialMeses: 120,
      valorResidual: "100",
      valorBaseInicial: "1000.1234567",
      dataInicio: new Date("2026-01-01"),
    },
  });
  const comum = {
    patrimonioId: bem.id,
    comissaoId: comissao.id,
    createdById: u.id,
  };
  await db.substituicaoNumeroPatrimonial.create({
    data: {
      patrimonioId: bem.id,
      numeroAnterior: "999",
      numeroNovo: bem.numeroPatrimonio,
      createdById: u.id,
      createdAt: new Date("2026-01-02T12:00:00Z"),
    },
  });
  const transferencia = await db.transferenciaPatrimonio.create({
    data: {
      ...comum,
      setorAntigoId: setor.id,
      setorAtualId: destino.id,
      dataTransferencia: new Date("2026-01-01T03:00:00Z"),
      observacao: "Motivo registrado",
    },
  });
  await db.transferenciaPatrimonio.create({
    data: {
      ...comum,
      setorAntigoId: setor.id,
      setorAtualId: destino.id,
      dataTransferencia: new Date("2026-01-02T02:59:59.999Z"),
    },
  });
  await db.depreciacaoPatrimonio.createMany({
    data: [1, 2].map((m) => ({
      ...comum,
      parametroDepreciacaoId: parametro.id,
      dataCompetencia: new Date(`2026-0${m}-01`),
      dataDepreciacao: new Date(`2026-0${m}-28T12:00:00Z`),
      valorContabilAnterior: "1000",
      valorDepreciado: "10.1234567",
      valorContabilNovo: "989.8765433",
    })),
  });
  await db.reavaliacaoPatrimonio.create({
    data: {
      ...comum,
      dataReferencia: null,
      dataReavaliacao: new Date("2026-02-01T12:00:00Z"),
      valorLiquidoAnterior: "900",
      valorReavaliado: "1100",
      valorResidualNovo: "110",
      vidaUtilNovaMeses: 120,
    },
  });
  const manutencao = await db.manutencao.create({
    data: {
      dataEnvio: new Date("2026-01-01"),
      comissaoId: comissao.id,
      createdById: u.id,
    },
  });
  const item = await db.itemManutencao.create({
    data: {
      manutencaoId: manutencao.id,
      patrimonioId: bem.id,
      tipo: "CORRETIVA",
      valorOrcamento: "20.1234567",
      valorRealizado: "15.1234567",
      dataRetorno: new Date("2026-01-05"),
      recebidoEm: new Date("2026-01-05T14:00:00Z"),
      recebidoPorId: u.id,
      versaoOrcamento: 2,
    },
  });
  await db.revisaoOrcamentoManutencao.createMany({
    data: [1, 2].map((v) => ({
      itemId: item.id,
      versao: v,
      dataOrcamento: new Date("2026-01-02"),
      descricaoOrcamento: `Revisão ${v}`,
      valorOrcamento: v === 1 ? "30" : "20.1234567",
      createdById: u.id,
    })),
  });
  const emprestimo = await db.emprestimoPatrimonio.create({
    data: {
      ...comum,
      dataEmprestimo: new Date("2026-01-01"),
      dataPrevistaDevolucao: new Date("2026-01-02"),
      grupoEmprestimoId: randomUUID(),
      destinatario: "Destinatário sintético",
      setorVinculoId: destino.id,
    },
  });
  await db.devolucaoPatrimonio.create({
    data: {
      emprestimoId: emprestimo.id,
      comissaoId: comissao.id,
      dataDevolucao: new Date("2026-01-03"),
      createdById: null,
    },
  });
  const inventario = await db.inventario.create({
    data: {
      nome: `Inventário ${tag}`,
      status: "FINALIZADO",
      dataInicio: new Date("2026-01-01"),
      dataFim: new Date("2026-01-03"),
      iniciadoPorId: u.id,
      finalizadoPorId: u.id,
      comissaoId: comissao.id,
      createdById: u.id,
    },
  });
  const si = await db.setorInventario.create({
    data: {
      inventarioId: inventario.id,
      setorId: setor.id,
      status: "CONCLUIDO",
      dataInicio: new Date("2026-01-01T12:00:00Z"),
      dataFim: new Date("2026-01-03T12:00:00Z"),
      iniciadoPorId: u.id,
      concluidoPorId: u.id,
    },
  });
  await db.itemInventario.create({
    data: {
      inventarioId: inventario.id,
      setorInventarioId: si.id,
      setorEsperadoId: setor.id,
      patrimonioId: bem.id,
      statusVerificacao: "VERIFICADO",
      situacao: "DIVERGENCIA",
      setorEncontradoId: destino.id,
      dataVerificacao: new Date("2026-01-01T12:00:00Z"),
      verificadoPorId: u.id,
      statusPatrimonioNaVerificacao: "ATIVO",
      statusCorrecao: "CORRIGIDO",
      tipoCorrecao: "TRANSFERENCIA_CADASTRAL",
      dataCorrecao: new Date("2026-01-02T12:00:00Z"),
      corrigidoPorId: u.id,
      transferenciaCorrecaoId: transferencia.id,
    },
  });
  const posterior = await db.inventario.create({
    data: {
      nome: `Posterior ${tag}`,
      status: "FINALIZADO",
      dataInicio: new Date("2026-02-01"),
      dataFim: new Date("2026-02-05"),
      iniciadoPorId: u.id,
      finalizadoPorId: u.id,
      comissaoId: comissao.id,
      createdById: u.id,
    },
  });
  const sp = await db.setorInventario.create({
    data: {
      inventarioId: posterior.id,
      setorId: setor.id,
      status: "CONCLUIDO",
      dataInicio: new Date("2026-02-01T12:00:00Z"),
      dataFim: new Date("2026-02-05T12:00:00Z"),
      iniciadoPorId: u.id,
      concluidoPorId: u.id,
    },
  });
  const ip = await db.itemInventario.create({
    data: {
      inventarioId: posterior.id,
      setorInventarioId: sp.id,
      setorEsperadoId: setor.id,
      patrimonioId: bem.id,
      statusVerificacao: "VERIFICADO",
      situacao: "NAO_LOCALIZADO",
      dataVerificacao: new Date("2026-02-01T12:00:00Z"),
      verificadoPorId: u.id,
      statusPatrimonioNaVerificacao: "ATIVO",
    },
  });
  await db.localizacaoPosteriorInventario.create({
    data: {
      itemInventarioId: ip.id,
      inventarioId: posterior.id,
      setorInventarioEncontradoId: sp.id,
      dataLocalizacao: new Date("2026-02-02T12:00:00Z"),
      localizadoPorId: u.id,
      statusCorrecao: "CORRIGIDO",
      tipoCorrecao: "RETORNO_AO_SETOR_CADASTRADO",
      dataCorrecao: new Date("2026-02-03T12:00:00Z"),
      corrigidoPorId: u.id,
    },
  });
  await db.baixaPatrimonio.create({
    data: {
      ...comum,
      dataBaixa: new Date("2026-03-01"),
      tipo: "OUTRO",
      motivo: "Motivo integral da baixa — documentação preservada.",
    },
  });
  await db.patrimonio.update({
    where: { id: bem.id },
    data: { status: "BAIXADO" },
  });
  const cookies = [];
  for (const user of usuarios) {
    const token = gerarTokenSessao();
    await db.sessaoUsuario.create({
      data: {
        usuarioId: user.id,
        tokenHash: calcularHashTokenSessao(token)!,
        expiraAt: new Date(Date.now() + 8 * 3600000),
      },
    });
    cookies.push(`sipat_session=${token}`);
  }
  return {
    tag,
    bem,
    bens,
    usuarios,
    cookies,
    setor,
    destino,
    comissao,
    inventario,
    item,
  };
}
