import path from "node:path";
import { setImmediate } from "node:timers/promises";
import {
  LimitesRelatorios,
  titulosRelatorios,
  type TipoRelatorio,
} from "@repo/contracts";
import { conferirPrazo, limiteRelatorio } from "./relatorio-limites";
import { rotuloRelatorio, textoRelatorio } from "./pdf-format";

type Registro = Record<string, unknown>;
type Consulta = {
  id: string;
  instante: string;
  filtros: Registro;
  criterioTemporal: string;
  ordenacao: string;
  avisos: string[];
};
type Celula = { rotulo: string; linhas: string[] };
type Coluna = {
  campo: string;
  titulo: string;
  peso: number;
  direita?: boolean;
};
const tabelas: Partial<Record<TipoRelatorio, Coluna[]>> = {
  patrimonios: [
    { campo: "numeroPatrimonio", titulo: "Patrimônio / código", peso: 0.19 },
    { campo: "descricao", titulo: "Descrição", peso: 0.31 },
    { campo: "setorAtual", titulo: "Setor atual", peso: 0.24 },
    {
      campo: "valorLiquidoAtual",
      titulo: "Líquido atual (R$)",
      peso: 0.26,
      direita: true,
    },
  ],
  movimentacoes: [
    { campo: "numeroPatrimonio", titulo: "Bem", peso: 0.13 },
    { campo: "descricao", titulo: "Descrição atual", peso: 0.25 },
    { campo: "setorOrigem", titulo: "Origem", peso: 0.19 },
    { campo: "setorDestino", titulo: "Destino", peso: 0.19 },
    { campo: "dataTransferencia", titulo: "Transferência", peso: 0.16 },
    { campo: "origem", titulo: "Natureza", peso: 0.08 },
  ],
  manutencoes: [
    { campo: "requisicao", titulo: "Requisição", peso: 0.14 },
    { campo: "numeroPatrimonio", titulo: "Bem", peso: 0.13 },
    { campo: "fornecedor", titulo: "Fornecedor", peso: 0.22 },
    { campo: "situacao", titulo: "Situação", peso: 0.13 },
    { campo: "dataEnvio", titulo: "Envio", peso: 0.12 },
    {
      campo: "valorOrcamento",
      titulo: "Orçamento (R$)",
      peso: 0.26,
      direita: true,
    },
  ],
  depreciacoes: [
    { campo: "numeroPatrimonio", titulo: "Bem", peso: 0.13 },
    { campo: "descricao", titulo: "Descrição atual", peso: 0.21 },
    { campo: "competencia", titulo: "Competência", peso: 0.12 },
    {
      campo: "valorContabilAnterior",
      titulo: "Líquido anterior (R$)",
      peso: 0.18,
      direita: true,
    },
    {
      campo: "valorDepreciado",
      titulo: "Quota (R$)",
      peso: 0.18,
      direita: true,
    },
    {
      campo: "valorContabilNovo",
      titulo: "Líquido posterior (R$)",
      peso: 0.18,
      direita: true,
    },
  ],
  "pendencias-depreciacao": [
    { campo: "numeroPatrimonio", titulo: "Bem", peso: 0.14 },
    { campo: "descricao", titulo: "Descrição atual", peso: 0.28 },
    { campo: "competenciaEsperada", titulo: "Competência esperada", peso: 0.2 },
    {
      campo: "quantidadePendencias",
      titulo: "Pendências",
      peso: 0.14,
      direita: true,
    },
    {
      campo: "quotaPrevista",
      titulo: "Quota prevista (R$)",
      peso: 0.24,
      direita: true,
    },
  ],
  reavaliacoes: [
    { campo: "numeroSnapshot", titulo: "Número no evento", peso: 0.15 },
    { campo: "descricaoSnapshot", titulo: "Descrição no evento", peso: 0.25 },
    { campo: "dataReferencia", titulo: "Referência", peso: 0.12 },
    {
      campo: "valorLiquidoAnterior",
      titulo: "Líquido anterior (R$)",
      peso: 0.24,
      direita: true,
    },
    {
      campo: "valorReavaliado",
      titulo: "Novo bruto (R$)",
      peso: 0.24,
      direita: true,
    },
  ],
  inventarios: [
    { campo: "numeroPatrimonio", titulo: "Bem", peso: 0.14 },
    { campo: "descricao", titulo: "Descrição atual", peso: 0.24 },
    { campo: "setorEsperado", titulo: "Setor esperado", peso: 0.19 },
    { campo: "setorEncontrado", titulo: "Setor encontrado", peso: 0.19 },
    { campo: "verificacao", titulo: "Conferência", peso: 0.12 },
    { campo: "situacao", titulo: "Situação", peso: 0.12 },
  ],
  emprestimos: [
    { campo: "numeroPatrimonio", titulo: "Bem", peso: 0.13 },
    { campo: "destinatario", titulo: "Destinatário", peso: 0.25 },
    { campo: "dataSaida", titulo: "Saída", peso: 0.13 },
    { campo: "previsao", titulo: "Previsão", peso: 0.13 },
    { campo: "dataDevolucao", titulo: "Devolução", peso: 0.14 },
    { campo: "situacao", titulo: "Situação", peso: 0.22 },
  ],
  baixas: [
    { campo: "numeroPatrimonio", titulo: "Bem", peso: 0.13 },
    { campo: "descricao", titulo: "Descrição atual", peso: 0.25 },
    { campo: "dataBaixa", titulo: "Baixa", peso: 0.14 },
    { campo: "tipo", titulo: "Tipo", peso: 0.17 },
    { campo: "motivo", titulo: "Motivo", peso: 0.31 },
  ],
};
const detalhesPorTipo: Partial<Record<TipoRelatorio, string[]>> = {
  patrimonios: [
    "tipoNumeroPatrimonial",
    "especie",
    "natureza",
    "salaAtual",
    "responsavelAtual",
    "status",
    "dataTombamento",
    "valorIncorporacao",
    "valorBrutoAtual",
    "depreciacaoAcumuladaAtual",
  ],
  movimentacoes: [
    "comissao",
    "autor",
    "registroEm",
    "observacao",
    "inventarioId",
  ],
  manutencoes: [
    "descricao",
    "pedidoId",
    "tipo",
    "previsaoRetorno",
    "dataRetorno",
    "valorRealizado",
    "versaoOrcamento",
    "servico",
    "garantia",
    "vencimentoGarantia",
    "comissao",
  ],
  depreciacoes: ["processamento", "comissao", "autor"],
  "pendencias-depreciacao": [
    "status",
    "primeiraCompetencia",
    "ultimaCompetenciaProcessada",
    "valorLiquidoAtual",
    "valorResidual",
  ],
  reavaliacoes: [
    "numeroPatrimonioAtual",
    "descricaoAtual",
    "dataReavaliacao",
    "valorBrutoAnterior",
    "depreciacaoAcumuladaAnterior",
    "valorResidualAnterior",
    "valorResidualNovo",
    "vidaUtilAnteriorMeses",
    "vidaUtilNovaMeses",
    "comissaoSnapshot",
    "autorSnapshot",
    "comissaoAtual",
    "autorAtual",
    "laudo",
    "observacao",
    "parametroAnteriorSituacao",
    "parametroAnteriorId",
  ],
  inventarios: [
    "inventario",
    "statusInventario",
    "dataVerificacao",
    "autorVerificacao",
    "statusNaVerificacao",
    "ausenciaJustificada",
    "correcao",
    "tipoCorrecao",
    "dataCorrecao",
    "autorCorrecao",
    "localizacaoId",
    "dataLocalizacao",
    "setorLocalizacao",
    "autorLocalizacao",
    "correcaoPosterior",
    "tipoCorrecaoPosterior",
    "dataCorrecaoPosterior",
    "autorCorrecaoPosterior",
  ],
  emprestimos: [
    "descricao",
    "grupoId",
    "modoAgrupamento",
    "finalidade",
    "setorVinculo",
    "emAtraso",
    "comissaoSaida",
    "autorSaida",
    "comissaoDevolucao",
    "autorDevolucao",
    "observacao",
  ],
  baixas: ["comissao", "autor", "registroEm", "observacao"],
};
const referenciasPorTipo: Partial<Record<TipoRelatorio, string[]>> = {
  patrimonios: ["id", "patrimonioId"],
  movimentacoes: ["id", "patrimonioId"],
  manutencoes: ["id", "patrimonioId"],
  depreciacoes: ["id", "patrimonioId", "parametroId"],
  "pendencias-depreciacao": ["id", "patrimonioId"],
  reavaliacoes: ["id", "patrimonioId"],
  inventarios: [
    "id",
    "patrimonioId",
    "inventarioId",
    "emprestimoId",
    "manutencaoItemId",
    "transferenciaCorrecaoId",
    "transferenciaPosteriorId",
  ],
  emprestimos: ["id", "patrimonioId", "devolucaoId"],
  baixas: ["id", "patrimonioId"],
};
const indicadores: Partial<Record<TipoRelatorio, string[]>> = {
  patrimonios: ["quantidade", "liquidoAtual", "semNumeroOficial"],
  movimentacoes: ["quantidade", "bensDistintos"],
  manutencoes: ["quantidade", "pendentes", "realizadoConhecido"],
  depreciacoes: ["quantidade", "bensDistintos", "quotas"],
  "pendencias-depreciacao": [
    "quantidade",
    "bensDistintos",
    "quantidadeCompetencias",
  ],
  reavaliacoes: ["quantidade", "bensDistintos", "semReferencia"],
  inventarios: ["quantidade", "pendentes", "divergentes"],
  emprestimos: ["quantidade", "pendentes", "atrasados"],
  baixas: ["quantidade"],
};
const camposEventoFicha: Record<string, string[]> = {
  SUBSTITUICAO_NUMERO: ["numeroAnterior", "numeroNovo"],
  REVISAO_ORCAMENTO: ["itemId", "versao", "descricao", "valor", "fornecedor"],
};
const tipoAtributosFicha: Record<string, TipoRelatorio> = {
  TRANSFERENCIA: "movimentacoes",
  REAVALIACAO: "reavaliacoes",
  DEPRECIACAO: "depreciacoes",
  EMPRESTIMO: "emprestimos",
  DEVOLUCAO: "emprestimos",
  BAIXA: "baixas",
  ENVIO_MANUTENCAO: "manutencoes",
  RETORNO_MANUTENCAO: "manutencoes",
  CONFERENCIA_INVENTARIO: "inventarios",
  CORRECAO_INVENTARIO: "inventarios",
  LOCALIZACAO_POSTERIOR: "inventarios",
  CORRECAO_LOCALIZACAO: "inventarios",
};
const azul = "#17365b",
  tinta = "#24364b",
  cinza = "#526278",
  borda = "#dce4ed";

