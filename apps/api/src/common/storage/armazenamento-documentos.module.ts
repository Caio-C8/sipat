import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { ARMAZENAMENTO_DOCUMENTOS } from "./armazenamento-documentos.port";
import { CoordenadorDocumentosService } from "./coordenador-documentos.service";
import { SistemaArquivosLocalAdapter } from "./sistema-arquivos-local.adapter";
import { ReconciliadorDocumentosService } from "./reconciliador-documentos.service";

@Module({
  imports: [DatabaseModule],
  providers: [
    SistemaArquivosLocalAdapter,
    {
      provide: ARMAZENAMENTO_DOCUMENTOS,
      useExisting: SistemaArquivosLocalAdapter,
    },
    CoordenadorDocumentosService,
    ReconciliadorDocumentosService,
  ],
  exports: [ARMAZENAMENTO_DOCUMENTOS, CoordenadorDocumentosService],
})
export class ArmazenamentoDocumentosModule {}
