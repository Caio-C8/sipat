import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MulterModule } from "@nestjs/platform-express";
import path from "node:path";
import { DatabaseModule } from "../../common/database/database.module";
import { ArmazenamentoDocumentosModule } from "../../common/storage/armazenamento-documentos.module";
import type { EnvironmentVariables } from "../../environment";
import { ComissoesModule } from "../comissoes/comissoes.module";
import { InventariosModule } from "../inventarios/inventarios.module";
import { BaixasController } from "./baixas.controller";
import { BaixasRepository } from "./baixas.repository";
import { BaixasService } from "./baixas.service";

@Module({
  imports: [
    DatabaseModule,
    ComissoesModule,
    InventariosModule,
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
  controllers: [BaixasController],
  providers: [BaixasRepository, BaixasService],
})
export class BaixasModule {}