/** Paginação explícita: nenhum texto cadastrado é cortado ou interpretado como markup. */
export class LayoutRelatorioPdf {
  private y = 0;
  private paginas = 0;
  private contexto = "";
  private colunasAtivas: Coluna[] | undefined;
  private readonly largura: number;
  constructor(
    private readonly doc: PDFKit.PDFDocument,
    private readonly tipo: TipoRelatorio,
    private readonly consulta: Consulta,
    private readonly prazo: number,
    private readonly signal: AbortSignal | undefined,
    private readonly conferirStream: () => void,
  ) {
    this.largura =
      tipo === "ficha-bem" || tipo === "patrimonios" ? 523.28 : 769.89;
  }

  private conferir() {
    conferirPrazo(this.prazo, this.signal);
    this.conferirStream();
  }
  private get fim() {
    return this.doc.page.height - 48;
  }
  private fonte(tamanho = 9, negrito = false, cor = tinta) {
    this.doc
      .font(negrito ? "Helvetica-Bold" : "Helvetica")
      .fontSize(tamanho)
      .fillColor(cor);
  }
  private texto(
    texto: string,
    x: number,
    y: number,
    largura: number,
    direita = false,
  ) {
    // lineBreak:false requer alinhamento manual; não depende de quebra automática do PDFKit.
    this.doc.text(
      texto,
      direita ? x + largura - this.doc.widthOfString(texto) : x,
      y,
      { width: largura, lineBreak: false },
    );
  }
  private async linhas(
    valor: unknown,
    largura: number,
    tamanho = 9,
    negrito = false,
  ) {
    this.fonte(tamanho, negrito);
    const saida: string[] = [];
    let linha = "",
      contador = 0;
    for (const palavra of textoRelatorio(valor).split(/(\s+)/)) {
      if (
        !palavra.includes("\n") &&
        this.doc.widthOfString(linha + palavra) <= largura
      ) {
        linha += palavra;
      } else {
        if (linha.trim()) saida.push(linha.trimEnd());
        linha = "";
        for (const c of palavra) {
          if (c === "\n") {
            saida.push(linha);
            linha = "";
            continue;
          }
          if (this.doc.widthOfString(linha + c) > largura) {
            saida.push(linha);
            linha = "";
          }
          linha += c;
          if (++contador % 2048 === 0) {
            await setImmediate();
            this.conferir();
          }
        }
      }
      contador += palavra.length;
      if (contador > 2048) {
        await setImmediate();
        this.conferir();
        contador = 0;
      }
    }
    if (linha.trim() || !saida.length) saida.push(linha.trimEnd());
    return saida;
  }
  private novaPagina() {
    this.conferir();
    if (++this.paginas > LimitesRelatorios.paginasPdf) throw limiteRelatorio();
    this.doc.addPage();
    this.y = 89;
    if (this.contexto) {
      this.fonte(8, true, azul);
      this.texto(
        `SIPAT · Câmara Municipal de Patos de Minas · ${titulosRelatorios[this.tipo]}`,
        36,
        this.y,
        this.largura,
      );
      this.y += 16;
      this.faixa(this.contexto + " | continuação", true);
    }
    if (this.colunasAtivas) this.cabecalhoTabela(this.colunasAtivas);
  }
  cabecalhos() {
    const range = this.doc.bufferedPageRange();
    const brasao = path.join(
      __dirname,
      ...(path.basename(__dirname) === "dist"
        ? ["modules", "relatorios", "assets"]
        : ["assets"]),
      "brasao.png",
    );
    for (let i = range.start; i < range.start + range.count; i++) {
      this.doc.switchToPage(i);
      this.doc.image(brasao, 36, 25, { fit: [34, 38] });
      this.fonte(9, true, cinza);
      this.texto(
        "SIPAT | Câmara Municipal de Patos de Minas",
        82,
        26,
        this.largura - 46,
      );
      this.fonte(19, true, azul);
      this.texto(titulosRelatorios[this.tipo], 82, 43, this.largura - 46);
      this.doc.rect(36, 74, this.largura, 2).fill(azul);
    }
  }
  private faixa(titulo: string, clara = false) {
    this.doc
      .roundedRect(36, this.y, this.largura, 25, 3)
      .fill(clara ? "#eaf0f7" : azul);
    this.fonte(10, true, clara ? azul : "#ffffff");
    this.texto(titulo, 46, this.y + 7, this.largura - 20);
    this.y += 33;
  }
  private async paragrafo(valor: unknown, tamanho = 9, cor = cinza) {
    const linhas = await this.linhas(valor, this.largura, tamanho);
    for (const linha of linhas) {
      if (this.y + 13 > this.fim) this.novaPagina();
      this.fonte(tamanho, false, cor);
      this.texto(linha, 36, this.y, this.largura);
      this.y += 13;
    }
    this.y += 7;
  }
  private entradas(objeto: Registro, prefixo = ""): [string, unknown][] {
    return Object.entries(objeto).flatMap(([k, v]): [string, unknown][] => {
      const rotulo = prefixo + rotuloRelatorio(k);
      if (v && typeof v === "object" && !Array.isArray(v))
        return this.entradas(v as Registro, rotulo + " / ");
      return [
        [
          rotulo,
          v === null &&
          ["brutoAtual", "acumuladoAtual", "liquidoAtual"].includes(k)
            ? "Total indisponível"
            : v,
        ],
      ];
    });
  }
  private async preparar(
    entradas: [string, unknown][],
    colunas = 3,
  ): Promise<Celula[][]> {
    const largura = this.largura / colunas - 20;
    const linhas: Celula[][] = [];
    for (let i = 0; i < entradas.length; i += colunas) {
      const celulas: Celula[] = [];
      for (const [rotulo, valor] of entradas.slice(i, i + colunas)) {
        // Rótulos longos também permanecem completos.
        celulas.push({ rotulo, linhas: await this.linhas(valor, largura) });
      }
      linhas.push(celulas);
    }
    return linhas;
  }
  private async grade(linhas: Celula[][], colunas = 3, destaque = false) {
    const largura = this.largura / colunas;
    for (const celulas of linhas) {
      const rotulos = await Promise.all(
        celulas.map((c) => this.linhas(c.rotulo, largura - 20, 8, true)),
      );
      const alturaRotulo = Math.max(...rotulos.map((r) => r.length)) * 10 + 8;
      const total = Math.max(...celulas.map((c) => c.linhas.length));
      let posicao = 0;
      while (posicao < total) {
        if (this.y + alturaRotulo + 20 > this.fim) this.novaPagina();
        const cabem = Math.min(
          total - posicao,
          Math.floor((this.fim - this.y - alturaRotulo - 8) / 12),
        );
        const altura = alturaRotulo + cabem * 12 + 8;
        this.doc
          .rect(36, this.y, this.largura, altura)
          .fill(destaque ? "#edf3fa" : "#f7f9fc");
        for (let c = 0; c < celulas.length; c++) {
          const x = 46 + c * largura;
          this.fonte(8, true, cinza);
          rotulos[c]!.forEach((r, i) =>
            this.texto(r, x, this.y + 7 + i * 10, largura - 20),
          );
          this.fonte(9, destaque, destaque ? azul : tinta);
          celulas[c]!.linhas.slice(posicao, posicao + cabem).forEach((r, i) =>
            this.texto(r, x, this.y + alturaRotulo + i * 12, largura - 20),
          );
        }
        this.y += altura + 3;
        posicao += cabem;
        if (posicao < total) this.novaPagina();
        await setImmediate();
        this.conferir();
      }
    }
    this.y += 8;
  }
  private cabecalhoTabela(colunas: Coluna[]) {
    this.doc.rect(36, this.y, this.largura, 30).fill("#eaf0f7");
    this.fonte(8, true, azul);
    let x = 36;
    for (const coluna of colunas) {
      const largura = this.largura * coluna.peso;
      const titulo = coluna.titulo;
      this.texto(titulo, x + 7, this.y + 10, largura - 14, coluna.direita);
      x += largura;
    }
    this.y += 30;
  }
  private async tabelaRegistros(
    linhas: readonly Registro[],
    colunas: Coluna[],
  ) {
    if (this.y + 55 > this.fim) this.novaPagina();
    this.contexto = "Registros selecionados";
    this.fonte(11, true, azul);
    this.texto("Registros selecionados", 36, this.y, this.largura);
    this.y += 23;
    this.colunasAtivas = colunas;
    this.cabecalhoTabela(colunas);
    for (let indice = 0; indice < linhas.length; indice++) {
      this.conferir();
      const registro = linhas[indice]!;
      this.contexto = `Registro ${indice + 1} de ${linhas.length} — ${textoRelatorio(registro.numeroPatrimonio ?? registro.numeroPatrimonioAtual ?? registro.numeroSnapshot ?? "sem número")}`;
      const celulas = await Promise.all(
        colunas.map(async (c) => {
          const valor = registro[c.campo];
          const conteudo =
            valor === null && c.campo === "valorLiquidoAtual"
              ? "Indisponível"
              : textoRelatorio(valor);
          return this.linhas(conteudo, this.largura * c.peso - 14, 8.5);
        }),
      );
      const total = Math.max(...celulas.map((c) => c.length));
      let deslocamento = 0;
      while (deslocamento < total) {
        if (this.y + 25 > this.fim) this.novaPagina();
        const cabem = Math.min(
          total - deslocamento,
          Math.max(1, Math.floor((this.fim - this.y - 12) / 11)),
        );
        const altura = Math.max(28, cabem * 11 + 12);
        if (indice % 2 === 1)
          this.doc.rect(36, this.y, this.largura, altura).fill("#f7f9fc");
        let x = 36;
        for (let c = 0; c < colunas.length; c++) {
          const coluna = colunas[c]!;
          const largura = this.largura * coluna.peso;
          this.fonte(8.5, false, tinta);
          celulas[c]!.slice(deslocamento, deslocamento + cabem).forEach(
            (texto, i) =>
              this.texto(
                texto,
                x + 7,
                this.y + 7 + i * 11,
                largura - 14,
                coluna.direita,
              ),
          );
          x += largura;
        }
        this.doc
          .moveTo(36, this.y + altura)
          .lineTo(36 + this.largura, this.y + altura)
          .lineWidth(0.4)
          .strokeColor(borda)
          .stroke();
        this.y += altura;
        deslocamento += cabem;
        if (deslocamento < total) this.novaPagina();
      }
      if (indice % 32 === 0) await setImmediate();
    }
    this.colunasAtivas = undefined;
    this.contexto = "";
    this.y += 10;
  }
  private async detalhesRegistros(linhas: readonly Registro[]) {
    const campos = detalhesPorTipo[this.tipo] ?? [];
    const referencias = referenciasPorTipo[this.tipo] ?? [];
    if (!campos.length) return;
    const alturaRegistro = async (registro: Registro) => {
      let altura = 85;
      for (const campo of campos.filter((campo) => campo in registro)) {
        altura +=
          (
            await this.linhas(
              `${rotuloRelatorio(campo)}: ${textoRelatorio(registro[campo])}`,
              this.largura - 14,
              9,
            )
          ).length *
            13 +
          5;
      }
      return altura;
    };
    const primeiraAltura = linhas[0] ? await alturaRegistro(linhas[0]) : 35;
    if (this.y + Math.min(primeiraAltura + 20, this.fim - 155) > this.fim)
      this.novaPagina();
    this.fonte(11, true, azul);
    this.texto("Informações complementares", 36, this.y, this.largura);
    this.y += 20;
    for (let i = 0; i < linhas.length; i++) {
      const registro = linhas[i]!;
      const numero =
        registro.numeroPatrimonio ??
        registro.numeroPatrimonioAtual ??
        registro.numeroSnapshot;
      const titulo = `${i + 1}. ${numero ? `Bem ${textoRelatorio(numero)}` : "Registro"}`;
      const altura = await alturaRegistro(registro);
      if (this.y + Math.min(altura, this.fim - 155) > this.fim) {
        this.contexto = "Informações complementares";
        this.novaPagina();
      }
      this.contexto = titulo;
      this.fonte(9, true, azul);
      this.texto(titulo, 36, this.y, this.largura);
      this.y += 16;
      const presentes = campos.filter((campo) => campo in registro);
      const financeiros = presentes.filter((campo) =>
        /^(valor|depreciacaoAcumulada)/.test(campo),
      );
      const cadastrais = presentes.filter(
        (campo) => !financeiros.includes(campo),
      );
      for (const [subtitulo, grupo] of [
        ["Dados complementares", cadastrais],
        ["Valores contábeis e financeiros", financeiros],
      ] as const) {
        if (!grupo.length) continue;
        if (this.y + 42 > this.fim) this.novaPagina();
        if (financeiros.length && cadastrais.length) {
          this.fonte(8, true, cinza);
          this.texto(subtitulo, 36, this.y, this.largura);
          this.y += 15;
        }
        await this.lista(
          grupo.map(
            (campo) =>
              `${rotuloRelatorio(campo)}: ${textoRelatorio(registro[campo])}`,
          ),
        );
      }
      const porValor = new Map<string, string[]>();
      for (const campo of referencias) {
        if (registro[campo] === null || registro[campo] === undefined) continue;
        const valor = textoRelatorio(registro[campo]);
        porValor.set(valor, [
          ...(porValor.get(valor) ?? []),
          rotuloRelatorio(campo),
        ]);
      }
      const refs = [...porValor].map(
        ([valor, rotulos]) => `${rotulos.join(" / ")}: ${valor}`,
      );
      if (refs.length)
        await this.paragrafo(`Referências: ${refs.join(" · ")}`, 7.5, cinza);
      this.doc
        .moveTo(36, this.y)
        .lineTo(36 + this.largura, this.y)
        .lineWidth(0.4)
        .strokeColor(borda)
        .stroke();
      this.y += 11;
      if (i % 16 === 0) {
        await setImmediate();
        this.conferir();
      }
    }
    this.contexto = "";
  }
  private async lista(itens: string[]) {
    for (const item of itens) {
      const linhas = await this.linhas(item, this.largura - 14, 9);
      const altura = linhas.length * 13 + 5;
      // Um tópico curto acompanha seu valor; somente textos maiores que uma página são divididos.
      if (altura <= this.fim - 155 && this.y + altura > this.fim)
        this.novaPagina();
      for (let i = 0; i < linhas.length; i++) {
        if (this.y + 13 > this.fim) this.novaPagina();
        this.fonte(9, false, tinta);
        if (i === 0) this.texto("•", 38, this.y, 10);
        this.texto(linhas[i]!, 50, this.y, this.largura - 14);
        this.y += 13;
      }
      this.y += 5;
      await setImmediate();
      this.conferir();
    }
    this.y += 4;
  }
  private async cadastroFicha(cadastro: Registro) {
    await this.paragrafo(
      "Cadastro atual: valores e localização na consulta; não representam posição em data passada.",
    );
    const secoes: [string, string[]][] = [
      [
        "Identificação cadastral",
        [
          "numeroPatrimonio",
          "tipoNumeroPatrimonial",
          "descricao",
          "marca",
          "modelo",
          "serie",
          "especie",
          "natureza",
          "status",
          "dataTombamento",
        ],
      ],
      [
        "Localização e aquisição atuais",
        ["setorAtual", "salaAtual", "responsavelAtual", "processo"],
      ],
      [
        "Valores e depreciação atuais",
        [
          "valorIncorporacao",
          "valorBrutoAtual",
          "depreciacaoAcumuladaAtual",
          "valorLiquidoAtual",
          "parametro",
        ],
      ],
    ];
    for (const [titulo, campos] of secoes) {
      if (this.y + 55 > this.fim) this.novaPagina();
      this.contexto = titulo;
      this.faixa(titulo, true);
      await this.grade(
        await this.preparar(
          campos
            .filter((campo) => campo in cadastro)
            .map(
              (campo) =>
                [rotuloRelatorio(campo), cadastro[campo]] as [string, unknown],
            ),
          2,
        ),
        2,
      );
      this.contexto = "";
    }
    await this.paragrafo(
      `Referências do cadastro: ${["id", "patrimonioId", "processoId"]
        .filter((campo) => cadastro[campo])
        .map(
          (campo) =>
            `${rotuloRelatorio(campo)}: ${textoRelatorio(cadastro[campo])}`,
        )
        .join(" · ")}`,
      7.5,
    );
  }
  private async eventoFicha(evento: Registro, indice: number, total: number) {
    const tipo = String(evento.tipo ?? "EVENTO");
    const titulo = `${indice + 1} de ${total} · ${textoRelatorio(tipo)} · ${textoRelatorio(evento.ocorrencia)}`;
    this.contexto = titulo;
    if (this.y + 65 > this.fim) this.novaPagina();
    this.faixa(titulo, true);
    await this.lista(
      ["precisao", "registroEm", "autor", "comissao"].map(
        (campo) =>
          `${rotuloRelatorio(campo)}: ${textoRelatorio(evento[campo])}`,
      ),
    );
    const atributos = (evento.atributos ?? {}) as Registro;
    const tipoTabular = tipoAtributosFicha[tipo];
    const campos =
      camposEventoFicha[tipo] ??
      (tipoTabular
        ? [
            ...tabelas[tipoTabular]!.map((coluna) => coluna.campo),
            ...(detalhesPorTipo[tipoTabular] ?? []),
            ...(referenciasPorTipo[tipoTabular] ?? []),
          ]
        : []);
    const unicos = [...new Set(campos)];
    const dados = unicos
      .filter(
        (campo) =>
          campo in atributos && !campo.endsWith("Id") && campo !== "id",
      )
      .map(
        (campo) =>
          `${rotuloRelatorio(campo)}: ${textoRelatorio(atributos[campo])}`,
      );
    if (dados.length) await this.lista(dados);
    const refs = ["id", "patrimonioId", "fonteId"]
      .filter((campo) => evento[campo])
      .map(
        (campo) =>
          `${rotuloRelatorio(campo)}: ${textoRelatorio(evento[campo])}`,
      );
    refs.push(
      ...unicos
        .filter(
          (campo) =>
            campo in atributos &&
            campo.endsWith("Id") &&
            campo !== "patrimonioId",
        )
        .filter((campo) => atributos[campo] !== null)
        .map(
          (campo) =>
            `${rotuloRelatorio(campo)}: ${textoRelatorio(atributos[campo])}`,
        ),
    );
    if (refs.length)
      await this.paragrafo(`Referências: ${refs.join(" · ")}`, 7.5, cinza);
    this.contexto = "";
  }
  async conteudo(
    linhas: readonly Registro[],
    resumo: Registro,
    usuario: { nome: string; perfil: string },
    cadastro?: Registro,
  ) {
    this.novaPagina();
    await this.paragrafo(
      `Emitido em ${textoRelatorio(this.consulta.instante)} (São Paulo) | ${usuario.nome} | ${textoRelatorio(usuario.perfil)}`,
    );
    this.contexto = "Filtros aplicados";
    if (this.y + 55 > this.fim) this.novaPagina();
    this.faixa("Filtros aplicados", true);
    await this.paragrafo(
      Object.keys(this.consulta.filtros).length
        ? textoRelatorio(this.consulta.filtros)
        : "Sem filtros opcionais",
    );
    await this.paragrafo(
      `Critério temporal: ${this.consulta.criterioTemporal} Ordenação: ${this.consulta.ordenacao.replace(/\bNUMERO\b/g, "número patrimonial").replace(/\bTOMBAMENTO\b/g, "data de tombamento")}`,
    );
    this.faixa("Resumo do conjunto filtrado", true);
    const { porCompetencia, porTipo, ...totais } = resumo;
    const principais = indicadores[this.tipo] ?? ["quantidade"];
    const destaque = Object.fromEntries(
      principais
        .filter((campo) => campo in totais)
        .map((campo) => [campo, totais[campo]]),
    );
    const complementares = Object.fromEntries(
      Object.entries(totais).filter(([campo]) => !principais.includes(campo)),
    );
    if (Object.keys(destaque).length)
      await this.grade(await this.preparar(this.entradas(destaque)), 3, true);
    if (Object.keys(complementares).length)
      await this.paragrafo(
        `Outros totais: ${textoRelatorio(complementares)}`,
        8,
        cinza,
      );
    for (const [rotulo, dados] of [
      ["Por competência", porCompetencia],
      ["Por tipo", porTipo],
    ] as const) {
      if (Array.isArray(dados) && dados.length) {
        await this.paragrafo(`${rotulo}: ${textoRelatorio(dados)}`);
      }
    }
    for (const aviso of this.consulta.avisos) await this.paragrafo(aviso, 8);
    await this.paragrafo(
      "Valores monetários em R$, preservados com sete casas decimais. Datas e horas de instantes: America/Sao_Paulo.",
      8,
    );
    this.contexto = "";
    if (cadastro) {
      await this.cadastroFicha(cadastro);
    }
    if (!linhas.length) {
      if (this.y + 65 > this.fim) this.novaPagina();
      this.faixa("Nenhum registro encontrado", true);
      await this.paragrafo(
        "Nenhum registro corresponde aos filtros desta consulta.",
      );
      return;
    }
    if (this.tipo === "ficha-bem") {
      for (let i = 0; i < linhas.length; i++)
        await this.eventoFicha(linhas[i]!, i, linhas.length);
    } else {
      await this.tabelaRegistros(linhas, tabelas[this.tipo]!);
      await this.detalhesRegistros(linhas);
    }
  }
}
