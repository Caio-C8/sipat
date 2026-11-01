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
const azul = "#17365b",
  tinta = "#24364b",
  cinza = "#526278",
  borda = "#dce4ed";

/** Paginação explícita: nenhum texto cadastrado é cortado ou interpretado como markup. */
export class LayoutRelatorioPdf {
  private y = 0;
  private paginas = 0;
  private contexto = "";
  private tabela = false;
  private readonly largura: number;
  constructor(
    private readonly doc: PDFKit.PDFDocument,
    private readonly tipo: TipoRelatorio,
    private readonly consulta: Consulta,
    private readonly prazo: number,
    private readonly signal: AbortSignal | undefined,
    private readonly conferirStream: () => void,
  ) {
    this.largura = tipo === "ficha-bem" ? 523.28 : 769.89;
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
    this.doc.image(
      path.join(
        __dirname,
        ...(path.basename(__dirname) === "dist"
          ? ["modules", "relatorios", "assets"]
          : ["assets"]),
        "brasao.png",
      ),
      36,
      25,
      { fit: [34, 38] },
    );
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
    this.y = 89;
    if (this.contexto) this.faixa(this.contexto + " | continuação", true);
    if (this.tabela) this.cabecalhoDepreciacoes();
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
  private cabecalhoDepreciacoes() {
    const larguras = this.colunasDepreciacoes();
    this.doc.rect(36, this.y, this.largura, 29).fill(azul);
    this.fonte(8, true, "#ffffff");
    let x = 44;
    [
      "Bem / descrição atual",
      "Competência",
      "Líquido anterior (R$)",
      "Quota processada (R$)",
      "Líquido posterior (R$)",
    ].forEach((t, i) => {
      this.texto(t, x, this.y + 10, larguras[i]! - 16, i >= 2);
      x += larguras[i]!;
    });
    this.y += 29;
  }
  private colunasDepreciacoes() {
    return [this.largura - 484, 76, 136, 136, 136];
  }
  private async depreciacao(registro: Registro, indice: number, total: number) {
    const larguras = this.colunasDepreciacoes();
    const titulo = `Bem ${textoRelatorio(registro.numeroPatrimonio)} | lançamento ${indice + 1}/${total}`;
    const corpo = [
      await this.linhas(registro.descricao, larguras[0]! - 16),
      await this.linhas(registro.competencia, larguras[1]! - 16),
      await this.linhas(registro.valorContabilAnterior, larguras[2]! - 16),
      await this.linhas(registro.valorDepreciado, larguras[3]! - 16, 9, true),
      await this.linhas(registro.valorContabilNovo, larguras[4]! - 16),
    ];
    const detalhes = await this.linhas(
      `Processado em (São Paulo): ${textoRelatorio(registro.processamento)} | Comissão: ${textoRelatorio(registro.comissao)} | Autor: ${textoRelatorio(registro.autor)}`,
      this.largura - 16,
      8,
    );
    const referencias = await this.linhas(
      `Registro: ${textoRelatorio(registro.id)} | Bem (UUID): ${textoRelatorio(registro.patrimonioId)} | Parâmetro: ${textoRelatorio(registro.parametroId)}`,
      this.largura - 16,
      7.5,
    );
    const n = Math.max(...corpo.map((c) => c.length));
    const altura =
      25 + n * 12 + detalhes.length * 11 + referencias.length * 10 + 13;
    if (!this.tabela) {
      if (this.y + 29 + Math.min(altura, this.fim - 118) > this.fim)
        this.novaPagina();
      this.tabela = true;
      this.cabecalhoDepreciacoes();
    }
    // Mantém o lançamento inteiro quando ele cabe em uma página. Textos maiores continuam identificados.
    if (this.y + Math.min(altura, this.fim - 118) > this.fim) this.novaPagina();
    this.contexto = titulo;
    let linha = 0;
    while (linha < n) {
      if (this.y + 42 > this.fim) this.novaPagina();
      const cabem = Math.min(
        n - linha,
        Math.floor((this.fim - this.y - 29) / 12),
      );
      const alturaCorpo = 25 + cabem * 12;
      this.doc
        .rect(36, this.y, this.largura, alturaCorpo)
        .fill(indice % 2 ? "#f0f4f9" : "#f9fbfd");
      this.fonte(10, true, azul);
      this.texto(titulo, 44, this.y + 7, this.largura - 16);
      let x = 44;
      for (let c = 0; c < corpo.length; c++) {
        this.fonte(9, c === 3, c === 3 ? azul : tinta);
        corpo[c]!.slice(linha, linha + cabem).forEach((v, i) =>
          this.texto(v, x, this.y + 24 + i * 12, larguras[c]! - 16, c >= 2),
        );
        x += larguras[c]!;
      }
      this.y += alturaCorpo;
      linha += cabem;
      if (linha < n) this.novaPagina();
    }
    for (const [linhas, tamanho] of [
      [detalhes, 8],
      [referencias, 7.5],
    ] as const) {
      for (const linha of linhas) {
        if (this.y + 12 > this.fim) this.novaPagina();
        this.fonte(tamanho, false, cinza);
        this.texto(linha, 44, this.y + 2, this.largura - 16);
        this.y += 11;
      }
    }
    this.y += 7;
    this.doc
      .moveTo(36, this.y)
      .lineTo(36 + this.largura, this.y)
      .lineWidth(0.5)
      .strokeColor(borda)
      .stroke();
    this.y += 8;
    this.contexto = "";
    await setImmediate();
    this.conferir();
  }
  private async registro(
    registro: Registro,
    indice: number,
    total: number,
    cadastro?: Registro,
  ) {
    const numero =
      registro.numeroPatrimonio ??
      registro.numeroPatrimonioAtual ??
      cadastro?.numeroPatrimonio;
    const titulo = `${numero ? `Bem ${textoRelatorio(numero)} | ` : ""}${this.tipo === "ficha-bem" ? "Evento" : "Registro"} ${indice + 1} de ${total}`;
    const descricao = registro.descricao ?? registro.descricaoAtual;
    const detalhes = Object.fromEntries(
      Object.entries(registro).filter(
        ([k]) =>
          ![
            "descricao",
            "descricaoAtual",
            "numeroPatrimonio",
            "numeroPatrimonioAtual",
          ].includes(k),
      ),
    );
    const entradas = this.entradas(detalhes);
    // UUIDs vêm depois das informações de negócio, mantendo a rastreabilidade.
    entradas.sort(
      ([a], [b]) =>
        Number(a.includes("UUID") || a.endsWith(" Id")) -
        Number(b.includes("UUID") || b.endsWith(" Id")),
    );
    const colunas = this.tipo === "ficha-bem" ? 2 : 3;
    const grade = await this.preparar(entradas, colunas);
    const altura =
      65 +
      grade.reduce(
        (s, r) => s + 31 + Math.max(...r.map((c) => c.linhas.length)) * 12,
        0,
      );
    if (this.y + Math.min(altura, this.fim - 89) > this.fim) this.novaPagina();
    this.contexto = titulo;
    this.faixa(titulo);
    if (descricao !== undefined)
      await this.paragrafo(
        `Descrição cadastral atual: ${textoRelatorio(descricao)}`,
        10,
        tinta,
      );
    await this.grade(grade, colunas);
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
      `Emitido em ${textoRelatorio(this.consulta.instante)} (São Paulo) | ${usuario.nome} | ${usuario.perfil}`,
    );
    this.contexto = "Identificação da consulta";
    await this.paragrafo(
      `Filtros: ${Object.keys(this.consulta.filtros).length ? textoRelatorio(this.consulta.filtros) : "Sem filtros opcionais"}`,
    );
    await this.paragrafo(
      `Critério temporal: ${this.consulta.criterioTemporal} Ordenação: ${this.consulta.ordenacao}`,
    );
    this.faixa("Resumo do conjunto filtrado", true);
    const { porCompetencia, porTipo, ...totais } = resumo;
    await this.grade(await this.preparar(this.entradas(totais)), 3, true);
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
      await this.paragrafo(
        "Cadastro atual: valores e localização na consulta; não representam posição em data passada.",
      );
      await this.registro(cadastro, 0, 1, cadastro);
    }
    if (!linhas.length) {
      if (this.y + 65 > this.fim) this.novaPagina();
      this.faixa("Nenhum registro encontrado", true);
      await this.paragrafo(
        "Nenhum registro corresponde aos filtros desta consulta.",
      );
      return;
    }
    for (let i = 0; i < linhas.length; i++) {
      if (this.tipo === "depreciacoes")
        await this.depreciacao(linhas[i]!, i, linhas.length);
      else await this.registro(linhas[i]!, i, linhas.length, cadastro);
    }
  }
}
