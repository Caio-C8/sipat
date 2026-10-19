import { Module } from "@nestjs/common";
import { ARMAZENAMENTO_DOCUMENTOS } from "./armazenamento-documentos.port";
import { CoordenadorDocumentosService } from "./coordenador-documentos.service";
import { SistemaArquivosLocalAdapter } from "./sistema-arquivos-local.adapter";

@Module({
  providers: [
    SistemaArquivosLocalAdapter,
    {
      provide: ARMAZENAMENTO_DOCUMENTOS,
      useExisting: SistemaArquivosLocalAdapter,
    },
    CoordenadorDocumentosService,
  ],
  exports: [ARMAZENAMENTO_DOCUMENTOS, CoordenadorDocumentosService],
})
export class ArmazenamentoDocumentosModule {}
