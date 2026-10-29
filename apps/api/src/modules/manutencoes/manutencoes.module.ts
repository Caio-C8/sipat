import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import path from "node:path";
import { DatabaseModule } from "../../common/database/database.module";
import { ArmazenamentoDocumentosModule } from "../../common/storage/armazenamento-documentos.module";
import type { EnvironmentVariables } from "../../environment";
import { ComissoesModule } from "../comissoes/comissoes.module";
import { InventariosModule } from "../inventarios/inventarios.module";
import { PatrimoniosModule } from "../patrimonios/patrimonios.module";
import { ManutencoesController } from "./manutencoes.controller";
import { ManutencoesRepository } from "./manutencoes.repository";
import { ManutencoesService } from "./manutencoes.service";

@Module({
  imports: [
    DatabaseModule,
    ArmazenamentoDocumentosModule,
    ComissoesModule,
    InventariosModule,
    PatrimoniosModule,
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
  controllers: [ManutencoesController],
  providers: [ManutencoesService, ManutencoesRepository],
  exports: [ManutencoesService],
})
export class ManutencoesModule {}
