import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import path from "node:path";
import { DatabaseModule } from "../../common/database/database.module";
import { ArmazenamentoDocumentosModule } from "../../common/storage/armazenamento-documentos.module";
import type { EnvironmentVariables } from "../../environment";
import { FornecedoresModule } from "../fornecedores/fornecedores.module";
import { NotasFiscaisController } from "./notas-fiscais.controller";
import { NotasFiscaisRepository } from "./notas-fiscais.repository";
import { NotasFiscaisService } from "./notas-fiscais.service";

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
  controllers: [NotasFiscaisController],
  providers: [NotasFiscaisRepository, NotasFiscaisService],
  exports: [NotasFiscaisService],
})
export class NotasFiscaisModule {}
