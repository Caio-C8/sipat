import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from "@nestjs/common";
import type { DatabaseClient } from "@repo/database";
import { DATABASE_CLIENT } from "../database/database.constants";
import {
  ARMAZENAMENTO_DOCUMENTOS,
  type ArmazenamentoDocumentosPorta,
} from "./armazenamento-documentos.port";

const CARENCIA_RECONCILIACAO_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ReconciliadorDocumentosService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReconciliadorDocumentosService.name);

  constructor(
    @Inject(DATABASE_CLIENT) private readonly database: DatabaseClient,
    @Inject(ARMAZENAMENTO_DOCUMENTOS)
    private readonly armazenamento: ArmazenamentoDocumentosPorta,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const [notas, baixas] = await Promise.all([
        this.database.notaFiscal.findMany({
          where: { caminhoAnexoNotaFiscal: { not: null } },
          select: { caminhoAnexoNotaFiscal: true },
        }),
        this.database.baixaPatrimonio.findMany({
          where: { caminhoAnexoDocumento: { not: null } },
          select: { caminhoAnexoDocumento: true },
        }),
      ]);
      const chavesReferenciadas = new Set([
        ...notas.flatMap(({ caminhoAnexoNotaFiscal }) =>
          caminhoAnexoNotaFiscal === null ? [] : [caminhoAnexoNotaFiscal],
        ),
        ...baixas.flatMap(({ caminhoAnexoDocumento }) =>
          caminhoAnexoDocumento === null ? [] : [caminhoAnexoDocumento],
        ),
      ]);
      const limite = new Date(Date.now() - CARENCIA_RECONCILIACAO_MS);
      await this.armazenamento.reconciliar({
        chavesReferenciadas,
        temporariosModificadosAntesDe: limite,
        orfaosModificadosAntesDe: limite,
      });
    } catch {
      if (process.env.NODE_ENV !== "test") {
        this.logger.error(
          "Falha ao reconciliar documentos na inicialização; nenhuma chave ou caminho foi registrado.",
        );
      }
    }
  }
}
