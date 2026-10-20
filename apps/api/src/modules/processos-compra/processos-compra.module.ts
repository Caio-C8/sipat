import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import path from "node:path";
import { ArmazenamentoDocumentosModule } from "../../common/storage/armazenamento-documentos.module";
import { DatabaseModule } from "../../common/database/database.module";
import type { EnvironmentVariables } from "../../environment";
import { FornecedoresModule } from "../fornecedores/fornecedores.module";
import { ProcessosCompraController } from "./processos-compra.controller";
import { ProcessosCompraRepository } from "./processos-compra.repository";
import { ProcessosCompraService } from "./processos-compra.service";

@Module({
  imports: [
    DatabaseModule,
    FornecedoresModule,
    ArmazenamentoDocumentosModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        dest: path.join(
          config.getOrThrow("UPLOADS_ROOT_PATH", { infer: true }),
          ".staging",
        ),
      }),
    }),
  ],
  controllers: [ProcessosCompraController],
  providers: [ProcessosCompraRepository, ProcessosCompraService],
  exports: [ProcessosCompraService],
})
export class ProcessosCompraModule {}
