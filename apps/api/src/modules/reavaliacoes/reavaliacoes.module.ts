import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../common/database/database.module";
import { ComissoesModule } from "../comissoes/comissoes.module";
import { ReavaliacoesController } from "./reavaliacoes.controller";
import { ReavaliacoesRepository } from "./reavaliacoes.repository";
import { ReavaliacoesService } from "./reavaliacoes.service";

@Module({
  imports: [DatabaseModule, ComissoesModule],
  controllers: [ReavaliacoesController],
  providers: [ReavaliacoesService, ReavaliacoesRepository],
  exports: [ReavaliacoesService],
})
export class ReavaliacoesModule {}
