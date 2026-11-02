import { DependenciaConsultaIndisponivelException } from "../../common/http/dependencia-consulta-indisponivel.exception";
import { Injectable, StreamableFile } from "@nestjs/common";
import { LayoutRelatorioPdf } from "./pdf-layout";
import PDFDocument from "pdfkit";
import {
  LimitesRelatorios,
  titulosRelatorios,
  type IdentidadeAutenticada,
  type TipoRelatorio,
  type TipoTabular,
} from "@repo/contracts";
import { MuitasRequisicoesException } from "../../common/http/muitas-requisicoes.exception";
import { RelatoriosService } from "./relatorios.service";
import { FichaService } from "./ficha.service";
import { conferirPrazo, limiteRelatorio } from "./relatorio-limites";

type Registro = Record<string, unknown>;
@Injectable()
export class RelatoriosPdfService {
  private readonly usuarios = new Set<string>();
  constructor(
    private readonly tabulares: RelatoriosService,
    private readonly ficha: FichaService,
  ) {}
  async emitir(
    tipo: TipoRelatorio,
    q: Registro,
    usuario: IdentidadeAutenticada,
    signal?: AbortSignal,
    patrimonioId?: string,
  ): Promise<StreamableFile> {
    if (
      this.usuarios.has(usuario.id) ||
      this.usuarios.size >= LimitesRelatorios.emissoesInstancia
    )
      throw new MuitasRequisicoesException(2);
    this.usuarios.add(usuario.id);
    const prazo = Date.now() + LimitesRelatorios.prazoMs;
    try {
      const resultado =
        tipo === "ficha-bem"
          ? await this.ficha.completaPdf(patrimonioId!, q)
          : await this.tabulares.tabular(tipo as TipoTabular, q, true);
      conferirPrazo(prazo, signal);
      if (
        Buffer.byteLength(JSON.stringify(resultado), "utf8") >
        LimitesRelatorios.bytesDataset
      )
        throw limiteRelatorio();
      const resposta = "eventos" in resultado ? resultado.eventos : resultado;
      const cadastro = "cadastro" in resultado ? resultado.cadastro : undefined;
      const bytes = await this.renderizar(
        tipo,
        resposta.dados,
        resposta.resumo,
        resposta.consulta,
        usuario,
        prazo,
        signal,
        cadastro,
      );
      const data = new Date(resposta.consulta.instante)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d+Z$/, "Z");
      return new StreamableFile(bytes, {
        type: "application/pdf",
        disposition: `attachment; filename="sipat-${tipo}-${data}-${resposta.consulta.id}.pdf"`,
        length: bytes.length,
      });
    } finally {
      this.usuarios.delete(usuario.id);
    }
  }
  async renderizar(
    tipo: TipoRelatorio,
    linhas: readonly Registro[],
    resumo: Registro,
    consulta: {
      id: string;
      instante: string;
      filtros: Registro;
      criterioTemporal: string;
      ordenacao: string;
      avisos: string[];
    },
    usuario: Pick<IdentidadeAutenticada, "nome" | "perfil">,
    prazo: number,
    signal?: AbortSignal,
    cadastro?: Registro,
  ): Promise<Buffer> {
    const doc = new PDFDocument({
      size: "A4",
      layout: tipo === "ficha-bem" ? "portrait" : "landscape",
      margin: 36,
      bufferPages: true,
      autoFirstPage: false,
      info: {
        Title: titulosRelatorios[tipo],
        Author: usuario.nome,
        Creator: "SIPAT",
      },
    });
    let tamanho = 0;
    let erroStream: Error | null = null;
    const chunks: Buffer[] = [];
    const completo = new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk: Buffer) => {
        tamanho += chunk.length;
        if (tamanho > LimitesRelatorios.bytesPdf) {
          erroStream = limiteRelatorio();
          doc.destroy(erroStream);
          return;
        }
        chunks.push(chunk);
      });
      doc.once("end", () => resolve(Buffer.concat(chunks)));
      doc.once("error", (e) => {
        erroStream = e;
        reject(e);
      });
    });
    // Evita rejeição não tratada enquanto o produtor assíncrono ainda está trabalhando.
    void completo.catch(() => undefined);
    const cancelar = () =>
      doc.destroy(new DependenciaConsultaIndisponivelException());
    signal?.addEventListener("abort", cancelar, { once: true });
    const layout = new LayoutRelatorioPdf(
      doc,
      tipo,
      consulta,
      prazo,
      signal,
      () => {
        if (erroStream) throw erroStream;
      },
    );
    try {
      await layout.conteudo(linhas, resumo, usuario, cadastro);
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const bottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#526580")
          .text(
            `Página ${i + 1} de ${range.count} • ${consulta.id}`,
            36,
            doc.page.height - 30,
            { width: doc.page.width - 72, lineBreak: false },
          );
        doc.page.margins.bottom = bottom;
      }
      conferirPrazo(prazo, signal);
      doc.end();
      return await completo;
    } catch (e) {
      doc.destroy();
      throw e;
    } finally {
      signal?.removeEventListener("abort", cancelar);
    }
  }
}
